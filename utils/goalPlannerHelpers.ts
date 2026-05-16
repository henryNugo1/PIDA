export const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const weekHeader = ["S", "M", "T", "W", "T", "F", "S"];
export const timeframeOptions = ["day", "week", "month", "year"] as const;
export const routineModes = ["everyday", "custom"] as const;

export const monthShort = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const dayMap: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export type TimeframeType = "day" | "week" | "month" | "year";
export type RoutineMode = "everyday" | "custom";

export type ShiftItem = {
  id: string;
  title: string;
  explanation?: string;
  resourceLinks?: { title: string; url: string }[];
  timeframeType: TimeframeType;
  timeframeValue: number;
  startTime: string;
  endTime: string;
  weekdayLabel?: string;
  targetType: "weekday" | "date" | "week" | "month" | "year";
  targetKey?: string;
  targetLabel?: string;
  plannedDate?: string;
  imageKey?: string;
  imageUri?: string;
};

export type SelectableItem = {
  key: string;
  label: string;
  active: boolean;
};

export const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const isSameDate = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const formatDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const parseDateKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const formatTime = (timeString: string) =>
  new Date(timeString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatFullDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const sortShiftsByTime = (shifts: ShiftItem[]) => {
  return [...shifts].sort((a, b) => {
    const startDiff =
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime();

    if (startDiff !== 0) return startDiff;

    return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
  });
};

export const getWeekdayFromDate = (date: Date) => {
  const jsDay = date.getDay();
  return weekDays[(jsDay + 6) % 7];
};

export const getMonthLabel = (date: Date) =>
  date.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

export const getWeekOfMonth = (date: Date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  return Math.ceil((date.getDate() + firstDay.getDay()) / 7);
};

export const getYearBlockStart = (year: number) => Math.floor(year / 25) * 25;

export const getWeekKeyFromDate = (date: Date) => {
  return `${date.getFullYear()}|${date.getMonth()}|${getWeekOfMonth(date)}`;
};

export const getMonthKeyFromDate = (date: Date) => {
  return `${date.getFullYear()}|${date.getMonth()}`;
};

export const getYearKeyFromDate = (date: Date) => {
  return `${date.getFullYear()}`;
};

export const areTimeRangesOverlapping = (
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
) => {
  return startA < endB && endA > startB;
};

export const mergeDateWithTime = (baseDate: Date, timeSource: string) => {
  const source = new Date(timeSource);

  const merged = new Date(baseDate);
  merged.setHours(
    source.getHours(),
    source.getMinutes(),
    source.getSeconds(),
    source.getMilliseconds(),
  );

  return merged;
};

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
  const end = startOfDay(new Date(goalEndDate ?? goalStartDate));

  if (check < start || check > end) return false;

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

export const getDatesCoveredByShift = (
  shift: ShiftItem,
  goalStartDate: Date,
  goalEndDate: Date,
  selectedDays: string[],
) => {
  const dates: Date[] = [];
  const start = startOfDay(goalStartDate);
  const end = startOfDay(goalEndDate);
  const current = new Date(start);

  while (current <= end) {
    const weekdayLabel = getWeekdayFromDate(current);
    const isSelectedWeekday = selectedDays.includes(weekdayLabel);

    if (isSelectedWeekday) {
      const yearKey = getYearKeyFromDate(current);
      const monthKey = getMonthKeyFromDate(current);
      const weekKey = getWeekKeyFromDate(current);

      let applies = false;

      if (
        shift.targetType === "weekday" &&
        shift.weekdayLabel === weekdayLabel
      ) {
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

export const isDateInRange = (
  date: Date,
  startDate: Date,
  endDate: Date,
  routineMode: RoutineMode,
) => {
  const check = startOfDay(date);
  const start = startOfDay(startDate);

  if (routineMode === "everyday") return check >= start;

  const end = startOfDay(endDate);
  return check >= start && check <= end;
};

export const isDateSelectable = (
  date: Date,
  selectedDays: string[],
  startDate: Date,
  endDate: Date,
  routineMode: RoutineMode,
) => {
  if (!isDateInRange(date, startDate, endDate, routineMode)) return false;
  if (selectedDays.length === 0) return false;

  const selectedDayNumbers = selectedDays.map((day) => dayMap[day]);
  return selectedDayNumbers.includes(date.getDay());
};

export const doesRangeContainAnyValidSelectedDay = (
  rangeStart: Date,
  rangeEnd: Date,
  isSelectable: (date: Date) => boolean,
) => {
  const current = startOfDay(rangeStart);
  const end = startOfDay(rangeEnd);

  while (current <= end) {
    if (isSelectable(current)) return true;
    current.setDate(current.getDate() + 1);
  }

  return false;
};

export const getSelectedScheduleDaysCount = (
  selectedDays: string[],
  startDate: Date,
  endDate: Date,
  routineMode: RoutineMode,
) => {
  if (selectedDays.length === 0) return 0;

  if (routineMode === "everyday") {
    return selectedDays.length;
  }

  const start = startOfDay(startDate);
  const end = startOfDay(endDate);

  if (end < start) return 0;

  const selectedDayNumbers = selectedDays.map((day) => dayMap[day]);
  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    if (selectedDayNumbers.includes(current.getDay())) count++;
    current.setDate(current.getDate() + 1);
  }

  return count;
};

export const sortDateKeysAscending = (keys: string[]) =>
  [...keys].sort(
    (a, b) => parseDateKey(a).getTime() - parseDateKey(b).getTime(),
  );

export const formatSelectedDatesSummary = (
  keys: string[],
  expanded = false,
) => {
  if (keys.length === 0) return "No dates selected";

  const sortedDates = sortDateKeysAscending(keys).map(parseDateKey);
  const visibleDates = expanded ? sortedDates : sortedDates.slice(0, 4);
  const hiddenCount = sortedDates.length - visibleDates.length;

  const sameYear = sortedDates.every(
    (date) => date.getFullYear() === sortedDates[0].getFullYear(),
  );

  const sameMonth =
    sameYear &&
    sortedDates.every((date) => date.getMonth() === sortedDates[0].getMonth());

  let summary = "";

  if (sameMonth) {
    const daysOnly = visibleDates.map((date) => date.getDate()).join(", ");
    const monthYear = visibleDates[0].toLocaleDateString("en-GB", {
      month: "short",
      year: "numeric",
    });
    summary = `For ${daysOnly} ${monthYear}`;
  } else if (sameYear) {
    const parts = visibleDates.map((date) =>
      date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
    );
    summary = `For ${parts.join(", ")} ${sortedDates[0].getFullYear()}`;
  } else {
    const parts = visibleDates.map((date) =>
      date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    );
    summary = `For ${parts.join(", ")}`;
  }

  if (!expanded && hiddenCount > 0) summary += " ...";
  return summary;
};

export const formatSelectedWeeksSummary = (
  keys: string[],
  expanded = false,
) => {
  const visible = expanded ? keys : keys.slice(0, 4);
  const hidden = keys.length - visible.length;

  const labels = visible.map((key) => {
    const [year, month, weekNumber] = key.split("|").map(Number);
    return `Week ${weekNumber} ${monthShort[month]} ${year}`;
  });

  let summary = `For ${labels.join(", ")}`;
  if (!expanded && hidden > 0) summary += " ...";
  return summary;
};

export const formatSelectedMonthsSummary = (
  keys: string[],
  expanded = false,
) => {
  const visible = expanded ? keys : keys.slice(0, 4);
  const hidden = keys.length - visible.length;

  const labels = visible.map((key) => {
    const [year, month] = key.split("|").map(Number);
    return `${monthShort[month]} ${year}`;
  });

  let summary = `For ${labels.join(", ")}`;
  if (!expanded && hidden > 0) summary += " ...";
  return summary;
};

export const formatSelectedYearsSummary = (
  keys: string[],
  expanded = false,
) => {
  const visible = expanded ? keys : keys.slice(0, 4);
  const hidden = keys.length - visible.length;

  let summary = `For ${visible.join(", ")}`;
  if (!expanded && hidden > 0) summary += " ...";
  return summary;
};

export const formatSelectedWeekdaysSummary = (
  days: string[],
  expanded = false,
) => {
  if (days.length === 0) return "No days selected";

  const visibleDays = expanded ? days : days.slice(0, 4);
  const hiddenCount = days.length - visibleDays.length;

  let summary = `For every ${visibleDays.join(", ")}`;
  if (!expanded && hiddenCount > 0) summary += " ...";

  return summary;
};

export const buildDayCells = (displayedMonth: Date) => {
  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const firstWeekday = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];

  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
};

export const buildWeekItems = (
  displayedMonth: Date,
  isSelectable: (date: Date) => boolean,
): SelectableItem[] => {
  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = firstDay.getDay();

  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const totalWeeks = totalCells / 7;

  const items: SelectableItem[] = [];

  for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex++) {
    const weekNumber = weekIndex + 1;
    const startDay = 1 + weekIndex * 7 - firstWeekday;
    const rangeStart = new Date(year, month, startDay);
    const rangeEnd = new Date(year, month, startDay + 6);

    items.push({
      key: `${year}|${month}|${weekNumber}`,
      label: `Week ${weekNumber}`,
      active: doesRangeContainAnyValidSelectedDay(
        rangeStart,
        rangeEnd,
        isSelectable,
      ),
    });
  }

  return items;
};

export const buildMonthItems = (
  displayedYear: number,
  isSelectable: (date: Date) => boolean,
): SelectableItem[] => {
  return monthShort.map((label, monthIndex) => {
    const rangeStart = new Date(displayedYear, monthIndex, 1);
    const rangeEnd = new Date(displayedYear, monthIndex + 1, 0);

    return {
      key: `${displayedYear}|${monthIndex}`,
      label,
      active: doesRangeContainAnyValidSelectedDay(
        rangeStart,
        rangeEnd,
        isSelectable,
      ),
    };
  });
};

export const buildYearItems = (
  displayedYear: number,
  isSelectable: (date: Date) => boolean,
): SelectableItem[] => {
  const startYear = getYearBlockStart(displayedYear);
  const items: SelectableItem[] = [];

  for (let i = 0; i < 25; i++) {
    const year = startYear + i;
    const rangeStart = new Date(year, 0, 1);
    const rangeEnd = new Date(year, 11, 31);

    items.push({
      key: `${year}`,
      label: `${year}`,
      active: doesRangeContainAnyValidSelectedDay(
        rangeStart,
        rangeEnd,
        isSelectable,
      ),
    });
  }

  return items;
};

export const getGroupedShifts = (
  selectedSpecificKeys: string[],
  timeframeType: TimeframeType,
  planGuide: ShiftItem[],
) => {
  if (selectedSpecificKeys.length === 0) {
    const weekdayShifts = planGuide.filter(
      (step) => step.targetType === "weekday" && step.weekdayLabel,
    );

    const grouped: Record<string, ShiftItem[]> = {};

    weekdayShifts.forEach((step) => {
      const key = step.weekdayLabel!;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(step);
    });

    Object.keys(grouped).forEach((key) => {
      grouped[key] = sortShiftsByTime(grouped[key]);
    });

    return Object.entries(grouped).sort(
      (a, b) => weekDays.indexOf(a[0]) - weekDays.indexOf(b[0]),
    );
  }

  if (timeframeType === "day") {
    const sortedDates =
      sortDateKeysAscending(selectedSpecificKeys).map(parseDateKey);

    return sortedDates.map((selectedDate) => {
      const weekdayName = getWeekdayFromDate(selectedDate);
      const yearKey = getYearKeyFromDate(selectedDate);
      const monthKey = getMonthKeyFromDate(selectedDate);
      const weekKey = getWeekKeyFromDate(selectedDate);

      const weekdayShifts = planGuide.filter(
        (step) =>
          step.targetType === "weekday" && step.weekdayLabel === weekdayName,
      );

      const yearShifts = planGuide.filter(
        (step) => step.targetType === "year" && step.targetKey === yearKey,
      );

      const monthShifts = planGuide.filter(
        (step) => step.targetType === "month" && step.targetKey === monthKey,
      );

      const weekShifts = planGuide.filter(
        (step) => step.targetType === "week" && step.targetKey === weekKey,
      );

      const exactDateShifts = planGuide.filter(
        (step) =>
          step.targetType === "date" &&
          step.plannedDate &&
          isSameDate(new Date(step.plannedDate), selectedDate),
      );

      const mergedShifts = sortShiftsByTime([
        ...weekdayShifts,
        ...yearShifts,
        ...monthShifts,
        ...weekShifts,
        ...exactDateShifts,
      ]);

      return [selectedDate.toISOString(), mergedShifts] as [
        string,
        ShiftItem[],
      ];
    });
  }

  if (timeframeType === "week") {
    const sortedWeekKeys = [...selectedSpecificKeys].sort();

    return sortedWeekKeys.map((weekKey) => {
      const [year, month] = weekKey.split("|").map(Number);
      const yearKey = `${year}`;
      const monthKey = `${year}|${month}`;

      const yearShifts = planGuide.filter(
        (step) => step.targetType === "year" && step.targetKey === yearKey,
      );

      const monthShifts = planGuide.filter(
        (step) => step.targetType === "month" && step.targetKey === monthKey,
      );

      const weekShifts = planGuide.filter(
        (step) => step.targetType === "week" && step.targetKey === weekKey,
      );

      const mergedShifts = sortShiftsByTime([
        ...yearShifts,
        ...monthShifts,
        ...weekShifts,
      ]);

      return [weekKey, mergedShifts] as [string, ShiftItem[]];
    });
  }

  if (timeframeType === "month") {
    const sortedMonthKeys = [...selectedSpecificKeys].sort();

    return sortedMonthKeys.map((monthKey) => {
      const [year] = monthKey.split("|").map(Number);
      const yearKey = `${year}`;

      const yearShifts = planGuide.filter(
        (step) => step.targetType === "year" && step.targetKey === yearKey,
      );

      const monthShifts = planGuide.filter(
        (step) => step.targetType === "month" && step.targetKey === monthKey,
      );

      const mergedShifts = sortShiftsByTime([...yearShifts, ...monthShifts]);

      return [monthKey, mergedShifts] as [string, ShiftItem[]];
    });
  }

  const sortedYearKeys = [...selectedSpecificKeys].sort();

  return sortedYearKeys.map((yearKey) => {
    const yearShifts = planGuide.filter(
      (step) => step.targetType === "year" && step.targetKey === yearKey,
    );

    return [yearKey, sortShiftsByTime(yearShifts)] as [string, ShiftItem[]];
  });
};
