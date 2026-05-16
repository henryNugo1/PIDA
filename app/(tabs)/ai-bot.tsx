import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../../context/AuthContext";
import { useCredits } from "../../context/CreditContext";
import { GoalContext } from "../../context/GoalContext";
import { ThemeContext } from "../../context/ThemeContext";

type PlanCategory =
  | "workout"
  | "cooking"
  | "study"
  | "sleep"
  | "meditation"
  | "money";

type AIPlanItem = {
  title: string;
  weekdayLabel?: string;
  startTime: string;
  endTime: string;
  explanation?: string;
  imageKey?: string;
  imageSource?: any;
  imageUri?: string | null;
  imageThumbUri?: string | null;
  imageAuthor?: string | null;
  imageAuthorUrl?: string | null;
  imageUnsplashUrl?: string | null;
  imageSearchQuery?: string;
  category?: PlanCategory;

  timeframeType?: "day" | "week" | "month" | "year" | string;
  timeframeValue?: number;
  targetType?: "weekday" | "date" | "week" | "month" | "year" | string;
  targetKey?: string;
  targetLabel?: string;
  plannedDate?: string;
  phaseLabel?: string;
  difficultyLevel?: "basic" | "intermediate" | "advanced" | string;
  resourceLinks?: { title: string; url: string }[];
};

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
  hidden?: boolean;
};

type CoachStage = "goal_input" | "chat" | "summary" | "plan_result";

