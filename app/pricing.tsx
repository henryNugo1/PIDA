import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useContext, useState } from "react";
import {
  Linking,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import SmoothModal from "../components/ui/SmoothModal";
import SmoothPressable from "../components/ui/SmoothPressable";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { API_BASE_URL } from "../lib/api";
import { supabase } from "../lib/supabase";

type PaidPlanId = "mini" | "standard" | "premium";

type PaidPlan = {
  id: PaidPlanId;
  title: string;
  basePrice: number;
  internationalPrice: string;
  payablePrice: number;
  credits: number;
  description: string;
  features: string[];
  highlight?: boolean;
};

type CreditPackId = "credits_50" | "credits_150" | "credits_250";

type CreditPack = {
  id: CreditPackId;
  title: string;
  basePrice: number;
  internationalPrice: string;
  payablePrice: number;
  credits: number;
  description: string;
};

type BillingProvider = "paystack" | "lemon" | "paddle";

const formatNaira = (amount: number) =>
  `NGN ${amount.toLocaleString("en-NG")}`;

const getBillingProviderForCountry = (country?: string | null): BillingProvider => {
  const normalized = String(country ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, " ");

  return normalized === "nigeria" ? "paystack" : "paddle";
};

const formatDisplayPrice = (
  item: Pick<PaidPlan | CreditPack, "basePrice" | "internationalPrice">,
  provider: BillingProvider,
) => (provider === "paystack" ? formatNaira(item.basePrice) : item.internationalPrice);

const formatCheckoutSubtitle = (
  baseAmount: number,
  payableAmount: number,
  provider: BillingProvider,
) =>
  provider !== "paystack"
    ? "Final price is shown securely by Paddle before payment."
    : `Checkout total with processing fee: ${formatNaira(payableAmount)}`;

const grossUpPaymentProcessingFee = (targetAmount: number) => {
  const fixedFee = targetAmount >= 2500 ? 100 : 0;
  return Math.ceil((targetAmount + fixedFee) / 0.985);
};

const getPlanTitle = (planId?: string | null) => {
  if (planId === "mini") return "Mini Plan";
  if (planId === "standard") return "Standard Plan";
  if (planId === "premium") return "Premium Plan";
  return "Free Plan";
};

const getPlanIcon = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes("free")) return "leaf-outline";
  if (lower.includes("mini")) return "flash-outline";
  if (lower.includes("standard")) return "ribbon-outline";
  if (lower.includes("premium")) return "diamond-outline";
  if (lower.includes("top up") || lower.includes("credits")) return "add-circle-outline";
  if (lower.includes("tester")) return "flask-outline";
  return "card-outline";
};

