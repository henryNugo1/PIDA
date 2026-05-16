import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
//import { Audio } from "expo-av";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import { AuthContext } from "./AuthContext";

/* ================= TYPES ================= */

export type TimeframeType = "day" | "week" | "month" | "year";
export type TargetType = "date" | "weekday" | "week" | "month" | "year";
export type ShiftReviewStatus = "pending" | "completed" | "missed";

export interface PlanGuideItem {
  id: string;
  title: string;
  timeframeType: TimeframeType;
  timeframeValue: number;
  startTime: string;
  endTime: string;
  plannedDate?: string;
  weekdayLabel?: string;
  targetType: TargetType;
  targetKey?: string;
  targetLabel?: string;
  imageKey?: string;
  imageUri?: string;
  explanation?: string;
  resourceLinks?: { title: string; url: string }[];
}

export interface ShiftReviewItem {
  key: string;
  goalId: string;
  shiftId: string;
  shiftTitle: string;
  shiftDate: string;
  shiftStart: string;
  shiftEnd: string;
  expiresAt: string;
  status: ShiftReviewStatus;
  reviewedAt?: string;
}

export interface Goal {
  id: string;
  title: string;
  type: "daily" | "fixed";
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  days?: string;
  progress: number;
  createdWithAI?: boolean;
  aiGoalMemory?: any;
  aiLastEditedAt?: string | null;
  status: "Upcoming" | "In Progress" | "Completed" | "Failed";
  planGuide?: PlanGuideItem[];
  shiftReviews?: ShiftReviewItem[];
}

interface GoalContextType {
  goals: Goal[];
  historyGoals: Goal[];
  hasLoadedGoals: boolean;
  addGoal: (goal: Goal) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  completeGoal: (id: string) => Promise<void>;
  restoreGoal: (goal: Goal) => Promise<void>;
  deleteHistoryGoal: (id: string) => Promise<void>;
  loadGoals: () => Promise<void>;
  refreshShiftReviews: () => Promise<void>;
  markShiftCompleted: (goalId: string, reviewKey: string) => void;
  markShiftMissed: (goalId: string, reviewKey: string) => void;
  currentStreak: number;
  failedChances: number;
  highestStreak: number;
  lastUnlockedBadge: string | null;
}

export const GoalContext = createContext<GoalContextType | null>(null);

/* ================= STORAGE ================= */

const STORAGE_KEY_BASE = "goals";
const SHIFT_NOTIFICATION_SOURCE = "goaltracker_shift_notification";
const REVIEW_FOLLOWUP_NOTIFICATION_SOURCE =
  "goaltracker_review_followup_notification";
  const SHIFT_NOTIFICATION_CHANNEL_ID = "goaltracker-shifts-v3";
const SHIFT_NOTIFICATION_SOUND = "notification.wav";


const SHIFT_NOTIFICATION_LOOKAHEAD_DAYS = 60;
const REVIEW_SOFT_REMINDER_MS = 12 * 60 * 60 * 1000;
const REVIEW_STRONG_REMINDER_BEFORE_EXPIRY_MS = 5 * 60 * 60 * 1000;
const REVIEW_FINAL_REMINDER_BEFORE_EXPIRY_MS = 2 * 60 * 60 * 1000;

const HISTORY_STORAGE_KEY_BASE = "history_goals";
const STREAK_STORAGE_KEY_BASE = "goaltracker_streak";
const DEBUG = false;
const SHIFT_REVIEW_WINDOW_MS = 24 * 60 * 60 * 1000;
type ReviewFollowUpStage = "soft" | "strong" | "final";

const softFollowUpMessages = [
  "{name}, your {shiftTitle} shift is waiting for review.",
  "Quick check-in{name}. Did you finish {shiftTitle}?",
  "Your {shiftTitle} shift ended earlier. Tap to review it.",
  "Small action, big streak. Review your shift when you can.",
  "You still have time to lock in your progress.",
  "{name}, do not forget to protect your streak.",
  "Your goal is still waiting for you. Tap to review your shift.",
];

const strongFollowUpMessages = [
  "{name}, are you giving up? Tap to review your shift ASAP.",
  "I am not giving up on you. Do not give up on your goal.",
  "Hope you have not abandoned your goal. Review your shift now.",
  "{name}, your streak needs you right now.",
  "You said this goal mattered. Come back and review it.",
  "This is where consistency is built. Tap to review your shift.",
  "Do not let one review damage your progress.",
  "Your {shiftTitle} shift is getting close to expiry.",
];

const finalCallMessages = [
  "{name}, your shift is almost gone.",
  "Noooooooo. Do not lose this one now.",
  "Cmonnnnnn, review your shift before it expires.",
  "You gave me your word. Tap to review it.",
  "Our streak!!! Review this before it expires.",
  "How do I convince you, {name}? Tap to review now.",
  "I guess no 100% today? Unless you review this now.",
  "{name}, this is the final call.",
  "Your shift expires soon. Save the streak.",
  "Do not let the clock beat you.",
  "Two hours left. This is your last clean chance.",
  "Open the app. Review the shift. Keep your promise.",
];