export default function AIBotScreen() {
  const params = useLocalSearchParams<{
    resetAI?: string;
    editMode?: string;
    editGoalId?: string;
    aiGoalMemory?: string;
  }>();

  const themeContext = useContext(ThemeContext);
  const goalContext = useContext(GoalContext);
  const existingGoals = goalContext?.goals ?? [];
  const updateGoal = goalContext?.updateGoal;
  const editGoalId = Array.isArray(params.editGoalId)
    ? params.editGoalId[0]
    : params.editGoalId;

  const goalBeingEdited = existingGoals.find((g) => g.id === editGoalId);
  const theme = themeContext?.theme;
  const auth = useContext(AuthContext);
  const userPlan = auth?.profile?.plan ?? "free";
  const hasPremiumAccess = auth?.trialStatus.hasPremiumAccess ?? false;
  const effectiveAIPlan =
    userPlan === "premium" ? "premium" : hasPremiumAccess ? "trial" : "free";

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

  //const BASE_URL = "http://192.168.101.22:3000";
  const BASE_URL = "http://10.34.119.209:3000";
  const scrollRef = useRef<ScrollView>(null);
  const chatScrollRef = useRef<ScrollView>(null);

  const imagePools: Record<PlanCategory, { key: string; source: any }[]> = {
    workout: [
      {
        key: "workout-1",
        source: require("../../assets/images/Workout/cagin-kargi-Qzp60FT380E-unsplash.jpg"),
      },
      {
        key: "workout-2",
        source: require("../../assets/images/Workout/gordon-cowie-ISg1JhN_vFk-unsplash.jpg"),
      },
      {
        key: "workout-3",
        source: require("../../assets/images/Workout/jonathan-borba-lrQPTQs7nQQ-unsplash.jpg"),
      },
      {
        key: "workout-4",
        source: require("../../assets/images/Workout/kike-vega-F2qh3yjz6Jk-unsplash.jpg"),
      },
      {
        key: "workout-5",
        source: require("../../assets/images/Workout/logan-weaver-lgnwvr-amgv9YUg-MA-unsplash.jpg"),
      },
    ],
    cooking: [
      {
        key: "cooking-1",
        source: require("../../assets/images/Cooking/ahmadreza-rezaie-9x6QkgB722w-unsplash.jpg"),
      },
      {
        key: "cooking-2",
        source: require("../../assets/images/Cooking/joseph-gonzalez-zcUgjyqEwe8-unsplash.jpg"),
      },
      {
        key: "cooking-3",
        source: require("../../assets/images/Cooking/myles-tan-IWCljYv1TJw-unsplash.jpg"),
      },
      {
        key: "cooking-4",
        source: require("../../assets/images/Cooking/tim-zankert-ZWweujwrLEM-unsplash.jpg"),
      },
      {
        key: "cooking-5",
        source: require("../../assets/images/Cooking/the-design-lady-Z9QhA1aGXck-unsplash.jpg"),
      },
    ],
    study: [
      {
        key: "study-1",
        source: require("../../assets/images/Studying/christin-hume-k2Kcwkandwg-unsplash.jpg"),
      },
      {
        key: "study-2",
        source: require("../../assets/images/Studying/joel-muniz-XqXJJhK-c08-unsplash (1).jpg"),
      },
      {
        key: "study-3",
        source: require("../../assets/images/Studying/ioann-mark-kuznietsov-P6uqpNyXcI4-unsplash.jpg"),
      },
      {
        key: "study-4",
        source: require("../../assets/images/Studying/jessica-ruscello-OQSCtabGkSY-unsplash.jpg"),
      },
      {
        key: "study-5",
        source: require("../../assets/images/Studying/matias-north-v8DSLoY80Xk-unsplash.jpg"),
      },
    ],
    sleep: [
      {
        key: "sleep-1",
        source: require("../../assets/images/Sleeping/alexander-possingham-CeWNEEsHPbA-unsplash.jpg"),
      },
      {
        key: "sleep-2",
        source: require("../../assets/images/Sleeping/charlesdeluvio-S2AcayPkszE-unsplash.jpg"),
      },
      {
        key: "sleep-3",
        source: require("../../assets/images/Sleeping/phil-desforges-m4bcgrz4jn0-unsplash.jpg"),
      },
      {
        key: "sleep-4",
        source: require("../../assets/images/Sleeping/becca-schultz-l6BenhrIc2w-unsplash.jpg"),
      },
      {
        key: "sleep-5",
        source: require("../../assets/images/Sleeping/nathan-waters-zukdSYdFB_A-unsplash.jpg"),
      },
    ],
    meditation: [
      {
        key: "meditation-1",
        source: require("../../assets/images/Meditation/jared-rice-NTyBbu66_SI-unsplash.jpg"),
      },
      {
        key: "meditation-2",
        source: require("../../assets/images/Meditation/colton-sturgeon-6KkYYqTEDwQ-unsplash.jpg"),
      },
      {
        key: "meditation-3",
        source: require("../../assets/images/Meditation/chelsea-gates-n8L1VYaypcw-unsplash.jpg"),
      },
      {
        key: "meditation-4",
        source: require("../../assets/images/Meditation/levi-xu-dOhJtfXJZfw-unsplash.jpg"),
      },
      {
        key: "meditation-5",
        source: require("../../assets/images/Meditation/ethan-rougon-zWIWNeEg4Uo-unsplash.jpg"),
      },
    ],
    money: [
      {
        key: "money-1",
        source: require("../../assets/images/Money/adam-nir-wTO6MWpMrJk-unsplash.jpg"),
      },
      {
        key: "money-2",
        source: require("../../assets/images/Money/alexander-grey-8lnbXtxFGZw-unsplash.jpg"),
      },
      {
        key: "money-3",
        source: require("../../assets/images/Money/art-rachen-yJpjLD3c9bU-unsplash.jpg"),
      },
      {
        key: "money-4",
        source: require("../../assets/images/Money/brano-heYdDdq0cbE-unsplash.jpg"),
      },
      {
        key: "money-5",
        source: require("../../assets/images/Money/elena-mozhvilo-nhYK4qIv9Pg-unsplash.jpg"),
      },
    ],
  };

  const inferCategoryFromText = (title: string): PlanCategory => {
    const text = title.toLowerCase();

    if (
      text.includes("gym") ||
      text.includes("strength") ||
      text.includes("upper body") ||
      text.includes("lower body") ||
      text.includes("full body") ||
      text.includes("training") ||
      text.includes("workout") ||
      text.includes("bulk") ||
      text.includes("muscle")
    ) {
      return "workout";
    }

    if (
      text.includes("meal") ||
      text.includes("cook") ||
      text.includes("grocery") ||
      text.includes("protein") ||
      text.includes("dinner") ||
      text.includes("food")
    ) {
      return "cooking";
    }

    if (
      text.includes("study") ||
      text.includes("learn") ||
      text.includes("reading") ||
      text.includes("practice") ||
      text.includes("school") ||
      text.includes("exam") ||
      text.includes("jamb") ||
      text.includes("cbt")
    ) {
      return "study";
    }

    if (
      text.includes("sleep") ||
      text.includes("rest") ||
      text.includes("recovery")
    ) {
      return "sleep";
    }

    if (
      text.includes("meditate") ||
      text.includes("mindfulness") ||
      text.includes("breathing") ||
      text.includes("calm")
    ) {
      return "meditation";
    }

    if (
      text.includes("money") ||
      text.includes("budget") ||
      text.includes("finance") ||
      text.includes("income") ||
      text.includes("sales") ||
      text.includes("business") ||
      text.includes("startup") ||
      text.includes("brand") ||
      text.includes("real estate")
    ) {
      return "money";
    }

    return "workout";
  };

  const getRandomPoolItem = <T,>(items: T[]) => {
    return items[Math.floor(Math.random() * items.length)];
  };

  const buildCreativeGoalTitle = (rawGoal: string, items: AIPlanItem[]) => {
    const clean = rawGoal
      .replace(/^i want to\s+/i, "")
      .replace(/^i need to\s+/i, "")
      .replace(/^help me\s+/i, "")
      .trim();

    const words = clean.split(" ").filter(Boolean);

    if (words.length === 0) {
      return "New Goal Plan";
    }

    if (words.length === 1) {
      const single = words[0].toLowerCase();
      return `${single.charAt(0).toUpperCase()}${single.slice(1)} Plan`;
    }

    return clean
      .split(" ")
      .slice(0, 5)
      .join(" ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatScheduleTimeForAI = (timeValue: any) => {
    if (!timeValue) return "";

    const raw = String(timeValue);

    if (/^\d{2}:\d{2}$/.test(raw)) {
      return raw;
    }

    const date = new Date(raw);

    if (!Number.isNaN(date.getTime())) {
      return `${String(date.getHours()).padStart(2, "0")}:${String(
        date.getMinutes(),
      ).padStart(2, "0")}`;
    }

    return raw.slice(0, 5);
  };

  const buildExistingScheduleSummary = () => {
    return existingGoals.map((goal) => ({
      goalId: goal.id,
      goalTitle: goal.title,
      startDate: goal.startDate,
      endDate: goal.endDate,
      days: goal.days,
      shifts: (goal.planGuide ?? []).map((shift: any) => ({
        title: shift.title,
        startTime: formatScheduleTimeForAI(shift.startTime),
        endTime: formatScheduleTimeForAI(shift.endTime),
        weekdayLabel: shift.weekdayLabel,
        targetType: shift.targetType,
        targetKey: shift.targetKey,
        targetLabel: shift.targetLabel,
        plannedDate: shift.plannedDate,
        timeframeType: shift.timeframeType,
      })),
    }));
  };

  const getPlanTargetText = (item: AIPlanItem) => {
    if (item.targetType === "date" && item.plannedDate) {
      return item.plannedDate;
    }

    if (item.targetType === "week" && item.targetLabel) {
      return item.targetLabel;
    }

    if (item.targetType === "month" && item.targetLabel) {
      return item.targetLabel;
    }

    if (item.targetType === "year" && item.targetLabel) {
      return item.targetLabel;
    }

    if (item.weekdayLabel) {
      return item.weekdayLabel;
    }

    return "Planned";
  };

  const [goal, setGoal] = useState("");
  const [stage, setStage] = useState<CoachStage>("goal_input");
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [result, setResult] = useState<AIPlanItem[]>([]);
  const [goalMeta, setGoalMeta] = useState<any>(null);
  const [planSummary, setPlanSummary] = useState<{
    summaryTitle: string;
    summaryText: string;
    shiftPreview: { title: string; description: string }[];
  } | null>(null);
  const [includeImages, setIncludeImages] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [editConversationCount, setEditConversationCount] = useState(0);
  const [canGenerateEditedPlan, setCanGenerateEditedPlan] = useState(false);
  const [showQuickEdits, setShowQuickEdits] = useState(false);
  const { credits, syncCredits } = useCredits();

  const CREDIT_COST = {
    START_GOAL: 1,
    CHAT: 1,
    SUMMARY: 2,
    PLAN: 5,
    EDIT_CHAT: 1,
    EDIT_PLAN: 3,
  };

  const userId =
    (auth as any)?.user?.id ??
    (auth as any)?.session?.user?.id ??
    (auth as any)?.profile?.id;

  const getAIHeaders = () => ({
    "Content-Type": "application/json",
    "x-user-id": String(userId ?? ""),
    "x-user-plan": effectiveAIPlan,
  });

  const blockIfNoCredits = (cost: number) => {
    if (!userId) {
      console.log("AI CREDIT ERROR: Missing user id");
      return true;
    }

    if (effectiveAIPlan === "free") {
      setShowPremiumModal(true);
      return true;
    }

    if (credits === null) {
      return true;
    }

    if (credits < cost) {
      setShowPremiumModal(true);
      return true;
    }

    return false;
  };

  const syncCreditsFromResponse = (data: any) => {
    syncCredits(data?.remainingCredits ?? data?.creditsLeft);
  };

  useFocusEffect(
    useCallback(() => {
      const loadCredits = async () => {
        if (!userId) return;

        try {
          const res = await fetch(`${BASE_URL}/credits/status`, {
            method: "GET",
            headers: getAIHeaders(),
          });

          const data = await res.json();
          syncCreditsFromResponse(data);

          const remaining = Number(data?.remainingCredits);

          if (res.ok && Number.isFinite(remaining)) {
            setShowPremiumModal(remaining <= 0);
          }
        } catch (error) {
          console.log("LOAD CREDITS ERROR:", error);
        }
      };

      loadCredits();
    }, [userId, effectiveAIPlan]),
  );

  const hasAIProgress =
    goal.trim().length > 0 ||
    chatMessages.length > 0 ||
    chatInput.trim().length > 0 ||
    result.length > 0;

  const requestCancelAI = () => {
    if (!hasAIProgress) {
      resetAIBot();
      return;
    }

    setShowLeaveModal(true);
  };

  const resetAIBot = () => {
    setGoal("");
    setChatMessages([]);
    setChatInput("");
    setResult([]);
    setGoalMeta(null);
    setPlanSummary(null);
    setStage("goal_input");
    setLoading(false);
    setIncludeImages(true);
    setIsEditMode(false);

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
  };

  useEffect(() => {
    if (params.resetAI) {
      resetAIBot();
    }
  }, [params.resetAI]);

  useEffect(() => {
    if (
      params.editMode !== "true" ||
      !params.aiGoalMemory ||
      !goalBeingEdited
    ) {
      return;
    }

    try {
      const memory = JSON.parse(String(params.aiGoalMemory));

      const previousMessages = Array.isArray(memory?.chatMessages)
        ? memory.chatMessages
        : [];

      setGoal(memory?.originalGoal ?? goalBeingEdited.title);
      setChatMessages([
        ...previousMessages,
        {
          role: "assistant",
          content:
            "I remember this AI-created goal. Before I rebuild it, tell me what feels wrong, difficult, or what you want improved.",
        },
      ]);

      setResult((goalBeingEdited.planGuide ?? []) as any);
      setGoalMeta({
        goalTitle: goalBeingEdited.title,
        goalStartDate: goalBeingEdited.startDate,
        goalEndDate: goalBeingEdited.endDate,
      });

      setIsEditMode(true);
      setStage("chat");
      setCanGenerateEditedPlan(false);
      setEditConversationCount(0);
      setShowQuickEdits(true);
    } catch (error) {
      console.log("Failed to load AI edit memory:", error);
    }
  }, [params.editMode, params.aiGoalMemory, goalBeingEdited?.id]);

  const scrollToBottom = (animated = true) => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated });
    }, 120);
  };

  const scrollChatToBottom = (animated = true) => {
    requestAnimationFrame(() => {
      chatScrollRef.current?.scrollToEnd({ animated });
    });

    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated });
      scrollRef.current?.scrollToEnd({ animated });
    }, 160);
  };

  useEffect(() => {
    if (stage === "chat") {
      scrollChatToBottom(true);
    }
  }, [chatMessages.length, stage, loading]);

  const normalizePlanItems = (data: any[]): AIPlanItem[] => {
    return data.map((item: any) => {
      const category = inferCategoryFromText(String(item.title ?? ""));
      const hasRemoteImage =
        typeof item.imageUri === "string" && item.imageUri.trim().length > 0;

      const randomImage = getRandomPoolItem(imagePools[category]);

      return {
        title: String(item.title ?? "AI Shift"),
        weekdayLabel: item.weekdayLabel ? String(item.weekdayLabel) : undefined,
        startTime: String(item.startTime ?? "18:00"),
        endTime: String(item.endTime ?? "19:00"),
        explanation: item.explanation
          ? String(item.explanation)
              .replace(/\.\s+/g, "\n")
              .replace(/•/g, "")
              .trim()
          : undefined,
        category,
        imageSearchQuery: item.imageSearchQuery
          ? String(item.imageSearchQuery)
          : undefined,
        imageUri: hasRemoteImage ? String(item.imageUri) : null,
        imageThumbUri: item.imageThumbUri ? String(item.imageThumbUri) : null,
        imageAuthor: item.imageAuthor ? String(item.imageAuthor) : null,
        imageAuthorUrl: item.imageAuthorUrl
          ? String(item.imageAuthorUrl)
          : null,
        imageUnsplashUrl: item.imageUnsplashUrl
          ? String(item.imageUnsplashUrl)
          : null,
        imageKey: hasRemoteImage ? undefined : randomImage.key,
        imageSource: hasRemoteImage
          ? { uri: String(item.imageUri) }
          : randomImage.source,

        timeframeType: item.timeframeType ? String(item.timeframeType) : "day",
        timeframeValue:
          typeof item.timeframeValue === "number"
            ? item.timeframeValue
            : Number(item.timeframeValue ?? 1),
        targetType: item.targetType ? String(item.targetType) : "weekday",
        targetKey: item.targetKey ? String(item.targetKey) : undefined,
        targetLabel: item.targetLabel ? String(item.targetLabel) : undefined,
        plannedDate: item.plannedDate ? String(item.plannedDate) : undefined,
        phaseLabel: item.phaseLabel ? String(item.phaseLabel) : undefined,
        difficultyLevel: item.difficultyLevel
          ? String(item.difficultyLevel)
          : undefined,

        resourceLinks: Array.isArray(item.resourceLinks)
          ? item.resourceLinks
              .map((link: any) => ({
                title: String(link?.title ?? ""),
                url: String(link?.url ?? ""),
              }))
              .filter((link: any) => link.title && link.url)
          : [],
      };
    });
  };

  const startConversation = async () => {
    try {
      if (!goal.trim()) return;

      if (blockIfNoCredits(CREDIT_COST.START_GOAL)) return;

      setLoading(true);

      const initialUserMessage: ChatMessage = {
        role: "user",
        content: goal.trim(),
      };

      const res = await fetch(`${BASE_URL}/generate-next-question`, {
        method: "POST",
        headers: getAIHeaders(),

        body: JSON.stringify({
          goal: goal.trim(),
          messages: [initialUserMessage],
          existingSchedule: buildExistingScheduleSummary(),
        }),
      });

      const data = await res.json();

      syncCreditsFromResponse(data);

      if (!res.ok) {
        setShowPremiumModal(Boolean(data?.upgrade));
        return;
      }

      const nextMessages: ChatMessage[] = [
        initialUserMessage,
        {
          role: "assistant",
          content:
            data?.reply || "Tell me more about the goal you want to achieve.",
        },
      ];

      setChatMessages(nextMessages);
      setStage("chat");
      setChatInput("");
      scrollChatToBottom();
    } catch (err) {
      console.log("START CHAT ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendChatReply = async () => {
    try {
      if (!chatInput.trim()) return;
      if (blockIfNoCredits(CREDIT_COST.CHAT)) return;

      const userMessage: ChatMessage = {
        role: "user",
        content: chatInput.trim(),
      };

      const updatedMessages = [...chatMessages, userMessage];
      setChatMessages(updatedMessages);
      scrollChatToBottom();

      setChatInput("");
      setLoading(true);

      const lower = userMessage.content.toLowerCase();

      if (lower.includes("no images") || lower.includes("without images")) {
        setIncludeImages(false);
      }

      if (
        lower.includes("include images") ||
        lower.includes("with images") ||
        lower === "yes"
      ) {
        setIncludeImages(true);
      }

      const res = await fetch(`${BASE_URL}/generate-next-question`, {
        method: "POST",
        headers: getAIHeaders(),
        body: JSON.stringify({
          goal: goal.trim(),
          messages: updatedMessages,
          existingSchedule: buildExistingScheduleSummary(),
        }),
      });

      const data = await res.json();
      syncCreditsFromResponse(data);

      if (!res.ok) {
        setShowPremiumModal(Boolean(data?.upgrade));
        return;
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content:
          data?.reply ||
          "Great. I have enough information to build your plan now.",
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setChatMessages(finalMessages);
      scrollChatToBottom();

      if (data?.hasEnoughInfo) {
        await generateSummaryFromMessages(finalMessages);
      }
    } catch (err) {
      console.log("CHAT REPLY ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateSummaryFromMessages = async (messages: ChatMessage[]) => {
    try {
      if (blockIfNoCredits(CREDIT_COST.SUMMARY)) return;

      const res = await fetch(`${BASE_URL}/generate-summary`, {
        method: "POST",
        headers: getAIHeaders(),
        body: JSON.stringify({
          goal: goal.trim(),
          messages,
          existingSchedule: buildExistingScheduleSummary(),
        }),
      });

      const data = await res.json();
      syncCreditsFromResponse(data);

      if (!res.ok) {
        setShowPremiumModal(Boolean(data?.upgrade));
        return;
      }

      if (data?.summaryText) {
        setPlanSummary({
          summaryTitle: String(data.summaryTitle ?? "Plan Summary"),
          summaryText: String(data.summaryText ?? ""),
          shiftPreview: Array.isArray(data.shiftPreview)
            ? data.shiftPreview
            : [],
        });
        setStage("summary");
      }
    } catch (err) {
      console.log("SUMMARY GENERATION ERROR:", err);
    }
  };
  const generatePlanFromMessages = async (messages: ChatMessage[]) => {
    try {
      if (blockIfNoCredits(CREDIT_COST.PLAN)) return;

      setLoading(true);

      const res = await fetch(`${BASE_URL}/generate-plan`, {
        method: "POST",
        headers: getAIHeaders(),
        body: JSON.stringify({
          goal: goal.trim(),
          messages,
          includeImages,
          existingSchedule: buildExistingScheduleSummary(),
        }),
      });

      const data = await res.json();
      syncCreditsFromResponse(data);

      if (!res.ok) {
        setShowPremiumModal(Boolean(data?.upgrade));
        return;
      }

      const planPayload = Array.isArray(data)
        ? data
        : Array.isArray(data?.plan)
          ? data.plan
          : [];

      if (planPayload.length > 0) {
        const enrichedResult = normalizePlanItems(planPayload);
        setGoalMeta(data?.goalMeta ?? null);
        setResult(enrichedResult);
        setStage("plan_result");
        setIsEditMode(false);
      } else {
        setGoalMeta(null);
        setResult([]);
      }
    } catch (err) {
      console.log("PLAN GENERATION ERROR:", err);
      setResult([]);
    } finally {
      setLoading(false);
    }
  };

  const beginEditMode = () => {
    setIsEditMode(true);
    setStage("chat");
    setShowQuickEdits(true);
    setChatMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "What would you like to adjust?",
      },
    ]);
  };

  const applyQuickEdit = async (instruction: string) => {
    try {
      if (!result.length) return;
      if (blockIfNoCredits(CREDIT_COST.EDIT_PLAN)) return;

      setLoading(true);

      const updatedMessages = [
        ...chatMessages,
        {
          role: "user" as const,
          content: instruction,
          hidden: instruction
            .toLowerCase()
            .includes("use the full edit conversation above"),
        },
      ];

      setChatMessages(updatedMessages);

      const res = await fetch(`${BASE_URL}/modify-plan`, {
        method: "POST",
        headers: getAIHeaders(),
        body: JSON.stringify({
          goal: goal.trim(),
          messages: updatedMessages,
          currentPlan: result,
          editInstruction: instruction,
          includeImages,
          existingSchedule: buildExistingScheduleSummary(),
        }),
      });

      const data = await res.json();
      syncCreditsFromResponse(data);

      if (!res.ok) {
        setShowPremiumModal(Boolean(data?.upgrade));
        return;
      }

      const planPayload = Array.isArray(data)
        ? data
        : Array.isArray(data?.plan)
          ? data.plan
          : [];

      if (planPayload.length > 0) {
        const enrichedResult = normalizePlanItems(planPayload);

        setResult(enrichedResult);
        setStage("plan_result");
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Done. I’ve updated your plan. What else would you like to adjust?",
          },
        ]);
      }
    } catch (err) {
      console.log("QUICK EDIT ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendEditReply = async () => {
    try {
      if (!chatInput.trim()) return;
      if (blockIfNoCredits(CREDIT_COST.EDIT_CHAT)) return;

      const instruction = chatInput.trim();
      setChatInput("");
      setShowQuickEdits(false);

      const userMessage: ChatMessage = {
        role: "user",
        content: instruction,
      };

      const updatedMessages = [...chatMessages, userMessage];
      setChatMessages(updatedMessages);
      scrollChatToBottom();
      setLoading(true);

      const res = await fetch(`${BASE_URL}/generate-next-question`, {
        method: "POST",
        headers: getAIHeaders(),

        body: JSON.stringify({
          goal: goal.trim(),
          messages: updatedMessages,
          existingSchedule: buildExistingScheduleSummary(),
          editMode: true,
          currentPlan: result,
          instruction: `
You are editing an existing AI-created goal plan.

DO NOT immediately modify the plan when the user gives a quick instruction like:
- "Remove a day"
- "Make it easier"
- "Reduce intensity"

Instead:
1. Ask a clarifying question first
2. Understand the reason (time, energy, difficulty, consistency)
3. Only confirm changes after you are confident

If the request is specific (e.g. "Remove Monday workout"), you can proceed.
`,
        }),
      });

      const data = await res.json();
      syncCreditsFromResponse(data);

      if (!res.ok) {
        setShowPremiumModal(Boolean(data?.upgrade));
        return;
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content:
          data?.reply ||
          "I understand. What specific part should I adjust: the time, the difficulty, the number of shifts, or the goal structure?",
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setChatMessages(finalMessages);
      scrollChatToBottom();

      const nextCount = editConversationCount + 1;
      setEditConversationCount(nextCount);

      if (data?.hasEnoughInfo === true) {
        setCanGenerateEditedPlan(true);

        setChatMessages([
          ...finalMessages,
          {
            role: "assistant",
            content:
              "I have enough information now. Tap Generate Updated Plan when you are ready.",
          },
        ]);
        scrollChatToBottom();
      } else {
        setCanGenerateEditedPlan(false);
      }
      // Do not auto-scroll here. Let the user stay where they are reading
    } catch (err) {
      console.log("EDIT CONVERSATION ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const useThisPlan = () => {
    if (!goal.trim() || result.length === 0) return;

    const creativeGoalTitle =
      typeof goalMeta?.goalTitle === "string" && goalMeta.goalTitle.trim()
        ? goalMeta.goalTitle.trim()
        : buildCreativeGoalTitle(goal, result);

    const exportableResult = result.map((item) => ({
      title: item.title,
      weekdayLabel: item.weekdayLabel,
      startTime: item.startTime,
      endTime: item.endTime,
      explanation: item.explanation,
      imageKey: item.imageKey,
      imageUri: item.imageUri ?? undefined,
      imageAuthor: item.imageAuthor ?? undefined,
      imageAuthorUrl: item.imageAuthorUrl ?? undefined,
      imageUnsplashUrl: item.imageUnsplashUrl ?? undefined,
      imageSearchQuery: item.imageSearchQuery ?? undefined,

      timeframeType: item.timeframeType ?? "day",
      timeframeValue: item.timeframeValue ?? 1,
      targetType: item.targetType ?? "weekday",
      targetKey: item.targetKey ?? undefined,
      targetLabel: item.targetLabel ?? undefined,
      plannedDate: item.plannedDate ?? undefined,
      phaseLabel: item.phaseLabel ?? undefined,
      difficultyLevel: item.difficultyLevel ?? undefined,
      resourceLinks: item.resourceLinks ?? [],
    }));

    if (isEditMode && goalBeingEdited && updateGoal) {
      updateGoal({
        ...goalBeingEdited,
        title: creativeGoalTitle,
        startDate: goalMeta?.goalStartDate ?? goalBeingEdited.startDate,
        endDate: goalMeta?.goalEndDate ?? goalBeingEdited.endDate,
        startTime: exportableResult[0]?.startTime ?? goalBeingEdited.startTime,
        endTime: exportableResult[0]?.endTime ?? goalBeingEdited.endTime,
        planGuide: exportableResult as any,
        createdWithAI: true,
        aiGoalMemory: {
          originalGoal: goal.trim(),
          chatMessages,
          planSummary,
          lastEditedAt: new Date().toISOString(),
        },
        aiLastEditedAt: new Date().toISOString(),
      } as any);

      router.back();
      return;
    }

    router.push({
      pathname: "/add-goal",
      params: {
        aiGoalTitle: creativeGoalTitle,
        aiPlan: JSON.stringify({
          goalMeta,
          plan: exportableResult,
          aiMemory: {
            originalGoal: goal.trim(),
            chatMessages,
            planSummary,
            createdAt: new Date().toISOString(),
          },
        }),
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: UI.screen }}>
      {showPremiumModal && (
        <Modal transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.75)",
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
                Goal Coach Locked
              </Text>

              <Text
                style={{
                  color: UI.muted,
                  fontSize: 14,
                  lineHeight: 22,
                  marginBottom: 18,
                }}
              >
                {effectiveAIPlan === "free"
                  ? "Goal Coach is available during your 7-day Premium trial or an active Premium plan. Start your trial to unlock guided planning, smart schedules, and plan editing."
                  : "Your Premium access is active, but your AI credits are not available right now. Please refresh or manage your plan."}
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
                  style={{ color: UI.text, fontWeight: "800", marginBottom: 6 }}
                >
                  Premium unlocks:
                </Text>

                <Text style={{ color: UI.muted, lineHeight: 21 }}>
                  • AI goal planning{"\n"}• Smart schedule generation{"\n"}•
                  Plan editing with AI{"\n"}• Future AI coaching system
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => router.push("/pricing" as any)}
                style={{
                  backgroundColor: UI.primary,
                  paddingVertical: 14,
                  borderRadius: 15,
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "900" }}>
                  {effectiveAIPlan === "free"
                    ? "Start 7-Day Free Trial"
                    : "Manage Credits"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  router.back();
                }}
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
                  Go Back
                </Text>
              </TouchableOpacity>
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
                Leave Goal Coach?
              </Text>

              <Text
                style={{
                  color: UI.muted,
                  fontSize: 14,
                  lineHeight: 20,
                  marginBottom: 20,
                }}
              >
                You have progress in this Goal Coach session. Leaving now will
                discard your conversation, summary, and generated plan.
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
                    borderWidth: 1,
                    borderColor: UI.border,
                  }}
                >
                  <Text style={{ color: UI.text, fontWeight: "600" }}>
                    Stay Here
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setShowLeaveModal(false);
                    resetAIBot();
                  }}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 10,
                    backgroundColor: "#ef4444",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    Discard
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <KeyboardAvoidingView
        style={{
          flex: 1,
          opacity: showPremiumModal ? 0.4 : 1,
        }}
        pointerEvents={showPremiumModal ? "none" : "auto"}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={10}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 20, paddingBottom: 10 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag" // 👈 CHANGE THIS
          showsVerticalScrollIndicator={false} // optional but clean
        >
          <Text
            style={{
              color: UI.text,
              fontSize: 28,
              fontWeight: "800",
              marginBottom: 8,
            }}
          >
            Goal Coach
          </Text>

          <Text
            style={{
              color: UI.muted,
              fontSize: 14,
              marginBottom: 20,
            }}
          >
            Plan smarter with your personal goal coach.
          </Text>

          <View
            style={{
              backgroundColor: UI.innerCard,
              borderRadius: 12,
              padding: 10,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: UI.border,
            }}
          >
            <Text style={{ color: UI.text, fontWeight: "700" }}>
              Coach Credits: {credits === null ? "Loading..." : credits}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: UI.card,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: UI.border,
              padding: 18,
            }}
          >
            <Text
              style={{
                color: UI.text,
                fontSize: 16,
                fontWeight: "700",
                marginBottom: 10,
              }}
            >
              Enter your goal
            </Text>

            <TextInput
              value={goal}
              onChangeText={setGoal}
              placeholder="e.g I want to bulk"
              placeholderTextColor={UI.muted}
              editable={stage === "goal_input"}
              style={{
                backgroundColor: UI.innerCard,
                color: UI.text,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: UI.border,
                marginBottom: 12,
                opacity: stage === "goal_input" ? 1 : 0.7,
              }}
            />

            {stage === "goal_input" && (
              <TouchableOpacity
                onPress={startConversation}
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
                  {loading ? "Thinking..." : "Continue"}
                </Text>
              </TouchableOpacity>
            )}

            {stage === "chat" && (
              <View style={{ marginTop: 20 }}>
                <ScrollView
                  ref={chatScrollRef}
                  style={{
                    maxHeight: 360,
                    marginBottom: 12,
                  }}
                  contentContainerStyle={{ paddingBottom: 8 }}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                  onContentSizeChange={() => scrollChatToBottom(true)}
                >
                  {chatMessages
                    .filter((message) => !message.hidden)
                    .map((message, index) => (
                      <View
                        key={`${message.role}-${index}`}
                        style={{
                          alignSelf:
                            message.role === "assistant"
                              ? "flex-start"
                              : "flex-end",
                          backgroundColor:
                            message.role === "assistant"
                              ? UI.innerCard
                              : UI.primarySoft,
                          borderWidth: 1,
                          borderColor:
                            message.role === "assistant"
                              ? UI.border
                              : UI.primary,
                          borderRadius: 14,
                          padding: 12,
                          marginBottom: 10,
                          maxWidth: "92%",
                        }}
                      >
                        <Text
                          style={{
                            color: UI.text,
                            fontSize: 14,
                            lineHeight: 20,
                          }}
                        >
                          {message.content}
                        </Text>
                      </View>
                    ))}
                </ScrollView>

                {isEditMode && showQuickEdits && (
                  <View style={{ marginTop: 8, marginBottom: 12 }}>
                    <Text
                      style={{
                        color: UI.muted,
                        fontSize: 12,
                        marginBottom: 10,
                      }}
                    >
                      Quick edits
                    </Text>

                    <View
                      style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                    >
                      {[
                        "Make sessions shorter",
                        "Make sessions longer",
                        "Change rest day",
                        "Increase intensity",
                        "Reduce intensity",
                        "Remove a day",
                        "Add more flexibility",
                      ].map((label) => (
                        <TouchableOpacity
                          key={label}
                          onPress={() => {
                            setShowQuickEdits(false);
                            setChatInput(label);
                          }}
                          style={{
                            backgroundColor: UI.innerCard,
                            borderWidth: 1,
                            borderColor: UI.border,
                            borderRadius: 12,
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                          }}
                        >
                          <Text
                            style={{
                              color: UI.text,
                              fontSize: 13,
                              fontWeight: "600",
                            }}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <TextInput
                  value={chatInput}
                  onChangeText={setChatInput}
                  onFocus={() => {}}
                  placeholder={
                    isEditMode
                      ? "Type what you want to adjust..."
                      : "Reply to the AI..."
                  }
                  placeholderTextColor={UI.muted}
                  multiline
                  scrollEnabled={false}
                  style={{
                    backgroundColor: UI.innerCard,
                    color: UI.text,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: UI.border,
                    minHeight: 54,
                    marginBottom: 12,
                  }}
                />

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    onPress={requestCancelAI}
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
                    <Text
                      style={{
                        color: UI.text,
                        fontWeight: "700",
                        fontSize: 14,
                      }}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={isEditMode ? sendEditReply : sendChatReply}
                    style={{
                      flex: 1,
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
                      {loading ? "Thinking..." : "Send"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {isEditMode && result.length > 0 && canGenerateEditedPlan && (
                  <TouchableOpacity
                    onPress={() =>
                      applyQuickEdit(
                        "Use the full edit conversation above to rebuild the current goal plan. Keep it connected to the original goal. Make it easier, smarter, and more realistic based on the user's reasons.",
                      )
                    }
                    disabled={loading}
                    style={{
                      marginTop: 12,
                      backgroundColor: UI.primary,
                      paddingVertical: 14,
                      borderRadius: 14,
                      alignItems: "center",
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "900" }}>
                      Generate Updated Plan
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {stage === "summary" && planSummary && (
              <View style={{ marginTop: 20 }}>
                <Text
                  style={{
                    color: UI.text,
                    fontSize: 15,
                    fontWeight: "700",
                    marginBottom: 10,
                  }}
                >
                  {planSummary.summaryTitle}
                </Text>

                <View
                  style={{
                    backgroundColor: UI.innerCard,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: UI.border,
                    padding: 14,
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      color: UI.muted,
                      fontSize: 13,
                      lineHeight: 20,
                    }}
                  >
                    {planSummary.summaryText}
                  </Text>
                </View>

                {planSummary.shiftPreview.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text
                      style={{
                        color: UI.text,
                        fontSize: 14,
                        fontWeight: "700",
                        marginBottom: 8,
                      }}
                    >
                      Shift Preview
                    </Text>

                    {planSummary.shiftPreview.map((item, index) => (
                      <View
                        key={`${item.title}-${index}`}
                        style={{
                          backgroundColor: UI.innerCard,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: UI.border,
                          padding: 12,
                          marginBottom: 10,
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
                          {item.title}
                        </Text>

                        <Text
                          style={{
                            color: UI.muted,
                            fontSize: 13,
                            lineHeight: 19,
                          }}
                        >
                          {item.description}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    onPress={requestCancelAI}
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
                    <Text
                      style={{
                        color: UI.text,
                        fontWeight: "700",
                        fontSize: 14,
                      }}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={loading}
                    onPress={() => {
                      if (loading) return;
                      generatePlanFromMessages(chatMessages);
                    }}
                    style={{
                      flex: 1,
                      opacity: loading ? 0.65 : 1,
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
                      {loading ? "Generating Plan..." : "Generate Plan"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* GENERATE UPDATED PLAN BUTTON (ONLY IN EDIT MODE) */}
              </View>
            )}

            {stage === "plan_result" && result.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Text
                  style={{
                    color: UI.text,
                    fontSize: 15,
                    fontWeight: "700",
                    marginBottom: 10,
                  }}
                >
                  Your goal Plan Result
                </Text>

                {result.map((item, index) => (
                  <View
                    key={`${item.title}-${index}`}
                    style={{
                      backgroundColor: UI.innerCard,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: UI.border,
                      padding: 12,
                      marginBottom: 10,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Image
                        source={item.imageSource}
                        resizeMode="cover"
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 12,
                          marginRight: 12,
                        }}
                      />

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: UI.text,
                            fontSize: 14,
                            fontWeight: "700",
                            marginBottom: 4,
                          }}
                        >
                          {item.title}
                        </Text>

                        <Text
                          style={{
                            color: UI.muted,
                            fontSize: 13,
                          }}
                        >
                          {getPlanTargetText(item)} • {item.startTime} -{" "}
                          {item.endTime}
                        </Text>

                        {!!item.phaseLabel && (
                          <Text
                            style={{
                              color: UI.primary,
                              fontSize: 12,
                              marginTop: 4,
                              fontWeight: "700",
                            }}
                          >
                            {item.phaseLabel}
                          </Text>
                        )}
                      </View>
                    </View>

                    {!!item.explanation && (
                      <Text
                        style={{
                          color: UI.muted,
                          fontSize: 13,
                          lineHeight: 19,
                          marginTop: 10,
                        }}
                      >
                        {item.explanation}
                      </Text>
                    )}
                    {Array.isArray(item.resourceLinks) &&
                      item.resourceLinks.length > 0 && (
                        <View style={{ marginTop: 10 }}>
                          <Text
                            style={{
                              color: UI.text,
                              fontSize: 12,
                              fontWeight: "800",
                              marginBottom: 6,
                            }}
                          >
                            Helpful links
                          </Text>

                          {item.resourceLinks.map((link, linkIndex) => (
                            <Text
                              key={`${link.url}-${linkIndex}`}
                              style={{
                                color: UI.primary,
                                fontSize: 13,
                                fontWeight: "700",
                                marginBottom: 5,
                              }}
                            >
                              {link.title}
                            </Text>
                          ))}
                        </View>
                      )}
                  </View>
                ))}

                <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                  <TouchableOpacity
                    onPress={requestCancelAI}
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
                    <Text
                      style={{
                        color: UI.text,
                        fontWeight: "700",
                        fontSize: 12,
                      }}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={beginEditMode}
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
                    <Text
                      style={{
                        color: UI.text,
                        fontWeight: "700",
                        fontSize: 12,
                      }}
                    >
                      Edit Plan
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={useThisPlan}
                    style={{
                      flex: 1,
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
                        fontSize: 12,
                      }}
                    >
                      {isEditMode ? "Update" : "Use Plan"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