const formatPlanDate = (value?: string | null) => {
  if (!value) return "your next billing date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "your next billing date";

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const paidPlans: PaidPlan[] = [
  {
    id: "mini",
    title: "Mini Plan",
    basePrice: 700,
    internationalPrice: "$2.99",
    payablePrice: grossUpPaymentProcessingFee(700),
    credits: 50,
    description: "For light Goach use and quick planning help.",
    features: [
      "50 Goach credits monthly",
      "Goach planning access",
      "Goach-created goal cards",
      "Good for light Goach use",
    ],
  },
  {
    id: "standard",
    title: "Standard Plan",
    basePrice: 1800,
    internationalPrice: "$5.99",
    payablePrice: grossUpPaymentProcessingFee(1800),
    credits: 150,
    description: "For regular Goach planning and editing.",
    features: [
      "150 Goach credits monthly",
      "Goach planning and editing",
      "Quick goal-card and shift creation",
      "Best balance for regular use",
    ],
    highlight: true,
  },
  {
    id: "premium",
    title: "Premium Plan",
    basePrice: 2800,
    internationalPrice: "$8.99",
    payablePrice: grossUpPaymentProcessingFee(2800),
    credits: 250,
    description: "For heavy Goach users and bigger routines.",
    features: [
      "250 Goach credits monthly",
      "Goach planning and editing",
      "Best value per credit",
      "Built for heavier Goach use",
    ],
  },
];

const creditPacks: CreditPack[] = [
  {
    id: "credits_50",
    title: "50 Goach Credits",
    basePrice: 700,
    internationalPrice: "$2.99",
    payablePrice: grossUpPaymentProcessingFee(700),
    credits: 50,
    description: "A quick credit pack for a few extra Goach sessions.",
  },
  {
    id: "credits_150",
    title: "150 Goach Credits",
    basePrice: 1800,
    internationalPrice: "$5.99",
    payablePrice: grossUpPaymentProcessingFee(1800),
    credits: 150,
    description: "More room for planning, edits, and follow-up help.",
  },
  {
    id: "credits_250",
    title: "250 Goach Credits",
    basePrice: 2800,
    internationalPrice: "$8.99",
    payablePrice: grossUpPaymentProcessingFee(2800),
    credits: 250,
    description: "A bigger credit pack for heavy Goach use.",
  },
];

export default function PricingScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const auth = useContext(AuthContext);
  const themeCtx = useContext(ThemeContext);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [checkingOutPlanId, setCheckingOutPlanId] =
    useState<PaidPlanId | null>(null);
  const [billingError, setBillingError] = useState("");
  const [billingReference, setBillingReference] = useState("");
  const [billingUrl, setBillingUrl] = useState("");
  const [selectedBillingProvider, setSelectedBillingProvider] =
    useState<BillingProvider>("paystack");
  const [selectedPlan, setSelectedPlan] = useState<PaidPlan | null>(null);
  const [selectedCreditPack, setSelectedCreditPack] =
    useState<CreditPack | null>(null);
  const [checkingOutCreditPackId, setCheckingOutCreditPackId] =
    useState<CreditPackId | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<"plan" | "credit_pack">(
    "plan",
  );
  const [activePricingTab, setActivePricingTab] = useState<
    "plans" | "credits"
  >(params.tab === "credits" ? "credits" : "plans");
  const [showPlanChangeModal, setShowPlanChangeModal] = useState(false);
  const [planChangePlan, setPlanChangePlan] = useState<PaidPlan | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const [showTesterModal, setShowTesterModal] = useState(false);
  const [testerPassword, setTesterPassword] = useState("");
  const [testerLoading, setTesterLoading] = useState(false);
  const [testerError, setTesterError] = useState("");
  const [showTesterPassword, setShowTesterPassword] = useState(false);

  if (!themeCtx) return null;

  const { theme, themeKey } = themeCtx;
  const isDaylightTheme = themeKey === "lightClean";
  const currentPlan = auth?.profile?.plan ?? "free";
  const billingProvider = getBillingProviderForCountry(auth?.profile?.country);
  const isInternationalBilling = billingProvider !== "paystack";
  const visiblePaidPlans = isInternationalBilling
    ? paidPlans.filter((plan) => plan.id !== "mini")
    : paidPlans;
  const isTrialActive = auth?.trialStatus.isTrialActive ?? false;
  const isPaidCurrentPlan = ["mini", "standard", "premium"].includes(
    currentPlan,
  );
  const currentPeriodEndsAt = auth?.profile?.current_period_ends_at ?? null;
  const isCancellationScheduled =
    isPaidCurrentPlan &&
    (auth?.profile?.cancel_at_period_end ||
      auth?.profile?.subscription_status === "cancelled");
  const canCancelCurrentSubscription =
    isPaidCurrentPlan &&
    !isTrialActive &&
    !isCancellationScheduled &&
    auth?.profile?.subscription_provider !== "tester";
  const pendingPlan = auth?.profile?.pending_plan ?? null;
  const pendingPlanStartsAt = auth?.profile?.pending_plan_starts_at ?? null;
  const currentPlanTitle = isTrialActive
    ? "Standard Trial"
    : getPlanTitle(currentPlan);
  const currentPlanCaption = isPaidCurrentPlan
    ? isCancellationScheduled
      ? `Cancels on ${formatPlanDate(currentPeriodEndsAt)}`
      : currentPeriodEndsAt
      ? `Active until ${formatPlanDate(currentPeriodEndsAt)}`
      : "Your paid plan is active."
    : isTrialActive
      ? "Your 7-day trial is using Standard plan access."
      : "Choose a monthly plan or credit pack to unlock Goach.";
  const pageShadowColor = isDaylightTheme ? "#94a3b8" : "#000";
  const openPlanChangeModal = (plan: PaidPlan) => {
    setPlanChangePlan(plan);
    setScheduleError("");
    setShowPlanChangeModal(true);
  };

  const handlePlanPress = (plan: PaidPlan) => {
    if (isPaidCurrentPlan && currentPlan !== plan.id) {
      openPlanChangeModal(plan);
      return;
    }

    startPlanCheckout(plan);
  };

  const schedulePlanChange = async () => {
    try {
      if (!auth?.user?.id || !planChangePlan) {
        setScheduleError("Account or plan is missing.");
        return;
      }

      setScheduleLoading(true);
      setScheduleError("");

      const res = await fetch(`${API_BASE_URL}/billing/schedule-plan-change`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: auth.user.id,
          planId: planChangePlan.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setScheduleError(data?.error || "Unable to schedule plan change.");
        return;
      }

      await auth.refreshProfile();

      setShowPlanChangeModal(false);
      setPlanChangePlan(null);
    } catch (error: any) {
      setScheduleError(error?.message || "Unable to schedule plan change.");
    } finally {
      setScheduleLoading(false);
    }
  };

  const cancelSubscription = async () => {
    try {
      if (!auth?.user?.id) {
        setCancelError("Please sign in before cancelling.");
        return;
      }

      setCancelLoading(true);
      setCancelError("");

      const res = await fetch(`${API_BASE_URL}/billing/cancel-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: auth.user.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCancelError(data?.error || "Unable to cancel subscription.");
        return;
      }

      await auth.refreshProfile();
      setShowCancelModal(false);
    } catch (error: any) {
      setCancelError(error?.message || "Unable to cancel subscription.");
    } finally {
      setCancelLoading(false);
    }
  };

  const startPlanCheckout = async (plan: PaidPlan) => {
    try {
      if (!auth?.user?.id || !auth?.profile?.email) {
        setBillingError("Please sign in before choosing a plan.");
        setSelectedPlan(plan);
        setShowPaymentModal(true);
        return;
      }

      setBillingLoading(true);
      setBillingError("");
      setBillingReference("");
      setBillingUrl("");
      setSelectedBillingProvider(billingProvider);
      setSelectedPlan(plan);
      setSelectedCreditPack(null);
      setCheckoutMode("plan");
      setCheckingOutPlanId(plan.id);

      const res = await fetch(`${API_BASE_URL}/billing/start-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: auth.user.id,
          email: auth.profile.email,
          planId: plan.id,
          planName: plan.title,
          credits: plan.credits,
          baseAmount: plan.basePrice,
          amount: plan.payablePrice,
          billingProvider,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBillingError(data?.error || "Unable to open plan checkout.");
        setShowPaymentModal(true);
        return;
      }

      setSelectedBillingProvider(
        data.provider === "paddle" || data.provider === "lemon"
          ? data.provider
          : billingProvider,
      );
      setBillingReference(String(data.reference ?? ""));
      setBillingUrl(String(data.authorizationUrl ?? ""));
      setShowPaymentModal(true);

      if (data.authorizationUrl) {
        await Linking.openURL(String(data.authorizationUrl));
      }
    } catch (error: any) {
      setBillingError(error?.message || "Unable to open checkout.");
      setShowPaymentModal(true);
    } finally {
      setBillingLoading(false);
      setCheckingOutPlanId(null);
    }
  };

  const startCreditPackCheckout = async (pack: CreditPack) => {
    try {
      if (!auth?.user?.id || !auth?.profile?.email) {
        setBillingError("Please sign in before buying Goach credits.");
        setSelectedCreditPack(pack);
        setSelectedPlan(null);
        setCheckoutMode("credit_pack");
        setShowPaymentModal(true);
        return;
      }

      setBillingLoading(true);
      setBillingError("");
      setBillingReference("");
      setBillingUrl("");
      setSelectedBillingProvider(billingProvider);
      setSelectedPlan(null);
      setSelectedCreditPack(pack);
      setCheckoutMode("credit_pack");
      setCheckingOutCreditPackId(pack.id);

      const res = await fetch(`${API_BASE_URL}/billing/start-credit-pack`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: auth.user.id,
          email: auth.profile.email,
          packId: pack.id,
          credits: pack.credits,
          baseAmount: pack.basePrice,
          amount: pack.payablePrice,
          billingProvider,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBillingError(data?.error || "Unable to open credit checkout.");
        setShowPaymentModal(true);
        return;
      }

      setSelectedBillingProvider(
        data.provider === "paddle" || data.provider === "lemon"
          ? data.provider
          : billingProvider,
      );
      setBillingReference(String(data.reference ?? ""));
      setBillingUrl(String(data.authorizationUrl ?? ""));
      setShowPaymentModal(true);

      if (data.authorizationUrl) {
        await Linking.openURL(String(data.authorizationUrl));
      }
    } catch (error: any) {
      setBillingError(error?.message || "Unable to open checkout.");
      setShowPaymentModal(true);
    } finally {
      setBillingLoading(false);
      setCheckingOutCreditPackId(null);
    }
  };

  const verifyPlanCheckout = async () => {
    try {
      if (!auth?.user?.id || !billingReference) {
        setBillingError("Checkout reference is missing.");
        return;
      }

      setBillingLoading(true);
      setBillingError("");

      const res = await fetch(`${API_BASE_URL}/billing/verify-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: auth.user.id,
          reference: billingReference,
          billingProvider: selectedBillingProvider,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBillingError(data?.error || "Plan verification failed.");
        return;
      }

      await auth.refreshProfile();

      setBillingReference("");
      setBillingUrl("");
      setSelectedPlan(null);
      setShowPaymentModal(false);
    } catch (error: any) {
      setBillingError(error?.message || "Unable to verify plan checkout.");
    } finally {
      setBillingLoading(false);
    }
  };

  const verifyCreditPackCheckout = async () => {
    try {
      if (!auth?.user?.id || !billingReference) {
        setBillingError("Checkout reference is missing.");
        return;
      }

      setBillingLoading(true);
      setBillingError("");

      const res = await fetch(`${API_BASE_URL}/billing/verify-credit-pack`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: auth.user.id,
          reference: billingReference,
          billingProvider: selectedBillingProvider,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBillingError(data?.error || "Credit pack verification failed.");
        return;
      }

      await auth.refreshProfile();

      setBillingReference("");
      setBillingUrl("");
      setSelectedCreditPack(null);
      setShowPaymentModal(false);
    } catch (error: any) {
      setBillingError(error?.message || "Unable to verify credit checkout.");
    } finally {
      setBillingLoading(false);
    }
  };

  const activateTesterMode = async () => {
    try {
      if (!auth?.user?.id) {
        setTesterError("Please sign in first.");
        return;
      }

      if (!testerPassword.trim()) {
        setTesterError("Enter the tester password.");
        return;
      }

      setTesterLoading(true);
      setTesterError("");

      const res = await fetch(`${API_BASE_URL}/tester/activate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: testerPassword.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setTesterError(data?.error || "Invalid tester password.");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          plan: "premium",
          subscription_status: "active",
          subscription_provider: "tester",
          ai_credits: Number(data?.aiCredits ?? 250),
        })
        .eq("id", auth.user.id);

      if (error) {
        setTesterError(error.message);
        return;
      }

      await auth.refreshProfile();

      setTesterPassword("");
      setShowTesterModal(false);
    } catch (error: any) {
      setTesterError(error?.message || "Failed to activate tester mode.");
    } finally {
      setTesterLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.screen }}>
      <CheckoutModal
        billingError={billingError}
        billingLoading={billingLoading}
        billingProvider={selectedBillingProvider}
        billingReference={billingReference}
        billingUrl={billingUrl}
        creditPack={selectedCreditPack}
        mode={checkoutMode}
        onClose={() => {
          setShowPaymentModal(false);
          setBillingError("");
          setSelectedCreditPack(null);
        }}
        onOpenCheckout={() => billingUrl && Linking.openURL(billingUrl)}
        onVerify={
          checkoutMode === "credit_pack"
            ? verifyCreditPackCheckout
            : verifyPlanCheckout
        }
        plan={selectedPlan}
        theme={theme}
        visible={showPaymentModal}
      />

      <TesterModal
        error={testerError}
        loading={testerLoading}
        onActivate={activateTesterMode}
        onClose={() => {
          setShowTesterModal(false);
          setTesterPassword("");
          setTesterError("");
          setShowTesterPassword(false);
        }}
        password={testerPassword}
        setPassword={(text: string) => {
          setTesterPassword(text);
          setTesterError("");
        }}
        setShowPassword={setShowTesterPassword}
        showPassword={showTesterPassword}
        theme={theme}
        visible={showTesterModal}
      />

      <CancelSubscriptionModal
        currentPeriodEndsAt={currentPeriodEndsAt}
        currentPlanTitle={currentPlanTitle}
        error={cancelError}
        loading={cancelLoading}
        onCancelSubscription={cancelSubscription}
        onClose={() => {
          setShowCancelModal(false);
          setCancelError("");
        }}
        theme={theme}
        visible={showCancelModal}
      />

      <PlanChangeModal
        currentPlanTitle={getPlanTitle(currentPlan)}
        currentPeriodEndsAt={currentPeriodEndsAt}
        error={scheduleError}
        loading={scheduleLoading}
        onChangeNow={() => {
          const plan = planChangePlan;
          setShowPlanChangeModal(false);
          setScheduleError("");
          if (plan) startPlanCheckout(plan);
        }}
        onClose={() => {
          setShowPlanChangeModal(false);
          setPlanChangePlan(null);
          setScheduleError("");
        }}
        onSchedule={schedulePlanChange}
        plan={planChangePlan}
        theme={theme}
        visible={showPlanChangeModal}
      />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 42,
              height: 42,
              borderRadius: 16,
              backgroundColor: theme.card,
              borderWidth: 1,
              borderColor: theme.border,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text
              style={{ color: theme.text, fontSize: 28, fontWeight: "900" }}
            >
              Plans & Credit Packs
            </Text>
            <Text
              style={{
                color: theme.muted,
                fontSize: 13,
                fontWeight: "700",
                marginTop: 2,
              }}
            >
              Choose monthly credits or buy one-time Goach credits.
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 24,
            padding: 16,
            marginBottom: 16,
            shadowColor: pageShadowColor,
            shadowOpacity: isDaylightTheme ? 0.12 : 0.22,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 8 },
            elevation: 3,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 17,
                backgroundColor: theme.primarySoft,
                borderWidth: 1,
                borderColor: theme.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={
                  isPaidCurrentPlan || isTrialActive
                    ? "shield-checkmark-outline"
                    : "lock-closed-outline"
                }
                size={22}
                color={theme.primary}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{ color: theme.muted, fontSize: 12, fontWeight: "900" }}
              >
                CURRENT ACCESS
              </Text>
              <Text
                style={{
                  color: theme.text,
                  fontSize: 23,
                  fontWeight: "900",
                  marginTop: 4,
                }}
              >
                {currentPlanTitle}
              </Text>
              <Text
                style={{
                  color: theme.muted,
                  lineHeight: 20,
                  marginTop: 4,
                  fontWeight: "700",
                }}
              >
                {currentPlanCaption}
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              gap: 10,
              marginTop: 14,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: theme.innerCard,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 16,
                padding: 12,
              }}
            >
              <Text
                style={{ color: theme.muted, fontSize: 11, fontWeight: "900" }}
              >
                MONTHLY CREDITS
              </Text>
              <Text
                style={{
                  color: theme.text,
                  fontSize: 18,
                  fontWeight: "900",
                  marginTop: 3,
                }}
              >
                {isPaidCurrentPlan || isTrialActive
                  ? currentPlan === "mini"
                    ? "50"
                    : currentPlan === "premium"
                      ? "250"
                      : "150"
                  : "0"}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: theme.innerCard,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 16,
                padding: 12,
              }}
            >
              <Text
                style={{ color: theme.muted, fontSize: 11, fontWeight: "900" }}
              >
                CREDIT PACKS
              </Text>
              <Text
                style={{
                  color: theme.primary,
                  fontSize: 18,
                  fontWeight: "900",
                  marginTop: 3,
                }}
              >
                Available
              </Text>
            </View>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 18,
            padding: 5,
            marginBottom: 16,
          }}
        >
          {[
            { key: "plans", label: "Plans", icon: "albums-outline" },
            { key: "credits", label: "Credit Packs", icon: "add-circle-outline" },
          ].map((tab) => {
            const active = activePricingTab === tab.key;

            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() =>
                  setActivePricingTab(tab.key as "plans" | "credits")
                }
                style={{
                  flex: 1,
                  backgroundColor: active ? theme.primary : "transparent",
                  borderRadius: 14,
                  paddingVertical: 11,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 7,
                }}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={17}
                  color={active ? "#ffffff" : theme.muted}
                />
                <Text
                  style={{
                    color: active ? "#ffffff" : theme.text,
                    fontWeight: "900",
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View
          style={{
            backgroundColor: theme.innerCard,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 18,
            padding: 14,
            marginBottom: 18,
            flexDirection: "row",
            gap: 10,
          }}
        >
          <Ionicons
            name={
              activePricingTab === "credits" ? "wallet-outline" : "card-outline"
            }
            size={20}
            color={theme.primary}
            style={{ marginTop: 1 }}
          />
          <Text
            style={{
              color: theme.muted,
              flex: 1,
              lineHeight: 21,
              fontWeight: "700",
            }}
          >
            {activePricingTab === "credits"
              ? "Buy one-time Goach credits with or without a subscription. Credits add to your current balance."
              : "Choose a monthly plan for Goach credits and planning access."}{" "}
            {isInternationalBilling
              ? "International payments use Lemon Squeezy."
              : "Payment processing fee is shown before checkout."}
          </Text>
        </View>

        {!!pendingPlan && (
          <View
            style={{
              backgroundColor: theme.primarySoft,
              borderWidth: 1,
              borderColor: theme.primary,
              borderRadius: 18,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: theme.text, fontWeight: "900", fontSize: 16 }}>
              Plan change scheduled
            </Text>
            <Text
              style={{
                color: theme.muted,
                lineHeight: 21,
                marginTop: 6,
                fontWeight: "700",
              }}
            >
              {getPlanTitle(pendingPlan)} starts on{" "}
              {formatPlanDate(pendingPlanStartsAt)}. Your current plan stays
              active until then.
            </Text>
          </View>
        )}

        {activePricingTab === "plans" ? (
          <>
            <PlanCard
              title="Free Plan"
              price={isInternationalBilling ? "$0" : formatNaira(0)}
              features={[
                "Manual goal tracking",
                "Focused 1-3 goal system",
                "Reminders and value meter",
                "No Goach access",
              ]}
              active={currentPlan === "free" && !isTrialActive}
              theme={theme}
            />

            {visiblePaidPlans.map((plan) => {
              const active =
                currentPlan === plan.id ||
                (isTrialActive && plan.id === "standard");
              const checkingOut = checkingOutPlanId === plan.id;
              const isRealCurrentPlan = currentPlan === plan.id && !isTrialActive;

              return (
                <PlanCard
                  key={plan.id}
                  title={plan.title}
                  price={
                    isInternationalBilling
                      ? `${plan.internationalPrice} / month`
                      : `${formatNaira(plan.basePrice)} / month`
                  }
                  subtitle={formatCheckoutSubtitle(
                    plan.basePrice,
                    plan.payablePrice,
                    billingProvider,
                  )}
                  features={plan.features}
                  highlight={plan.highlight}
                  active={active}
                  activeLabel={isTrialActive ? "TRIAL ACTIVE" : "CURRENT PLAN"}
                  theme={theme}
                  action={
                    isRealCurrentPlan && isCancellationScheduled ? (
                      <View
                        style={{
                          marginTop: 16,
                          backgroundColor: theme.primarySoft,
                          borderWidth: 1,
                          borderColor: theme.primary,
                          borderRadius: 15,
                          padding: 13,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <Ionicons
                          name="time-outline"
                          size={19}
                          color={theme.primary}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: theme.text,
                              fontWeight: "900",
                              fontSize: 14,
                            }}
                          >
                            Renewal cancelled
                          </Text>
                          <Text
                            style={{
                              color: theme.muted,
                              fontWeight: "700",
                              fontSize: 12,
                              lineHeight: 18,
                              marginTop: 3,
                            }}
                          >
                            Access stays until{" "}
                            {formatPlanDate(currentPeriodEndsAt)}.
                          </Text>
                        </View>
                      </View>
                    ) : isRealCurrentPlan && canCancelCurrentSubscription ? (
                      <TouchableOpacity
                        onPress={() => {
                          setCancelError("");
                          setShowCancelModal(true);
                        }}
                        disabled={billingLoading || cancelLoading}
                        style={{
                          backgroundColor: isDaylightTheme
                            ? "#fff1f2"
                            : "#2a1218",
                          paddingVertical: 13,
                          borderRadius: 15,
                          alignItems: "center",
                          marginTop: 16,
                          borderWidth: 1,
                          borderColor: "#ef4444",
                          opacity: billingLoading || cancelLoading ? 0.6 : 1,
                        }}
                      >
                        <Text
                          style={{
                            color: "#ef4444",
                            fontWeight: "900",
                            fontSize: 14,
                          }}
                        >
                          Cancel Renewal
                        </Text>
                      </TouchableOpacity>
                    ) : active ? null : (
                      <TouchableOpacity
                        onPress={() => handlePlanPress(plan)}
                        disabled={billingLoading}
                        style={{
                          backgroundColor: theme.primary,
                          paddingVertical: 14,
                          borderRadius: 15,
                          alignItems: "center",
                          marginTop: 16,
                          opacity: checkingOut ? 0.65 : 1,
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: "900",
                            fontSize: 15,
                          }}
                        >
                          {checkingOut
                            ? "Opening Checkout..."
                            : isPaidCurrentPlan
                              ? "Change Plan"
                              : "Choose Plan"}
                        </Text>
                      </TouchableOpacity>
                    )
                  }
                />
              );
            })}
          </>
        ) : (
          <>
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{ color: theme.text, fontSize: 22, fontWeight: "900" }}
              >
                Credit Packs
              </Text>
              <Text
                style={{
                  color: theme.muted,
                  marginTop: 6,
                  lineHeight: 21,
                  fontWeight: "700",
                }}
              >
                One-time Goach credits for anyone who needs extra planning help.
                They add to your current balance and do not change your monthly plan.
              </Text>
            </View>

            {creditPacks.map((pack) => {
                const checkingOut = checkingOutCreditPackId === pack.id;

                return (
                  <PlanCard
                    key={pack.id}
                    title={pack.title}
                    price={formatDisplayPrice(pack, billingProvider)}
                    subtitle={formatCheckoutSubtitle(
                      pack.basePrice,
                      pack.payablePrice,
                      billingProvider,
                    )}
                    features={[
                      pack.description,
                      `${pack.credits} credits added instantly after payment`,
                      "Does not change your current plan",
                    ]}
                    outlined
                    theme={theme}
                    action={
                      <TouchableOpacity
                        onPress={() => startCreditPackCheckout(pack)}
                        disabled={billingLoading}
                        style={{
                          backgroundColor: theme.primary,
                          paddingVertical: 13,
                          borderRadius: 14,
                          alignItems: "center",
                          marginTop: 16,
                          opacity: checkingOut ? 0.65 : 1,
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: "900",
                            fontSize: 14,
                          }}
                        >
                          {checkingOut ? "Opening Checkout..." : "Buy Credits"}
                        </Text>
                      </TouchableOpacity>
                    }
                  />
                );
              })}
          </>
        )}
        {activePricingTab === "plans" && currentPlan === "free" && !isTrialActive && (
          <PlanCard
            title="Tester Access"
            price="Invite only"
            features={[
              "For approved app testers",
              "Unlocks paid features for testing",
              "Includes Goach credits",
              "Requires tester password",
              "Remove before public release",
            ]}
            outlined
            theme={theme}
            action={
              <TouchableOpacity
                onPress={() => setShowTesterModal(true)}
                style={{
                  backgroundColor: theme.innerCard,
                  paddingVertical: 13,
                  borderRadius: 14,
                  alignItems: "center",
                  marginTop: 16,
                  borderWidth: 1,
                  borderColor: theme.primary,
                }}
              >
                <Text
                  style={{
                    color: theme.primary,
                    fontWeight: "900",
                    fontSize: 14,
                  }}
                >
                  Enter Tester Password
                </Text>
              </TouchableOpacity>
            }
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PlanChangeModal({
  currentPlanTitle,
  currentPeriodEndsAt,
  error,
  loading,
  onChangeNow,
  onClose,
  onSchedule,
  plan,
  theme,
  visible,
}: any) {
  if (!visible || !plan) return null;

  return (
    <SmoothModal visible={visible} onRequestClose={onClose}>
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
            maxWidth: 430,
            backgroundColor: theme.card,
            borderRadius: 24,
            padding: 22,
            borderWidth: 1,
            borderColor: theme.primary,
          }}
        >
          <Text
            style={{
              color: theme.text,
              fontSize: 22,
              fontWeight: "900",
              marginBottom: 8,
            }}
          >
            Change to {plan.title}
          </Text>

          <Text
            style={{
              color: theme.muted,
              fontSize: 14,
              lineHeight: 22,
              marginBottom: 16,
              fontWeight: "700",
            }}
          >
            Your {currentPlanTitle} stays active until{" "}
            {formatPlanDate(currentPeriodEndsAt)}. Then {plan.title} becomes
            your next plan.
          </Text>

          <View
            style={{
              backgroundColor: theme.innerCard,
              borderWidth: 1,
              borderColor: theme.border,
              borderRadius: 16,
              padding: 14,
              marginBottom: 14,
            }}
          >
            <Text style={{ color: theme.text, fontWeight: "900" }}>
              Recommended
            </Text>
            <Text style={{ color: theme.muted, lineHeight: 21, marginTop: 6 }}>
              Schedule the change for your next billing date. You keep the days
              you already paid for, and you will not pay for the new plan today.
            </Text>
          </View>

          {!!error && (
            <Text
              style={{
                color: "#f87171",
                fontSize: 13,
                lineHeight: 19,
                fontWeight: "700",
                marginBottom: 12,
              }}
            >
              {error}
            </Text>
          )}

          <SmoothPressable
            onPress={onSchedule}
            disabled={loading}
            style={{
              backgroundColor: theme.primary,
              paddingVertical: 14,
              borderRadius: 15,
              alignItems: "center",
              marginBottom: 10,
              opacity: loading ? 0.65 : 1,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>
              {loading ? "Scheduling..." : "Schedule Change"}
            </Text>
          </SmoothPressable>

          <SmoothPressable
            onPress={onChangeNow}
            disabled={loading}
            style={{
              backgroundColor: theme.innerCard,
              paddingVertical: 13,
              borderRadius: 15,
              alignItems: "center",
              borderWidth: 1,
              borderColor: theme.border,
              marginBottom: 10,
            }}
          >
            <Text style={{ color: theme.text, fontWeight: "900" }}>
              Change Now Instead
            </Text>
          </SmoothPressable>

          <SmoothPressable
            onPress={onClose}
            disabled={loading}
            style={{
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: theme.muted, fontWeight: "900" }}>
              Cancel
            </Text>
          </SmoothPressable>
        </View>
      </View>
    </SmoothModal>
  );
}

function CancelSubscriptionModal({
  currentPeriodEndsAt,
  currentPlanTitle,
  error,
  loading,
  onCancelSubscription,
  onClose,
  theme,
  visible,
}: any) {
  if (!visible) return null;

  return (
    <SmoothModal visible={visible} onRequestClose={onClose}>
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
            maxWidth: 430,
            backgroundColor: theme.card,
            borderRadius: 24,
            padding: 22,
            borderWidth: 1,
            borderColor: "#ef4444",
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 18,
              backgroundColor: "#ef444422",
              borderWidth: 1,
              borderColor: "#ef4444",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <Ionicons name="close-circle-outline" size={25} color="#ef4444" />
          </View>

          <Text
            style={{
              color: theme.text,
              fontSize: 22,
              fontWeight: "900",
              marginBottom: 8,
            }}
          >
            Cancel {currentPlanTitle}?
          </Text>

          <Text
            style={{
              color: theme.muted,
              fontSize: 14,
              lineHeight: 22,
              marginBottom: 16,
              fontWeight: "700",
            }}
          >
            This stops the next renewal. Your plan, remaining credits, and Goach
            access stay available until {formatPlanDate(currentPeriodEndsAt)}.
          </Text>

          <View
            style={{
              backgroundColor: theme.innerCard,
              borderWidth: 1,
              borderColor: theme.border,
              borderRadius: 16,
              padding: 14,
              marginBottom: 14,
            }}
          >
            <Text style={{ color: theme.text, fontWeight: "900" }}>
              What happens after cancel?
            </Text>
            <Text
              style={{
                color: theme.muted,
                lineHeight: 21,
                marginTop: 6,
                fontWeight: "700",
              }}
            >
              PIDA will not charge this subscription again. When the paid period
              ends, you can choose another plan or buy credit packs.
            </Text>
          </View>

          {!!error && (
            <Text
              style={{
                color: "#f87171",
                fontSize: 13,
                lineHeight: 19,
                fontWeight: "700",
                marginBottom: 12,
              }}
            >
              {error}
            </Text>
          )}

          <SmoothPressable
            onPress={onCancelSubscription}
            disabled={loading}
            style={{
              backgroundColor: "#ef4444",
              paddingVertical: 14,
              borderRadius: 15,
              alignItems: "center",
              marginBottom: 10,
              opacity: loading ? 0.65 : 1,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>
              {loading ? "Cancelling..." : "Cancel Renewal"}
            </Text>
          </SmoothPressable>

          <SmoothPressable
            onPress={onClose}
            disabled={loading}
            style={{
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: theme.muted, fontWeight: "900" }}>
              Keep My Plan
            </Text>
          </SmoothPressable>
        </View>
      </View>
    </SmoothModal>
  );
}

function CheckoutModal({
  billingError,
  billingLoading,
  billingProvider,
  billingReference,
  billingUrl,
  creditPack,
  mode,
  onClose,
  onOpenCheckout,
  onVerify,
  plan,
  theme,
  visible,
}: any) {
  if (!visible) return null;
  const isInternationalCheckout = billingProvider !== "paystack";
  const internationalProviderName =
    billingProvider === "paddle" ? "Paddle" : "Lemon Squeezy";

  const checkoutItem = mode === "credit_pack" ? creditPack : plan;
  const checkoutTitle =
    mode === "credit_pack"
      ? creditPack
        ? `${creditPack.title} Checkout`
        : "Credit Checkout"
      : plan
        ? `${plan.title} Checkout`
        : "Plan Checkout";

  return (
    <SmoothModal visible={visible} onRequestClose={onClose}>
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
            backgroundColor: theme.card,
            borderRadius: 24,
            padding: 22,
            borderWidth: 1,
            borderColor: theme.primary,
          }}
        >
          <Text
            style={{
              color: theme.text,
              fontSize: 22,
              fontWeight: "900",
              marginBottom: 8,
            }}
          >
            {checkoutTitle}
          </Text>

          <Text
            style={{
              color: theme.muted,
              fontSize: 14,
              lineHeight: 22,
              marginBottom: 18,
            }}
          >
            Complete checkout, then return here to verify your{" "}
            {mode === "credit_pack" ? "credit purchase" : "plan"}.{" "}
            {mode === "credit_pack"
              ? "Your extra credits are added to your current balance."
              : "Your plan credits are added to any credits you already have."}
          </Text>

          {checkoutItem ? (
            <View
              style={{
                backgroundColor: theme.innerCard,
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: theme.border,
                marginBottom: 18,
              }}
            >
              <Text
                style={{
                  color: theme.text,
                  fontWeight: "800",
                  marginBottom: 6,
                }}
              >
                Payment summary:
              </Text>

              {mode === "credit_pack" ? (
                <Text style={{ color: theme.muted, lineHeight: 21 }}>
                  - {creditPack.credits} Goach credits once{"\n"}
                  {isInternationalCheckout
                    ? `- International checkout through ${internationalProviderName}\n- Final price is shown before payment`
                    : `- Pack price: ${formatNaira(creditPack.basePrice)}\n- Processing fee: ${formatNaira(
                        creditPack.payablePrice - creditPack.basePrice,
                      )}\n- Total payable: ${formatNaira(
                        creditPack.payablePrice,
                      )}`}
                </Text>
              ) : (
                <Text style={{ color: theme.muted, lineHeight: 21 }}>
                  - {plan.credits} Goach credits monthly{"\n"}
                  {isInternationalCheckout
                    ? `- International subscription through ${internationalProviderName}\n- Final price is shown before payment`
                    : `- Plan price: ${formatNaira(plan.basePrice)}\n- Processing fee: ${formatNaira(
                        plan.payablePrice - plan.basePrice,
                      )}\n- Total payable: ${formatNaira(plan.payablePrice)}`}
                </Text>
              )}
            </View>
          ) : null}

          {!!billingError && (
            <Text
              style={{
                color: "#f87171",
                fontSize: 13,
                lineHeight: 19,
                fontWeight: "700",
                marginBottom: 12,
              }}
            >
              {billingError}
            </Text>
          )}

          {!!billingUrl && (
            <SmoothPressable
              onPress={onOpenCheckout}
              style={{
                backgroundColor: theme.innerCard,
                paddingVertical: 13,
                borderRadius: 15,
                alignItems: "center",
                borderWidth: 1,
                borderColor: theme.border,
                marginBottom: 10,
              }}
            >
              <Text style={{ color: theme.text, fontWeight: "800" }}>
                Reopen Checkout
              </Text>
            </SmoothPressable>
          )}

          {!!billingReference && (
            <SmoothPressable
              onPress={onVerify}
              disabled={billingLoading}
              style={{
                backgroundColor: theme.primary,
                paddingVertical: 14,
                borderRadius: 15,
                alignItems: "center",
                marginBottom: 10,
                opacity: billingLoading ? 0.65 : 1,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>
                {billingLoading
                  ? "Verifying..."
                  : mode === "credit_pack"
                    ? "I Have Bought Credits"
                    : "I Have Completed Checkout"}
              </Text>
            </SmoothPressable>
          )}

          <SmoothPressable
            onPress={onClose}
            style={{
              backgroundColor: billingReference ? theme.innerCard : theme.primary,
              paddingVertical: 13,
              borderRadius: 15,
              alignItems: "center",
              borderWidth: billingReference ? 1 : 0,
              borderColor: billingReference ? theme.border : "transparent",
            }}
          >
            <Text
              style={{
                color: billingReference ? theme.text : "#fff",
                fontWeight: "900",
              }}
            >
              {billingReference ? "Close" : "I Understand"}
            </Text>
          </SmoothPressable>
        </View>
      </View>
    </SmoothModal>
  );
}

function TesterModal({
  error,
  loading,
  onActivate,
  onClose,
  password,
  setPassword,
  setShowPassword,
  showPassword,
  theme,
  visible,
}: any) {
  if (!visible) return null;

  return (
    <SmoothModal visible={visible} onRequestClose={onClose}>
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
            backgroundColor: theme.card,
            borderRadius: 24,
            padding: 22,
            borderWidth: 1,
            borderColor: theme.primary,
          }}
        >
          <Text
            style={{
              color: theme.text,
              fontSize: 22,
              fontWeight: "900",
              marginBottom: 8,
            }}
          >
            Tester Access
          </Text>

          <Text
            style={{
              color: theme.muted,
              fontSize: 14,
              lineHeight: 22,
              marginBottom: 16,
            }}
          >
            Enter the tester password to unlock paid features and Goach credits
            for testing.
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.innerCard,
              borderWidth: 1,
              borderColor: theme.border,
              borderRadius: 14,
              marginBottom: 10,
            }}
          >
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Tester password"
              placeholderTextColor={theme.muted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              style={{
                flex: 1,
                color: theme.text,
                paddingHorizontal: 14,
                paddingVertical: 13,
              }}
            />

            <TouchableOpacity
              onPress={() => setShowPassword((prev: boolean) => !prev)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 12,
              }}
            >
              <Text
                style={{
                  color: theme.primary,
                  fontWeight: "900",
                  fontSize: 16,
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </Text>
            </TouchableOpacity>
          </View>

          {!!error && (
            <Text
              style={{
                color: "#f87171",
                fontSize: 13,
                marginBottom: 12,
                fontWeight: "700",
              }}
            >
              {error}
            </Text>
          )}

          <SmoothPressable
            onPress={onActivate}
            disabled={loading}
            style={{
              backgroundColor: theme.primary,
              paddingVertical: 14,
              borderRadius: 15,
              alignItems: "center",
              marginBottom: 10,
              opacity: loading ? 0.65 : 1,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>
              {loading ? "Activating..." : "Unlock Tester Mode"}
            </Text>
          </SmoothPressable>

          <SmoothPressable
            onPress={onClose}
            style={{
              backgroundColor: theme.innerCard,
              paddingVertical: 13,
              borderRadius: 15,
              alignItems: "center",
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Text style={{ color: theme.text, fontWeight: "800" }}>Cancel</Text>
          </SmoothPressable>
        </View>
      </View>
    </SmoothModal>
  );
}

function PlanCard({
  title,
  price,
  subtitle,
  features,
  highlight,
  active,
  activeLabel = "CURRENT PLAN",
  action,
  theme,
}: any) {
  const isCurrent = Boolean(active);
  const iconName = getPlanIcon(title);

  return (
    <View
      style={{
        backgroundColor: theme.card,
        borderColor: isCurrent || highlight ? theme.primary : theme.border,
        borderWidth: 1,
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOpacity: isCurrent || highlight ? 0.12 : 0.08,
        shadowRadius: isCurrent || highlight ? 16 : 12,
        shadowOffset: { width: 0, height: isCurrent || highlight ? 8 : 6 },
        elevation: isCurrent || highlight ? 3 : 2,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <View style={{ flex: 1, flexDirection: "row", gap: 12 }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 16,
              backgroundColor: theme.primarySoft,
              borderWidth: 1,
              borderColor: highlight || isCurrent ? theme.primary : theme.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name={iconName as any} size={21} color={theme.primary} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: "900" }}>
              {title}
            </Text>
            {highlight ? (
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: theme.primarySoft,
                  borderWidth: 1,
                  borderColor: theme.primary,
                  borderRadius: 999,
                  paddingHorizontal: 9,
                  paddingVertical: 4,
                  marginTop: 5,
                }}
              >
                <Text
                  style={{
                    color: theme.primary,
                    fontSize: 11,
                    fontWeight: "900",
                  }}
                >
                  Recommended
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {active ? (
          <View
            style={{
              backgroundColor: "#22c55e",
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 999,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              maxWidth: 120,
            }}
          >
            <Ionicons name="checkmark" size={12} color="#fff" />
            <Text
              numberOfLines={1}
              style={{ color: "#fff", fontWeight: "900", fontSize: 10 }}
            >
              {activeLabel}
            </Text>
          </View>
        ) : null}
      </View>

      <View
        style={{
          marginTop: 16,
          paddingTop: 14,
          borderTopWidth: 1,
          borderTopColor: theme.border,
        }}
      >
        <Text
          style={{
            color: highlight ? theme.primary : theme.text,
            fontSize: 25,
            fontWeight: "900",
          }}
        >
          {price}
        </Text>

        {!!subtitle && (
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: theme.innerCard,
              borderWidth: 1,
              borderColor: theme.border,
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 6,
              marginTop: 8,
            }}
          >
            <Text
              style={{
                color: theme.muted,
                fontSize: 12,
                fontWeight: "800",
              }}
            >
              {subtitle}
            </Text>
          </View>
        )}
      </View>

      <View style={{ marginTop: 14 }}>
        {features.map((feature: string) => (
          <View
            key={feature}
            style={{
              flexDirection: "row",
              gap: 9,
              alignItems: "flex-start",
              marginBottom: 9,
            }}
          >
            <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
            <Text
              style={{
                flex: 1,
                color: theme.text,
                lineHeight: 19,
                fontWeight: "700",
              }}
            >
              {feature}
            </Text>
          </View>
        ))}
      </View>

      {action}
    </View>
  );
}

