import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useCredits } from "../../context/CreditContext";

import {
  Animated,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ThemeButton from "../../components/theme-effects/ThemeButton";
import ThemeSurface from "../../components/theme-effects/ThemeSurface";
import { AuthContext } from "../../context/AuthContext";
import {
  Goal,
  GoalContext,
  PlanGuideItem,
  ShiftReviewItem,
} from "../../context/GoalContext";
import { ThemeContext } from "../../context/ThemeContext";

/* ---------------------------------- */
/* Constants */
/* ---------------------------------- */

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const DEBUG = false;

const statusColors = {
  Upcoming: "#f59e0b",
  "In Progress": "#3b82f6",
  Completed: "#10b981",
} as const;

const statusBgColors = {
  Upcoming: "rgba(245, 158, 11, 0.18)",
  "In Progress": "rgba(59, 130, 246, 0.18)",
  Completed: "rgba(16, 185, 129, 0.18)",
} as const;

/* ---------------------------------- */
/* Types */
/* ---------------------------------- */

type ShiftStatus = "Upcoming" | "In Progress" | "Completed";

type GoalProgressInfo = {
  completedShiftCount: number;
  totalShiftCount: number;
  percent: number;
};

type ExtendedPlanGuideItem = PlanGuideItem & {
  targetKey?: string;
  targetLabel?: string;
  plannedDate?: string;
  weekdayLabel?: string;
  imageKey?: string;
  imageUri?: string;
  targetType?: "weekday" | "date" | "week" | "month" | "year" | string;
  explanation?: string;
  resourceLinks?: { title: string; url: string }[];
};

type ShiftState = {
  shift: ExtendedPlanGuideItem;
  start: Date;
  end: Date;
  status: ShiftStatus;
  date: Date;
};

type PendingReviewShift = ShiftReviewItem & {
  reviewDate: Date;
  expiresDate: Date;
};

/* ---------------------------------- */
/* Helpers */
/* ---------------------------------- */

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isSameDate = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const getWeekdayLabelFromDate = (date: Date) => {
  const jsDay = date.getDay();
  return weekDays[(jsDay + 6) % 7];
};

const getWeekOfMonth = (date: Date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  return Math.ceil((date.getDate() + firstDay.getDay()) / 7);
};

const getWeekKeyFromDate = (date: Date) =>
  `${date.getFullYear()}|${date.getMonth()}|${getWeekOfMonth(date)}`;

const getMonthKeyFromDate = (date: Date) =>
  `${date.getFullYear()}|${date.getMonth()}`;

const getYearKeyFromDate = (date: Date) => `${date.getFullYear()}`;

const formatTime = (timeString: string) =>
  new Date(timeString).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

const formatFullDateRangePart = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatSelectedDaysFull = (days?: string) => {
  const parsed = String(days ?? "")
    .split(" ")
    .filter(Boolean);

  return parsed.length > 0 ? parsed.join(", ") : "No selected days";
};

const mergeDateWithTime = (baseDate: Date, timeSource: string) => {
  const source = new Date(timeSource);

  const merged = new Date(baseDate);
  merged.setHours(source.getHours(), source.getMinutes(), 0, 0);

  return merged;
};

const sortShiftsByTime = (shifts: ExtendedPlanGuideItem[]) => {
  return [...shifts].sort((a, b) => {
    const startDiff =
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime();

    if (startDiff !== 0) return startDiff;

    return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
  });
};

const isDateInsideGoalRange = (goal: Goal, date: Date) => {
  const check = startOfDay(date);
  const start = startOfDay(new Date(goal.startDate));

  if (!goal.endDate) {
    return check >= start;
  }

  const end = startOfDay(new Date(goal.endDate));
  return check >= start && check <= end;
};

const isGoalActiveOnDate = (goal: Goal, date: Date) => {
  if (!isDateInsideGoalRange(goal, date)) return false;

  const goalDays = String(goal.days ?? "")
    .split(" ")
    .filter(Boolean);

  if (goalDays.length === 0) return false;

  const weekdayLabel = getWeekdayLabelFromDate(date);
  return goalDays.includes(weekdayLabel);
};

const getTotalScheduledDays = (goal: Goal) => {
  const goalDays = String(goal.days ?? "")
    .split(" ")
    .filter(Boolean);

  if (goalDays.length === 0) return 0;

  const start = startOfDay(new Date(goal.startDate));
  const end = goal.endDate
    ? startOfDay(new Date(goal.endDate))
    : startOfDay(new Date());

  if (end < start) return 0;

  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    if (isGoalActiveOnDate(goal, current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
};

const getCurrentDayNumber = (goal: Goal, now: Date) => {
  const goalDays = String(goal.days ?? "")
    .split(" ")
    .filter(Boolean);

  if (goalDays.length === 0) return 0;

  const start = startOfDay(new Date(goal.startDate));
  const today = startOfDay(now);

  if (today < start) return 0;

  const end = goal.endDate ? startOfDay(new Date(goal.endDate)) : today;
  const stop = today < end ? today : end;

  let count = 0;
  const current = new Date(start);

  while (current <= stop) {
    if (isGoalActiveOnDate(goal, current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
};

const getTotalScheduledShiftCount = (goal: Goal, now: Date) => {
  const start = startOfDay(new Date(goal.startDate));
  const end = goal.endDate
    ? startOfDay(new Date(goal.endDate))
    : startOfDay(now);

  if (end < start) return 0;

  let total = 0;
  const current = new Date(start);

  while (current <= end) {
    const shifts = getShiftsForDate(goal, current);
    total += shifts.length;
    current.setDate(current.getDate() + 1);
  }

  return total;
};

const getShiftsForDate = (goal: Goal, date: Date): ExtendedPlanGuideItem[] => {
  const shifts = (goal.planGuide ?? []) as ExtendedPlanGuideItem[];

  if (!isGoalActiveOnDate(goal, date)) {
    return [];
  }

  const weekdayLabel = getWeekdayLabelFromDate(date);
  const yearKey = getYearKeyFromDate(date);
  const monthKey = getMonthKeyFromDate(date);
  const weekKey = getWeekKeyFromDate(date);

  const weekdayShifts = shifts.filter(
    (step) =>
      step.targetType === "weekday" && step.weekdayLabel === weekdayLabel,
  );

  const yearShifts = shifts.filter(
    (step) => step.targetType === "year" && step.targetKey === yearKey,
  );

  const monthShifts = shifts.filter(
    (step) => step.targetType === "month" && step.targetKey === monthKey,
  );

  const weekShifts = shifts.filter(
    (step) => step.targetType === "week" && step.targetKey === weekKey,
  );

  const exactDateShifts = shifts.filter(
    (step) =>
      step.targetType === "date" &&
      step.plannedDate &&
      isSameDate(new Date(step.plannedDate), date),
  );

  return sortShiftsByTime([
    ...yearShifts,
    ...monthShifts,
    ...weekShifts,
    ...weekdayShifts,
    ...exactDateShifts,
  ]);
};

const getShiftStateForDate = (
  shift: ExtendedPlanGuideItem,
  date: Date,
  now: Date,
): ShiftState => {
  const start = mergeDateWithTime(date, shift.startTime);
  const end = mergeDateWithTime(date, shift.endTime);

  let status: ShiftStatus = "Upcoming";

  if (now >= start && now <= end) {
    status = "In Progress";
  } else if (now > end) {
    status = "Completed";
  }

  return {
    shift,
    start,
    end,
    status,
    date,
  };
};

const getBestShiftForNow = (goal: Goal, now: Date) => {
  const todayShifts = getShiftsForDate(goal, now);

  if (todayShifts.length === 0) {
    return null;
  }

  const shiftStates = todayShifts.map((shift) =>
    getShiftStateForDate(shift, now, now),
  );

  const inProgress = shiftStates.find((item) => item.status === "In Progress");
  if (inProgress) return inProgress;

  const upcoming = shiftStates.find((item) => item.status === "Upcoming");
  if (upcoming) return upcoming;

  return null;
};

const getNextUpcomingShift = (goal: Goal, now: Date, daysToCheck = 365) => {
  for (let i = 0; i <= daysToCheck; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);

    const shifts = getShiftsForDate(goal, date);
    if (shifts.length === 0) continue;

    const shiftStates = shifts
      .map((shift) => getShiftStateForDate(shift, date, now))
      .filter((item) => item.start > now);

    if (shiftStates.length > 0) {
      return shiftStates[0];
    }
  }

  return null;
};

const getUpcomingShifts = (goal: Goal, now: Date, limit = 3) => {
  const upcoming: ShiftState[] = [];

  for (let i = 0; i <= 365; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);

    const shifts = getShiftsForDate(goal, date);
    if (shifts.length === 0) continue;

    const shiftStates = shifts
      .map((shift) => getShiftStateForDate(shift, date, now))
      .filter((item) => item.start > now || item.status === "In Progress");

    for (const item of shiftStates) {
      if (item.status !== "Completed") {
        upcoming.push(item);
      }

      if (upcoming.length >= limit) {
        return upcoming;
      }
    }
  }

  return upcoming;
};

const getShiftImageSource = (imageKey?: string) => {
  switch (imageKey) {
    case "gym-1":
      return require("../../assets/images/Gym/edgar-chaparro-sHfo3WOgGTU-unsplash.jpg");
    case "gym-2":
      return require("../../assets/images/Gym/brett-jordan-U2q73PfHFpM-unsplash.jpg");
    case "gym-3":
      return require("../../assets/images/Gym/lorenzo-hamers-jvIaut-V9a4-unsplash.jpg");
    case "gym-4":
      return require("../../assets/images/Gym/sven-mieke-Lx_GDv7VA9M-unsplash.jpg");
    case "gym-5":
      return require("../../assets/images/Gym/victor-freitas-WvDYdXDzkhs-unsplash.jpg");

    case "workout-1":
      return require("../../assets/images/Workout/cagin-kargi-Qzp60FT380E-unsplash.jpg");
    case "workout-2":
      return require("../../assets/images/Workout/gordon-cowie-ISg1JhN_vFk-unsplash.jpg");
    case "workout-3":
      return require("../../assets/images/Workout/jonathan-borba-lrQPTQs7nQQ-unsplash.jpg");
    case "workout-4":
      return require("../../assets/images/Workout/kike-vega-F2qh3yjz6Jk-unsplash.jpg");
    case "workout-5":
      return require("../../assets/images/Workout/logan-weaver-lgnwvr-amgv9YUg-MA-unsplash.jpg");

    case "meditation-1":
      return require("../../assets/images/Meditation/jared-rice-NTyBbu66_SI-unsplash.jpg");
    case "meditation-2":
      return require("../../assets/images/Meditation/colton-sturgeon-6KkYYqTEDwQ-unsplash.jpg");
    case "meditation-3":
      return require("../../assets/images/Meditation/chelsea-gates-n8L1VYaypcw-unsplash.jpg");
    case "meditation-4":
      return require("../../assets/images/Meditation/levi-xu-dOhJtfXJZfw-unsplash.jpg");
    case "meditation-5":
      return require("../../assets/images/Meditation/ethan-rougon-zWIWNeEg4Uo-unsplash.jpg");

    case "cooking-1":
      return require("../../assets/images/Cooking/ahmadreza-rezaie-9x6QkgB722w-unsplash.jpg");
    case "cooking-2":
      return require("../../assets/images/Cooking/joseph-gonzalez-zcUgjyqEwe8-unsplash.jpg");
    case "cooking-3":
      return require("../../assets/images/Cooking/myles-tan-IWCljYv1TJw-unsplash.jpg");
    case "cooking-4":
      return require("../../assets/images/Cooking/tim-zankert-ZWweujwrLEM-unsplash.jpg");
    case "cooking-5":
      return require("../../assets/images/Cooking/the-design-lady-Z9QhA1aGXck-unsplash.jpg");

    case "money-1":
      return require("../../assets/images/Money/adam-nir-wTO6MWpMrJk-unsplash.jpg");
    case "money-2":
      return require("../../assets/images/Money/alexander-grey-8lnbXtxFGZw-unsplash.jpg");
    case "money-3":
      return require("../../assets/images/Money/art-rachen-yJpjLD3c9bU-unsplash.jpg");
    case "money-4":
      return require("../../assets/images/Money/brano-heYdDdq0cbE-unsplash.jpg");
    case "money-5":
      return require("../../assets/images/Money/elena-mozhvilo-nhYK4qIv9Pg-unsplash.jpg");

    case "study-1":
      return require("../../assets/images/Studying/christin-hume-k2Kcwkandwg-unsplash.jpg");
    case "study-2":
      return require("../../assets/images/Studying/joel-muniz-XqXJJhK-c08-unsplash (1).jpg");
    case "study-3":
      return require("../../assets/images/Studying/ioann-mark-kuznietsov-P6uqpNyXcI4-unsplash.jpg");
    case "study-4":
      return require("../../assets/images/Studying/jessica-ruscello-OQSCtabGkSY-unsplash.jpg");
    case "study-5":
      return require("../../assets/images/Studying/matias-north-v8DSLoY80Xk-unsplash.jpg");

    case "sleep-1":
      return require("../../assets/images/Sleeping/alexander-possingham-CeWNEEsHPbA-unsplash.jpg");
    case "sleep-2":
      return require("../../assets/images/Sleeping/charlesdeluvio-S2AcayPkszE-unsplash.jpg");
    case "sleep-3":
      return require("../../assets/images/Sleeping/phil-desforges-m4bcgrz4jn0-unsplash.jpg");
    case "sleep-4":
      return require("../../assets/images/Sleeping/becca-schultz-l6BenhrIc2w-unsplash.jpg");
    case "sleep-5":
      return require("../../assets/images/Sleeping/nathan-waters-zukdSYdFB_A-unsplash.jpg");

    default:
      return null;
  }
};

const getCardImageForGoal = (
  goal: Goal,
  displayShift: ShiftState | null,
  upcomingShifts: ShiftState[],
) => {
  if (displayShift?.shift.imageUri) {
    return { uri: displayShift.shift.imageUri };
  }

  if (displayShift?.shift.imageKey) {
    return getShiftImageSource(displayShift.shift.imageKey);
  }

  for (let i = 0; i < upcomingShifts.length; i++) {
    const item = upcomingShifts[i];

    if (item.shift.imageUri) {
      return { uri: item.shift.imageUri };
    }

    if (item.shift.imageKey) {
      return getShiftImageSource(item.shift.imageKey);
    }
  }

  const firstShiftWithImage = (goal.planGuide ?? []).find(
    (step) => step.imageUri || step.imageKey,
  );

  if (firstShiftWithImage?.imageUri) {
    return { uri: firstShiftWithImage.imageUri };
  }

  if (firstShiftWithImage?.imageKey) {
    return getShiftImageSource(firstShiftWithImage.imageKey);
  }

  return null;
};

const getRelativeShiftLabel = (shiftState: ShiftState, now: Date) => {
  const shiftDay = startOfDay(shiftState.date);
  const today = startOfDay(now);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (isSameDate(shiftDay, today)) {
    return `Today at ${formatTime(shiftState.shift.startTime)} - ${formatTime(
      shiftState.shift.endTime,
    )}`;
  }

  if (isSameDate(shiftDay, tomorrow)) {
    return `Tomorrow at ${formatTime(
      shiftState.shift.startTime,
    )} - ${formatTime(shiftState.shift.endTime)}`;
  }

  const weekday = shiftState.date.toLocaleDateString("en-GB", {
    weekday: "short",
  });

  const day = shiftState.date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  return `${weekday}, ${day} at ${formatTime(
    shiftState.shift.startTime,
  )} - ${formatTime(shiftState.shift.endTime)}`;
};

const getPendingReviewShifts = (
  goal: Goal,
  now: Date,
): PendingReviewShift[] => {
  return (goal.shiftReviews ?? [])
    .filter((review) => review.status === "pending")
    .filter((review) => new Date(review.expiresAt).getTime() > now.getTime())
    .map((review) => ({
      ...review,
      reviewDate: new Date(review.shiftDate),
      expiresDate: new Date(review.expiresAt),
    }))
    .sort((a, b) => {
      const dateDiff = b.reviewDate.getTime() - a.reviewDate.getTime();
      if (dateDiff !== 0) return dateDiff;

      return new Date(b.shiftEnd).getTime() - new Date(a.shiftEnd).getTime();
    });
};

const getGoalProgress = (goal: Goal, now: Date): GoalProgressInfo => {
  const totalShiftCount = getTotalScheduledShiftCount(goal, now);

  const completedShiftCount = (goal.shiftReviews ?? []).filter(
    (review) => review.status === "completed",
  ).length;

  const percent =
    totalShiftCount === 0
      ? 0
      : Math.min(
          100,
          Math.max(
            0,
            Math.round((completedShiftCount / totalShiftCount) * 100),
          ),
        );

  return {
    completedShiftCount,
    totalShiftCount,
    percent,
  };
};

const isGoalFullyCompleted = (goal: Goal, now: Date) => {
  const reviews = goal.shiftReviews ?? [];

  if (reviews.length === 0) return false;

  const hasPendingReview = reviews.some(
    (review) => review.status === "pending",
  );
  if (hasPendingReview) return false;

  const latestExpiry = reviews.reduce<number>((latest, review) => {
    const expiryTime = new Date(review.expiresAt).getTime();
    return expiryTime > latest ? expiryTime : latest;
  }, 0);

  if (latestExpiry === 0) return false;

  return now.getTime() >= latestExpiry;
};
/* ---------------------------------- */
/* Screen */
/* ---------------------------------- */
const GoalExpandIcon = ({ isExpanded }: { isExpanded: boolean }) => {
  const [iconAnim] = useState(new Animated.Value(isExpanded ? 1 : 0));

  useEffect(() => {
    Animated.timing(iconAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [isExpanded, iconAnim]);

  return (
    <View style={{ width: 24, height: 18, alignItems: "center" }}>
      <Animated.Text
        style={{
          position: "absolute",
          color: "rgba(255,255,255,0.32)",
          fontSize: 15,
          fontWeight: "900",
          opacity: iconAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          }),
          transform: [
            {
              translateY: iconAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 7],
              }),
            },
          ],
        }}
      >
        ﹀
      </Animated.Text>

      <Animated.Text
        style={{
          position: "absolute",
          color: "rgba(255,255,255,0.32)",
          fontSize: 15,
          fontWeight: "900",
          opacity: iconAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          }),
          transform: [
            {
              translateY: iconAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-7, 0],
              }),
            },
          ],
        }}
      >
        ︿
      </Animated.Text>
    </View>
  );
};
export default function HomeScreen() {
  const auth = useContext(AuthContext);
  const context = useContext(GoalContext);
  const { credits } = useCredits();
  const { width } = useWindowDimensions();

  const isVeryNarrowPhone = width < 340;
  const isNarrowPhone = width < 380;
  const isTablet = width >= 768;
  const isLargeTablet = width >= 1024;

  const contentMaxWidth = isLargeTablet ? 1100 : isTablet ? 950 : width;
  const screenPadding = isTablet ? 28 : 20;
  const drawerWidth = isTablet ? 340 : isNarrowPhone ? 250 : 280;
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;

  const UI = theme ?? {
    screen: "#111b30e6",
    card: "#111827",
    innerCard: "#0f172a",
    border: "#1f2937",
    text: "#ffffff",
    muted: "#94a3b8",
    primary: "#2563eb",
    primarySoft: "rgba(37,99,235,0.16)",

    imageOverlaySolid: "rgba(15,23,42,0.96)",
    imageOverlayStrong: "rgba(15,23,42,1)",
    imageOverlay90: "rgba(15,23,42,0.92)",
    imageOverlay80: "rgba(15,23,42,0.80)",
    imageOverlay60: "rgba(15,23,42,0.58)",
    imageOverlay30: "rgba(15,23,42,0.30)",
    imageOverlay10: "rgba(15,23,42,0.10)",
    imageShade: "rgba(0,0,0,0.15)",
  };

  const [now, setNow] = useState(new Date());
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const goalCardYRef = useRef<Record<string, number>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [drawerAnim] = useState(new Animated.Value(-drawerWidth));
  const [overlayOpacity] = useState(new Animated.Value(0));
  const [badgeScale] = useState(new Animated.Value(1));
  const [inProgressGlow] = useState(new Animated.Value(0.2));
  const inProgressBorderColor = inProgressGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(59,130,246,0)", "#3b82f6"],
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(badgeScale, {
          toValue: 1.12,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(badgeScale, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [badgeScale]);

  useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(inProgressGlow, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(inProgressGlow, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ]),
    );

    glowLoop.start();

    return () => {
      glowLoop.stop();
    };
  }, [inProgressGlow]);

  const goals = context?.goals ?? [];
  const historyGoals = context?.historyGoals ?? [];
  const hasLoadedGoals = context?.hasLoadedGoals ?? false;
  const deleteGoal = context?.deleteGoal;
  const completeGoal = context?.completeGoal;
  const refreshShiftReviews = context?.refreshShiftReviews;
  const markShiftCompleted = context?.markShiftCompleted;
  const markShiftMissed = context?.markShiftMissed;
  if (DEBUG) {
    console.log("HOME SCREEN -> goals count:", goals.length);
    console.log(
      "HOME SCREEN -> goal titles:",
      goals.map((g) => g.title),
    );
  }

  useEffect(() => {
    if (!completeGoal) return;
    const completedGoalIds = goals
      .filter((goal) => goal.status !== "Completed" && goal.status !== "Failed")
      .filter((goal) => isGoalFullyCompleted(goal, now))
      .map((goal) => goal.id);

    if (completedGoalIds.length === 0) return;

    completedGoalIds.forEach((goalId) => {
      completeGoal(goalId);
    });
  }, [goals, now, completeGoal]);

  useEffect(() => {
    if (!refreshShiftReviews || !hasLoadedGoals) return;
    refreshShiftReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, hasLoadedGoals]);

  if (
    !context ||
    !deleteGoal ||
    !completeGoal ||
    !refreshShiftReviews ||
    !markShiftCompleted ||
    !markShiftMissed
  ) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: UI.screen }}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: UI.text }}>Context not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const goalCards = useMemo(() => {
    return goals.map((goal) => {
      const totalDays = getTotalScheduledDays(goal);
      const currentDay = getCurrentDayNumber(goal, now);

      const todayShift = getBestShiftForNow(goal, now);
      const nextShift = getNextUpcomingShift(goal, now);
      const displayShift = todayShift ?? nextShift;

      const progressInfo = getGoalProgress(goal, now);
      const upcomingShifts = getUpcomingShifts(goal, now, 3);
      const pendingReviewShifts = getPendingReviewShifts(goal, now);

      return {
        goal,
        totalDays,
        currentDay,
        displayShift,
        progressInfo,
        upcomingShifts,
        pendingReviewShifts,
        cardImage: getCardImageForGoal(goal, displayShift, upcomingShifts),
      };
    });
  }, [goals, now]);

  const closeGoalDetails = (goalId: string) => {
    const goalY = goalCardYRef.current[goalId] ?? 0;

    setExpandedGoalId(null);

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(goalY - 12, 0),
        animated: true,
      });
    });
  };

  const handleDeleteGoal = (goalId: string) => {
    setDeleteTargetId(goalId);
  };

  const openMenu = () => {
    setMenuOpen(true);

    Animated.parallel([
      Animated.timing(drawerAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(drawerAnim, {
        toValue: -drawerWidth,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMenuOpen(false);
    });
  };

  const goToHistory = () => {
    closeMenu();
    setTimeout(() => {
      router.push("/history");
    }, 220);
  };

  const goToAboutUs = () => {
    closeMenu();
    setTimeout(() => {
      router.push("/about-us");
    }, 220);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: UI.screen }}>
      {deleteTargetId && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 50,
            padding: 20,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 340,
              backgroundColor: UI.card,
              borderRadius: 18,
              padding: 20,
              borderWidth: 1,
              borderColor: UI.border,
            }}
          >
            <Text
              style={{
                color: UI.text,
                fontSize: 18,
                fontWeight: "900",
                marginBottom: 8,
              }}
            >
              Delete Goal
            </Text>

            <Text
              style={{
                color: UI.muted,
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 20,
              }}
            >
              This will permanently remove your goal, progress, and all
              associated shifts. This action cannot be undone.
            </Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setDeleteTargetId(null)}
                style={{
                  flex: 1,
                  backgroundColor: UI.innerCard,
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: UI.text, fontWeight: "700" }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  deleteGoal?.(deleteTargetId);
                  setDeleteTargetId(null);
                }}
                style={{
                  flex: 1,
                  backgroundColor: "#dc2626",
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "800" }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {menuOpen && (
        <>
          <Pressable
            onPress={closeMenu}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 20,
            }}
          >
            <Animated.View
              pointerEvents="none"
              style={{
                flex: 1,
                backgroundColor: UI.imageShade,
                opacity: overlayOpacity,
              }}
            />
          </Pressable>

          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: drawerWidth,
              backgroundColor: UI.innerCard,
              borderRightColor: UI.border,
              borderRightWidth: 1,
              paddingTop: 70,
              paddingHorizontal: 18,
              zIndex: 21,
              transform: [{ translateX: drawerAnim }],
            }}
          >
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  color: UI.text,
                  fontSize: 22,
                  fontWeight: "800",
                  marginBottom: 4,
                }}
              >
                Menu
              </Text>

              <Text
                style={{
                  color: UI.muted,
                  fontSize: 13,
                  lineHeight: 18,
                }}
              >
                Navigate through your goal spaces
              </Text>
            </View>

            <TouchableOpacity
              onPress={goToHistory}
              style={{
                backgroundColor: UI.screen,
                borderColor: UI.border,
                borderWidth: 1,
                borderRadius: 14,
                padding: 14,
                marginBottom: 12,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: 4,
                  backgroundColor: UI.primary,
                }}
              />
              <Text
                style={{
                  color: UI.text,
                  fontSize: 16,
                  fontWeight: "800",
                  marginBottom: 6,
                }}
              >
                History
              </Text>

              <Text
                style={{
                  color: UI.muted,
                  fontSize: 12,
                }}
              >
                {historyGoals.length} completed goal
                {historyGoals.length === 1 ? "" : "s"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                closeMenu();
                setTimeout(() => {
                  router.push("/settings");
                }, 220);
              }}
              style={{
                backgroundColor: UI.screen,
                borderColor: UI.border,
                borderWidth: 1,
                borderRadius: 14,
                padding: 14,
                marginBottom: 12,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: 4,
                  backgroundColor: UI.primary,
                }}
              />

              <Text
                style={{
                  color: UI.text,
                  fontSize: 16,
                  fontWeight: "800",
                  marginBottom: 6,
                }}
              >
                Settings
              </Text>

              <Text
                style={{
                  color: UI.muted,
                  fontSize: 12,
                }}
              >
                Theme colors and text size
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                closeMenu();
                setTimeout(() => {
                  router.push("/reminder");
                }, 220);
              }}
              style={{
                backgroundColor: UI.screen,
                borderColor: UI.border,
                borderWidth: 1,
                borderRadius: 14,
                padding: 14,
                marginBottom: 12,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: 4,
                  backgroundColor: UI.primary,
                }}
              />
              <Text
                style={{
                  color: UI.text,
                  fontSize: 16,
                  fontWeight: "800",
                  marginBottom: 6,
                }}
              >
                Reminder
              </Text>

              <Text
                style={{
                  color: UI.muted,
                  fontSize: 12,
                }}
              >
                Motivations, rules and daily reminders
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goToAboutUs}
              style={{
                backgroundColor: UI.screen,
                borderColor: UI.border,
                borderWidth: 1,
                borderRadius: 14,
                padding: 14,
                marginBottom: 12,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: 4,
                  backgroundColor: UI.primary,
                }}
              />
              <Text
                style={{
                  color: UI.text,
                  fontSize: 16,
                  fontWeight: "800",
                  marginBottom: 6,
                }}
              >
                About Us
              </Text>

              <Text
                style={{
                  color: UI.muted,
                  fontSize: 12,
                }}
              >
                App info and social handles
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: screenPadding, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: "100%",
            maxWidth: contentMaxWidth,
            alignSelf: "center",
          }}
        >
          <View
            style={{
              flexDirection: isNarrowPhone ? "column" : "row",
              justifyContent: "space-between",
              alignItems: isNarrowPhone ? "flex-start" : "center",
              marginBottom: 22,
              gap: isNarrowPhone ? 12 : 0,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flex: 1,
                width: "100%",
              }}
            >
              <TouchableOpacity
                onPress={openMenu}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: UI.card,
                  borderColor: UI.border,
                  borderWidth: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 12,
                }}
              >
                <Text
                  style={{
                    color: UI.text,
                    fontSize: 20,
                    fontWeight: "800",
                  }}
                >
                  ☰
                </Text>
              </TouchableOpacity>

              <View>
                <Text
                  style={{
                    color: UI.text,
                    fontSize: 28,
                    fontWeight: "800",
                    letterSpacing: 0.3,
                  }}
                >
                  Goals
                </Text>
                <Text
                  style={{
                    color: UI.primary,
                    marginTop: 6,
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  Welcome, {auth?.profile?.first_name?.trim() || "there"} 👋
                </Text>
                <Text
                  style={{
                    color: UI.muted,
                    marginTop: 4,
                    fontSize: 13,
                  }}
                >
                  Stay on track with your routine
                </Text>
              </View>
            </View>

            <ThemeButton
              theme={UI}
              onPress={() => router.push("/add-goal")}
              style={{
                backgroundColor: UI.primary,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                shadowColor: "#000",
                shadowOpacity: 0.2,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
                elevation: 3,
                width: isNarrowPhone ? "100%" : undefined,
                minHeight: 46,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                style={{
                  color: UI.text,
                  fontWeight: "700",
                  fontSize: 14,
                }}
              >
                Add Goal
              </Text>
            </ThemeButton>
          </View>

          {goalCards.length === 0 ? (
            <View
              style={{
                backgroundColor: UI.card,
                borderColor: UI.border,
                borderRadius: 18,
                padding: 22,
                borderWidth: 1,
              }}
            >
              <Text
                style={{
                  color: UI.text,
                  fontSize: 18,
                  fontWeight: "700",
                }}
              >
                No goals yet
              </Text>
              <Text
                style={{
                  color: UI.muted,
                  marginTop: 8,
                  lineHeight: 20,
                }}
              >
                Add a goal and its time shifts to start tracking your daily
                routine.
              </Text>
            </View>
          ) : (
            goalCards.map(
              ({
                goal,
                totalDays,
                currentDay,
                displayShift,
                progressInfo,
                pendingReviewShifts,
                upcomingShifts,
                cardImage,
              }) => {
                const isExpanded = expandedGoalId === goal.id;

                const statusText: ShiftStatus =
                  displayShift?.status ?? "Upcoming";

                const isInProgress = statusText === "In Progress";

                const shiftTitle =
                  displayShift?.shift.title ??
                  upcomingShifts[0]?.shift.title ??
                  "Scheduled goal";

                const shiftTimeText = displayShift
                  ? getRelativeShiftLabel(displayShift, now)
                  : upcomingShifts[0]
                    ? getRelativeShiftLabel(upcomingShifts[0], now)
                    : "No active shift right now";

                const fullDateRange = `${formatFullDateRangePart(
                  goal.startDate,
                )} - ${formatFullDateRangePart(goal.endDate ?? goal.startDate)}`;

                return (
                  <ThemeSurface
                    key={goal.id}
                    theme={UI}
                    lavaBackground={(UI as any).effect === "lava"}
                    style={{
                      borderRadius: 20,
                      marginBottom: 18,
                      borderWidth: isInProgress ? 2.2 : 1,
                      borderColor: UI.border,
                      overflow: "hidden",
                      shadowColor: isInProgress ? "#3b82f6" : "#000",
                      shadowOpacity: isInProgress ? 0.45 : 0.2,
                      shadowRadius: isInProgress ? 16 : 8,
                      shadowOffset: { width: 0, height: 4 },
                      elevation: isInProgress ? 10 : 4,
                    }}
                  >
                    <View
                      onLayout={(event) => {
                        goalCardYRef.current[goal.id] =
                          event.nativeEvent.layout.y;
                      }}
                    >
                      <TouchableOpacity
                        activeOpacity={0.92}
                        onPress={() =>
                          setExpandedGoalId((prev) =>
                            prev === goal.id ? null : goal.id,
                          )
                        }
                      >
                        <View
                          style={{
                            height: 178,
                            position: "relative",
                            backgroundColor: UI.innerCard,
                            overflow: "hidden",
                          }}
                        >
                          {cardImage ? (
                            <Image
                              source={cardImage}
                              fadeDuration={0}
                              resizeMode="cover"
                              style={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                bottom: 0,
                                width: isTablet ? "62%" : "70%",
                                height: "100%",
                              }}
                            />
                          ) : (
                            <View
                              style={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                bottom: 0,
                                width: isTablet ? "62%" : "70%",
                                backgroundColor: UI.border,
                              }}
                            />
                          )}

                          <View
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              bottom: 0,
                              width: "42%",
                              backgroundColor: UI.imageOverlaySolid,
                            }}
                          />

                          <LinearGradient
                            colors={[
                              UI.imageOverlayStrong,
                              UI.imageOverlayStrong,
                              UI.imageOverlay90,
                              UI.imageOverlay80,
                              UI.imageOverlay60,
                              UI.imageOverlay30,
                              UI.imageOverlay10,
                              "transparent",
                            ]}
                            locations={[
                              0, 0.12, 0.24, 0.4, 0.58, 0.74, 0.88, 1,
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: "30%",
                              bottom: 0,
                              width: "42%",
                            }}
                          />

                          <LinearGradient
                            colors={[
                              "rgba(255,255,255,0.03)",
                              "rgba(0,0,0,0.02)",
                              "rgba(0,0,0,0.12)",
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                            }}
                          />
                          <View
                            style={{
                              position: "absolute",
                              top: 0,
                              right: 0,
                              bottom: 0,
                              width: isTablet ? "62%" : "70%",
                              backgroundColor: UI.imageShade,
                            }}
                          />

                          <View
                            style={{
                              paddingHorizontal: 16,
                              paddingVertical: 14,
                              height: 178,
                              justifyContent: "center",
                            }}
                          >
                            <View
                              style={{
                                position: "absolute",
                                top: 2,
                                left: 0,
                                right: 0,
                                alignItems: "center",
                                zIndex: 6,
                              }}
                            >
                              <GoalExpandIcon isExpanded={isExpanded} />
                            </View>

                            {pendingReviewShifts.length > 0 && (
                              <Animated.View
                                style={{
                                  position: "absolute",
                                  top: 12,
                                  right: 12,
                                  minWidth: 28,
                                  height: 28,
                                  borderRadius: 999,
                                  backgroundColor: "#dc2626",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  paddingHorizontal: 8,
                                  zIndex: 5,
                                  transform: [{ scale: badgeScale }],
                                  shadowColor: "#000",
                                  shadowOpacity: 0.25,
                                  shadowRadius: 6,
                                  shadowOffset: { width: 0, height: 3 },
                                  elevation: 5,
                                }}
                              >
                                <Text
                                  style={{
                                    color: "#ffffff",
                                    fontSize: 12,
                                    fontWeight: "800",
                                  }}
                                >
                                  {pendingReviewShifts.length}
                                </Text>
                              </Animated.View>
                            )}
                            <View>
                              <View
                                style={{
                                  flexDirection: "row",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                  marginBottom: 10,
                                }}
                              >
                                <View
                                  style={{
                                    flex: 1,
                                    paddingRight: isExpanded ? 0 : 10,
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: UI.text,
                                      fontSize: isTablet ? 24 : 22,
                                      fontWeight: "900",
                                      lineHeight: isTablet ? 28 : 25,
                                      maxWidth: isExpanded
                                        ? "100%"
                                        : isTablet
                                          ? "78%"
                                          : isVeryNarrowPhone
                                            ? "60%"
                                            : "68%",
                                      flexShrink: 1,
                                      flexWrap: "wrap",
                                    }}
                                    numberOfLines={isExpanded ? undefined : 2}
                                    ellipsizeMode={
                                      isExpanded ? undefined : "tail"
                                    }
                                  >
                                    {goal.title}
                                  </Text>
                                </View>

                                {!isExpanded && (
                                  <View
                                    style={{
                                      backgroundColor: UI.innerCard,

                                      paddingHorizontal: 10,
                                      paddingVertical: 6,
                                      borderRadius: 12,
                                      borderWidth: 1,
                                      borderColor: UI.border,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: UI.text,
                                        fontSize: 11,
                                        fontWeight: "700",
                                      }}
                                    >
                                      {goal.endDate
                                        ? `Day ${Math.max(currentDay, 0)}/${Math.max(totalDays, 0)}`
                                        : `Day ${Math.max(currentDay, 0)}`}
                                    </Text>
                                  </View>
                                )}
                              </View>

                              <Text
                                style={{
                                  color: UI.primary,
                                  fontSize: 12,
                                  marginTop: 2,
                                  fontWeight: "600",
                                  marginBottom: 5,
                                  maxWidth: "68%",
                                  letterSpacing: 0.2,
                                }}
                                numberOfLines={1}
                              >
                                {shiftTimeText}
                              </Text>

                              <Text
                                style={{
                                  color: UI.text,
                                  fontSize: 14,
                                  fontWeight: "600",
                                  marginBottom: 8,
                                  maxWidth: "68%",
                                }}
                                numberOfLines={1}
                              >
                                {shiftTitle}
                              </Text>

                              <View
                                style={{
                                  marginBottom:
                                    pendingReviewShifts.length > 0 ? 6 : 10,
                                  alignSelf: "flex-start",
                                  backgroundColor: isInProgress
                                    ? "rgba(59, 130, 246, 0.18)"
                                    : statusBgColors[statusText],
                                  borderWidth: isInProgress ? 2 : 1,
                                  borderColor: isInProgress
                                    ? "#60a5fa"
                                    : statusColors[statusText],
                                  paddingVertical: 4,
                                  paddingHorizontal: 10,
                                  borderRadius: 999,
                                  shadowColor: isInProgress
                                    ? "#3b82f6"
                                    : "transparent",
                                  shadowOpacity: isInProgress ? 0.45 : 0,
                                  shadowRadius: isInProgress ? 8 : 0,
                                  shadowOffset: { width: 0, height: 0 },
                                  elevation: isInProgress ? 4 : 0,
                                }}
                              >
                                <Text
                                  style={{
                                    color: isInProgress
                                      ? "#93c5fd"
                                      : statusColors[statusText],
                                    fontWeight: "900",
                                    fontSize: 10,
                                    letterSpacing: 0.4,
                                  }}
                                >
                                  {statusText}
                                </Text>
                              </View>

                              {pendingReviewShifts.length > 0 && (
                                <Text
                                  style={{
                                    color: "#fca5a5",
                                    fontSize: 12,
                                    fontWeight: "700",
                                    marginBottom: 10,
                                    maxWidth: "68%",
                                  }}
                                  numberOfLines={1}
                                >
                                  {pendingReviewShifts.length} shift
                                  {pendingReviewShifts.length === 1
                                    ? ""
                                    : "s"}{" "}
                                  awaiting review
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>

                      <View
                        style={{
                          padding: 18,
                          paddingTop: isExpanded ? 16 : 12,
                        }}
                      >
                        {isExpanded && (
                          <View style={{ marginBottom: 18 }}>
                            <ThemeSurface
                              theme={UI}
                              style={{
                                backgroundColor: UI.innerCard,
                                borderRadius: 16,
                                padding: 14,
                                marginBottom: 14,
                              }}
                            >
                              <Text
                                style={{
                                  color: UI.muted,
                                  fontSize: 12,
                                  fontWeight: "700",
                                  marginBottom: 6,
                                  textTransform: "uppercase",
                                  letterSpacing: 0.8,
                                }}
                              >
                                Selected Days
                              </Text>
                              <Text
                                style={{
                                  color: UI.text,
                                  fontSize: 15,
                                  fontWeight: "600",
                                }}
                              >
                                {formatSelectedDaysFull(goal.days)}
                              </Text>

                              <Text
                                style={{
                                  color: UI.muted,
                                  fontSize: 12,
                                  fontWeight: "700",
                                  marginTop: 14,
                                  marginBottom: 6,
                                  textTransform: "uppercase",
                                  letterSpacing: 0.8,
                                }}
                              >
                                Date Range
                              </Text>
                              <Text
                                style={{
                                  color: UI.text,
                                  fontSize: 15,
                                  fontWeight: "600",
                                  lineHeight: 22,
                                }}
                              >
                                {fullDateRange}
                              </Text>
                            </ThemeSurface>

                            <>
                              <View
                                style={{
                                  backgroundColor: UI.innerCard,
                                  borderRadius: 18,
                                  padding: 16,
                                  marginBottom: 14,
                                  borderWidth: 1,
                                  borderColor: UI.border,
                                  overflow: "hidden",
                                }}
                              >
                                <View
                                  style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: 12,
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: UI.muted,
                                      fontSize: 12,
                                      fontWeight: "700",
                                      textTransform: "uppercase",
                                      letterSpacing: 0.8,
                                    }}
                                  >
                                    Progress
                                  </Text>

                                  <Text
                                    style={{
                                      color: UI.text,
                                      fontSize: 18,
                                      fontWeight: "900",
                                    }}
                                  >
                                    {progressInfo.percent}%
                                  </Text>
                                </View>

                                <View
                                  style={{
                                    height: 16,
                                    borderRadius: 999,
                                    overflow: "hidden",
                                    backgroundColor: "rgba(255,255,255,0.08)",
                                    position: "relative",
                                    borderWidth: 1,
                                    borderColor: "rgba(255,255,255,0.06)",
                                  }}
                                >
                                  <LinearGradient
                                    colors={["#2563eb", "#3b82f6", "#60a5fa"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                    }}
                                  />

                                  <View
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      right: 0,
                                      bottom: 0,
                                      width: `${100 - progressInfo.percent}%`,
                                      backgroundColor: UI.innerCard,
                                    }}
                                  />

                                  <LinearGradient
                                    colors={[
                                      "rgba(255,255,255,0.20)",
                                      "rgba(255,255,255,0.06)",
                                      "transparent",
                                    ]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      height: 7,
                                    }}
                                  />
                                </View>

                                <Text
                                  style={{
                                    color: UI.muted,
                                    fontSize: 13,
                                    marginTop: 10,
                                    lineHeight: 18,
                                  }}
                                >
                                  {progressInfo.completedShiftCount} of{" "}
                                  {progressInfo.totalShiftCount} shifts
                                  completed
                                </Text>
                              </View>
                              <ThemeSurface
                                theme={UI}
                                style={{
                                  backgroundColor: UI.innerCard,
                                  borderRadius: 16,
                                  padding: 14,
                                  marginBottom: 14,
                                }}
                              >
                                <Text
                                  style={{
                                    color: UI.muted,
                                    fontSize: 12,
                                    fontWeight: "700",
                                    marginBottom: 10,
                                    textTransform: "uppercase",
                                    letterSpacing: 0.8,
                                  }}
                                >
                                  Finished Shifts Awaiting Review
                                </Text>

                                {pendingReviewShifts.length === 0 ? (
                                  <Text
                                    style={{
                                      color: UI.muted,
                                      fontSize: 14,
                                    }}
                                  >
                                    No finished shifts waiting for review
                                  </Text>
                                ) : (
                                  pendingReviewShifts.map((item, index) => {
                                    const finishedShift = (
                                      goal.planGuide ?? []
                                    ).find(
                                      (step) => step.id === item.shiftId,
                                    ) as ExtendedPlanGuideItem | undefined;

                                    const finishedShiftKey = `${goal.id}-finished-${item.key}`;

                                    return (
                                      <View
                                        key={item.key}
                                        style={{
                                          paddingVertical: 10,
                                          borderTopWidth: index === 0 ? 0 : 1,
                                          borderTopColor: UI.border,
                                        }}
                                      >
                                        <Text
                                          style={{
                                            color: UI.text,
                                            fontSize: 15,
                                            fontWeight: "700",
                                            marginBottom: 4,
                                          }}
                                        >
                                          {item.shiftTitle}
                                        </Text>

                                        <Text
                                          style={{
                                            color: UI.primary,
                                            fontSize: 13,
                                            fontWeight: "600",
                                            marginBottom: 10,
                                          }}
                                        >
                                          {new Date(
                                            item.shiftDate,
                                          ).toLocaleDateString("en-GB", {
                                            weekday: "short",
                                            day: "numeric",
                                            month: "short",
                                          })}{" "}
                                          • {formatTime(item.shiftStart)} -{" "}
                                          {formatTime(item.shiftEnd)}
                                        </Text>

                                        <Text
                                          style={{
                                            color: UI.muted,
                                            fontSize: 12,
                                            marginBottom: 10,
                                          }}
                                        >
                                          Review before{" "}
                                          {item.expiresDate.toLocaleDateString(
                                            "en-GB",
                                            {
                                              weekday: "short",
                                              day: "numeric",
                                              month: "short",
                                            },
                                          )}{" "}
                                          at 12:00 AM
                                        </Text>

                                        <View
                                          style={{
                                            flexDirection: isVeryNarrowPhone
                                              ? "column"
                                              : "row",
                                            gap: 10,
                                          }}
                                        >
                                          <TouchableOpacity
                                            onPress={() =>
                                              markShiftCompleted?.(
                                                goal.id,
                                                item.key,
                                              )
                                            }
                                            style={{
                                              flex: 1,
                                              backgroundColor: "#16a34a",
                                              paddingVertical: 11,
                                              borderRadius: 10,
                                              justifyContent: "center",
                                            }}
                                          >
                                            <Text
                                              style={{
                                                color: UI.text,
                                                textAlign: "center",
                                                fontWeight: "700",
                                              }}
                                            >
                                              ✓ Completed
                                            </Text>
                                          </TouchableOpacity>

                                          <TouchableOpacity
                                            onPress={() =>
                                              markShiftMissed?.(
                                                goal.id,
                                                item.key,
                                              )
                                            }
                                            style={{
                                              flex: 1,
                                              backgroundColor: "#dc2626",
                                              paddingVertical: 11,
                                              borderRadius: 10,
                                              justifyContent: "center",
                                            }}
                                          >
                                            <Text
                                              style={{
                                                color: UI.text,
                                                textAlign: "center",
                                                fontWeight: "700",
                                              }}
                                            >
                                              ✕ Missed
                                            </Text>
                                          </TouchableOpacity>
                                        </View>
                                        {!!finishedShift?.explanation && (
                                          <Text
                                            style={{
                                              color: UI.muted,
                                              fontSize: 13,
                                              lineHeight: 21,
                                              marginTop: 10,
                                            }}
                                          >
                                            {finishedShift.explanation}
                                          </Text>
                                        )}

                                        {Array.isArray(
                                          finishedShift?.resourceLinks,
                                        ) &&
                                          finishedShift.resourceLinks.length >
                                            0 && (
                                            <View style={{ marginTop: 10 }}>
                                              <Text
                                                style={{
                                                  color: UI.text,
                                                  fontSize: 12,
                                                  fontWeight: "700",
                                                  marginBottom: 6,
                                                }}
                                              >
                                                Helpful links
                                              </Text>

                                              {finishedShift.resourceLinks.map(
                                                (link, linkIndex) => (
                                                  <TouchableOpacity
                                                    key={`${link.url}-${linkIndex}`}
                                                    onPress={() =>
                                                      Linking.openURL(link.url)
                                                    }
                                                    style={{
                                                      backgroundColor:
                                                        UI.primarySoft,
                                                      borderRadius: 10,
                                                      paddingVertical: 8,
                                                      paddingHorizontal: 10,
                                                      marginBottom: 6,
                                                    }}
                                                  >
                                                    <Text
                                                      style={{
                                                        color: UI.primary,
                                                        fontSize: 13,
                                                        fontWeight: "700",
                                                      }}
                                                    >
                                                      {link.title}
                                                    </Text>
                                                  </TouchableOpacity>
                                                ),
                                              )}
                                            </View>
                                          )}
                                      </View>
                                    );
                                  })
                                )}
                              </ThemeSurface>

                              <ThemeSurface
                                theme={UI}
                                style={{
                                  backgroundColor: UI.innerCard,
                                  borderRadius: 16,
                                  padding: 14,
                                }}
                              >
                                <Text
                                  style={{
                                    color: UI.muted,
                                    fontSize: 12,
                                    fontWeight: "700",
                                    marginBottom: 10,
                                    textTransform: "uppercase",
                                    letterSpacing: 0.8,
                                  }}
                                >
                                  Next Time Shifts
                                </Text>

                                {upcomingShifts.length === 0 ? (
                                  <Text
                                    style={{
                                      color: UI.muted,
                                      fontSize: 14,
                                    }}
                                  >
                                    No upcoming shifts
                                  </Text>
                                ) : (
                                  upcomingShifts.map((item, index) => (
                                    <View
                                      key={`${item.shift.id}-${index}`}
                                      style={{
                                        paddingVertical: 10,
                                        borderTopWidth: index === 0 ? 0 : 1,
                                        borderTopColor: UI.border,
                                      }}
                                    >
                                      <Text
                                        style={{
                                          color: UI.text,
                                          fontSize: 15,
                                          fontWeight: "700",
                                          marginBottom: 4,
                                        }}
                                      >
                                        {item.shift.title}
                                      </Text>

                                      <Text
                                        style={{
                                          color: UI.primary,
                                          fontSize: 13,
                                          fontWeight: "600",
                                        }}
                                      >
                                        {getRelativeShiftLabel(item, now)}
                                      </Text>
                                      {!!item.shift.explanation && (
                                        <Text
                                          style={{
                                            color: UI.muted,
                                            fontSize: 13,
                                            lineHeight: 19,
                                            marginTop: 8,
                                          }}
                                        >
                                          {item.shift.explanation}
                                        </Text>
                                      )}

                                      {Array.isArray(
                                        item.shift.resourceLinks,
                                      ) &&
                                        item.shift.resourceLinks.length > 0 && (
                                          <View style={{ marginTop: 10 }}>
                                            <Text
                                              style={{
                                                color: UI.text,
                                                fontSize: 12,
                                                fontWeight: "700",
                                                marginBottom: 6,
                                              }}
                                            >
                                              Helpful links
                                            </Text>

                                            {item.shift.resourceLinks.map(
                                              (link, linkIndex) => (
                                                <TouchableOpacity
                                                  key={`${link.url}-${linkIndex}`}
                                                  onPress={() =>
                                                    Linking.openURL(link.url)
                                                  }
                                                  style={{
                                                    backgroundColor:
                                                      UI.primarySoft,
                                                    borderRadius: 10,
                                                    paddingVertical: 8,
                                                    paddingHorizontal: 10,
                                                    marginBottom: 6,
                                                  }}
                                                >
                                                  <Text
                                                    style={{
                                                      color: UI.primary,
                                                      fontSize: 13,
                                                      fontWeight: "700",
                                                    }}
                                                  >
                                                    {link.title}
                                                  </Text>
                                                </TouchableOpacity>
                                              ),
                                            )}
                                          </View>
                                        )}
                                    </View>
                                  ))
                                )}
                              </ThemeSurface>
                            </>
                          </View>
                        )}

                        <>
                          <View
                            style={{
                              flexDirection: isVeryNarrowPhone
                                ? "column"
                                : "row",
                              gap: 10,
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <ThemeButton
                                theme={UI}
                                onPress={() =>
                                  router.push(`/edit-goal?id=${goal.id}`)
                                }
                                style={{
                                  backgroundColor: UI.primary,
                                  paddingVertical: 13,
                                  borderRadius: 12,
                                  minHeight: 48,
                                  justifyContent: "center",
                                }}
                              >
                                <Text
                                  numberOfLines={1}
                                  adjustsFontSizeToFit
                                  minimumFontScale={0.85}
                                  style={{
                                    color: UI.text,
                                    textAlign: "center",
                                    fontWeight: "700",
                                    fontSize: 14,
                                  }}
                                >
                                  Edit
                                </Text>
                              </ThemeButton>
                            </View>

                            <TouchableOpacity
                              onPress={() => handleDeleteGoal(goal.id)}
                              style={{
                                flex: 1,
                                backgroundColor: "#dc2626",
                                paddingVertical: 13,
                                borderRadius: 12,
                                minHeight: 48,
                                justifyContent: "center",
                              }}
                            >
                              <Text
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.85}
                                style={{
                                  color: UI.text,
                                  textAlign: "center",
                                  fontWeight: "700",
                                  fontSize: 14,
                                }}
                              >
                                Delete
                              </Text>
                            </TouchableOpacity>
                          </View>
                          {isExpanded && (
                            <TouchableOpacity
                              onPress={() => closeGoalDetails(goal.id)}
                              activeOpacity={0.9}
                              style={{
                                marginTop: 12,
                                backgroundColor: UI.innerCard,
                                borderColor: UI.border,
                                borderWidth: 1,
                                paddingVertical: 12,
                                borderRadius: 12,
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "row",
                                gap: 8,
                              }}
                            >
                              <Text
                                style={{
                                  color: UI.primary,
                                  fontSize: 16,
                                  fontWeight: "900",
                                }}
                              ></Text>

                              <Text
                                style={{
                                  color: UI.text,
                                  fontSize: 14,
                                  fontWeight: "800",
                                }}
                              >
                                Close details
                              </Text>
                            </TouchableOpacity>
                          )}
                          {!isExpanded && (
                            <View
                              style={{
                                marginTop: 14,
                                width: "100%",
                              }}
                            >
                              <View
                                style={{
                                  height: 10,
                                  borderRadius: 999,
                                  overflow: "hidden",
                                  backgroundColor: UI.border,
                                  position: "relative",
                                }}
                              >
                                <LinearGradient
                                  colors={["#ef4444", "#f59e0b", "#10b981"]}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                  style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                  }}
                                />

                                <View
                                  style={{
                                    position: "absolute",
                                    top: 0,
                                    right: 0,
                                    bottom: 0,
                                    width: `${100 - progressInfo.percent}%`,
                                    backgroundColor: UI.border,
                                  }}
                                />
                              </View>
                            </View>
                          )}
                        </>
                      </View>
                    </View>
                  </ThemeSurface>
                );
              },
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
