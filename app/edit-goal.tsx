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
  doesRangeContainAnyValidSelectedDay,
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
  timeframeOptions,
  weekDays,
  weekHeader,
  type ShiftItem,
  type TimeframeType,
} from "../utils/goalPlannerHelpers";

import { validateShiftConflicts } from "../utils/shiftValidation";

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

export default function EditGoalScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const goalId = Array.isArray(id) ? id[0] : id;

  const context = useContext(GoalContext);
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();

  const isVeryNarrowPhone = width < 340;
  const isNarrowPhone = width < 380;
  const isTablet = width >= 768;
  const isLargeTablet = width >= 1024;

  const contentMaxWidth = isLargeTablet ? 1100 : isTablet ? 900 : width;
  const categoryCardWidth = isNarrowPhone ? "100%" : isTablet ? "31.5%" : "48%";

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

  const shiftFormYRef = useRef(0);
  const hasInitializedFormRef = useRef(false);

  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;
  const auth = useContext(AuthContext);
  const hasPremiumAccess = auth?.trialStatus.hasPremiumAccess ?? false;

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

  const [title, setTitle] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

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

  const [selectedShiftImageKey, setSelectedShiftImageKey] = useState<
    string | null
  >(null);
  const [selectedShiftImageUri, setSelectedShiftImageUri] = useState<
    string | null
  >(null);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(
    null,
  );
  const [showCategoryImageModal, setShowCategoryImageModal] = useState(false);
  const [timeframeType, setTimeframeType] = useState<TimeframeType>("day");

  const [stepStartTime, setStepStartTime] = useState(new Date());
  const [stepEndTime, setStepEndTime] = useState(new Date());
  const [showStepStartTime, setShowStepStartTime] = useState(false);
  const [showStepEndTime, setShowStepEndTime] = useState(false);

  const [planGuide, setPlanGuide] = useState<ShiftItem[]>([]);

  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const toastTranslateY = useRef(new Animated.Value(-100)).current;

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [shiftPendingDelete, setShiftPendingDelete] =
    useState<ShiftItem | null>(null);

  if (!context) {
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

  const { goals, updateGoal } = context;
  const currentGoal = goals.find((g) => g.id === goalId);

  const initialGoalSnapshotRef = useRef<string>("");

  useEffect(() => {
    if (!currentGoal) return;

    const initialSnapshot = JSON.stringify({
      title: currentGoal.title ?? "",
      selectedDays: Array.isArray(currentGoal.days)
        ? currentGoal.days
        : String(currentGoal.days ?? "")
            .split(" ")
            .filter(Boolean),
      startDate: new Date(currentGoal.startDate).toISOString(),
      endDate: new Date(
        currentGoal.endDate ?? currentGoal.startDate,
      ).toISOString(),
      planGuide: ((currentGoal.planGuide ?? []) as any[]).map((step) => ({
        title: step.title ?? "",
        explanation: step.explanation ?? "",
        timeframeType: step.timeframeType ?? "day",
        timeframeValue: Number(step.timeframeValue ?? 1),
        startTime: step.startTime,
        endTime: step.endTime,
        plannedDate: step.plannedDate ?? null,
        weekdayLabel: step.weekdayLabel ?? null,
        targetType: step.targetType,
        targetKey: step.targetKey ?? null,
        targetLabel: step.targetLabel ?? null,
        imageKey: step.imageKey ?? null,
        imageUri: step.imageUri ?? null,
      })),
    });

    initialGoalSnapshotRef.current = initialSnapshot;
  }, [currentGoal]);

  const hasUnsavedChanges = useMemo(() => {
    if (!currentGoal) return false;

    const currentSnapshot = JSON.stringify({
      title: title.trim(),
      selectedDays,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      planGuide: planGuide.map((step: any) => ({
        title: step.title ?? "",
        explanation: step.explanation ?? "",
        timeframeType: step.timeframeType ?? "day",
        timeframeValue: Number(step.timeframeValue ?? 1),
        startTime: step.startTime,
        endTime: step.endTime,
        plannedDate: step.plannedDate ?? null,
        weekdayLabel: step.weekdayLabel ?? null,
        targetType: step.targetType,
        targetKey: step.targetKey ?? null,
        targetLabel: step.targetLabel ?? null,
        imageKey: step.imageKey ?? null,
        imageUri: step.imageUri ?? null,
      })),
    });

    return currentSnapshot !== initialGoalSnapshotRef.current;
  }, [currentGoal, title, selectedDays, startDate, endDate, planGuide]);

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

  const showTopToast = useCallback(
    (message: string) => {
      setToastMessage(message);
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

  useEffect(() => {
    if (!currentGoal || hasInitializedFormRef.current) return;

    setTitle(currentGoal.title);

    setSelectedDays(
      Array.isArray(currentGoal.days)
        ? currentGoal.days
        : String(currentGoal.days ?? "")
            .split(" ")
            .filter(Boolean),
    );

    const loadedStartDate = new Date(currentGoal.startDate);
    const loadedEndDate = new Date(
      currentGoal.endDate ?? currentGoal.startDate,
    );

    setStartDate(loadedStartDate);
    setEndDate(loadedEndDate);
    setDisplayedMonth(
      new Date(loadedStartDate.getFullYear(), loadedStartDate.getMonth(), 1),
    );
    setDisplayedYear(loadedStartDate.getFullYear());

    const existingPlanGuide = ((currentGoal.planGuide ?? []) as any[]).map(
      (step) => ({
        id:
          step.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        title: step.title ?? "",
        explanation: step.explanation ?? "",
        resourceLinks: Array.isArray(step.resourceLinks)
          ? step.resourceLinks
          : [],
        timeframeType: (step.timeframeType ?? "day") as TimeframeType,
        timeframeValue: Number(step.timeframeValue ?? 1),
        startTime: step.startTime,
        endTime: step.endTime,
        plannedDate: step.plannedDate,
        weekdayLabel: step.weekdayLabel,
        targetType: (step.targetType ??
          (step.plannedDate ? "date" : "weekday")) as
          | "weekday"
          | "date"
          | "week"
          | "month"
          | "year",
        targetKey: step.targetKey,
        targetLabel: step.targetLabel,
        imageKey: step.imageKey,
        imageUri: step.imageUri,
      }),
    );

    setPlanGuide(existingPlanGuide);

    const firstImageShift = existingPlanGuide.find(
      (step) => step.imageKey || step.imageUri,
    );

    if (firstImageShift?.imageKey) {
      setSelectedShiftImageKey(firstImageShift.imageKey);
      setSelectedShiftImageUri(null);

      const preset = presetGoalImages.find(
        (item) => item.key === firstImageShift.imageKey,
      );
      setSelectedCategoryKey(preset?.category ?? null);
    } else if (firstImageShift?.imageUri) {
      setSelectedShiftImageUri(firstImageShift.imageUri);
      setSelectedShiftImageKey(null);
      setSelectedCategoryKey(null);
    }

    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    setStepStartTime(now);
    setStepEndTime(oneHourLater);

    hasInitializedFormRef.current = true;
  }, [currentGoal]);

  const checkDateSelectable = useCallback(
    (date: Date) =>
      isDateSelectable(date, selectedDays, startDate, endDate, "custom"),
    [selectedDays, startDate, endDate],
  );

  useEffect(() => {
    setSelectedSpecificKeys((prev) =>
      prev.filter((key) => isSpecificKeyStillValid(key)),
    );
  }, [selectedDays, startDate, endDate, timeframeType]);

  const canOpenPlanGuide =
    title.trim() && selectedDays.length > 0 && startDate && endDate;

  const hasAtLeastOneShift = planGuide.length > 0;
  const shouldShowDeselectAll = selectedSpecificKeys.length > 1;

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const getPlanGuideHeading = () => {
    const total = getSelectedScheduleDaysCount(
      selectedDays,
      startDate,
      endDate,
      "custom",
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.length) {
      setSelectedShiftImageUri(result.assets[0].uri);
      setSelectedShiftImageKey(null);
    }
  };

  const choosePresetShiftImage = (key: string) => {
    const selectedPreset = presetGoalImages.find((item) => item.key === key);

    setSelectedShiftImageKey(key);
    setSelectedShiftImageUri(null);
    setSelectedCategoryKey(selectedPreset?.category ?? null);
  };

  const clearSelectedShiftImage = () => {
    setSelectedShiftImageKey(null);
    setSelectedShiftImageUri(null);
    setSelectedCategoryKey(null);
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

  const isSpecificKeyStillValid = (key: string) => {
    if (timeframeType === "day") {
      const date = parseDateKey(key);
      return checkDateSelectable(date);
    }

    if (timeframeType === "week") {
      const [year, month, weekNumber] = key.split("|").map(Number);
      const firstDay = new Date(year, month, 1);
      const firstWeekday = firstDay.getDay();
      const weekStartDay = 1 + (weekNumber - 1) * 7 - firstWeekday;
      const rangeStart = new Date(year, month, weekStartDay);
      const rangeEnd = new Date(year, month, weekStartDay + 6);

      return doesRangeContainAnyValidSelectedDay(
        rangeStart,
        rangeEnd,
        checkDateSelectable,
      );
    }

    if (timeframeType === "month") {
      const [year, month] = key.split("|").map(Number);
      const rangeStart = new Date(year, month, 1);
      const rangeEnd = new Date(year, month + 1, 0);

      return doesRangeContainAnyValidSelectedDay(
        rangeStart,
        rangeEnd,
        checkDateSelectable,
      );
    }

    if (timeframeType === "year") {
      const year = Number(key);
      const rangeStart = new Date(year, 0, 1);
      const rangeEnd = new Date(year, 11, 31);

      return doesRangeContainAnyValidSelectedDay(
        rangeStart,
        rangeEnd,
        checkDateSelectable,
      );
    }

    return false;
  };

  const isSpecificSelected = (key: string) =>
    selectedSpecificKeys.includes(key);

  const toggleSpecificKey = (key: string) => {
    setSelectedSpecificKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
    setShowShiftForm(false);
  };

  const handleDeselectAllSpecificKeys = () => {
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
    if (selectedDays.length === 0) {
      showTopToast("Select at least one day first");
      return;
    }

    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    setEditingShiftId(null);
    setStepStartTime(now);
    setStepEndTime(oneHourLater);
    setShiftTitle("");
    setShiftDescription("");
    clearSelectedShiftImage();
    setShowShiftForm(true);

    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, shiftFormYRef.current - 16),
        animated: true,
      });
    }, 250);
  };

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
      }));
    }

    const isValid = validateShiftConflicts({
      newShifts,
      localGoalStart: new Date(startDate),
      localGoalEnd: new Date(endDate),
      selectedDays,
      routineMode: "custom",
      planGuide: editingShiftId
        ? planGuide.filter((step) => step.id !== editingShiftId)
        : planGuide,
      goals: goals.filter((goal) => goal.id !== goalId),
      title,
      showTopToast,
    });

    if (!isValid) return;

    if (editingShiftId) {
      const existingShift = planGuide.find(
        (step) => step.id === editingShiftId,
      );

      const replacementShift = {
        ...existingShift,
        ...newShifts[0],
        id: editingShiftId,
      };

      setPlanGuide((prev) =>
        prev.map((step) =>
          step.id === editingShiftId ? replacementShift : step,
        ),
      );
    } else {
      setPlanGuide((prev) => [...prev, ...newShifts]);
    }

    setEditingShiftId(null);
    setShiftTitle("");
    setShiftDescription("");
    clearSelectedShiftImage();

    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    setStepStartTime(now);
    setStepEndTime(oneHourLater);
    setShowShiftForm(false);
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

  const handleEditShift = (step: ShiftItem) => {
    setEditingShiftId(step.id);
    setShiftTitle(step.title);
    setShiftDescription((step as any).explanation ?? "");
    setTimeframeType(step.timeframeType);
    setStepStartTime(new Date(step.startTime));
    setStepEndTime(new Date(step.endTime));
    setSelectedShiftImageKey(step.imageKey ?? null);
    setSelectedShiftImageUri(step.imageUri ?? null);

    if (step.imageKey) {
      const preset = presetGoalImages.find(
        (item) => item.key === step.imageKey,
      );
      setSelectedCategoryKey(preset?.category ?? null);
    } else {
      setSelectedCategoryKey(null);
    }

    if (step.targetType === "weekday") {
      setSelectedSpecificKeys([]);
    } else if (step.targetKey) {
      setSelectedSpecificKeys([step.targetKey]);
    } else if (step.plannedDate) {
      setSelectedSpecificKeys([formatDateKey(new Date(step.plannedDate))]);
    } else {
      setSelectedSpecificKeys([]);
    }

    setShowShiftForm(true);

    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, shiftFormYRef.current - 16),
        animated: true,
      });
    }, 250);
  };

  const groupedShifts = useMemo(
    () => getGroupedShifts(selectedSpecificKeys, timeframeType, planGuide),
    [selectedSpecificKeys, timeframeType, planGuide],
  );

  const handleEditWithAI = () => {
    if (!hasPremiumAccess) {
      setShowPremiumModal(true);
      return;
    }

    if (!currentGoal?.createdWithAI || !currentGoal?.aiGoalMemory) {
      showTopToast(
        "This goal was not created with AI. Only AI-created goals can be edited with AI.",
      );
      return;
    }

    router.push({
      pathname: "/(tabs)/ai-bot" as any,
      params: {
        editGoalId: currentGoal.id,
        editMode: "true",
        aiGoalMemory: JSON.stringify(currentGoal.aiGoalMemory),
      },
    });
  };

  const handleUpdateGoal = () => {
    if (!title.trim()) {
      showTopToast("Please enter a goal title");
      return;
    }

    if (selectedDays.length === 0) {
      showTopToast("Please select at least one day");
      return;
    }

    if (endDate < startDate) {
      showTopToast("End date cannot be before start date");
      return;
    }

    const total = getSelectedScheduleDaysCount(
      selectedDays,
      startDate,
      endDate,
      "custom",
    );

    if (total === 0) {
      showTopToast("No selected weekdays fall within this date range");
      return;
    }

    if (!planGuide.length) {
      showTopToast("Please add at least one time shift before updating");
      return;
    }
    const isPlanValid = validateShiftConflicts({
      newShifts: planGuide,
      localGoalStart: new Date(startDate),
      localGoalEnd: new Date(endDate),
      selectedDays,
      routineMode: "custom",
      planGuide,
      goals: goals.filter((goal) => goal.id !== goalId),
      title,
      showTopToast,
    });

    if (!isPlanValid) return;
    const updatedGoal: any = {
      ...currentGoal,
      id: goalId!,
      title: title.trim(),
      type: "daily",
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      startTime: planGuide[0]?.startTime,
      endTime: planGuide[0]?.endTime,
      days: selectedDays.join(" "),
      progress: currentGoal?.progress ?? 0,
      status: currentGoal?.status ?? "Upcoming",
      planGuide,

      createdWithAI: currentGoal?.createdWithAI ?? false,
      aiGoalMemory: currentGoal?.aiGoalMemory ?? null,
      aiLastEditedAt: currentGoal?.aiLastEditedAt ?? null,
    };

    updateGoal(updatedGoal);

    initialGoalSnapshotRef.current = JSON.stringify({
      title: title.trim(),
      selectedDays,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      planGuide: planGuide.map((step: any) => ({
        title: step.title ?? "",
        explanation: step.explanation ?? "",
        timeframeType: step.timeframeType ?? "day",
        timeframeValue: Number(step.timeframeValue ?? 1),
        startTime: step.startTime,
        endTime: step.endTime,
        plannedDate: step.plannedDate ?? null,
        weekdayLabel: step.weekdayLabel ?? null,
        targetType: step.targetType,
        targetKey: step.targetKey ?? null,
        targetLabel: step.targetLabel ?? null,
        imageKey: step.imageKey ?? null,
        imageUri: step.imageUri ?? null,
      })),
    });

    router.back();
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
      {showPremiumModal && (
        <Modal transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.7)",
              justifyContent: "flex-start",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingTop: Math.max(insets.top + 70, 95),
              paddingBottom: Math.max(insets.bottom + 30, 60),
            }}
          >
            <ScrollView
              style={{ width: "100%" }}
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "flex-start",
              }}
              showsVerticalScrollIndicator={false}
            >
              {" "}
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
                  AI Editing is Premium 💎
                </Text>

                <Text
                  style={{
                    color: UI.muted,
                    fontSize: 14,
                    lineHeight: 22,
                    marginBottom: 18,
                  }}
                >
                  Edit with AI helps you improve your goal structure, rebuild
                  time shifts, and adjust your routine with less manual work.
                </Text>

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
            </ScrollView>
          </View>
        </Modal>
      )}

      {showToast && (
        <Animated.View
          style={{
            position: "absolute",
            top: Math.max(insets.top + 12, 42),
            left: 16,
            right: 16,
            zIndex: 999,
            transform: [{ translateY: toastTranslateY }],
            backgroundColor: "#ef4444",
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

      <Modal
        visible={showCategoryImageModal}
        animationType="fade"
        transparent
        onRequestClose={closeCategoryImagePicker}
      >
        <Pressable
          onPress={closeCategoryImagePicker}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.75)",
            justifyContent: "center",
            paddingHorizontal: 18,
          }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: UI.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: UI.border,
              padding: 16,
              maxHeight: "72%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <Text
                style={{
                  color: UI.text,
                  fontSize: 18,
                  fontWeight: "800",
                }}
              >
                Select Image
              </Text>

              <TouchableOpacity onPress={closeCategoryImagePicker}>
                <Text
                  style={{
                    color: UI.muted,
                    fontSize: 15,
                    fontWeight: "700",
                  }}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedCategoryImages.map((item) => {
                const selected = selectedShiftImageKey === item.key;

                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => {
                      choosePresetShiftImage(item.key);
                      closeCategoryImagePicker();
                    }}
                    style={{
                      width: 132,
                      marginRight: 12,
                    }}
                  >
                    <View
                      style={{
                        borderRadius: 16,
                        overflow: "hidden",
                        borderWidth: 2,
                        borderColor: selected ? UI.primary : UI.border,
                        backgroundColor: UI.innerCard,
                      }}
                    >
                      <Image
                        source={item.image}
                        style={{ width: "100%", height: 132 }}
                        resizeMode="cover"
                      />
                    </View>

                    <Text
                      style={{
                        color: selected ? UI.primary : UI.text,
                        marginTop: 8,
                        fontWeight: "700",
                        textAlign: "center",
                      }}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
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
                      fontWeight: "800",
                      letterSpacing: 0.3,
                    }}
                  >
                    Edit Goal
                  </Text>
                  <Text
                    style={{
                      color: UI.muted,
                      marginTop: 4,
                      fontSize: 13,
                    }}
                  >
                    Update your routine, shifts and image
                  </Text>

                  <TouchableOpacity
                    onPress={handleEditWithAI}
                    style={{
                      marginTop: 12,
                      backgroundColor:
                        currentGoal?.createdWithAI && hasPremiumAccess
                          ? UI.primary
                          : UI.innerCard,
                      borderWidth: 1,
                      borderColor:
                        currentGoal?.createdWithAI && hasPremiumAccess
                          ? UI.primary
                          : UI.border,
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderRadius: 14,
                      alignSelf: "flex-start",
                    }}
                  >
                    <Text
                      style={{
                        color: UI.text,
                        fontWeight: "800",
                        fontSize: 13,
                      }}
                    >
                      Edit with AI{" "}
                      {!hasPremiumAccess
                        ? "🔒"
                        : currentGoal?.createdWithAI
                          ? "✨"
                          : "Unavailable"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View
              style={{
                backgroundColor: UI.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: UI.border,
                padding: cardPadding,
                marginBottom: 18,
              }}
            >
              <Text
                style={{
                  color: UI.muted,
                  fontSize: 12,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 10,
                }}
              >
                Goal Title
              </Text>

              <TextInput
                placeholder="Enter your goal title..."
                placeholderTextColor={UI.muted}
                value={title}
                onChangeText={setTitle}
                style={{
                  backgroundColor: UI.innerCard,
                  borderWidth: 1,
                  borderColor: UI.border,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  borderRadius: 14,
                  color: UI.text,
                  fontSize: 16,
                  fontWeight: "600",
                }}
              />
            </View>

            <View
              style={{
                backgroundColor: UI.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: UI.border,
                padding: cardPadding,
                marginBottom: 18,
              }}
            ></View>

            <Text
              style={{
                color: UI.muted,
                fontSize: 12,
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: 0.8,
                marginBottom: 10,
              }}
            >
              Select Days
            </Text>

            <View
              style={{
                backgroundColor: UI.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: UI.border,
                padding: cardPadding,
                marginBottom: 18,
              }}
            >
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {weekDays.map((day) => {
                  const selected = selectedDays.includes(day);

                  return (
                    <TouchableOpacity
                      key={day}
                      onPress={() => toggleDay(day)}
                      style={{
                        width: 45,
                        height: 45,
                        borderRadius: 25,
                        backgroundColor: selected ? UI.primary : UI.innerCard,
                        borderWidth: 1,
                        borderColor: selected ? UI.primary : UI.border,
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 8,
                        marginBottom: 10,
                      }}
                    >
                      <Text style={{ color: UI.text }}>{day}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View
              style={{
                backgroundColor: UI.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: UI.border,
                padding: cardPadding,
                marginBottom: 18,
              }}
            >
              <Text
                style={{
                  color: UI.muted,
                  fontSize: 12,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 10,
                }}
              >
                Start Date
              </Text>

              <TouchableOpacity
                onPress={() => setShowStartDate(true)}
                style={{
                  backgroundColor: UI.innerCard,
                  borderWidth: 1,
                  borderColor: UI.border,
                  borderRadius: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 14,
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: UI.text, fontWeight: "600" }}>
                  {startDate.toDateString()}
                </Text>
              </TouchableOpacity>

              <Text
                style={{
                  color: UI.muted,
                  fontSize: 12,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 10,
                }}
              >
                End Date
              </Text>

              <TouchableOpacity
                onPress={() => setShowEndDate(true)}
                style={{
                  backgroundColor: UI.innerCard,
                  borderWidth: 1,
                  borderColor: UI.border,
                  borderRadius: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 14,
                }}
              >
                <Text style={{ color: UI.text, fontWeight: "600" }}>
                  {endDate.toDateString()}
                </Text>
              </TouchableOpacity>
            </View>

            {showStartDate && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={(_, date) => {
                  setShowStartDate(false);

                  if (date) {
                    setStartDate(date);

                    if (date > endDate) {
                      setEndDate(date);
                    }
                  }
                }}
              />
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
                  }
                }}
              />
            )}

            {canOpenPlanGuide && (
              <>
                <Text
                  style={{
                    color: UI.text,
                    marginTop: 6,
                    marginBottom: 12,
                    fontSize: 18,
                    fontWeight: "bold",
                  }}
                >
                  {getPlanGuideHeading()}
                </Text>

                <Text
                  style={{
                    color: UI.muted,
                    fontSize: 12,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    marginBottom: 10,
                  }}
                >
                  Timeframe Type
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    marginBottom: shouldShowDeselectAll ? 10 : 15,
                    backgroundColor: UI.card,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: UI.border,
                    padding: 12,
                  }}
                >
                  {timeframeOptions.map((option) => {
                    const selected = timeframeType === option;

                    return (
                      <TouchableOpacity
                        key={option}
                        onPress={() => {
                          setTimeframeType(option);
                          setSelectedSpecificKeys([]);
                          setShowShiftForm(false);
                        }}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 14,
                          borderRadius: 20,
                          backgroundColor: selected ? UI.primary : UI.innerCard,
                          borderWidth: 1,
                          borderColor: selected ? UI.primary : UI.border,
                          marginRight: 8,
                          marginBottom: 8,
                        }}
                      >
                        <Text
                          style={{
                            color: UI.text,
                            textTransform: "capitalize",
                          }}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {shouldShowDeselectAll && (
                  <View
                    style={{
                      marginBottom: 15,
                      backgroundColor: UI.card,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: UI.border,
                      padding: 12,
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
                        Deselect All
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View
                  style={{
                    backgroundColor: UI.card,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: UI.border,
                    padding: 12,
                    marginBottom: 10,
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
                    <TouchableOpacity onPress={goToPrevious}>
                      <Text style={{ color: UI.primary, fontSize: 18 }}>◀</Text>
                    </TouchableOpacity>

                    <Text
                      style={{
                        color: UI.text,
                        fontSize: 16,
                        fontWeight: "bold",
                      }}
                    >
                      {getPlannerHeader()}
                    </Text>

                    <TouchableOpacity onPress={goToNext}>
                      <Text style={{ color: UI.primary, fontSize: 18 }}>▶</Text>
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

                      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
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
                          const selected = isSpecificSelected(key);

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
                                      : UI.screen,
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
                        const selected = isSpecificSelected(item.key);

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
                                    : UI.screen,
                                paddingVertical: 18,
                                alignItems: "center",
                                opacity: item.active ? 1 : 0.35,
                              }}
                            >
                              <Text
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
                        const selected = isSpecificSelected(item.key);

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
                                    : UI.screen,
                                paddingVertical: 18,
                                alignItems: "center",
                                opacity: item.active ? 1 : 0.35,
                              }}
                            >
                              <Text
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
                        const selected = isSpecificSelected(item.key);

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
                                    : UI.screen,
                                paddingVertical: 18,
                                alignItems: "center",
                                opacity: item.active ? 1 : 0.35,
                              }}
                            >
                              <Text
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
              </>
            )}

            <Text
              style={{
                color: UI.text,
                marginTop: 25,
                fontSize: 18,
                fontWeight: "bold",
              }}
            >
              Time Shifts
            </Text>

            {!canOpenPlanGuide ? (
              <Text style={{ color: UI.muted, marginTop: 8 }}>
                Fill title and dates first before editing your shifts.
              </Text>
            ) : (
              <>
                {(showShiftForm || selectedSpecificKeys.length === 0) && (
                  <View
                    onLayout={(event) => {
                      shiftFormYRef.current = event.nativeEvent.layout.y;
                    }}
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
                      placeholderTextColor={UI.muted}
                      value={shiftTitle}
                      onChangeText={setShiftTitle}
                      onFocus={() => {
                        setTimeout(() => {
                          scrollRef.current?.scrollTo({
                            y: Math.max(0, shiftFormYRef.current - 16),
                            animated: true,
                          });
                        }, 250);
                      }}
                      style={{
                        borderWidth: 1,
                        borderColor: UI.border,
                        backgroundColor: UI.innerCard,
                        padding: 12,
                        borderRadius: 12,
                        marginBottom: 15,
                        color: UI.text,
                      }}
                    />

                    <TextInput
                      placeholder="Shift description..."
                      placeholderTextColor={UI.muted}
                      value={shiftDescription}
                      onChangeText={setShiftDescription}
                      multiline
                      style={{
                        borderWidth: 1,
                        borderColor: UI.border,
                        backgroundColor: UI.innerCard,
                        padding: 12,
                        borderRadius: 12,
                        marginBottom: 15,
                        color: UI.text,
                        fontSize: 14,
                        lineHeight: 20,
                        minHeight: 88,
                        textAlignVertical: "top",
                      }}
                    />

                    <Text style={{ color: UI.muted, marginBottom: 6 }}>
                      {getShiftTargetSummary()}
                    </Text>

                    {shouldShowMoreLess() && (
                      <TouchableOpacity
                        onPress={() =>
                          setShowAllSelectedTargets(!showAllSelectedTargets)
                        }
                      >
                        <Text style={{ color: UI.primary, marginBottom: 10 }}>
                          {showAllSelectedTargets ? "Show less" : "Show more"}
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
                        marginTop: 8,
                        marginBottom: 12,
                      }}
                    >
                      Select Shift Image
                    </Text>

                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                        marginBottom: 14,
                      }}
                    >
                      {imageCategories.map((category) => {
                        const preview = getPreviewImageByKey(
                          category.previewKey,
                        );

                        return (
                          <TouchableOpacity
                            key={category.key}
                            onPress={() =>
                              openCategoryImagePicker(category.key)
                            }
                            style={{
                              width: categoryCardWidth,
                              backgroundColor: UI.innerCard,
                              borderRadius: 16,
                              overflow: "hidden",
                              marginBottom: 12,
                              borderColor:
                                selectedCategoryKey === category.key
                                  ? UI.primary
                                  : UI.border,
                              borderWidth:
                                selectedCategoryKey === category.key ? 2 : 1,
                            }}
                          >
                            {preview && (
                              <Image
                                source={preview.image}
                                style={{ width: "100%", height: 110 }}
                                resizeMode="cover"
                              />
                            )}

                            <View style={{ padding: 10 }}>
                              <View
                                style={{
                                  flexDirection: "row",
                                  justifyContent: "space-between",
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
                                  {category.label}
                                </Text>

                                {selectedCategoryKey === category.key && (
                                  <Text
                                    style={{
                                      color: UI.primary,
                                      fontSize: 11,
                                      fontWeight: "800",
                                    }}
                                  >
                                    ACTIVE
                                  </Text>
                                )}
                              </View>

                              <Text
                                style={{
                                  color: UI.muted,
                                  fontSize: 12,
                                  marginTop: 2,
                                }}
                              >
                                Tap to choose
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <TouchableOpacity
                      onPress={pickCustomShiftImage}
                      style={{
                        backgroundColor: UI.primary,
                        paddingVertical: 12,
                        borderRadius: 10,
                        marginBottom: 20,
                      }}
                    >
                      <Text
                        style={{
                          color: UI.text,
                          textAlign: "center",
                          fontWeight: "700",
                        }}
                      >
                        Import From Gallery
                      </Text>
                    </TouchableOpacity>

                    {(selectedShiftImageKey || selectedShiftImageUri) && (
                      <TouchableOpacity
                        onPress={clearSelectedShiftImage}
                        style={{
                          backgroundColor: "#dc2626",
                          paddingVertical: 12,
                          borderRadius: 10,
                          marginBottom: 14,
                        }}
                      >
                        <Text
                          style={{
                            color: UI.text,
                            textAlign: "center",
                            fontWeight: "700",
                          }}
                        >
                          Remove Selected Shift Image
                        </Text>
                      </TouchableOpacity>
                    )}

                    <Text style={{ color: UI.text, marginTop: 5 }}>
                      Shift Start Time
                    </Text>

                    <TouchableOpacity
                      onPress={() => setShowStepStartTime(true)}
                      style={{
                        backgroundColor: UI.innerCard,
                        borderWidth: 1,
                        borderColor: UI.border,
                        paddingVertical: 14,
                        paddingHorizontal: 14,
                        borderRadius: 12,
                        marginTop: 8,
                      }}
                    >
                      <Text style={{ color: UI.text, fontWeight: "600" }}>
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
                          if (date) setStepStartTime(date);
                        }}
                      />
                    )}

                    <Text style={{ color: UI.text, marginTop: 15 }}>
                      Shift End Time
                    </Text>

                    <TouchableOpacity
                      onPress={() => setShowStepEndTime(true)}
                      style={{
                        backgroundColor: UI.innerCard,
                        borderWidth: 1,
                        borderColor: UI.border,
                        paddingVertical: 14,
                        paddingHorizontal: 14,
                        borderRadius: 12,
                        marginTop: 8,
                      }}
                    >
                      <Text style={{ color: UI.text, fontWeight: "600" }}>
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
                        display="default"
                        onChange={(_, date) => {
                          setShowStepEndTime(false);
                          if (date) setStepEndTime(date);
                        }}
                      />
                    )}

                    <TouchableOpacity
                      onPress={handleAddShift}
                      style={{
                        backgroundColor: "#8e44ad",
                        marginTop: 18,
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
                        {editingShiftId ? "Update Shift" : "Add Shift"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {hasAtLeastOneShift && (
                  <View style={{ marginTop: 20 }}>
                    {groupedShifts.map(([groupKey, shifts]) => {
                      if (shifts.length === 0) return null;

                      return (
                        <View
                          key={groupKey}
                          style={{
                            marginBottom: 16,
                            backgroundColor: UI.card,
                            padding: 14,
                            borderRadius: 18,
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
                                : shifts[0]?.targetLabel || groupKey}
                          </Text>

                          {shifts.map((step, index) => (
                            <View
                              key={step.id}
                              style={{
                                marginBottom: 12,
                                paddingBottom: 12,
                                borderBottomWidth:
                                  index === shifts.length - 1 ? 0 : 1,
                                borderBottomColor: UI.border,
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
                                style={{ color: UI.muted, marginBottom: 10 }}
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
                                        : getPreviewImageByKey(step.imageKey!)
                                            ?.image
                                    }
                                    style={{ width: "100%", height: 140 }}
                                    resizeMode="cover"
                                  />
                                </View>
                              )}

                              {!!(step as any).explanation && (
                                <Text
                                  style={{
                                    color: UI.muted,
                                    fontSize: 13,
                                    lineHeight: 19,
                                    marginBottom: 12,
                                  }}
                                >
                                  {(step as any).explanation}
                                </Text>
                              )}

                              <View
                                style={{
                                  flexDirection: isVeryNarrowPhone
                                    ? "column"
                                    : "row",
                                  gap: 8,
                                }}
                              >
                                <TouchableOpacity
                                  onPress={() => handleEditShift(step)}
                                  style={{
                                    flex: 1,
                                    backgroundColor: UI.primary,
                                    paddingVertical: 10,
                                    borderRadius: 8,
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: UI.text,
                                      textAlign: "center",
                                      fontWeight: "700",
                                    }}
                                  >
                                    Edit Shift
                                  </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  onPress={() => requestDeleteShift(step)}
                                  style={{
                                    flex: 1,
                                    backgroundColor: "#e74c3c",
                                    paddingVertical: 10,
                                    borderRadius: 8,
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: UI.text,
                                      textAlign: "center",
                                      fontWeight: "700",
                                    }}
                                  >
                                    Delete Shift
                                  </Text>
                                </TouchableOpacity>
                              </View>
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
                      backgroundColor: UI.primary,
                      marginTop: 14,
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
                      {`Add Time Shift For Selected ${timeframeType}(s)`}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            <TouchableOpacity
              onPress={handleUpdateGoal}
              disabled={!hasAtLeastOneShift}
              style={{
                backgroundColor: hasAtLeastOneShift ? "#16a085" : "#555",
                marginTop: 25,
                paddingVertical: 14,
                borderRadius: 10,
                opacity: hasAtLeastOneShift ? 1 : 0.7,
              }}
            >
              <Text
                style={{
                  color: UI.text,
                  textAlign: "center",
                  fontWeight: "700",
                }}
              >
                {hasAtLeastOneShift ? "Update Goal" : "Add a Time Shift First"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
