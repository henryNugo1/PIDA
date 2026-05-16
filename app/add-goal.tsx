import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Animated,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import { GoalContext } from "../context/GoalContext";
import { ThemeContext } from "../context/ThemeContext";

import {
  buildDayCells,
  buildMonthItems,
  buildWeekItems,
  buildYearItems,
  formatDateKey,
  formatFullDate,
  formatSelectedDatesSummary,
  formatSelectedMonthsSummary,
  formatSelectedWeekdaysSummary,
  formatSelectedWeeksSummary,
  formatSelectedYearsSummary,
  formatTime,
  getGroupedShifts,
  getMonthLabel,
  getSelectedScheduleDaysCount,
  isDateSelectable,
  monthShort,
  parseDateKey,
  routineModes,
  timeframeOptions,
  weekDays,
  weekHeader,
  type RoutineMode,
  type ShiftItem,
  type TimeframeType,
} from "../utils/goalPlannerHelpers";

import { validateShiftConflicts } from "../utils/shiftValidation";
const DEBUG = false;

const presetGoalImages = [
  {
    key: "gym-1",
    category: "gym",
    label: "Gym 1",
    image: require("../assets/images/Gym/edgar-chaparro-sHfo3WOgGTU-unsplash.jpg"),
  },
  {
    key: "gym-2",
    category: "gym",
    label: "Gym 2",
    image: require("../assets/images/Gym/brett-jordan-U2q73PfHFpM-unsplash.jpg"),
  },
  {
    key: "gym-3",
    category: "gym",
    label: "Gym 3",
    image: require("../assets/images/Gym/lorenzo-hamers-jvIaut-V9a4-unsplash.jpg"),
  },
  {
    key: "gym-4",
    category: "gym",
    label: "Gym 4",
    image: require("../assets/images/Gym/sven-mieke-Lx_GDv7VA9M-unsplash.jpg"),
  },
  {
    key: "gym-5",
    category: "gym",
    label: "Gym 5",
    image: require("../assets/images/Gym/victor-freitas-WvDYdXDzkhs-unsplash.jpg"),
  },

  {
    key: "workout-1",
    category: "workout",
    label: "Workout 1",
    image: require("../assets/images/Workout/cagin-kargi-Qzp60FT380E-unsplash.jpg"),
  },
  {
    key: "workout-2",
    category: "workout",
    label: "Workout 2",
    image: require("../assets/images/Workout/gordon-cowie-ISg1JhN_vFk-unsplash.jpg"),
  },
  {
    key: "workout-3",
    category: "workout",
    label: "Workout 3",
    image: require("../assets/images/Workout/jonathan-borba-lrQPTQs7nQQ-unsplash.jpg"),
  },
  {
    key: "workout-4",
    category: "workout",
    label: "Workout 4",
    image: require("../assets/images/Workout/kike-vega-F2qh3yjz6Jk-unsplash.jpg"),
  },
  {
    key: "workout-5",
    category: "workout",
    label: "Workout 5",
    image: require("../assets/images/Workout/logan-weaver-lgnwvr-amgv9YUg-MA-unsplash.jpg"),
  },

  {
    key: "meditation-1",
    category: "meditation",
    label: "Meditation 1",
    image: require("../assets/images/Meditation/jared-rice-NTyBbu66_SI-unsplash.jpg"),
  },
  {
    key: "meditation-2",
    category: "meditation",
    label: "Meditation 2",
    image: require("../assets/images/Meditation/colton-sturgeon-6KkYYqTEDwQ-unsplash.jpg"),
  },
  {
    key: "meditation-3",
    category: "meditation",
    label: "Meditation 3",
    image: require("../assets/images/Meditation/chelsea-gates-n8L1VYaypcw-unsplash.jpg"),
  },
  {
    key: "meditation-4",
    category: "meditation",
    label: "Meditation 4",
    image: require("../assets/images/Meditation/levi-xu-dOhJtfXJZfw-unsplash.jpg"),
  },
  {
    key: "meditation-5",
    category: "meditation",
    label: "Meditation 5",
    image: require("../assets/images/Meditation/ethan-rougon-zWIWNeEg4Uo-unsplash.jpg"),
  },

  {
    key: "cooking-1",
    category: "cooking",
    label: "Cooking 1",
    image: require("../assets/images/Cooking/ahmadreza-rezaie-9x6QkgB722w-unsplash.jpg"),
  },
  {
    key: "cooking-2",
    category: "cooking",
    label: "Cooking 2",
    image: require("../assets/images/Cooking/joseph-gonzalez-zcUgjyqEwe8-unsplash.jpg"),
  },
  {
    key: "cooking-3",
    category: "cooking",
    label: "Cooking 3",
    image: require("../assets/images/Cooking/myles-tan-IWCljYv1TJw-unsplash.jpg"),
  },
  {
    key: "cooking-4",
    category: "cooking",
    label: "Cooking 4",
    image: require("../assets/images/Cooking/tim-zankert-ZWweujwrLEM-unsplash.jpg"),
  },
  {
    key: "cooking-5",
    category: "cooking",
    label: "Cooking 5",
    image: require("../assets/images/Cooking/the-design-lady-Z9QhA1aGXck-unsplash.jpg"),
  },

  {
    key: "money-1",
    category: "money",
    label: "Money 1",
    image: require("../assets/images/Money/adam-nir-wTO6MWpMrJk-unsplash.jpg"),
  },
  {
    key: "money-2",
    category: "money",
    label: "Money 2",
    image: require("../assets/images/Money/alexander-grey-8lnbXtxFGZw-unsplash.jpg"),
  },
  {
    key: "money-3",
    category: "money",
    label: "Money 3",
    image: require("../assets/images/Money/art-rachen-yJpjLD3c9bU-unsplash.jpg"),
  },
  {
    key: "money-4",
    category: "money",
    label: "Money 4",
    image: require("../assets/images/Money/brano-heYdDdq0cbE-unsplash.jpg"),
  },
  {
    key: "money-5",
    category: "money",
    label: "Money 5",
    image: require("../assets/images/Money/elena-mozhvilo-nhYK4qIv9Pg-unsplash.jpg"),
  },

  {
    key: "study-1",
    category: "study",
    label: "Study 1",
    image: require("../assets/images/Studying/christin-hume-k2Kcwkandwg-unsplash.jpg"),
  },
  {
    key: "study-2",
    category: "study",
    label: "Study 2",
    image: require("../assets/images/Studying/joel-muniz-XqXJJhK-c08-unsplash (1).jpg"),
  },
  {
    key: "study-3",
    category: "study",
    label: "Study 3",
    image: require("../assets/images/Studying/ioann-mark-kuznietsov-P6uqpNyXcI4-unsplash.jpg"),
  },
  {
    key: "study-4",
    category: "study",
    label: "Study 4",
    image: require("../assets/images/Studying/jessica-ruscello-OQSCtabGkSY-unsplash.jpg"),
  },
  {
    key: "study-5",
    category: "study",
    label: "Study 5",
    image: require("../assets/images/Studying/matias-north-v8DSLoY80Xk-unsplash.jpg"),
  },

  {
    key: "sleep-1",
    category: "sleep",
    label: "Sleep 1",
    image: require("../assets/images/Sleeping/alexander-possingham-CeWNEEsHPbA-unsplash.jpg"),
  },
  {
    key: "sleep-2",
    category: "sleep",
    label: "Sleep 2",
    image: require("../assets/images/Sleeping/charlesdeluvio-S2AcayPkszE-unsplash.jpg"),
  },
  {
    key: "sleep-3",
    category: "sleep",
    label: "Sleep 3",
    image: require("../assets/images/Sleeping/phil-desforges-m4bcgrz4jn0-unsplash.jpg"),
  },
  {
    key: "sleep-4",
    category: "sleep",
    label: "Sleep 4",
    image: require("../assets/images/Sleeping/becca-schultz-l6BenhrIc2w-unsplash.jpg"),
  },
  {
    key: "sleep-5",
    category: "sleep",
    label: "Sleep 5",
    image: require("../assets/images/Sleeping/nathan-waters-zukdSYdFB_A-unsplash.jpg"),
  },
];

const imageCategories = [
  { key: "gym", label: "Gym", previewKey: "gym-1" },
  { key: "workout", label: "Workout", previewKey: "workout-1" },
  { key: "meditation", label: "Meditation", previewKey: "meditation-1" },
  { key: "cooking", label: "Cooking", previewKey: "cooking-1" },
  { key: "money", label: "Money", previewKey: "money-1" },
  { key: "study", label: "Study", previewKey: "study-1" },
  { key: "sleep", label: "Sleeping", previewKey: "sleep-1" },
];