const groupedSoftMessages = [
  "{name}, {count} shifts are waiting for review.",
  "{count} shifts need your review. Tap to check them.",
  "{name}, you have {count} shifts waiting. Lock in your progress.",
  "{count} shifts are still pending review.",
];

const groupedStrongMessages = [
  "{name}, {count} shifts are getting close to expiry.",
  "You are kidding. {count} shifts are about to expire.",
  "{count} shifts are still waiting. Do not let them become missed.",
  "{name}, your streak is under pressure. Review {count} shifts now.",
];

const groupedFinalMessages = [
  "{name}, final call. {count} shifts are almost expired.",
  "Noooooooo. {count} shifts are nearly gone.",
  "Our streak!!! {count} shifts need review now.",
  "Two hours left. Review {count} shifts before they expire.",
];

/* ================= BADGES ================= */

const getBadge = (streak: number) => {
  if (streak >= 450) return "Emperor";
  if (streak >= 350) return "King";
  if (streak >= 250) return "Ace";
  if (streak >= 150) return "Diamond";
  if (streak >= 100) return "Platinum";
  if (streak >= 50) return "Gold";
  if (streak >= 20) return "Silver";
  if (streak >= 10) return "Bronze";
  if (streak >= 3) return "Scout";
  return null;
};

/* ================= PROVIDER ================= */

