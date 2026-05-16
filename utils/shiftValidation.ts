import {
  areTimeRangesOverlapping,
  formatTime,
  getMonthKeyFromDate,
  getWeekKeyFromDate,
  getWeekdayFromDate,
  getYearKeyFromDate,
  isSameDate,
  mergeDateWithTime,
  sortShiftsByTime,
  startOfDay,
  type ShiftItem,
} from "./goalPlannerHelpers";

export const getGoalDaysArray = (days?: string) => {
  return String(days ?? "")
    .split(" ")
    .filter(Boolean);
};

export const isGoalActiveOnDate = (
  goalStartDate: string,
  goalEndDate: string | undefined,
  goalDays: string[],
  date: Date,
) => {
  const check = startOfDay(date);
  const start = startOfDay(new Date(goalStartDate));

  if (check < start) return false;

  if (goalEndDate) {
    const end = startOfDay(new Date(goalEndDate));
    if (check > end) return false;
  }

  const weekday = getWeekdayFromDate(date);
  return goalDays.includes(weekday);
};

export const getShiftsForGoalDate = (
  goal: {
    startDate: string;
    endDate?: string;
    days?: string;
    planGuide?: ShiftItem[];
  },
  date: Date,
) => {
  const goalDays = getGoalDaysArray(goal.days);
  const shifts = goal.planGuide ?? [];

  if (!isGoalActiveOnDate(goal.startDate, goal.endDate, goalDays, date)) {
    return [];
  }

  const weekdayLabel = getWeekdayFromDate(date);
  const yearKey = getYearKeyFromDate(date);
  const monthKey = getMonthKeyFromDate(date);
  const weekKey = getWeekKeyFromDate(date);

  const weekdayShifts = shifts.filter(
    (step) => step.targetType === "weekday" && step.weekdayLabel === weekdayLabel,
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

export const getDatesCoveredByShift = (
  shift: ShiftItem,
  goalStartDate: Date,
  goalEndDate: Date | undefined,
  selectedDays: string[],
) => {
  const dates: Date[] = [];
  const start = startOfDay(goalStartDate);
  const end = goalEndDate ? startOfDay(goalEndDate) : startOfDay(goalStartDate);

  const current = new Date(start);

  while (current <= end) {
    const weekdayLabel = getWeekdayFromDate(current);
    const isSelectedWeekday = selectedDays.includes(weekdayLabel);

    if (isSelectedWeekday) {
      const yearKey = getYearKeyFromDate(current);
      const monthKey = getMonthKeyFromDate(current);
      const weekKey = getWeekKeyFromDate(current);

      let applies = false;

      if (shift.targetType === "weekday" && shift.weekdayLabel === weekdayLabel) {
        applies = true;
      }

      if (
        shift.targetType === "date" &&
        shift.plannedDate &&
        isSameDate(new Date(shift.plannedDate), current)
      ) {
        applies = true;
      }

      if (shift.targetType === "week" && shift.targetKey === weekKey) {
        applies = true;
      }

      if (shift.targetType === "month" && shift.targetKey === monthKey) {
        applies = true;
      }

      if (shift.targetType === "year" && shift.targetKey === yearKey) {
        applies = true;
      }

      if (applies) {
        dates.push(new Date(current));
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return dates;
};

export const validateShiftConflicts = ({
  newShifts,
  localGoalStart,
  localGoalEnd,
  selectedDays,
  routineMode,
  planGuide,
  goals,
  title,
  showTopToast,
}: {
  newShifts: ShiftItem[];
  localGoalStart: Date;
  localGoalEnd: Date;
  selectedDays: string[];
  routineMode: "everyday" | "custom";
  planGuide: ShiftItem[];
  goals: any[];
  title: string;
  showTopToast: (message: string) => void;
}) => {
  for (const newShift of newShifts) {
    const newShiftDates = getDatesCoveredByShift(
      newShift,
      localGoalStart,
      localGoalEnd,
      selectedDays,
    );

    for (const shiftDate of newShiftDates) {
      const newStart = mergeDateWithTime(shiftDate, newShift.startTime);
      const newEnd = mergeDateWithTime(shiftDate, newShift.endTime);

      if (
        isSameDate(shiftDate, new Date()) &&
        newStart.getTime() < new Date().getTime()
      ) {
        showTopToast(
          `You cannot add a past shift for today. Current time has passed ${formatTime(
            newShift.startTime,
          )}.`,
        );
        return false;
      }

      const localExistingShifts = getShiftsForGoalDate(
        {
          startDate: localGoalStart.toISOString(),
          endDate:
            routineMode === "everyday" ? undefined : localGoalEnd.toISOString(),
          days: selectedDays.join(" "),
          planGuide,
        },
        shiftDate,
      );

      for (const existingShift of localExistingShifts) {
        if (newShift.id === existingShift.id) continue;

        const existingStart = mergeDateWithTime(shiftDate, existingShift.startTime);
        const existingEnd = mergeDateWithTime(shiftDate, existingShift.endTime);

        if (
          areTimeRangesOverlapping(newStart, newEnd, existingStart, existingEnd)
        ) {
          showTopToast(
            `This time shift is already taken by Goal Card: ${
              title || "Current Goal"
            }, Shift name: ${existingShift.title}`,
          );
          return false;
        }
      }

      for (const goal of goals) {
        const goalShiftsForDate = getShiftsForGoalDate(
          {
            startDate: goal.startDate,
            endDate: goal.endDate,
            days: goal.days,
            planGuide: (goal.planGuide ?? []) as ShiftItem[],
          },
          shiftDate,
        );

        for (const existingShift of goalShiftsForDate) {
          const existingStart = mergeDateWithTime(
            shiftDate,
            existingShift.startTime,
          );
          const existingEnd = mergeDateWithTime(
            shiftDate,
            existingShift.endTime,
          );

          if (
            areTimeRangesOverlapping(newStart, newEnd, existingStart, existingEnd)
          ) {
            showTopToast(
              `This time shift is already taken by Goal Card: ${goal.title}, Shift name: ${existingShift.title}`,
            );
            return false;
          }
        }
      }
    }
  }

  return true;
};