export default function AddGoalScreen() {
  const insets = useSafeAreaInsets();
  const context = useContext(GoalContext);
  const auth = useContext(AuthContext);

  const params = useLocalSearchParams<{
    aiGoalTitle?: string;
    aiPlan?: string;
  }>();

  const scrollRef = useRef<ScrollView>(null);

  const { width } = useWindowDimensions();

  const isVeryNarrowPhone = width < 340;
  const isNarrowPhone = width < 380;
  const isTablet = width >= 768;
  const isLargeTablet = width >= 1024;

  const contentMaxWidth = isLargeTablet ? 1100 : isTablet ? 900 : width;

  const categoryCardWidth = isNarrowPhone ? "100%" : isTablet ? "31.5%" : "48%";
  const routineButtonFullWidth = isNarrowPhone;

  type PlannerColumnWidth = "20%" | "25%" | "33.33%" | "50%" | "16.66%";

  const plannerColumns: {
    week: PlannerColumnWidth;
    month: PlannerColumnWidth;
    year: PlannerColumnWidth;
  } = {
    week: isVeryNarrowPhone ? "50%" : isTablet ? "16.66%" : "25%",
    month: isVeryNarrowPhone ? "50%" : isTablet ? "16.66%" : "25%",
    year: isVeryNarrowPhone ? "33.33%" : isTablet ? "16.66%" : "20%",
  };

  const screenPadding = isTablet ? 28 : 20;
  const cardPadding = isTablet ? 18 : 14;

  const [title, setTitle] = useState("");
  const [routineMode, setRoutineMode] = useState<RoutineMode>("custom");
  const [showGoalTitleDone, setShowGoalTitleDone] = useState(false);
  const [showShiftTitleDone, setShowShiftTitleDone] = useState(false);
  const [showShiftDescriptionDone, setShowShiftDescriptionDone] =
    useState(false);
  const [showDaysDone, setShowDaysDone] = useState(true);
  const [showStartDateDone, setShowStartDateDone] = useState(true);
  const [showEndDateDone, setShowEndDateDone] = useState(true);
  const [showImageDone, setShowImageDone] = useState(true);
  const [showStartTimeDone, setShowStartTimeDone] = useState(true);
  const [showEndTimeDone, setShowEndTimeDone] = useState(true);

  const [titleDone, setTitleDone] = useState(false);
  const [daysDone, setDaysDone] = useState(false);
  const [startDateDone, setStartDateDone] = useState(false);
  const [endDateDone, setEndDateDone] = useState(false);
  const [shiftTitleDone, setShiftTitleDone] = useState(false);
  const [shiftDescriptionDone, setShiftDescriptionDone] = useState(false);

  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  type GuidedStep =
    | "title"
    | "routine"
    | "days"
    | "startDate"
    | "endDate"
    | "planGuide"
    | "shiftForm"
    | "save";

  const [guidedStep, setGuidedStep] = useState<GuidedStep>("title");

  const sectionPositions = useRef<Record<GuidedStep, number>>({
    title: 0,
    routine: 0,
    days: 0,
    startDate: 0,
    endDate: 0,
    planGuide: 0,
    shiftForm: 0,
    save: 0,
  });

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
  };

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(
    new Date(new Date().setDate(new Date().getDate() + 7)),
  );

  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);

  const [displayedMonth, setDisplayedMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [displayedYear, setDisplayedYear] = useState(new Date().getFullYear());

  const [selectedSpecificKeys, setSelectedSpecificKeys] = useState<string[]>(
    [],
  );
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [showAllSelectedTargets, setShowAllSelectedTargets] = useState(false);

  const [shiftTitle, setShiftTitle] = useState("");
  const [shiftDescription, setShiftDescription] = useState("");

  type ShiftFormStep =
    | "shiftTitle"
    | "shiftDescription"
    | "shiftImage"
    | "shiftStart"
    | "shiftEnd"
    | "addShift";

  const [shiftFormStep, setShiftFormStep] =
    useState<ShiftFormStep>("shiftTitle");
  const [selectedShiftImageKey, setSelectedShiftImageKey] = useState<
    string | null
  >(null);
  const [selectedShiftImageUri, setSelectedShiftImageUri] = useState<
    string | null
  >(null);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(
    null,
  );
  const [showCategoryImageModal, setShowCategoryImageModal] = useState(false);
  const [timeframeType, setTimeframeType] = useState<TimeframeType>("day");

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showFocusWarningModal, setShowFocusWarningModal] = useState(false);
  const [hasAcceptedFocusWarning, setHasAcceptedFocusWarning] = useState(false);

  const [stepStartTime, setStepStartTime] = useState(new Date());
  const [stepEndTime, setStepEndTime] = useState(new Date());
  const [showStepStartTime, setShowStepStartTime] = useState(false);
  const [showStepEndTime, setShowStepEndTime] = useState(false);

  const [planGuide, setPlanGuide] = useState<ShiftItem[]>([]);
  const [hasImportedAIPlan, setHasImportedAIPlan] = useState(false);
  const [isAIImportedFlow, setIsAIImportedFlow] = useState(false);
  const [aiGoalMemory, setAiGoalMemory] = useState<any>(null);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const isAddingGoalRef = useRef(false);

  const weekDaysLocal = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const getCurrentWeekdayLabel = (date: Date) => {
    const jsDay = date.getDay();
    return weekDaysLocal[(jsDay + 6) % 7];
  };

  const parseTimeToMinutes = (timeString: string) => {
    const [hour, minute] = String(timeString).split(":").map(Number);
    return (hour || 0) * 60 + (minute || 0);
  };

  const formatMinutesToTime = (totalMinutes: number) => {
    const safe = Math.max(0, Math.min(totalMinutes, 23 * 60 + 59));
    const hour = Math.floor(safe / 60);
    const minute = safe % 60;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  };

  const roundUpToNearest30Minutes = (minutes: number) => {
    return Math.ceil(minutes / 30) * 30;
  };

  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastVariant, setToastVariant] = useState<"error" | "success">(
    "error",
  );
  const toastTranslateY = useRef(new Animated.Value(-100)).current;

  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [shiftPendingDelete, setShiftPendingDelete] =
    useState<ShiftItem | null>(null);

  const [premiumTitle, setPremiumTitle] = useState("Premium Feature");
  const [premiumMessage, setPremiumMessage] = useState("");

  const userPlan = auth?.profile?.plan ?? "free";
  const hasPremiumAccess = auth?.trialStatus.hasPremiumAccess ?? false;

  const openPremiumModal = (title: string, message: string) => {
    setPremiumTitle(title);
    setPremiumMessage(message);
    setShowPremiumModal(true);
  };

  const addGoal = context?.addGoal;
  const goals = context?.goals ?? [];

  useEffect(() => {
    if (!params.aiPlan || hasImportedAIPlan) return;

    try {
      const parsedPayload = JSON.parse(String(params.aiPlan));

      const goalMeta =
        !Array.isArray(parsedPayload) && parsedPayload?.goalMeta
          ? parsedPayload.goalMeta
          : null;

      const parsedPlan = Array.isArray(parsedPayload)
        ? parsedPayload
        : Array.isArray(parsedPayload?.plan)
          ? parsedPayload.plan
          : [];

      const importedAIMemory =
        !Array.isArray(parsedPayload) && parsedPayload?.aiMemory
          ? parsedPayload.aiMemory
          : null;

      setAiGoalMemory(importedAIMemory);

      if (!Array.isArray(parsedPlan) || parsedPlan.length === 0) return;

      const aiGoalTitle = String(params.aiGoalTitle ?? "");
      const uniqueDays = Array.from(
        new Set(
          parsedPlan
            .filter(
              (item: any) => String(item.targetType ?? "weekday") === "weekday",
            )
            .map((item: any) => String(item.weekdayLabel ?? "").trim())
            .filter(Boolean),
        ),
      );

      const now = new Date();

      const importedStartDates = parsedPlan
        .map((item: any) => {
          if (item.plannedDate) return new Date(String(item.plannedDate));
          return null;
        })
        .filter(
          (date: Date | null): date is Date =>
            date instanceof Date && !Number.isNaN(date.getTime()),
        );

      const importedStartDate =
        importedStartDates.length > 0
          ? new Date(
              Math.min(...importedStartDates.map((date) => date.getTime())),
            )
          : new Date();

      const importedEndDateFromPlan =
        importedStartDates.length > 0
          ? new Date(
              Math.max(...importedStartDates.map((date) => date.getTime())),
            )
          : null;

      const validGoalStartDate =
        goalMeta?.goalStartDate &&
        !Number.isNaN(new Date(String(goalMeta.goalStartDate)).getTime())
          ? new Date(String(goalMeta.goalStartDate))
          : importedStartDate;

      const validGoalEndDate =
        goalMeta?.goalEndDate &&
        !Number.isNaN(new Date(String(goalMeta.goalEndDate)).getTime())
          ? new Date(String(goalMeta.goalEndDate))
          : null;

      const inferredDurationDaysFromPlan = parsedPlan.some(
        (item: any) => String(item.timeframeType ?? "") === "year",
      )
        ? 365
        : parsedPlan.some(
              (item: any) => String(item.timeframeType ?? "") === "month",
            )
          ? 90
          : parsedPlan.some(
                (item: any) => String(item.timeframeType ?? "") === "week",
              )
            ? 28
            : 14;

      const importedEndDate =
        validGoalEndDate ??
        importedEndDateFromPlan ??
        new Date(
          validGoalStartDate.getTime() +
            inferredDurationDaysFromPlan * 24 * 60 * 60 * 1000,
        );

      const mappedPlanGuide: ShiftItem[] = parsedPlan.map(
        (item: any, index: number) => {
          const currentWeekday = getCurrentWeekdayLabel(now);
          const nowMinutes = now.getHours() * 60 + now.getMinutes();

          let startTimeString = String(item.startTime ?? "18:00");
          let endTimeString = String(item.endTime ?? "19:00");
          const weekdayLabel = item.weekdayLabel
            ? String(item.weekdayLabel)
            : undefined;

          const startMinutes = parseTimeToMinutes(startTimeString);
          const endMinutes = parseTimeToMinutes(endTimeString);

          let duration = endMinutes - startMinutes;
          if (duration <= 0) duration = 60;

          if (
            String(item.targetType ?? "weekday") === "weekday" &&
            weekdayLabel === currentWeekday &&
            startMinutes <= nowMinutes
          ) {
            const adjustedStart = roundUpToNearest30Minutes(nowMinutes + 45);
            const adjustedEnd = adjustedStart + duration;

            startTimeString = formatMinutesToTime(adjustedStart);
            endTimeString = formatMinutesToTime(
              Math.min(adjustedEnd, 23 * 60 + 59),
            );
          }
          const [startHour, startMinute] = startTimeString
            .split(":")
            .map(Number);

          const [endHour, endMinute] = endTimeString.split(":").map(Number);

          const start = new Date(now);
          start.setHours(startHour || 0, startMinute || 0, 0, 0);

          const end = new Date(now);
          end.setHours(endHour || 0, endMinute || 0, 0, 0);

          return {
            id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`,
            title: String(item.title ?? "AI Shift"),
            timeframeType: String(item.timeframeType ?? "day") as TimeframeType,
            timeframeValue: Number(item.timeframeValue ?? 1),
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            weekdayLabel: item.weekdayLabel
              ? String(item.weekdayLabel)
              : undefined,
            targetType: String(item.targetType ?? "weekday") as
              | "weekday"
              | "date"
              | "week"
              | "month"
              | "year",
            targetKey: item.targetKey ? String(item.targetKey) : undefined,
            targetLabel: item.targetLabel
              ? String(item.targetLabel)
              : undefined,
            plannedDate: item.plannedDate
              ? new Date(String(item.plannedDate)).toISOString()
              : undefined,
            imageKey: item.imageKey ? String(item.imageKey) : undefined,
            imageUri: item.imageUri ? String(item.imageUri) : undefined,
            explanation: item.explanation
              ? String(item.explanation)
              : undefined,
            resourceLinks: Array.isArray(item.resourceLinks)
              ? item.resourceLinks
                  .map((link: any) => ({
                    title: String(link?.title ?? ""),
                    url: String(link?.url ?? ""),
                  }))
                  .filter((link: any) => link.title && link.url)
              : [],

            reviewStatus: "scheduled",
            reviewStartedAt: undefined,
            reviewExpiresAt: undefined,
            completedAt: undefined,
            missedAt: undefined,
          };
        },
      );

      if (aiGoalTitle) {
        setTitle(aiGoalTitle);
        setTitleDone(true);
      }

      if (uniqueDays.length > 0) {
        setRoutineMode("custom");
        setSelectedDays(uniqueDays);
        setDaysDone(true);
      } else {
        setRoutineMode("everyday");
        setSelectedDays(weekDays);
        setDaysDone(true);
      }

      setPlanGuide(mappedPlanGuide);
      setStartDate(validGoalStartDate);
      setEndDate(importedEndDate);
      setDisplayedMonth(
        new Date(
          validGoalStartDate.getFullYear(),
          validGoalStartDate.getMonth(),
          1,
        ),
      );
      setDisplayedYear(validGoalStartDate.getFullYear());
      setShowShiftForm(false);
      setShiftTitleDone(true);

      setStartDateDone(true);
      setEndDateDone(true);

      setShowGoalTitleDone(false);
      setShowShiftTitleDone(false);
      setShowDaysDone(false);
      setShowStartDateDone(false);
      setShowEndDateDone(false);
      setShowImageDone(false);
      setShowStartTimeDone(false);
      setShowEndTimeDone(false);

      setGuidedStep("save");
      setIsAIImportedFlow(true);
      setHasImportedAIPlan(true);

      showTopToast("AI plan imported successfully", "success");

      setTimeout(() => {
        scrollToSection("save");
      }, 220);
    } catch (error) {
      if (DEBUG) console.log("AI import error:", error);
    }
  }, [params.aiGoalTitle, params.aiPlan, hasImportedAIPlan]);

  const hasUnsavedChanges = useMemo(() => {
    return (
      title.trim().length > 0 ||
      selectedDays.length > 0 ||
      selectedSpecificKeys.length > 0 ||
      shiftTitle.trim().length > 0 ||
      shiftDescription.trim().length > 0 ||
      planGuide.length > 0 ||
      selectedShiftImageKey !== null ||
      selectedShiftImageUri !== null
    );
  }, [
    title,
    selectedDays,
    selectedSpecificKeys,
    shiftTitle,
    shiftDescription,
    planGuide,
    selectedShiftImageKey,
    selectedShiftImageUri,
  ]);

  const confirmLeaveForm = useCallback(() => {
    if (!hasUnsavedChanges) {
      router.back();
      return;
    }

    setShowLeaveModal(true);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (!hasUnsavedChanges) return false;

        setShowLeaveModal(true);
        return true;
      },
    );

    return () => subscription.remove();
  }, [hasUnsavedChanges]);

  if (!context || !addGoal) {
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

  const showTopToast = useCallback(
    (message: string, variant: "error" | "success" = "error") => {
      setToastMessage(message);
      setToastVariant(variant);
      setShowToast(true);

      toastTranslateY.stopAnimation();
      toastTranslateY.setValue(-100);

      Animated.sequence([
        Animated.timing(toastTranslateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.delay(2600),
        Animated.timing(toastTranslateY, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowToast(false);
      });
    },
    [toastTranslateY],
  );

  const scrollToSection = useCallback((step: GuidedStep) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, sectionPositions.current[step] - 18),
        animated: true,
      });
    });
  }, []);

  const isSectionLocked = (step: GuidedStep) => {
    const order: GuidedStep[] = [
      "title",
      "routine",
      "days",
      "startDate",
      "endDate",
      "planGuide",
      "shiftForm",
      "save",
    ];

    return order.indexOf(step) > order.indexOf(guidedStep);
  };

  const handleLockedSectionPress = (step: GuidedStep) => {
    if (!isSectionLocked(step)) return;

    scrollToSection(guidedStep);
    showTopToast("Complete the highlighted section first");
  };

  const completeGoalTitleStep = () => {
    if (!title.trim()) {
      showTopToast("Please enter a goal title");
      return;
    }

    setTitleDone(true);
    setShowGoalTitleDone(false);
    scrollToSection("routine");
  };

  const completeShiftTitleStep = () => {
    if (!shiftTitle.trim()) {
      showTopToast("Please enter a shift title");
      return;
    }

    setShiftTitleDone(true);
    setShowShiftTitleDone(false);
    setShiftFormStep("shiftDescription");
    setShowShiftDescriptionDone(true);

    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, sectionPositions.current.shiftForm + 90),
        animated: true,
      });
    }, 180);
  };

  const completeShiftDescriptionStep = () => {
    if (!shiftDescription.trim()) {
      showTopToast("Please enter a shift description");
      return;
    }

    setShiftDescriptionDone(true);
    setShowShiftDescriptionDone(false);
    setShiftFormStep("shiftImage");

    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, sectionPositions.current.shiftForm + 220),
        animated: true,
      });
    }, 180);
  };

  const guardShiftSectionAccess = () => {
    if (isSectionLocked("shiftForm")) {
      handleLockedSectionPress("shiftForm");
      return true;
    }

    return false;
  };

  const getSectionWrapperStyle = (step: GuidedStep) => {
    const active = guidedStep === step;
    const locked = isSectionLocked(step);

    return {
      backgroundColor: UI.card,
      borderRadius: 18,
      borderWidth: active ? 1.5 : 1,
      borderColor: active ? UI.primary : UI.border,
      padding: cardPadding,
      marginBottom: 18,
      opacity: locked ? 0.38 : active ? 1 : 0.78,
      transform: [{ scale: active ? 1.015 : 1 }],
    };
  };

  const getSectionTitleStyle = (step: GuidedStep) => {
    const active = guidedStep === step;
    const locked = isSectionLocked(step);

    return {
      color: active ? UI.text : locked ? "#475569" : UI.muted,
      fontSize: active ? 13 : 12,
      fontWeight: active ? ("800" as const) : ("700" as const),
      textTransform: "uppercase" as const,
      letterSpacing: 0.8,
      marginBottom: 10,
    };
  };

  const isShiftStepLocked = (step: ShiftFormStep) => {
    const order: ShiftFormStep[] = [
      "shiftTitle",
      "shiftDescription",
      "shiftImage",
      "shiftStart",
      "shiftEnd",
      "addShift",
    ];

    return order.indexOf(step) > order.indexOf(shiftFormStep);
  };

  const handleLockedShiftStepPress = (_step: ShiftFormStep) => {
    showTopToast("Complete the highlighted shift section first");

    setTimeout(() => {
      const base = sectionPositions.current.shiftForm;

      const targetY =
        shiftFormStep === "shiftTitle"
          ? base - 20
          : shiftFormStep === "shiftDescription"
            ? base + 80
            : shiftFormStep === "shiftImage"
              ? base + 190
              : shiftFormStep === "shiftStart"
                ? base + 420
                : shiftFormStep === "shiftEnd"
                  ? base + 620
                  : base + 780;

      scrollRef.current?.scrollTo({
        y: Math.max(0, targetY),
        animated: true,
      });
    }, 120);
  };
  const getShiftStepCardStyle = (step: ShiftFormStep) => {
    const active = shiftFormStep === step;
    const locked = isShiftStepLocked(step);

    return {
      opacity: locked ? 0.35 : active ? 1 : 0.85,
      borderWidth: active ? 1.5 : 1,
      borderColor: active ? UI.primary : UI.border,
      backgroundColor: UI.card,
      borderRadius: 16,
      padding: 14,
      marginTop: 12,
    };
  };

  const canOpenPlanGuide =
    title.trim() &&
    selectedDays.length > 0 &&
    startDateDone &&
    (routineMode === "everyday" ? true : endDateDone);

  const hasAtLeastOneShift = planGuide.length > 0;
  const shouldShowDeselectAll = selectedSpecificKeys.length > 1;

  const toggleDay = (day: string) => {
    if (routineMode === "everyday") return;

    setDaysDone(false);
    setShowDaysDone(true);

    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  useEffect(() => {
    setDisplayedMonth(
      new Date(startDate.getFullYear(), startDate.getMonth(), 1),
    );
    setDisplayedYear(startDate.getFullYear());
  }, [startDate]);

  useEffect(() => {
    if (isAIImportedFlow) {
      setGuidedStep("save");
      return;
    }

    if (!title.trim() || !titleDone) {
      setGuidedStep("title");
      return;
    }

    if (!routineMode) {
      setGuidedStep("routine");
      return;
    }

    if (routineMode === "custom" && (selectedDays.length === 0 || !daysDone)) {
      setGuidedStep("days");
      return;
    }

    if (!startDateDone) {
      setGuidedStep("startDate");
      return;
    }

    if (routineMode === "custom" && !endDateDone) {
      setGuidedStep("endDate");
      return;
    }

    if (planGuide.length > 0 && !showShiftForm) {
      setGuidedStep("save");
      return;
    }

    setGuidedStep("shiftForm");
  }, [
    title,
    titleDone,
    routineMode,
    selectedDays,
    daysDone,
    startDateDone,
    endDateDone,
    shiftTitleDone,
    showShiftForm,
    planGuide.length,
  ]);

  const checkDateSelectable = useCallback(
    (date: Date) =>
      isDateSelectable(date, selectedDays, startDate, endDate, routineMode),
    [selectedDays, startDate, endDate, routineMode],
  );

  const toggleSpecificKey = (key: string) => {
    if (isSectionLocked("shiftForm")) {
      handleLockedSectionPress("shiftForm");
      return;
    }

    setSelectedSpecificKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
    setShowShiftForm(false);
  };
  const handleDeselectAllSpecificKeys = () => {
    if (isSectionLocked("shiftForm")) {
      handleLockedSectionPress("shiftForm");
      return;
    }

    setSelectedSpecificKeys([]);
    setShowShiftForm(false);
  };
  const dayCells = useMemo(
    () => buildDayCells(displayedMonth),
    [displayedMonth],
  );

  const weekItems = useMemo(
    () => buildWeekItems(displayedMonth, checkDateSelectable),
    [displayedMonth, checkDateSelectable],
  );

  const monthItems = useMemo(
    () => buildMonthItems(displayedYear, checkDateSelectable),
    [displayedYear, checkDateSelectable],
  );

  const yearItems = useMemo(
    () => buildYearItems(displayedYear, checkDateSelectable),
    [displayedYear, checkDateSelectable],
  );

  const getPlanGuideHeading = () => {
    if (routineMode === "everyday") {
      return "Plan Guide for Everyday Routine";
    }

    const total = getSelectedScheduleDaysCount(
      selectedDays,
      startDate,
      endDate,
      routineMode,
    );

    return `Plan Guide for ${total} Day${total === 1 ? "" : "s"}`;
  };

  const pickCustomShiftImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow gallery access to choose your image.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length) {
      setSelectedShiftImageUri(result.assets[0].uri);
      setSelectedShiftImageKey(null);
      setShowImageDone(true);
    }
  };

  const choosePresetShiftImage = (key: string) => {
    setSelectedShiftImageKey(key);
    setSelectedShiftImageUri(null);
    setShowImageDone(true);
  };

  const clearSelectedShiftImage = () => {
    setSelectedShiftImageKey(null);
    setSelectedShiftImageUri(null);
    setShowImageDone(true);
  };

  const openCategoryImagePicker = (categoryKey: string) => {
    setSelectedCategoryKey(categoryKey);
    setShowCategoryImageModal(true);
  };

  const closeCategoryImagePicker = () => {
    setShowCategoryImageModal(false);
  };

  const getCategoryImages = (categoryKey: string | null) => {
    if (!categoryKey) return [];
    return presetGoalImages.filter((item) => item.category === categoryKey);
  };

  const getPreviewImageByKey = (key: string) => {
    return presetGoalImages.find((item) => item.key === key);
  };

  const selectedCategoryImages = useMemo(
    () => getCategoryImages(selectedCategoryKey),
    [selectedCategoryKey],
  );

  const getShiftTargetSummary = () => {
    if (selectedSpecificKeys.length === 0) {
      return formatSelectedWeekdaysSummary(
        selectedDays,
        showAllSelectedTargets,
      );
    }

    if (timeframeType === "day") {
      return formatSelectedDatesSummary(
        selectedSpecificKeys,
        showAllSelectedTargets,
      );
    }

    if (timeframeType === "week") {
      return formatSelectedWeeksSummary(
        selectedSpecificKeys,
        showAllSelectedTargets,
      );
    }

    if (timeframeType === "month") {
      return formatSelectedMonthsSummary(
        selectedSpecificKeys,
        showAllSelectedTargets,
      );
    }

    return formatSelectedYearsSummary(
      selectedSpecificKeys,
      showAllSelectedTargets,
    );
  };

  const shouldShowMoreLess = () => {
    if (selectedSpecificKeys.length > 0) return selectedSpecificKeys.length > 4;
    return selectedDays.length > 4;
  };

  const handleOpenShiftForm = () => {
    if (!canOpenPlanGuide || isSectionLocked("shiftForm")) {
      handleLockedSectionPress("shiftForm");
      return;
    }

    if (selectedDays.length === 0) {
      showTopToast("Select at least one day first");
      return;
    }

    setShowShiftForm(true);

    setTimeout(() => {
      scrollToSection("shiftForm");
    }, 180);
  };

  useEffect(() => {
    if (!showShiftForm && selectedSpecificKeys.length !== 0) return;

    if (!shiftTitle.trim() || !shiftTitleDone) {
      setShiftFormStep("shiftTitle");
      return;
    }

    if (!shiftDescription.trim() || !shiftDescriptionDone) {
      setShiftFormStep("shiftDescription");
      return;
    }

    if (!selectedShiftImageKey && !selectedShiftImageUri) {
      setShiftFormStep("shiftImage");
      return;
    }

    if (showImageDone === false && showStartTimeDone === true) {
      setShiftFormStep("shiftStart");
      return;
    }

    if (showStartTimeDone === false && showEndTimeDone === true) {
      setShiftFormStep("shiftEnd");
      return;
    }

    if (showEndTimeDone === false) {
      setShiftFormStep("addShift");
    }
  }, [
    showShiftForm,
    selectedSpecificKeys.length,
    shiftTitle,
    shiftTitleDone,
    shiftDescription,
    shiftDescriptionDone,
    selectedShiftImageKey,
    selectedShiftImageUri,
    showImageDone,
    showStartTimeDone,
    showEndTimeDone,
  ]);
  const handleAddShift = () => {
    if (selectedDays.length === 0) {
      showTopToast("Select at least one day first");
      return;
    }

    if (!shiftTitle.trim()) {
      showTopToast("Please enter a shift title");
      return;
    }

    if (!shiftDescription.trim()) {
      showTopToast("Please enter a shift description");
      return;
    }

    if (stepEndTime <= stepStartTime) {
      showTopToast("Shift end time must be after shift start time");
      return;
    }

    let newShifts: ShiftItem[] = [];

    if (selectedSpecificKeys.length === 0) {
      newShifts = selectedDays.map((day, index) => ({
        id: `${Date.now()}-${day}-${index}-${Math.random()
          .toString(36)
          .slice(2, 9)}`,
        title: shiftTitle.trim(),
        explanation: shiftDescription.trim(),
        timeframeType,
        timeframeValue: 1,
        startTime: stepStartTime.toISOString(),
        endTime: stepEndTime.toISOString(),
        weekdayLabel: day,
        targetType: "weekday",
        imageKey: selectedShiftImageKey ?? undefined,
        imageUri: selectedShiftImageUri ?? undefined,
        reviewStatus: "scheduled",
        reviewStartedAt: undefined,
        reviewExpiresAt: undefined,
        completedAt: undefined,
        missedAt: undefined,
      }));
    } else if (timeframeType === "day") {
      newShifts = selectedSpecificKeys.map((key) => ({
        id: `${Date.now()}-${key}-${Math.random().toString(36).slice(2, 9)}`,
        title: shiftTitle.trim(),
        explanation: shiftDescription.trim(),
        timeframeType,
        timeframeValue: 1,
        startTime: stepStartTime.toISOString(),
        endTime: stepEndTime.toISOString(),
        plannedDate: parseDateKey(key).toISOString(),
        targetKey: key,
        targetLabel: formatFullDate(parseDateKey(key).toISOString()),
        targetType: "date",
        imageKey: selectedShiftImageKey ?? undefined,
        imageUri: selectedShiftImageUri ?? undefined,
        reviewStatus: "scheduled",
        reviewStartedAt: undefined,
        reviewExpiresAt: undefined,
        completedAt: undefined,
        missedAt: undefined,
      }));
    } else if (timeframeType === "week") {
      newShifts = selectedSpecificKeys.map((key) => {
        const [year, month, weekNumber] = key.split("|").map(Number);
        return {
          id: `${Date.now()}-${key}-${Math.random().toString(36).slice(2, 9)}`,
          title: shiftTitle.trim(),
          explanation: shiftDescription.trim(),
          timeframeType,
          timeframeValue: 1,
          startTime: stepStartTime.toISOString(),
          endTime: stepEndTime.toISOString(),
          targetKey: key,
          targetLabel: `Week ${weekNumber} ${monthShort[month]} ${year}`,
          targetType: "week" as const,
          imageKey: selectedShiftImageKey ?? undefined,
          imageUri: selectedShiftImageUri ?? undefined,
          reviewStatus: "scheduled",
          reviewStartedAt: undefined,
          reviewExpiresAt: undefined,
          completedAt: undefined,
          missedAt: undefined,
        };
      });
    } else if (timeframeType === "month") {
      newShifts = selectedSpecificKeys.map((key) => {
        const [year, month] = key.split("|").map(Number);
        return {
          id: `${Date.now()}-${key}-${Math.random().toString(36).slice(2, 9)}`,
          title: shiftTitle.trim(),
          explanation: shiftDescription.trim(),
          timeframeType,
          timeframeValue: 1,
          startTime: stepStartTime.toISOString(),
          endTime: stepEndTime.toISOString(),
          targetKey: key,
          targetLabel: `${monthShort[month]} ${year}`,
          targetType: "month" as const,
          imageKey: selectedShiftImageKey ?? undefined,
          imageUri: selectedShiftImageUri ?? undefined,
          reviewStatus: "scheduled",
          reviewStartedAt: undefined,
          reviewExpiresAt: undefined,
          completedAt: undefined,
          missedAt: undefined,
        };
      });
    } else {
      newShifts = selectedSpecificKeys.map((key) => ({
        id: `${Date.now()}-${key}-${Math.random().toString(36).slice(2, 9)}`,
        title: shiftTitle.trim(),
        explanation: shiftDescription.trim(),
        timeframeType,
        timeframeValue: 1,
        startTime: stepStartTime.toISOString(),
        endTime: stepEndTime.toISOString(),
        targetKey: key,
        targetLabel: key,
        targetType: "year",
        imageKey: selectedShiftImageKey ?? undefined,
        imageUri: selectedShiftImageUri ?? undefined,
        reviewStatus: "scheduled",
        reviewStartedAt: undefined,
        reviewExpiresAt: undefined,
        completedAt: undefined,
        missedAt: undefined,
      }));
    }

    const localGoalStart = new Date(startDate);
    const localGoalEnd =
      routineMode === "everyday" ? new Date(startDate) : new Date(endDate);

    const isValid = validateShiftConflicts({
      newShifts,
      localGoalStart,
      localGoalEnd,
      selectedDays,
      routineMode,
      planGuide,
      goals,
      title,
      showTopToast,
    });

    if (!isValid) return;

    setPlanGuide((prev) => [...prev, ...newShifts]);
    setShiftTitle("");
    setShiftDescription("");
    setShiftDescriptionDone(false);
    setShowShiftDescriptionDone(false);

    clearSelectedShiftImage();
    setStepStartTime(new Date());
    setStepEndTime(new Date());
    setShowShiftForm(false);

    setShiftTitleDone(false);
    setShiftDescriptionDone(false);
    setShowShiftTitleDone(false);
    setShowShiftDescriptionDone(false);

    setShowImageDone(true);
    setShowStartTimeDone(true);
    setShowEndTimeDone(true);

    setShiftFormStep("shiftTitle");

    setTimeout(() => {
      scrollToSection("save");
    }, 180);
  };

  const requestDeleteShift = (shift: ShiftItem) => {
    setShiftPendingDelete(shift);
  };

  const confirmDeleteShift = () => {
    if (!shiftPendingDelete) return;

    setPlanGuide((prev) =>
      prev.filter((step) => step.id !== shiftPendingDelete.id),
    );
    setShiftPendingDelete(null);
  };

  const groupedShifts = useMemo(
    () => getGroupedShifts(selectedSpecificKeys, timeframeType, planGuide),
    [selectedSpecificKeys, timeframeType, planGuide],
  );

  const handleAddGoal = async () => {
    if (isAddingGoalRef.current) return;

    if (!title.trim()) {
      showTopToast("Please enter a goal title");
      return;
    }

    if (selectedDays.length === 0) {
      showTopToast("Please select at least one day");
      return;
    }

    if (routineMode === "custom" && endDate < startDate) {
      showTopToast("End date cannot be before start date");
      return;
    }

    if (routineMode === "custom") {
      const total = getSelectedScheduleDaysCount(
        selectedDays,
        startDate,
        endDate,
        routineMode,
      );

      if (total === 0) {
        showTopToast("No selected weekdays fall within this date range");
        return;
      }
    }

    if (!planGuide.length) {
      showTopToast("Please add at least one time shift before saving");
      return;
    }

    if (!hasPremiumAccess) {
      const durationDays =
        routineMode === "everyday"
          ? 32
          : Math.ceil(
              (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
            ) + 1;

      if (durationDays > 31) {
        openPremiumModal(
          "Long Goal Duration",
          "Free users can create goals up to 31 days. Upgrade to Premium to plan longer goals, yearly planning, and extended routines.",
        );
        return;
      }

      const hasYearShift = planGuide.some(
        (shift) =>
          shift.timeframeType === "year" || shift.targetType === "year",
      );

      if (hasYearShift) {
        openPremiumModal(
          "Year Planning",
          "Year planning is a Premium feature. Free users can plan by Day, Week, or Month for up to 31 days.",
        );
        return;
      }
    }

    const conflictCheckEndDate =
      routineMode === "everyday"
        ? new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000)
        : new Date(endDate);

    const isPlanValid = validateShiftConflicts({
      newShifts: planGuide,
      localGoalStart: new Date(startDate),
      localGoalEnd: conflictCheckEndDate,
      selectedDays: routineMode === "everyday" ? [...weekDays] : selectedDays,
      routineMode,
      planGuide,
      goals,
      title,
      showTopToast,
    });

    if (!isPlanValid) return;

    const activeGoalCount = goals.filter(
      (goal) => goal.status === "Upcoming" || goal.status === "In Progress",
    ).length;

    if (!hasPremiumAccess && activeGoalCount >= 2) {
      openPremiumModal(
        "Goal Limit Reached",
        "Free users can create up to 2 active goal cards. Upgrade to Premium to create more goals and manage bigger routines.",
      );
      return;
    }

    if (activeGoalCount >= 3 && !hasAcceptedFocusWarning) {
      setShowFocusWarningModal(true);
      return;
    }

    const newGoal: any = {
      id: Date.now().toString(),
      title: title.trim(),
      type: "daily",
      startDate: startDate.toISOString(),
      endDate: routineMode === "everyday" ? undefined : endDate.toISOString(),
      startTime: planGuide[0]?.startTime,
      endTime: planGuide[0]?.endTime,
      days: (routineMode === "everyday" ? weekDays : selectedDays).join(" "),
      progress: 0,
      status: "Upcoming",
      planGuide,
      createdWithAI: isAIImportedFlow,
      aiGoalMemory: isAIImportedFlow ? aiGoalMemory : null,
      aiLastEditedAt: null,
    };

    if (DEBUG) {
      console.log("ADD-GOAL screen -> about to save goal:", newGoal);
      console.log("ADD-GOAL screen -> planGuide length:", planGuide.length);
    }

    try {
      isAddingGoalRef.current = true;
      setIsAddingGoal(true);

      await addGoal(newGoal);

      if (DEBUG) console.log("ADD-GOAL screen -> addGoal finished");
      router.replace("/(tabs)");
    } catch (error) {
      if (DEBUG) console.log("ADD-GOAL screen -> addGoal failed:", error);
      showTopToast("Failed to save goal");
    } finally {
      isAddingGoalRef.current = false;
      setIsAddingGoal(false);
    }
  };

  const goToPrevious = () => {
    if (timeframeType === "day" || timeframeType === "week") {
      setDisplayedMonth(
        new Date(
          displayedMonth.getFullYear(),
          displayedMonth.getMonth() - 1,
          1,
        ),
      );
      return;
    }

    if (timeframeType === "month") {
      setDisplayedYear(displayedYear - 1);
      return;
    }

    setDisplayedYear(displayedYear - 25);
  };

  const goToNext = () => {
    if (timeframeType === "day" || timeframeType === "week") {
      setDisplayedMonth(
        new Date(
          displayedMonth.getFullYear(),
          displayedMonth.getMonth() + 1,
          1,
        ),
      );
      return;
    }

    if (timeframeType === "month") {
      setDisplayedYear(displayedYear + 1);
      return;
    }

    setDisplayedYear(displayedYear + 25);
  };

  const getPlannerHeader = () => {
    if (timeframeType === "day" || timeframeType === "week") {
      return getMonthLabel(displayedMonth);
    }

    if (timeframeType === "month") {
      return `Months, ${displayedYear}`;
    }

    return "YEAR";
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: UI.screen }}>
      {showToast && (
        <Animated.View
          style={{
            position: "absolute",
            top: Math.max(insets.top + 12, 42),
            left: 16,
            right: 16,
            zIndex: 999,
            transform: [{ translateY: toastTranslateY }],
            backgroundColor: toastVariant === "success" ? "#16a34a" : "#ef4444",
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 12,
            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }}
        >
          <Text style={{ color: UI.text, fontWeight: "700", fontSize: 14 }}>
            {toastMessage}
          </Text>
        </Animated.View>
      )}

      {showPremiumModal && (
        <Modal transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.68)",
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <View
              style={{
                width: "100%",
                maxWidth: 420,
                backgroundColor: UI.card,
                borderRadius: 24,
                padding: 22,
                borderWidth: 1,
                borderColor: UI.primary,
              }}
            >
              <Text
                style={{
                  color: UI.text,
                  fontSize: 22,
                  fontWeight: "900",
                  marginBottom: 8,
                }}
              >
                {premiumTitle}
              </Text>

              <Text
                style={{
                  color: UI.muted,
                  fontSize: 14,
                  lineHeight: 22,
                  marginBottom: 18,
                }}
              >
                {premiumMessage}
              </Text>

              <View
                style={{
                  backgroundColor: UI.innerCard,
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: UI.border,
                  marginBottom: 18,
                }}
              >
                <Text
                  style={{
                    color: UI.text,
                    fontWeight: "800",
                    marginBottom: 6,
                  }}
                >
                  Premium unlocks:
                </Text>

                <Text style={{ color: UI.muted, lineHeight: 21 }}>
                  • More goal cards{"\n"}• Longer goals beyond 31 days
                  {"\n"}• Premium themes{"\n"}• Advanced reminders{"\n"}• Future
                  AI coaching tools
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setShowPremiumModal(false);
                  router.push("/pricing" as any);
                }}
                style={{
                  backgroundColor: UI.primary,
                  paddingVertical: 14,
                  borderRadius: 15,
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "900" }}>
                  Upgrade to Premium
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowPremiumModal(false)}
                style={{
                  backgroundColor: UI.innerCard,
                  paddingVertical: 13,
                  borderRadius: 15,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: UI.border,
                }}
              >
                <Text style={{ color: UI.text, fontWeight: "800" }}>
                  Maybe Later
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {showFocusWarningModal && (
        <Modal transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.65)",
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <View
              style={{
                width: "100%",
                maxWidth: 420,
                backgroundColor: UI.card,
                borderRadius: 22,
                padding: 22,
                borderWidth: 1,
                borderColor: UI.border,
              }}
            >
              <Text
                style={{
                  color: UI.text,
                  fontSize: 20,
                  fontWeight: "800",
                  marginBottom: 8,
                }}
              >
                Focus Warning
              </Text>

              <Text
                style={{
                  color: UI.muted,
                  fontSize: 14,
                  lineHeight: 21,
                  marginBottom: 16,
                }}
              >
                You already have {goals.length} active goals. GoalTracker Pro
                works best when you focus on 1–3 goals at a time.
              </Text>

              <View
                style={{
                  backgroundColor: UI.innerCard,
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: UI.border,
                  marginBottom: 18,
                }}
              >
                <Text
                  style={{
                    color: UI.text,
                    fontSize: 14,
                    fontWeight: "700",
                    marginBottom: 6,
                  }}
                >
                  Why this matters
                </Text>

                <Text
                  style={{
                    color: UI.muted,
                    fontSize: 13,
                    lineHeight: 20,
                  }}
                >
                  Shifts cannot share the same time. Adding too many goals can
                  reduce the quality of your schedule and make each goal harder
                  to follow consistently.
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setShowFocusWarningModal(false)}
                  style={{
                    flex: 1,
                    backgroundColor: UI.innerCard,
                    paddingVertical: 13,
                    borderRadius: 13,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: UI.border,
                  }}
                >
                  <Text style={{ color: UI.text, fontWeight: "700" }}>
                    Focus Better
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setShowFocusWarningModal(false);
                    setHasAcceptedFocusWarning(true);

                    setTimeout(() => {
                      handleAddGoal();
                    }, 80);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: UI.primary,
                    paddingVertical: 13,
                    borderRadius: 13,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: UI.text, fontWeight: "800" }}>
                    Continue Anyway
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showLeaveModal && (
        <Modal transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.6)",
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <View
              style={{
                width: "100%",
                maxWidth: 400,
                backgroundColor: UI.card,
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: UI.border,
              }}
            >
              <Text
                style={{
                  color: UI.text,
                  fontSize: 18,
                  fontWeight: "700",
                  marginBottom: 8,
                }}
              >
                Unsaved Changes
              </Text>

              <Text
                style={{
                  color: UI.muted,
                  fontSize: 14,
                  marginBottom: 20,
                }}
              >
                You have unsaved changes. Leaving now will discard your
                progress.
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  gap: 12,
                }}
              >
                <TouchableOpacity
                  onPress={() => setShowLeaveModal(false)}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 10,
                    backgroundColor: UI.innerCard,
                  }}
                >
                  <Text style={{ color: UI.text }}>Stay</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setShowLeaveModal(false);
                    router.back();
                  }}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 10,
                    backgroundColor: "#ef4444",
                  }}
                >
                  <Text style={{ color: "#fff" }}>Leave</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <Modal
        visible={!!shiftPendingDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setShiftPendingDelete(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.65)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 400,
              backgroundColor: UI.card,
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: UI.border,
            }}
          >
            <Text
              style={{
                color: UI.text,
                fontSize: 18,
                fontWeight: "800",
                marginBottom: 8,
              }}
            >
              Delete this shift?
            </Text>

            <Text
              style={{
                color: UI.muted,
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 18,
              }}
            >
              This will remove “{shiftPendingDelete?.title ?? "this shift"}”
              from your goal plan. You can’t undo this after saving.
            </Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setShiftPendingDelete(null)}
                style={{
                  flex: 1,
                  backgroundColor: UI.innerCard,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: UI.border,
                }}
              >
                <Text style={{ color: UI.text, fontWeight: "700" }}>
                  Keep Shift
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmDeleteShift}
                style={{
                  flex: 1,
                  backgroundColor: "#e74c3c",
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "800" }}>
                  Delete Shift
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            padding: screenPadding,
            paddingBottom: 60,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
                alignItems: isNarrowPhone ? "flex-start" : "center",
                justifyContent: "space-between",
                marginBottom: 22,
                gap: isNarrowPhone ? 12 : 0,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  onPress={confirmLeaveForm}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    backgroundColor: UI.card,
                    borderWidth: 1,
                    borderColor: UI.border,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                  }}
                >
                  <Text
                    style={{ color: UI.text, fontSize: 18, fontWeight: "800" }}
                  >
                    ←
                  </Text>
                </TouchableOpacity>

                <View>
                  <Text
                    style={{
                      color: UI.text,
                      fontSize: 28,
                      borderWidth: guidedStep === "save" ? 2 : 0,
                      borderColor:
                        guidedStep === "save" ? "#60a5fa" : "transparent",
                      fontWeight: "800",
                      letterSpacing: 0.3,
                    }}
                  >
                    Add Goal
                  </Text>
                  <Text
                    style={{
                      color: UI.muted,
                      marginTop: 4,
                      fontSize: 13,
                    }}
                  >
                    Build a routine with shifts and images
                  </Text>
                </View>
              </View>
            </View>

            <Pressable
              onPress={() => handleLockedSectionPress("title")}
              onLayout={(e) => {
                sectionPositions.current.title = e.nativeEvent.layout.y;
              }}
            >
              <Animated.View style={getSectionWrapperStyle("title")}>
                <Text style={getSectionTitleStyle("title")}>Goal Title</Text>

                <TextInput
                  placeholder="Enter your goal title..."
                  placeholderTextColor="#64748b"
                  returnKeyType="done"
                  onSubmitEditing={completeGoalTitleStep}
                  value={title}
                  onChangeText={(value) => {
                    setTitle(value);
                    setTitleDone(false);
                  }}
                  onFocus={() => {
                    scrollToSection("title");
                    setShowGoalTitleDone(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setShowGoalTitleDone(false);
                    }, 120);
                  }}
                  style={{
                    backgroundColor: UI.innerCard,
                    borderWidth: 1,
                    borderColor:
                      guidedStep === "title" ? UI.primary : UI.border,
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                    borderRadius: 14,
                    color: UI.text,
                    fontSize: guidedStep === "title" ? 17 : 16,
                    fontWeight: "600",
                    marginBottom: showGoalTitleDone ? 12 : 0,
                  }}
                />

                {showGoalTitleDone && !isAIImportedFlow && (
                  <TouchableOpacity
                    onPress={completeGoalTitleStep}
                    style={{
                      backgroundColor: UI.primary,
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: UI.text,
                        fontWeight: "700",
                        fontSize: 14,
                      }}
                    >
                      Done
                    </Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            </Pressable>
            <Pressable
              onPress={() => handleLockedSectionPress("routine")}
              onLayout={(e) => {
                sectionPositions.current.routine = e.nativeEvent.layout.y;
              }}
            >
              <Animated.View style={getSectionWrapperStyle("routine")}>
                <Text style={getSectionTitleStyle("routine")}>
                  Routine Type
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  {routineModes.map((mode) => {
                    const selected = routineMode === mode;
                    const label =
                      mode === "everyday" ? "Everyday" : "Custom Days";

                    return (
                      <TouchableOpacity
                        key={mode}
                        onPress={() => {
                          if (isSectionLocked("routine")) {
                            handleLockedSectionPress("routine");
                            return;
                          }

                          setRoutineMode(mode);
                          setDaysDone(false);

                          if (mode === "everyday") {
                            setSelectedDays(weekDays);
                          } else {
                            setSelectedDays([]);
                          }
                        }}
                        style={{
                          backgroundColor: selected
                            ? UI.primarySoft
                            : UI.innerCard,
                          borderWidth: 1,
                          borderColor:
                            selected || guidedStep === "routine"
                              ? UI.primary
                              : UI.border,
                          minHeight: 48,
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderRadius: 14,
                          width: routineButtonFullWidth ? "100%" : undefined,
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
                            fontWeight: "bold",
                            fontSize: guidedStep === "routine" ? 15 : 14,
                          }}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Animated.View>
            </Pressable>

            {routineMode === "custom" && (
              <Pressable
                onPress={() => handleLockedSectionPress("days")}
                onLayout={(e) => {
                  sectionPositions.current.days = e.nativeEvent.layout.y;
                }}
              >
                <Animated.View style={getSectionWrapperStyle("days")}>
                  <Text style={getSectionTitleStyle("days")}>Select Days</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {weekDays.map((day) => {
                      const selected = selectedDays.includes(day);

                      return (
                        <TouchableOpacity
                          key={day}
                          onPress={() => {
                            if (isSectionLocked("days")) {
                              handleLockedSectionPress("days");
                              return;
                            }

                            toggleDay(day);
                          }}
                          style={{
                            minWidth: isVeryNarrowPhone ? 42 : 48,
                            minHeight: isVeryNarrowPhone ? 42 : 48,
                            paddingHorizontal: isVeryNarrowPhone ? 6 : 8,
                            paddingVertical: 8,
                            borderRadius: 24,
                            backgroundColor: UI.innerCard,
                            borderWidth: selected ? 2 : 1,
                            borderColor: selected ? UI.primary : UI.border,
                            justifyContent: "center",
                            alignItems: "center",
                            marginRight: 8,
                            marginBottom: 10,
                          }}
                        >
                          <Text
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.8}
                            style={{
                              color: UI.text,
                              fontWeight: "600",
                              fontSize: guidedStep === "days" ? 14 : 13,
                            }}
                          >
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {showDaysDone && !isAIImportedFlow && (
                    <TouchableOpacity
                      onPress={() => {
                        if (
                          routineMode === "custom" &&
                          selectedDays.length === 0
                        ) {
                          showTopToast("Please select at least one day");
                          return;
                        }

                        setDaysDone(true);
                        setShowDaysDone(false);
                        scrollToSection("startDate");
                      }}
                      style={{
                        backgroundColor: UI.primary,
                        paddingVertical: 12,
                        borderRadius: 12,
                        alignItems: "center",
                        marginTop: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: UI.text,
                          fontWeight: "700",
                          fontSize: 14,
                        }}
                      >
                        Done
                      </Text>
                    </TouchableOpacity>
                  )}
                </Animated.View>
              </Pressable>
            )}
            {routineMode === "everyday" && (
              <Pressable
                onPress={() => handleLockedSectionPress("days")}
                onLayout={(e) => {
                  sectionPositions.current.days = e.nativeEvent.layout.y;
                }}
              >
                <Animated.View style={getSectionWrapperStyle("days")}>
                  <Text style={getSectionTitleStyle("days")}>Active Days</Text>
                  <Text
                    style={{
                      color: UI.text,
                      fontWeight: "bold",
                      fontSize: guidedStep === "days" ? 15 : 14,
                    }}
                  >
                    Mon Tue Wed Thu Fri Sat Sun
                  </Text>
                </Animated.View>
              </Pressable>
            )}

            <Pressable
              onPress={() => handleLockedSectionPress("startDate")}
              onLayout={(e) => {
                sectionPositions.current.startDate = e.nativeEvent.layout.y;
              }}
            >
              <Animated.View style={getSectionWrapperStyle("startDate")}>
                <Text style={getSectionTitleStyle("startDate")}>
                  Start Date
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    if (isSectionLocked("startDate")) {
                      handleLockedSectionPress("startDate");
                      return;
                    }

                    setShowStartDate(true);
                  }}
                  style={{
                    backgroundColor: UI.innerCard,
                    borderWidth: 1,
                    borderColor:
                      guidedStep === "startDate" ? UI.primary : UI.border,
                    borderRadius: 16,
                    padding: isTablet ? 18 : 16,
                  }}
                >
                  <Text
                    style={{
                      color: UI.text,
                      fontSize: guidedStep === "startDate" ? 16 : 15,
                      fontWeight: "600",
                    }}
                  >
                    {startDate.toDateString()}
                  </Text>
                </TouchableOpacity>
                {showStartDateDone && !isAIImportedFlow && (
                  <TouchableOpacity
                    onPress={() => {
                      setStartDateDone(true);
                      setShowStartDateDone(false);

                      if (routineMode === "everyday") {
                        setEndDateDone(true);
                        setShowEndDateDone(false);
                        return;
                      }

                      scrollToSection("endDate");
                    }}
                    style={{
                      backgroundColor: UI.primary,
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: "center",
                      marginTop: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: UI.text,
                        fontWeight: "700",
                        fontSize: 14,
                      }}
                    >
                      Done
                    </Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            </Pressable>

            {showStartDate && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={(_, date) => {
                  setShowStartDate(false);

                  if (date) {
                    setStartDate(date);

                    if (routineMode === "custom" && date > endDate) {
                      setEndDate(date);
                    }
                    setStartDateDone(false);
                    setShowStartDateDone(true);
                  }
                }}
              />
            )}
            {routineMode === "custom" && (
              <Pressable
                onPress={() => handleLockedSectionPress("endDate")}
                onLayout={(e) => {
                  sectionPositions.current.endDate = e.nativeEvent.layout.y;
                }}
              >
                <Animated.View style={getSectionWrapperStyle("endDate")}>
                  <Text style={getSectionTitleStyle("endDate")}>End Date</Text>

                  <TouchableOpacity
                    onPress={() => {
                      if (isSectionLocked("endDate")) {
                        handleLockedSectionPress("endDate");
                        return;
                      }

                      setShowEndDate(true);
                    }}
                    style={{
                      backgroundColor: UI.innerCard,
                      borderWidth: 1,
                      borderColor:
                        guidedStep === "endDate" ? UI.primary : UI.border,
                      borderRadius: 16,
                      padding: isTablet ? 18 : 16,
                    }}
                  >
                    <Text
                      style={{
                        color: UI.text,
                        fontSize: guidedStep === "endDate" ? 16 : 15,
                        fontWeight: "600",
                      }}
                    >
                      {endDate.toDateString()}
                    </Text>
                  </TouchableOpacity>

                  {showEndDateDone && !isAIImportedFlow && (
                    <TouchableOpacity
                      onPress={() => {
                        if (!endDate) {
                          showTopToast("Please select an end date");
                          return;
                        }

                        setEndDateDone(true);
                        setShowEndDateDone(false);
                      }}
                      style={{
                        backgroundColor: UI.primary,
                        paddingVertical: 12,
                        borderRadius: 12,
                        alignItems: "center",
                        marginTop: 12,
                      }}
                    >
                      <Text
                        style={{
                          color: UI.text,
                          fontWeight: "700",
                          fontSize: 14,
                        }}
                      >
                        Done
                      </Text>
                    </TouchableOpacity>
                  )}
                </Animated.View>
              </Pressable>
            )}

            {showEndDate && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={(_, date) => {
                  setShowEndDate(false);

                  if (date) {
                    if (date < startDate) {
                      showTopToast("End date cannot be before start date");
                      return;
                    }
                    setEndDate(date);
                    setShowEndDateDone(true);
                    setEndDateDone(false);
                  }
                }}
              />
            )}

            {canOpenPlanGuide && (
              <>
                <Pressable
                  onPress={() => handleLockedSectionPress("planGuide")}
                  onLayout={(e) => {
                    sectionPositions.current.planGuide = e.nativeEvent.layout.y;
                  }}
                >
                  <Animated.View style={getSectionWrapperStyle("planGuide")}>
                    <Text style={getSectionTitleStyle("planGuide")}>
                      Plan Guide
                    </Text>

                    <Text
                      style={{
                        color: UI.text,
                        fontSize: 18,
                        fontWeight: "800",
                      }}
                    >
                      {getPlanGuideHeading()}
                    </Text>

                    <Text
                      style={{
                        color: UI.muted,
                        marginTop: 6,
                        fontSize: 13,
                        lineHeight: 18,
                      }}
                    >
                      Choose when this goal should apply and assign time shifts
                      professionally.
                    </Text>
                  </Animated.View>
                </Pressable>

                <Text
                  style={{
                    color: isSectionLocked("shiftForm") ? UI.muted : UI.text,
                    marginTop: 15,
                    marginBottom: 8,
                    opacity: isSectionLocked("shiftForm") ? 0.38 : 1,
                  }}
                >
                  Timeframe Type
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    marginBottom: shouldShowDeselectAll ? 10 : 15,
                    opacity: isSectionLocked("shiftForm") ? 0.38 : 1,
                  }}
                >
                  {timeframeOptions.map((option) => {
                    const selected = timeframeType === option;
                    const lockedForFree =
                      !hasPremiumAccess && option === "year";

                    return (
                      <TouchableOpacity
                        key={option}
                        disabled={false}
                        onPress={() => {
                          if (lockedForFree) {
                            openPremiumModal(
                              "Premium Timeframe",
                              "Year planning is a Premium feature. Free users can plan by Day, Week, or Month for up to 31 days.",
                            );
                            return;
                          }

                          if (isSectionLocked("shiftForm")) {
                            handleLockedSectionPress("shiftForm");
                            return;
                          }

                          setTimeframeType(option);
                          setSelectedSpecificKeys([]);
                          setShowShiftForm(false);
                        }}
                        style={{
                          minHeight: 44,
                          paddingVertical: 10,
                          paddingHorizontal: 14,
                          borderRadius: 20,
                          backgroundColor: selected ? UI.primary : UI.innerCard,
                          borderWidth: 1,
                          borderColor: selected ? UI.primary : UI.border,
                          marginRight: 8,
                          marginBottom: 8,
                          justifyContent: "center",
                          alignItems: "center",
                          opacity: lockedForFree ? 0.45 : 1,
                        }}
                      >
                        <Text
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.85}
                          style={{
                            color: UI.text,
                            textTransform: "capitalize",
                            fontWeight: "600",
                          }}
                        >
                          {option} {lockedForFree ? "🔒" : ""}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {shouldShowDeselectAll && (
                  <View
                    style={{
                      backgroundColor: UI.card,
                      borderRadius: 18,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: UI.border,
                    }}
                  >
                    <Text
                      style={{
                        color: UI.text,
                        fontWeight: "bold",
                        marginBottom: 10,
                      }}
                    >
                      Deselect All
                    </Text>

                    <TouchableOpacity
                      onPress={handleDeselectAllSpecificKeys}
                      style={{
                        backgroundColor: "#e67e22",
                        paddingVertical: 12,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: UI.text,
                          textAlign: "center",
                          fontWeight: "bold",
                        }}
                      >
                        Deselect All
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <Pressable
                  onPress={() => {
                    if (guardShiftSectionAccess()) return;
                  }}
                >
                  <View
                    style={{
                      backgroundColor: UI.card,
                      borderRadius: 16,
                      padding: isTablet ? 16 : 12,
                      borderWidth: 1,
                      borderColor: UI.border,
                      opacity: isSectionLocked("shiftForm") ? 0.38 : 1,
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
                      <TouchableOpacity
                        onPress={() => {
                          if (guardShiftSectionAccess()) return;
                          goToPrevious();
                        }}
                      >
                        <Text
                          style={{
                            color: UI.primary,
                            fontSize: isTablet ? 20 : 18,
                          }}
                        >
                          ◀
                        </Text>
                      </TouchableOpacity>

                      <Text
                        style={{
                          color: UI.text,
                          fontSize: isTablet ? 18 : 16,
                          fontWeight: "bold",
                        }}
                      >
                        {getPlannerHeader()}
                      </Text>

                      <TouchableOpacity
                        onPress={() => {
                          if (guardShiftSectionAccess()) return;
                          goToNext();
                        }}
                      >
                        <Text
                          style={{
                            color: UI.primary,
                            fontSize: isTablet ? 20 : 18,
                          }}
                        >
                          ▶
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {timeframeType === "day" && (
                      <>
                        <View style={{ flexDirection: "row", marginBottom: 8 }}>
                          {weekHeader.map((label, index) => (
                            <View
                              key={`${label}-${index}`}
                              style={{ flex: 1, alignItems: "center" }}
                            >
                              <Text
                                style={{ color: UI.muted, fontWeight: "bold" }}
                              >
                                {label}
                              </Text>
                            </View>
                          ))}
                        </View>

                        <View
                          style={{ flexDirection: "row", flexWrap: "wrap" }}
                        >
                          {dayCells.map((date, index) => {
                            if (!date) {
                              return (
                                <View
                                  key={`empty-${index}`}
                                  style={{
                                    width: "14.28%",
                                    aspectRatio: 1,
                                    padding: 4,
                                  }}
                                />
                              );
                            }

                            const key = formatDateKey(date);
                            const active = checkDateSelectable(date);
                            const selected = selectedSpecificKeys.includes(key);

                            return (
                              <View
                                key={key}
                                style={{
                                  width: "14.28%",
                                  aspectRatio: 1,
                                  padding: 4,
                                }}
                              >
                                <TouchableOpacity
                                  disabled={!active}
                                  onPress={() => toggleSpecificKey(key)}
                                  style={{
                                    flex: 1,
                                    borderRadius: 10,
                                    justifyContent: "center",
                                    alignItems: "center",
                                    backgroundColor: selected
                                      ? UI.primary
                                      : active
                                        ? UI.innerCard
                                        : UI.border,
                                    borderWidth: selected ? 1 : 0,
                                    borderColor: UI.primary,
                                    opacity: active ? 1 : 0.35,
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: selected
                                        ? UI.text
                                        : active
                                          ? UI.text
                                          : UI.muted,
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {date.getDate()}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            );
                          })}
                        </View>
                      </>
                    )}

                    {timeframeType === "week" && (
                      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                        {weekItems.map((item) => {
                          const selected = selectedSpecificKeys.includes(
                            item.key,
                          );

                          return (
                            <View
                              key={item.key}
                              style={{
                                width: plannerColumns.week,
                                padding: 4,
                              }}
                            >
                              <TouchableOpacity
                                disabled={!item.active}
                                onPress={() => toggleSpecificKey(item.key)}
                                style={{
                                  borderRadius: 10,
                                  backgroundColor: selected
                                    ? UI.primary
                                    : item.active
                                      ? UI.innerCard
                                      : UI.border,
                                  paddingVertical: 18,
                                  alignItems: "center",
                                  minHeight: 52,
                                  justifyContent: "center",
                                  opacity: item.active ? 1 : 0.35,
                                }}
                              >
                                <Text
                                  numberOfLines={1}
                                  adjustsFontSizeToFit
                                  minimumFontScale={0.8}
                                  style={{ color: UI.text, fontWeight: "bold" }}
                                >
                                  {item.label}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {timeframeType === "month" && (
                      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                        {monthItems.map((item) => {
                          const selected = selectedSpecificKeys.includes(
                            item.key,
                          );

                          return (
                            <View
                              key={item.key}
                              style={{
                                width: plannerColumns.month,
                                padding: 4,
                              }}
                            >
                              <TouchableOpacity
                                disabled={!item.active}
                                onPress={() => toggleSpecificKey(item.key)}
                                style={{
                                  borderRadius: 10,
                                  backgroundColor: selected
                                    ? UI.primary
                                    : item.active
                                      ? UI.innerCard
                                      : UI.border,
                                  paddingVertical: 18,
                                  alignItems: "center",
                                  minHeight: 52,
                                  justifyContent: "center",
                                  opacity: item.active ? 1 : 0.35,
                                }}
                              >
                                <Text
                                  numberOfLines={1}
                                  adjustsFontSizeToFit
                                  minimumFontScale={0.8}
                                  style={{ color: UI.text, fontWeight: "bold" }}
                                >
                                  {item.label}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {timeframeType === "year" && (
                      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                        {yearItems.map((item) => {
                          const selected = selectedSpecificKeys.includes(
                            item.key,
                          );

                          return (
                            <View
                              key={item.key}
                              style={{
                                width: plannerColumns.year,
                                padding: 4,
                              }}
                            >
                              <TouchableOpacity
                                disabled={!item.active}
                                onPress={() => toggleSpecificKey(item.key)}
                                style={{
                                  borderRadius: 10,
                                  backgroundColor: selected
                                    ? UI.primary
                                    : item.active
                                      ? UI.innerCard
                                      : UI.border,
                                  paddingVertical: 18,
                                  alignItems: "center",
                                  minHeight: 52,
                                  justifyContent: "center",
                                  opacity: item.active ? 1 : 0.35,
                                }}
                              >
                                <Text
                                  numberOfLines={1}
                                  adjustsFontSizeToFit
                                  minimumFontScale={0.8}
                                  style={{ color: UI.text, fontWeight: "bold" }}
                                >
                                  {item.label}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    <Text style={{ color: UI.muted, marginTop: 12 }}>
                      {selectedSpecificKeys.length > 0
                        ? `${selectedSpecificKeys.length} specific ${timeframeType}(s) selected`
                        : "No specific selection. Time shifts below will apply generally to your selected days."}
                    </Text>
                  </View>
                </Pressable>
              </>
            )}

            <Pressable
              onPress={() => handleLockedSectionPress("shiftForm")}
              onLayout={(e) => {
                sectionPositions.current.shiftForm = e.nativeEvent.layout.y;
              }}
            >
              <Animated.View style={getSectionWrapperStyle("shiftForm")}>
                <Text style={getSectionTitleStyle("shiftForm")}>
                  Time Shifts
                </Text>

                {!canOpenPlanGuide ? (
                  <Text style={{ color: UI.muted, marginTop: 8 }}>
                    Fill title and start date first before adding your shifts.
                  </Text>
                ) : (
                  <>
                    {(showShiftForm || selectedSpecificKeys.length === 0) && (
                      <View
                        style={{
                          marginTop: 15,
                          backgroundColor: UI.card,
                          borderRadius: 18,
                          borderWidth: 1,
                          borderColor: UI.border,
                          padding: cardPadding,
                        }}
                      >
                        <TextInput
                          placeholder="Shift title..."
                          placeholderTextColor="#64748b"
                          returnKeyType="done"
                          onSubmitEditing={completeShiftTitleStep}
                          value={shiftTitle}
                          editable={!isSectionLocked("shiftForm")}
                          onChangeText={(value) => {
                            if (isSectionLocked("shiftForm")) return;

                            setShiftTitle(value);
                            setShiftTitleDone(false);
                            setShiftFormStep("shiftTitle");
                            setShowShiftTitleDone(true);
                          }}
                          onFocus={() => {
                            if (isSectionLocked("shiftForm")) {
                              handleLockedSectionPress("shiftForm");
                              return;
                            }

                            setShiftFormStep("shiftTitle");
                            setShowShiftTitleDone(true);

                            setTimeout(() => {
                              scrollRef.current?.scrollTo({
                                y: Math.max(
                                  0,
                                  sectionPositions.current.shiftForm - 40,
                                ),
                                animated: true,
                              });
                            }, 180);
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              setShowShiftTitleDone(false);
                            }, 120);
                          }}
                          style={{
                            backgroundColor: UI.innerCard,
                            borderWidth: shiftFormStep === "shiftTitle" ? 2 : 1,
                            borderColor:
                              shiftFormStep === "shiftTitle"
                                ? UI.primary
                                : UI.border,
                            paddingHorizontal: 14,
                            paddingVertical: 14,
                            borderRadius: 14,
                            marginBottom: showShiftTitleDone ? 12 : 15,
                            color: UI.text,
                            fontSize: 15,
                            fontWeight: "600",
                            opacity:
                              isSectionLocked("shiftForm") ||
                              shiftFormStep !== "shiftTitle"
                                ? 0.45
                                : 1,
                          }}
                        />

                        {showShiftTitleDone && (
                          <TouchableOpacity
                            onPress={completeShiftTitleStep}
                            style={{
                              backgroundColor: UI.primary,
                              paddingVertical: 12,
                              borderRadius: 12,
                              alignItems: "center",
                              marginBottom: 14,
                            }}
                          >
                            <Text
                              style={{
                                color: UI.text,
                                fontWeight: "700",
                                fontSize: 14,
                              }}
                            >
                              Done
                            </Text>
                          </TouchableOpacity>
                        )}

                        <TextInput
                          placeholder="Shift description..."
                          editable={!isSectionLocked("shiftForm")}
                          returnKeyType="done"
                          blurOnSubmit
                          submitBehavior="blurAndSubmit"
                          onSubmitEditing={completeShiftDescriptionStep}
                          onFocus={() => {
                            if (isSectionLocked("shiftForm")) {
                              handleLockedSectionPress("shiftForm");
                              return;
                            }

                            setShiftFormStep("shiftDescription");
                            setShowShiftDescriptionDone(true);
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              setShowShiftDescriptionDone(false);
                            }, 120);
                          }}
                          placeholderTextColor="#64748b"
                          value={shiftDescription}
                          onChangeText={(value) => {
                            if (isSectionLocked("shiftForm")) return;

                            setShiftDescription(value);
                            setShiftDescriptionDone(false);
                            setShiftFormStep("shiftDescription");
                            setShowShiftDescriptionDone(true);
                          }}
                          multiline
                          style={{
                            backgroundColor: UI.innerCard,
                            borderWidth:
                              shiftFormStep === "shiftDescription" ? 2 : 1,
                            borderColor:
                              shiftFormStep === "shiftDescription"
                                ? UI.primary
                                : UI.border,

                            paddingHorizontal: 14,
                            paddingVertical: 14,
                            borderRadius: 14,
                            opacity:
                              isSectionLocked("shiftForm") ||
                              shiftFormStep !== "shiftDescription"
                                ? 0.45
                                : 1,

                            marginBottom: 15,
                            color: UI.text,
                            fontSize: 14,
                            lineHeight: 20,
                            minHeight: 88,
                            textAlignVertical: "top",
                          }}
                        />

                        {showShiftDescriptionDone && (
                          <TouchableOpacity
                            onPress={completeShiftDescriptionStep}
                            style={{
                              backgroundColor: UI.primary,
                              paddingVertical: 12,
                              borderRadius: 12,
                              alignItems: "center",
                              marginBottom: 14,
                            }}
                          >
                            <Text
                              style={{
                                color: UI.text,
                                fontWeight: "700",
                                fontSize: 14,
                              }}
                            >
                              Done
                            </Text>
                          </TouchableOpacity>
                        )}

                        <Text style={{ color: UI.muted, marginBottom: 6 }}>
                          {getShiftTargetSummary()}
                        </Text>

                        <Text
                          style={{
                            color: UI.text,
                            marginTop: 10,
                            marginBottom: 10,
                            fontWeight: "700",
                          }}
                        >
                          Import from Gallery
                        </Text>

                        <TouchableOpacity
                          onPress={() => {
                            if (isSectionLocked("shiftForm")) {
                              handleLockedSectionPress("shiftForm");
                              return;
                            }

                            if (isShiftStepLocked("shiftImage")) {
                              handleLockedShiftStepPress("shiftImage");
                              return;
                            }

                            pickCustomShiftImage();
                          }}
                          style={{
                            backgroundColor: UI.primary,
                            paddingVertical: 13,
                            borderRadius: 12,
                            alignItems: "center",
                            marginBottom: 12,
                          }}
                        >
                          <Text
                            style={{
                              color: UI.text,
                              textAlign: "center",
                              fontWeight: "700",
                            }}
                          >
                            Import from Gallery
                          </Text>
                        </TouchableOpacity>

                        <Text
                          style={{
                            color: UI.muted,
                            textAlign: "center",
                            marginBottom: 12,
                            fontWeight: "700",
                          }}
                        >
                          Or
                        </Text>

                        <Text
                          style={{
                            color: UI.text,
                            marginBottom: 10,
                            fontWeight: "700",
                          }}
                        >
                          Select Shift Image
                        </Text>

                        <View
                          style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            justifyContent: "space-between",
                            rowGap: 12,
                          }}
                        >
                          {imageCategories.map((category) => {
                            const preview = getPreviewImageByKey(
                              category.previewKey,
                            );

                            const categorySelected =
                              !!selectedShiftImageKey &&
                              selectedShiftImageKey.startsWith(
                                `${category.key}-`,
                              );

                            return (
                              <TouchableOpacity
                                key={category.key}
                                onPress={() => {
                                  if (isSectionLocked("shiftForm")) {
                                    handleLockedSectionPress("shiftForm");
                                    return;
                                  }

                                  if (isShiftStepLocked("shiftImage")) {
                                    handleLockedShiftStepPress("shiftImage");
                                    return;
                                  }

                                  openCategoryImagePicker(category.key);
                                }}
                                style={{
                                  width: categoryCardWidth,
                                  backgroundColor: UI.innerCard,
                                  borderRadius: 16,
                                  borderColor:
                                    categorySelected ||
                                    shiftFormStep === "shiftImage"
                                      ? UI.primary
                                      : UI.border,
                                  borderWidth:
                                    categorySelected ||
                                    shiftFormStep === "shiftImage"
                                      ? 2
                                      : 1,
                                  padding: 10,
                                }}
                              >
                                {preview && (
                                  <Image
                                    source={preview.image}
                                    fadeDuration={0}
                                    resizeMode="cover"
                                    style={{
                                      width: "100%",
                                      height: 92,
                                      borderRadius: 12,
                                      marginBottom: 8,
                                    }}
                                  />
                                )}

                                <Text
                                  numberOfLines={1}
                                  adjustsFontSizeToFit
                                  minimumFontScale={0.85}
                                  style={{
                                    color: categorySelected
                                      ? UI.primary
                                      : UI.text,
                                    fontWeight: "700",
                                    fontSize: 14,
                                  }}
                                >
                                  {category.label}
                                </Text>

                                <Text
                                  numberOfLines={2}
                                  style={{
                                    color: UI.muted,
                                    fontSize: 12,
                                    marginTop: 4,
                                    lineHeight: 16,
                                  }}
                                >
                                  Tap to view 5 images
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>

                        <Modal
                          visible={showCategoryImageModal}
                          transparent
                          animationType="fade"
                          onRequestClose={closeCategoryImagePicker}
                        >
                          <View
                            style={{
                              flex: 1,
                              backgroundColor: "rgba(0,0,0,0.72)",
                              justifyContent: "center",
                              paddingHorizontal: 16,
                            }}
                          >
                            <Pressable
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                              }}
                              onPress={closeCategoryImagePicker}
                            />

                            <View
                              style={{
                                backgroundColor: UI.card,
                                borderColor: UI.border,
                                borderRadius: 18,
                                paddingVertical: 18,
                                paddingHorizontal: 14,
                                borderWidth: 1,
                              }}
                            >
                              <Text
                                style={{
                                  color: UI.text,
                                  fontSize: 18,
                                  fontWeight: "700",
                                  marginBottom: 6,
                                }}
                              >
                                {imageCategories.find(
                                  (c) => c.key === selectedCategoryKey,
                                )?.label ?? "Category"}{" "}
                                Images
                              </Text>

                              <Text
                                style={{
                                  color: UI.primary,
                                  fontSize: 13,
                                  marginBottom: 14,
                                }}
                              >
                                Swipe left or right and tap an image to select
                                it.
                              </Text>

                              <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                              >
                                {selectedCategoryImages.map((item) => {
                                  const selected =
                                    selectedShiftImageKey === item.key;

                                  return (
                                    <TouchableOpacity
                                      key={item.key}
                                      onPress={() => {
                                        if (isSectionLocked("shiftForm")) {
                                          handleLockedSectionPress("shiftForm");
                                          return;
                                        }

                                        if (isShiftStepLocked("shiftImage")) {
                                          handleLockedShiftStepPress(
                                            "shiftImage",
                                          );
                                          return;
                                        }

                                        choosePresetShiftImage(item.key);
                                      }}
                                    >
                                      <Image
                                        source={item.image}
                                        fadeDuration={0}
                                        resizeMode="cover"
                                        style={{
                                          width: 150,
                                          height: 170,
                                          borderRadius: 16,
                                          borderWidth: selected ? 3 : 1,
                                          borderColor: selected
                                            ? UI.primary
                                            : "#374151",
                                        }}
                                      />

                                      <Text
                                        style={{
                                          color: selected ? "#60a5fa" : UI.text,
                                          textAlign: "center",
                                          marginTop: 8,
                                          fontWeight: "600",
                                        }}
                                      >
                                        {item.label}
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </ScrollView>

                              <TouchableOpacity
                                onPress={closeCategoryImagePicker}
                                style={{
                                  marginTop: 16,
                                  backgroundColor: UI.primary,
                                  paddingVertical: 12,
                                  borderRadius: 10,
                                }}
                              >
                                <Text
                                  style={{
                                    color: UI.text,
                                    textAlign: "center",
                                    fontWeight: "700",
                                  }}
                                >
                                  Close
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </Modal>
                        {showImageDone && (
                          <TouchableOpacity
                            onPress={() => {
                              if (
                                !selectedShiftImageKey &&
                                !selectedShiftImageUri
                              ) {
                                showTopToast("Please select a shift image");
                                return;
                              }

                              setShowImageDone(false);
                              setShiftFormStep("shiftStart");

                              setTimeout(() => {
                                scrollRef.current?.scrollToEnd({
                                  animated: true,
                                });
                              }, 180);
                            }}
                            style={{
                              backgroundColor: UI.primary,
                              paddingVertical: 12,
                              borderRadius: 12,
                              alignItems: "center",
                              marginTop: 14,
                            }}
                          >
                            <Text
                              style={{
                                color: UI.text,
                                fontWeight: "700",
                                fontSize: 14,
                              }}
                            >
                              Done
                            </Text>
                          </TouchableOpacity>
                        )}

                        {!!selectedShiftImageUri && (
                          <View
                            style={{ marginTop: 12, alignItems: "flex-start" }}
                          >
                            <Image
                              source={{ uri: selectedShiftImageUri }}
                              style={{
                                width: 100,
                                height: 100,
                                borderRadius: 12,
                                marginBottom: 8,
                              }}
                            />
                            <Text style={{ color: "#93c5fd" }}>
                              Custom image selected
                            </Text>
                          </View>
                        )}

                        {(selectedShiftImageKey || selectedShiftImageUri) && (
                          <TouchableOpacity
                            onPress={() => {
                              if (isSectionLocked("shiftForm")) {
                                handleLockedSectionPress("shiftForm");
                                return;
                              }

                              if (isShiftStepLocked("shiftImage")) {
                                handleLockedShiftStepPress("shiftImage");
                                return;
                              }

                              clearSelectedShiftImage();
                            }}
                          >
                            <Text
                              style={{
                                color: UI.text,
                                textAlign: "center",
                                fontWeight: "700",
                              }}
                            >
                              Remove Shift Image
                            </Text>
                          </TouchableOpacity>
                        )}

                        {shouldShowMoreLess() && (
                          <TouchableOpacity
                            onPress={() =>
                              setShowAllSelectedTargets(!showAllSelectedTargets)
                            }
                          >
                            <Text
                              style={{ color: "#3b82f6", marginBottom: 10 }}
                            >
                              {showAllSelectedTargets
                                ? "Show less"
                                : "Show more"}
                            </Text>
                          </TouchableOpacity>
                        )}

                        <Text
                          style={{
                            color: UI.muted,
                            fontSize: 12,
                            fontWeight: "700",
                            textTransform: "uppercase",
                            letterSpacing: 0.8,
                            marginTop: 10,
                            marginBottom: 10,
                          }}
                        >
                          Shift Start Time
                        </Text>

                        <TouchableOpacity
                          onPress={() => {
                            if (isSectionLocked("shiftForm")) {
                              handleLockedSectionPress("shiftForm");
                              return;
                            }

                            if (isShiftStepLocked("shiftStart")) {
                              handleLockedShiftStepPress("shiftStart");
                              return;
                            }

                            setShowStepStartTime(true);
                          }}
                          style={{
                            backgroundColor: UI.innerCard,
                            borderWidth: shiftFormStep === "shiftStart" ? 2 : 1,
                            borderColor:
                              shiftFormStep === "shiftStart"
                                ? UI.primary
                                : UI.border,
                            borderRadius: 14,
                            padding: isTablet ? 17 : 15,
                            opacity: isShiftStepLocked("shiftStart") ? 0.4 : 1,
                          }}
                        >
                          <Text
                            style={{
                              color: UI.text,
                              fontSize: 15,
                              fontWeight: "600",
                            }}
                          >
                            {stepStartTime.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </TouchableOpacity>

                        {showStepStartTime && (
                          <DateTimePicker
                            value={stepStartTime}
                            mode="time"
                            display="default"
                            onChange={(_, date) => {
                              setShowStepStartTime(false);

                              if (date) {
                                setStepStartTime(date);
                                setShowStartTimeDone(true);
                              }
                            }}
                          />
                        )}

                        {showStartTimeDone && (
                          <TouchableOpacity
                            onPress={() => {
                              if (isShiftStepLocked("shiftStart")) {
                                handleLockedShiftStepPress("shiftStart");
                                return;
                              }

                              setShowStartTimeDone(false);
                              setShowEndTimeDone(true);
                              setShiftFormStep("shiftEnd");
                            }}
                            style={{
                              backgroundColor: UI.primary,
                              paddingVertical: 12,
                              borderRadius: 12,
                              alignItems: "center",
                              marginTop: 12,
                              marginBottom: 12,
                              opacity: isShiftStepLocked("shiftStart")
                                ? 0.4
                                : 1,
                            }}
                          >
                            <Text style={{ color: UI.text, fontWeight: "700" }}>
                              Done
                            </Text>
                          </TouchableOpacity>
                        )}
                        <Text
                          style={{
                            color: UI.muted,
                            fontSize: 12,
                            fontWeight: "700",
                            textTransform: "uppercase",
                            letterSpacing: 0.8,
                            marginTop: 15,
                            marginBottom: 10,
                          }}
                        >
                          Shift End Time
                        </Text>

                        <TouchableOpacity
                          onPress={() => {
                            if (isSectionLocked("shiftForm")) {
                              handleLockedSectionPress("shiftForm");
                              return;
                            }

                            if (isShiftStepLocked("shiftEnd")) {
                              handleLockedShiftStepPress("shiftEnd");
                              return;
                            }

                            setShowStepEndTime(true);
                          }}
                          style={{
                            backgroundColor: UI.innerCard,
                            borderWidth: shiftFormStep === "shiftEnd" ? 2 : 1,
                            borderColor:
                              shiftFormStep === "shiftEnd"
                                ? UI.primary
                                : UI.border,
                            borderRadius: 14,
                            padding: isTablet ? 17 : 15,
                            opacity: isShiftStepLocked("shiftEnd") ? 0.4 : 1,
                          }}
                        >
                          <Text
                            style={{
                              color: UI.text,
                              fontSize: 15,
                              fontWeight: "600",
                            }}
                          >
                            {stepEndTime.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </TouchableOpacity>

                        {showStepEndTime && (
                          <DateTimePicker
                            value={stepEndTime}
                            mode="time"
                            is24Hour
                            display="default"
                            onChange={(_, date) => {
                              setShowStepEndTime(false);

                              if (date) {
                                setStepEndTime(date);
                                setShowEndTimeDone(true);
                              }
                            }}
                          />
                        )}

                        {showEndTimeDone && (
                          <TouchableOpacity
                            onPress={() => {
                              if (isShiftStepLocked("shiftEnd")) {
                                handleLockedShiftStepPress("shiftEnd");
                                return;
                              }

                              if (stepEndTime <= stepStartTime) {
                                showTopToast(
                                  "End time must be after start time",
                                );
                                return;
                              }

                              setShowEndTimeDone(false);
                            }}
                            style={{
                              backgroundColor: UI.primary,
                              paddingVertical: 12,
                              borderRadius: 12,
                              alignItems: "center",
                              marginTop: 12,
                              marginBottom: 12,
                              opacity: isShiftStepLocked("shiftEnd") ? 0.4 : 1,
                            }}
                          >
                            <Text style={{ color: UI.text, fontWeight: "700" }}>
                              Done
                            </Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          onPress={() => {
                            if (isSectionLocked("shiftForm")) {
                              handleLockedSectionPress("shiftForm");
                              return;
                            }

                            if (isShiftStepLocked("addShift")) {
                              handleLockedShiftStepPress("addShift");
                              return;
                            }

                            handleAddShift();
                          }}
                          style={{
                            backgroundColor: "#8e44ad",
                            marginTop: 18,
                            paddingVertical: 12,
                            borderRadius: 8,
                            opacity: isShiftStepLocked("addShift") ? 0.4 : 1,
                          }}
                        >
                          <Text
                            style={{
                              color: UI.text,
                              textAlign: "center",
                              fontWeight: "700",
                            }}
                          >
                            Add Shift
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {hasAtLeastOneShift && (
                      <View style={{ marginTop: 20 }}>
                        {groupedShifts.map(([groupKey, shifts]) => {
                          if (shifts.length === 0) return null;

                          const sorted = [...shifts];

                          return (
                            <View
                              key={groupKey}
                              style={{
                                marginBottom: 16,
                                backgroundColor: UI.card,
                                padding: 14,
                                borderRadius: 16,
                                borderWidth: 1,
                                borderColor: UI.border,
                              }}
                            >
                              <Text
                                style={{
                                  color: UI.text,
                                  fontSize: 18,
                                  fontWeight: "bold",
                                  marginBottom: 10,
                                }}
                              >
                                {selectedSpecificKeys.length === 0
                                  ? `Every ${groupKey}`
                                  : timeframeType === "day"
                                    ? formatFullDate(groupKey)
                                    : sorted[0]?.targetLabel || groupKey}
                              </Text>

                              {sorted.map((step, index) => (
                                <View
                                  key={step.id}
                                  style={{
                                    marginBottom: 12,
                                    paddingBottom: 12,
                                    borderBottomWidth:
                                      index === sorted.length - 1 ? 0 : 1,
                                    borderBottomColor: "#333",
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: UI.text,
                                      fontSize: 15,
                                      fontWeight: "600",
                                      marginBottom: 6,
                                    }}
                                  >
                                    Shift {index + 1}: {step.title}
                                  </Text>

                                  <Text
                                    style={{ color: UI.muted, marginBottom: 6 }}
                                  >
                                    {formatTime(step.startTime)} -{" "}
                                    {formatTime(step.endTime)}
                                  </Text>

                                  {(step.imageUri || step.imageKey) && (
                                    <View
                                      style={{
                                        marginBottom: 12,
                                        borderRadius: 14,
                                        overflow: "hidden",
                                        borderWidth: 1,
                                        borderColor: UI.border,
                                        backgroundColor: UI.innerCard,
                                      }}
                                    >
                                      <Image
                                        source={
                                          step.imageUri
                                            ? { uri: step.imageUri }
                                            : getPreviewImageByKey(
                                                step.imageKey!,
                                              )?.image
                                        }
                                        style={{ width: "100%", height: 140 }}
                                        resizeMode="cover"
                                      />
                                    </View>
                                  )}

                                  {!!step.explanation && (
                                    <Text
                                      style={{
                                        color: UI.muted,
                                        fontSize: 13,
                                        lineHeight: 19,
                                        marginBottom: 12,
                                      }}
                                    >
                                      {step.explanation}
                                    </Text>
                                  )}

                                  <TouchableOpacity
                                    onPress={() => requestDeleteShift(step)}
                                    style={{
                                      backgroundColor: "#e74c3c",
                                      paddingVertical: 8,
                                      borderRadius: 6,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: UI.text,
                                        textAlign: "center",
                                      }}
                                    >
                                      Delete Shift
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              ))}
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {selectedSpecificKeys.length > 0 && !showShiftForm && (
                      <TouchableOpacity
                        onPress={handleOpenShiftForm}
                        style={{
                          backgroundColor: "#3b82f6",
                          marginTop: 14,
                          paddingVertical: 12,
                          borderRadius: 10,
                        }}
                      >
                        <Text
                          style={{
                            color: UI.text,
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          {`Create Time Shift For Selected ${timeframeType}(s)`}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </Animated.View>
            </Pressable>

            <Pressable
              onPress={() => handleLockedSectionPress("save")}
              onLayout={(e) => {
                sectionPositions.current.save = e.nativeEvent.layout.y;
              }}
            >
              <Animated.View style={getSectionWrapperStyle("save")}>
                <Text style={getSectionTitleStyle("save")}>Add Goal</Text>

                <TouchableOpacity
                  onPress={() => {
                    if (isAddingGoal) return;

                    if (isSectionLocked("save")) {
                      handleLockedSectionPress("save");
                      return;
                    }

                    handleAddGoal();
                  }}
                  disabled={!hasAtLeastOneShift || isAddingGoal}
                  style={{
                    backgroundColor:
                      hasAtLeastOneShift && !isAddingGoal
                        ? UI.primary
                        : "#334155",

                    paddingVertical: isTablet ? 18 : 16,
                    borderRadius: 16,
                    opacity: hasAtLeastOneShift && !isAddingGoal ? 1 : 0.7,
                    shadowColor: "#000",
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    minHeight: 54,
                    justifyContent: "center",
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 4,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    style={{
                      color: UI.text,
                      textAlign: "center",
                      fontWeight: "700",
                      fontSize: isTablet ? 17 : 16,
                    }}
                  >
                    {isAddingGoal
                      ? "Adding Goal..."
                      : hasAtLeastOneShift
                        ? "Add Goal"
                        : "Add a Time Shift First"}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