export const GoalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [historyGoals, setHistoryGoals] = useState<Goal[]>([]);
  const [hasLoadedGoals, setHasLoadedGoals] = useState(false);

  const [currentStreak, setCurrentStreak] = useState(0);
  const [failedChances, setFailedChances] = useState(0);
  const [highestStreak, setHighestStreak] = useState(0);
  const [lastUnlockedBadge, setLastUnlockedBadge] = useState<string | null>(
    null,
  );

  const auth = useContext(AuthContext);
  const userId = auth?.user?.id ?? null;
  const getUserDisplayName = () => {
    const profile = auth?.profile as any;

    const rawName =
      profile?.first_name || profile?.middle_name || profile?.full_name || "";

    const cleanName = String(rawName).trim();

    if (!cleanName) return "";

    return cleanName.split(" ")[0];
  };

  const getUserStorageKey = (baseKey: string) => {
    if (!userId) return null;
    return `${baseKey}:${userId}`;
  };

  /* ================= HELPERS ================= */

  const startOfDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const isSameDate = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

  const getWeekdayFromDate = (date: Date) => {
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

  const sortShiftsByTime = (shifts: PlanGuideItem[]) => {
    return [...shifts].sort((a, b) => {
      const startDiff =
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime();

      if (startDiff !== 0) return startDiff;

      return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
    });
  };

  const mergeDateWithTime = (baseDate: Date, timeSource: string) => {
    const source = new Date(timeSource);
    const merged = new Date(baseDate);
    merged.setHours(source.getHours(), source.getMinutes(), 0, 0);
    return merged;
  };

  const getGoalDaysArray = (days?: string) =>
    String(days ?? "")
      .split(" ")
      .filter(Boolean);

  const isGoalActiveOnDate = (goal: Goal, date: Date) => {
    const check = startOfDay(date);
    const start = startOfDay(new Date(goal.startDate));

    if (check < start) return false;

    if (goal.endDate) {
      const end = startOfDay(new Date(goal.endDate));
      if (check > end) return false;
    }

    const goalDays = getGoalDaysArray(goal.days);
    if (goalDays.length === 0) return false;

    return goalDays.includes(getWeekdayFromDate(date));
  };

  const getShiftsForGoalDate = (goal: Goal, date: Date): PlanGuideItem[] => {
    const shifts = goal.planGuide ?? [];

    if (!isGoalActiveOnDate(goal, date)) {
      return [];
    }

    const weekdayLabel = getWeekdayFromDate(date);
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

  const getShiftReviewKey = (
    goalId: string,
    shiftId: string,
    shiftDate: Date,
  ) => `${goalId}__${shiftId}__${startOfDay(shiftDate).toISOString()}`;

  const getShiftExpiryTime = (shiftEnd: Date) => {
    return new Date(shiftEnd.getTime() + SHIFT_REVIEW_WINDOW_MS);
  };

  const pickRandomMessage = (messages: string[]) => {
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const fillFollowUpTemplate = ({
    template,
    name,
    shiftTitle,
    count,
  }: {
    template: string;
    name: string;
    shiftTitle: string;
    count: number;
  }) => {
    const safeName = name || "Hey";
    const namePrefix = name ? `${name}` : "Hey";

    return template
      .replace(/\{name\}/g, namePrefix)
      .replace(/\{shiftTitle\}/g, shiftTitle)
      .replace(/\{count\}/g, String(count));
  };

  const getFollowUpMessage = ({
    stage,
    count,
    shiftTitle,
    name,
  }: {
    stage: ReviewFollowUpStage;
    count: number;
    shiftTitle: string;
    name: string;
  }) => {
    const isGrouped = count > 1;

    if (stage === "soft") {
      return fillFollowUpTemplate({
        template: pickRandomMessage(
          isGrouped ? groupedSoftMessages : softFollowUpMessages,
        ),
        name,
        shiftTitle,
        count,
      });
    }

    if (stage === "strong") {
      return fillFollowUpTemplate({
        template: pickRandomMessage(
          isGrouped ? groupedStrongMessages : strongFollowUpMessages,
        ),
        name,
        shiftTitle,
        count,
      });
    }

    return fillFollowUpTemplate({
      template: pickRandomMessage(
        isGrouped ? groupedFinalMessages : finalCallMessages,
      ),
      name,
      shiftTitle,
      count,
    });
  };

  const getFollowUpBucketKey = (date: Date, stage: ReviewFollowUpStage) => {
    const rounded = new Date(date);
    rounded.setSeconds(0, 0);
    return `${stage}:${rounded.toISOString()}`;
  };

  const getTotalScheduledShiftCount = (goal: Goal, now: Date = new Date()) => {
    const start = startOfDay(new Date(goal.startDate));
    const end = goal.endDate
      ? startOfDay(new Date(goal.endDate))
      : startOfDay(now);

    if (end < start) return 0;

    let total = 0;
    const current = new Date(start);

    while (current <= end) {
      const shifts = getShiftsForGoalDate(goal, current);
      total += shifts.length;
      current.setDate(current.getDate() + 1);
    }

    return total;
  };

  const recalculateGoalProgress = (
    goal: Goal,
    now: Date = new Date(),
  ): Goal => {
    const totalScheduled = getTotalScheduledShiftCount(goal, now);

    const completedCount = (goal.shiftReviews ?? []).filter(
      (review) => review.status === "completed",
    ).length;

    const progress =
      totalScheduled === 0
        ? 0
        : Math.min(
            100,
            Math.max(0, Math.round((completedCount / totalScheduled) * 100)),
          );

    return {
      ...goal,
      progress,
    };
  };

  const refreshGoalShiftReviewsWithMeta = (
    goal: Goal,
    now: Date = new Date(),
  ): { goal: Goal; autoMissedCount: number } => {
    const existingReviews = goal.shiftReviews ?? [];
    const reviewMap = new Map(
      existingReviews.map((review) => [review.key, review]),
    );

    const start = startOfDay(new Date(goal.startDate));
    const end = goal.endDate
      ? startOfDay(new Date(goal.endDate))
      : startOfDay(now);

    if (end >= start) {
      const current = new Date(start);

      while (current <= end) {
        const shifts = getShiftsForGoalDate(goal, current);

        for (const shift of shifts) {
          const shiftEnd = mergeDateWithTime(current, shift.endTime);

          if (shiftEnd <= now) {
            const key = getShiftReviewKey(goal.id, shift.id, current);

            if (!reviewMap.has(key)) {
              reviewMap.set(key, {
                key,
                goalId: goal.id,
                shiftId: shift.id,
                shiftTitle: shift.title,
                shiftDate: startOfDay(current).toISOString(),
                shiftStart: shift.startTime,
                shiftEnd: shift.endTime,
                expiresAt: getShiftExpiryTime(shiftEnd).toISOString(),
                status: "pending" as ShiftReviewStatus,
              });
            }
          }
        }

        current.setDate(current.getDate() + 1);
      }
    }

    let autoMissedCount = 0;

    const updatedReviews = Array.from(reviewMap.values()).map((review) => {
      if (
        review.status === "pending" &&
        new Date(review.expiresAt).getTime() <= now.getTime()
      ) {
        autoMissedCount += 1;

        return {
          ...review,
          status: "missed" as ShiftReviewStatus,
          reviewedAt: now.toISOString(),
        };
      }

      return review;
    });

    return {
      goal: recalculateGoalProgress(
        {
          ...goal,
          shiftReviews: updatedReviews,
        },
        now,
      ),
      autoMissedCount,
    };
  };

  const refreshGoalShiftReviews = (
    goal: Goal,
    now: Date = new Date(),
  ): Goal => {
    return refreshGoalShiftReviewsWithMeta(goal, now).goal;
  };

  const normalizeGoal = (goal: any): Goal => {
    const normalizedPlanGuide: PlanGuideItem[] = Array.isArray(goal?.planGuide)
      ? goal.planGuide.map((step: any) => ({
          id:
            step?.id ??
            `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          title: String(step?.title ?? ""),
          timeframeType: (step?.timeframeType ?? "day") as TimeframeType,
          timeframeValue: Number(step?.timeframeValue ?? 1),
          startTime: String(step?.startTime ?? ""),
          endTime: String(step?.endTime ?? ""),
          plannedDate: step?.plannedDate,
          weekdayLabel: step?.weekdayLabel,
          targetType: (step?.targetType ??
            (step?.plannedDate ? "date" : "weekday")) as TargetType,
          targetKey: step?.targetKey,
          targetLabel: step?.targetLabel,
          imageKey: step?.imageKey ? String(step.imageKey) : undefined,
          imageUri: step?.imageUri ? String(step.imageUri) : undefined,
          explanation: step?.explanation ? String(step.explanation) : undefined,
          resourceLinks: Array.isArray(step?.resourceLinks)
            ? step.resourceLinks
                .map((link: any) => ({
                  title: String(link?.title ?? ""),
                  url: String(link?.url ?? ""),
                }))
                .filter((link: any) => link.title && link.url)
            : [],
        }))
      : [];

    const normalizedShiftReviews: ShiftReviewItem[] = Array.isArray(
      goal?.shiftReviews,
    )
      ? goal.shiftReviews.map((review: any) => ({
          key: String(review?.key ?? ""),
          goalId: String(review?.goalId ?? goal?.id ?? ""),
          shiftId: String(review?.shiftId ?? ""),
          shiftTitle: String(review?.shiftTitle ?? ""),
          shiftDate: String(review?.shiftDate ?? ""),
          shiftStart: String(review?.shiftStart ?? ""),
          shiftEnd: String(review?.shiftEnd ?? ""),
          expiresAt: String(review?.expiresAt ?? ""),
          status: (review?.status ?? "pending") as ShiftReviewStatus,
          reviewedAt: review?.reviewedAt
            ? String(review.reviewedAt)
            : undefined,
        }))
      : [];

    return {
      id: String(goal?.id ?? Date.now().toString()),
      title: String(goal?.title ?? ""),
      type: (goal?.type ?? "daily") as "daily" | "fixed",
      startDate: String(goal?.startDate ?? new Date().toISOString()),
      endDate: goal?.endDate ? String(goal.endDate) : undefined,
      startTime: goal?.startTime ? String(goal.startTime) : undefined,
      endTime: goal?.endTime ? String(goal.endTime) : undefined,
      days: goal?.days ? String(goal.days) : undefined,
      progress: Number(goal?.progress ?? 0),
      status: (goal?.status ?? "Upcoming") as
        | "Upcoming"
        | "In Progress"
        | "Completed"
        | "Failed",
      planGuide: normalizedPlanGuide,
      shiftReviews: normalizedShiftReviews,

      createdWithAI: Boolean(goal?.createdWithAI),
      aiGoalMemory: goal?.aiGoalMemory ?? null,
      aiLastEditedAt: goal?.aiLastEditedAt ?? null,
    };
  };

  /* ================= SOUND ================= */

  // const playSuccessSound = async () => {
  //   try {
  //     const { sound } = await Audio.Sound.createAsync(
  //       require("../assets/sounds/success.mp3"),
  //     );
  //     await sound.playAsync();
  //   } catch (e) {
  //     console.log("Sound error:", e);
  //   }
  // };

  /* ================= SAVE ================= */

  const saveStreak = async (
    streak: number,
    failed: number,
    highest: number,
  ) => {
    const streakStorageKey = getUserStorageKey(STREAK_STORAGE_KEY_BASE);
    if (!streakStorageKey) return;

    try {
      await AsyncStorage.setItem(
        streakStorageKey,
        JSON.stringify({
          currentStreak: streak,
          failedChances: failed,
          highestStreak: highest,
        }),
      );
    } catch (e) {
      console.log("Error saving streak:", e);
    }
  };

  const getStreakAfterMissedCount = (
    missedCount: number,
    streak: number,
    failed: number,
  ) => {
    let nextFailed = failed;
    let nextStreak = streak;

    for (let i = 0; i < missedCount; i += 1) {
      nextFailed += 1;

      if (nextFailed >= 3) {
        nextFailed = 0;
        nextStreak = 0;
      }
    }

    return { nextStreak, nextFailed };
  };

  const applyAutoMissedPenalty = async (missedCount: number) => {
    if (missedCount <= 0) return;

    const { nextStreak, nextFailed } = getStreakAfterMissedCount(
      missedCount,
      currentStreak,
      failedChances,
    );

    setCurrentStreak(nextStreak);
    setFailedChances(nextFailed);

    await saveStreak(nextStreak, nextFailed, highestStreak);
  };

  const saveGoals = async (newGoals: Goal[]) => {
    try {
      const refreshResults = newGoals.map((goal) =>
        refreshGoalShiftReviewsWithMeta(goal),
      );

      const refreshedGoals = refreshResults.map((result) => result.goal);

      const autoMissedCount = refreshResults.reduce(
        (total, result) => total + result.autoMissedCount,
        0,
      );

      if (autoMissedCount > 0) {
        await applyAutoMissedPenalty(autoMissedCount);
      }

      if (DEBUG) {
        console.log("SAVE GOALS -> incoming count:", newGoals.length);
        console.log("SAVE GOALS -> refreshed count:", refreshedGoals.length);
        console.log(
          "SAVE GOALS -> titles:",
          refreshedGoals.map((g) => g.title),
        );
      }

      setGoals(refreshedGoals);
      const goalsStorageKey = getUserStorageKey(STORAGE_KEY_BASE);
      if (!goalsStorageKey) return;

      await AsyncStorage.setItem(
        goalsStorageKey,
        JSON.stringify(refreshedGoals),
      );

      setHasLoadedGoals(true);

      if (DEBUG) console.log("SAVE GOALS -> AsyncStorage write complete");
    } catch (e) {
      console.log("Error saving goals:", e);
    }
  };

  const saveHistoryGoals = async (newHistoryGoals: Goal[]) => {
    const historyStorageKey = getUserStorageKey(HISTORY_STORAGE_KEY_BASE);
    if (!historyStorageKey) return;

    try {
      await AsyncStorage.setItem(
        historyStorageKey,
        JSON.stringify(newHistoryGoals),
      );
      setHistoryGoals(newHistoryGoals);
    } catch (e) {
      console.log("Error saving history goals:", e);
    }
  };

  const clearShiftNotifications = async (goalId?: string) => {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    const shiftNotifications = scheduled.filter((item) => {
      const data = item.content?.data as Record<string, unknown> | undefined;

      if (!data) return false;
      if (
        data.source !== SHIFT_NOTIFICATION_SOURCE &&
        data.source !== REVIEW_FOLLOWUP_NOTIFICATION_SOURCE
      ) {
        return false;
      }

      if (goalId) {
        return data.goalId === goalId;
      }

      return true;
    });

    for (const item of shiftNotifications) {
      await Notifications.cancelScheduledNotificationAsync(item.identifier);
    }
  };

  const scheduleGoalShiftNotifications = async (goal: Goal) => {
    if (goal.status === "Completed" || goal.status === "Failed") return;

    const permission = await Notifications.getPermissionsAsync();

    let granted =
      permission.granted ||
      permission.ios?.status ===
        Notifications.IosAuthorizationStatus.PROVISIONAL;

    if (!granted) {
      const requested = await Notifications.requestPermissionsAsync();

      granted =
        requested.granted ||
        requested.ios?.status ===
          Notifications.IosAuthorizationStatus.PROVISIONAL;
    }

    if (!granted) {
      console.log("Shift notification permission not granted");
      return;
    }

    if (Platform.OS === "android") {
  await Notifications.setNotificationChannelAsync(SHIFT_NOTIFICATION_CHANNEL_ID, {
    name: "GoalTracker Shifts",
    importance: Notifications.AndroidImportance.HIGH,
    sound: SHIFT_NOTIFICATION_SOUND,
  });
}


    const now = new Date();
    const start = startOfDay(new Date(goal.startDate));

    const naturalEnd = goal.endDate
      ? startOfDay(new Date(goal.endDate))
      : startOfDay(
          new Date(
            now.getTime() +
              SHIFT_NOTIFICATION_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000,
          ),
        );

    const maxEnd = startOfDay(
      new Date(
        now.getTime() + SHIFT_NOTIFICATION_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000,
      ),
    );

    const end = naturalEnd < maxEnd ? naturalEnd : maxEnd;

    const current = new Date(start > now ? start : startOfDay(now));

    while (current <= end) {
      const shifts = getShiftsForGoalDate(goal, current);

      for (const shift of shifts) {
        const shiftStart = mergeDateWithTime(current, shift.startTime);
        const shiftEnd = mergeDateWithTime(current, shift.endTime);
        const tenMinutesBefore = new Date(
          shiftStart.getTime() - 10 * 60 * 1000,
        );

        const events = [
          {
            type: "prepare",
            date: tenMinutesBefore,
            title: "Get ready ⏳",
            body: `${shift.title} starts in 10 minutes.`,
          },
          {
            type: "start",
            date: shiftStart,
            title: "Shift starting now 🚀",
            body: `${shift.title} has started.`,
          },
          {
            type: "end",
            date: shiftEnd,
            title: "Shift ended ✅",
            body: `${shift.title} has ended. Review your progress.`,
          },
        ];

        for (const event of events) {
          if (event.date <= now) continue;

          await Notifications.scheduleNotificationAsync({
            content: {
              title: event.title,
              body: event.body,
              sound: SHIFT_NOTIFICATION_SOUND,
              data: {
                source: SHIFT_NOTIFICATION_SOURCE,
                goalId: goal.id,
                shiftId: shift.id,
                shiftTitle: shift.title,
                notificationType: event.type,
                scheduledFor: event.date.toISOString(),
              },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: event.date,
              channelId: SHIFT_NOTIFICATION_CHANNEL_ID,
            },
          });
        }
      }

      current.setDate(current.getDate() + 1);
    }
  };

  const scheduleReviewFollowUpNotifications = async (nextGoals: Goal[]) => {
    const permission = await Notifications.getPermissionsAsync();

    let granted =
      permission.granted ||
      permission.ios?.status ===
        Notifications.IosAuthorizationStatus.PROVISIONAL;

    if (!granted) {
      const requested = await Notifications.requestPermissionsAsync();

      granted =
        requested.granted ||
        requested.ios?.status ===
          Notifications.IosAuthorizationStatus.PROVISIONAL;
    }

    if (!granted) {
      console.log("Review follow-up notification permission not granted");
      return;
    }

    const now = new Date();
    const name = getUserDisplayName();

    const followUpBuckets = new Map<
      string,
      {
        stage: ReviewFollowUpStage;
        date: Date;
        items: {
          goalId: string;
          shiftId: string;
          reviewKey: string;
          shiftTitle: string;
          followUpType: "manual" | "ai";
        }[];
      }
    >();

    const addFollowUp = ({
      stage,
      date,
      goalId,
      shiftId,
      reviewKey,
      shiftTitle,
      followUpType,
    }: {
      stage: ReviewFollowUpStage;
      date: Date;
      goalId: string;
      shiftId: string;
      reviewKey: string;
      shiftTitle: string;
      followUpType: "manual" | "ai";
    }) => {
      if (date <= now) return;

      const key = getFollowUpBucketKey(date, stage);
      const existing = followUpBuckets.get(key);

      if (existing) {
        existing.items.push({
          goalId,
          shiftId,
          reviewKey,
          shiftTitle,
          followUpType,
        });
        return;
      }

      followUpBuckets.set(key, {
        stage,
        date,
        items: [
          {
            goalId,
            shiftId,
            reviewKey,
            shiftTitle,
            followUpType,
          },
        ],
      });
    };

    for (const goal of nextGoals) {
      if (goal.status === "Completed" || goal.status === "Failed") continue;

      const followUpType = goal.createdWithAI ? "ai" : "manual";

      const start = startOfDay(new Date(goal.startDate));

      const naturalEnd = goal.endDate
        ? startOfDay(new Date(goal.endDate))
        : startOfDay(
            new Date(
              now.getTime() +
                SHIFT_NOTIFICATION_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000,
            ),
          );

      const maxEnd = startOfDay(
        new Date(
          now.getTime() +
            SHIFT_NOTIFICATION_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000,
        ),
      );

      const end = naturalEnd < maxEnd ? naturalEnd : maxEnd;
      const current = new Date(start > now ? start : startOfDay(now));

      while (current <= end) {
        const shifts = getShiftsForGoalDate(goal, current);

        for (const shift of shifts) {
          const reviewKey = getShiftReviewKey(goal.id, shift.id, current);

          const existingReview = (goal.shiftReviews ?? []).find(
            (review) => review.key === reviewKey,
          );

          if (
            existingReview?.status === "completed" ||
            existingReview?.status === "missed"
          ) {
            continue;
          }

          const shiftEnd = mergeDateWithTime(current, shift.endTime);
          const expiresAt = getShiftExpiryTime(shiftEnd);

          addFollowUp({
            stage: "soft",
            date: new Date(shiftEnd.getTime() + REVIEW_SOFT_REMINDER_MS),
            goalId: goal.id,
            shiftId: shift.id,
            reviewKey,
            shiftTitle: shift.title,
            followUpType,
          });

          addFollowUp({
            stage: "strong",
            date: new Date(
              expiresAt.getTime() - REVIEW_STRONG_REMINDER_BEFORE_EXPIRY_MS,
            ),
            goalId: goal.id,
            shiftId: shift.id,
            reviewKey,
            shiftTitle: shift.title,
            followUpType,
          });

          addFollowUp({
            stage: "final",
            date: new Date(
              expiresAt.getTime() - REVIEW_FINAL_REMINDER_BEFORE_EXPIRY_MS,
            ),
            goalId: goal.id,
            shiftId: shift.id,
            reviewKey,
            shiftTitle: shift.title,
            followUpType,
          });
        }

        current.setDate(current.getDate() + 1);
      }
    }

    for (const bucket of followUpBuckets.values()) {
      const count = bucket.items.length;
      const firstItem = bucket.items[0];

      const body = getFollowUpMessage({
        stage: bucket.stage,
        count,
        shiftTitle: firstItem.shiftTitle,
        name,
      });

      await Notifications.scheduleNotificationAsync({
        content: {
          title:
            bucket.stage === "soft"
              ? "Shift review waiting"
              : bucket.stage === "strong"
                ? "Review before it expires"
                : "Final review call",
          body,
          sound: true,
          data: {
            source: REVIEW_FOLLOWUP_NOTIFICATION_SOURCE,
            notificationType: `review_follow_up_${bucket.stage}`,
            reviewKeys: bucket.items.map((item) => item.reviewKey),
            goalIds: bucket.items.map((item) => item.goalId),
            followUpTypes: bucket.items.map((item) => item.followUpType),
            scheduledFor: bucket.date.toISOString(),
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: bucket.date,
          channelId: SHIFT_NOTIFICATION_CHANNEL_ID,
        },
      });
    }
  };

  const rescheduleShiftNotifications = async (nextGoals: Goal[]) => {
    try {
      await clearShiftNotifications();

      for (const goal of nextGoals) {
        await scheduleGoalShiftNotifications(goal);
      }

      await scheduleReviewFollowUpNotifications(nextGoals);
    } catch (error) {
      console.log("Failed to reschedule shift notifications:", error);
    }
  };

  /* ================= LOAD ================= */

  const loadGoals = async () => {
    try {
      const goalsStorageKey = getUserStorageKey(STORAGE_KEY_BASE);
      const historyStorageKey = getUserStorageKey(HISTORY_STORAGE_KEY_BASE);
      const streakStorageKey = getUserStorageKey(STREAK_STORAGE_KEY_BASE);

      if (!goalsStorageKey || !historyStorageKey || !streakStorageKey) {
        setGoals([]);
        setHistoryGoals([]);
        setCurrentStreak(0);
        setFailedChances(0);
        setHighestStreak(0);
        setLastUnlockedBadge(null);
        setHasLoadedGoals(true);
        await clearShiftNotifications();
        return;
      }

      const [goalsJson, historyJson, streakJson] = await Promise.all([
        AsyncStorage.getItem(goalsStorageKey),
        AsyncStorage.getItem(historyStorageKey),
        AsyncStorage.getItem(streakStorageKey),
      ]);

      let normalizedGoals: Goal[] = [];
      let normalizedHistoryGoals: Goal[] = [];

      if (goalsJson) {
        const parsedGoals = JSON.parse(goalsJson);
        if (Array.isArray(parsedGoals)) {
          normalizedGoals = parsedGoals.map(normalizeGoal);
        }
      }

      if (historyJson) {
        const parsedHistory = JSON.parse(historyJson);
        if (Array.isArray(parsedHistory)) {
          normalizedHistoryGoals = parsedHistory.map(normalizeGoal);
        }
      }

      const refreshResults = normalizedGoals.map((goal) =>
        refreshGoalShiftReviewsWithMeta(goal),
      );

      const refreshedGoals = refreshResults.map((result) => result.goal);

      const autoMissedCount = refreshResults.reduce(
        (total, result) => total + result.autoMissedCount,
        0,
      );

      setGoals(refreshedGoals);
      setHistoryGoals(normalizedHistoryGoals);

      const goalsStorageKeyForRefresh = getUserStorageKey(STORAGE_KEY_BASE);

      if (goalsStorageKeyForRefresh) {
        await AsyncStorage.setItem(
          goalsStorageKeyForRefresh,
          JSON.stringify(refreshedGoals),
        );
      }

      await rescheduleShiftNotifications(refreshedGoals);
      setHasLoadedGoals(true);

      if (DEBUG) {
        console.log("LOAD GOALS -> loaded goals count:", refreshedGoals.length);
        console.log(
          "LOAD GOALS -> loaded titles:",
          refreshedGoals.map((g) => g.title),
        );
        console.log(
          "LOAD GOALS -> loaded history count:",
          normalizedHistoryGoals.length,
        );
      }

      let loadedCurrentStreak = 0;
      let loadedFailedChances = 0;
      let loadedHighestStreak = 0;

      if (streakJson) {
        const parsed = JSON.parse(streakJson);
        loadedCurrentStreak = parsed.currentStreak ?? 0;
        loadedFailedChances = parsed.failedChances ?? 0;
        loadedHighestStreak = parsed.highestStreak ?? 0;
      }

      if (autoMissedCount > 0) {
        const result = getStreakAfterMissedCount(
          autoMissedCount,
          loadedCurrentStreak,
          loadedFailedChances,
        );

        loadedCurrentStreak = result.nextStreak;
        loadedFailedChances = result.nextFailed;

        await saveStreak(
          loadedCurrentStreak,
          loadedFailedChances,
          loadedHighestStreak,
        );
      }

      setCurrentStreak(loadedCurrentStreak);
      setFailedChances(loadedFailedChances);
      setHighestStreak(loadedHighestStreak);
    } catch (e) {
      console.log("Error loading goals:", e);
      setGoals([]);
      setHistoryGoals([]);
      setHasLoadedGoals(true);
    }
  };

  useEffect(() => {
    setHasLoadedGoals(false);
    loadGoals();
  }, [userId]);

  /* ================= GOAL ACTIONS ================= */

  const addGoal = async (goal: Goal) => {
    const normalizedGoal = normalizeGoal(goal);

    if (DEBUG) {
      console.log("GOAL CONTEXT -> incoming goal:", normalizedGoal);
      console.log("GOAL CONTEXT -> goals before add:", goals.length);
    }

    const newGoals = [...goals, normalizedGoal];

    if (DEBUG) console.log("GOAL CONTEXT -> goals after add:", newGoals.length);

    await saveGoals(newGoals);
    await rescheduleShiftNotifications(newGoals);

    if (DEBUG) console.log("GOAL CONTEXT -> addGoal saveGoals finished");
  };

  const updateGoal = async (goal: Goal) => {
    const normalizedGoal = normalizeGoal(goal);
    const newGoals = goals.map((g) =>
      g.id === normalizedGoal.id ? normalizedGoal : g,
    );

    await saveGoals(newGoals);
    await rescheduleShiftNotifications(newGoals);
  };

  const deleteGoal = async (id: string) => {
    const newGoals = goals.filter((g) => g.id !== id);

    await saveGoals(newGoals);
    await clearShiftNotifications(id);
    await rescheduleShiftNotifications(newGoals);
  };

  const completeGoal = async (id: string) => {
    const goalToComplete = goals.find((g) => g.id === id);
    if (!goalToComplete) return;

    const reviews = goalToComplete.shiftReviews ?? [];
    const hasMissedShift = reviews.some((review) => review.status === "missed");

    const finalizedGoal: Goal = {
      ...goalToComplete,
      status: hasMissedShift ? "Failed" : "Completed",
    };

    const newGoals = goals.filter((g) => g.id !== id);
    const newHistoryGoals = [finalizedGoal, ...historyGoals];

    await saveGoals(newGoals);
    await saveHistoryGoals(newHistoryGoals);
  };

  const restoreGoal = async (goal: Goal) => {
    const restoredGoal: Goal = {
      ...normalizeGoal(goal),
      status: "Upcoming",
    };

    const newGoals = [...goals, restoredGoal];
    const newHistoryGoals = historyGoals.filter((g) => g.id !== goal.id);

    await saveGoals(newGoals);
    await saveHistoryGoals(newHistoryGoals);
  };

  const deleteHistoryGoal = async (id: string) => {
    const newHistoryGoals = historyGoals.filter((g) => g.id !== id);
    await saveHistoryGoals(newHistoryGoals);
  };

  const refreshShiftReviews = async () => {
    if (!hasLoadedGoals) return;

    await saveGoals(goals);
  };

  useEffect(() => {
    if (!hasLoadedGoals || !userId) return;

    const interval = setInterval(() => {
      refreshShiftReviews();
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [hasLoadedGoals, userId, goals]);

  /* ================= SHIFT REVIEW ACTIONS ================= */

  const markShiftCompleted = (goalId: string, reviewKey: string) => {
    const newStreak = currentStreak + 1;
    const newHighest = Math.max(highestStreak, newStreak);

    const newBadge = getBadge(newHighest);
    const oldBadge = getBadge(highestStreak);

    if (newBadge && newBadge !== oldBadge) {
      setLastUnlockedBadge(newBadge);
    }

    //playSuccessSound();

    const updatedGoals = goals.map((goal) => {
      if (goal.id !== goalId) return goal;

      const updatedReviews = (goal.shiftReviews ?? []).map((r) =>
        r.key === reviewKey
          ? {
              ...r,
              status: "completed" as ShiftReviewStatus,
              reviewedAt: new Date().toISOString(),
            }
          : r,
      );

      return recalculateGoalProgress({
        ...goal,
        shiftReviews: updatedReviews,
      });
    });

    setCurrentStreak(newStreak);
    setHighestStreak(newHighest);
    setFailedChances(0);

    saveGoals(updatedGoals);
    saveStreak(newStreak, 0, newHighest);
    rescheduleShiftNotifications(updatedGoals);
  };

  const markShiftMissed = (goalId: string, reviewKey: string) => {
    let newFailed = failedChances + 1;
    let newStreak = currentStreak;

    if (newFailed >= 3) {
      newFailed = 0;
      newStreak = 0;
    }

    const updatedGoals = goals.map((goal) => {
      if (goal.id !== goalId) return goal;

      const updatedReviews = (goal.shiftReviews ?? []).map((r) =>
        r.key === reviewKey
          ? {
              ...r,
              status: "missed" as ShiftReviewStatus,
              reviewedAt: new Date().toISOString(),
            }
          : r,
      );

      return recalculateGoalProgress({
        ...goal,
        shiftReviews: updatedReviews,
      });
    });

    setFailedChances(newFailed);
    setCurrentStreak(newStreak);

    saveGoals(updatedGoals);
    saveStreak(newStreak, newFailed, highestStreak);
    rescheduleShiftNotifications(updatedGoals);
  };

  return (
    <GoalContext.Provider
      value={{
        goals,
        historyGoals,
        hasLoadedGoals,
        addGoal,
        updateGoal,
        deleteGoal,
        completeGoal,
        restoreGoal,
        deleteHistoryGoal,
        loadGoals,
        refreshShiftReviews,
        markShiftCompleted,
        markShiftMissed,
        currentStreak,
        failedChances,
        highestStreak,
        lastUnlockedBadge,
      }}
    >
      {children}
    </GoalContext.Provider>
  );
};
