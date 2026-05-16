import { router } from "expo-router";
import { useContext, useState } from "react";
import {
  Linking,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";

export default function PricingScreen() {
  const auth = useContext(AuthContext);
  const themeCtx = useContext(ThemeContext);

  if (!themeCtx) return null;

  const { theme } = themeCtx;
  const currentPlan = auth?.profile?.plan ?? "free";
  const hasPremiumAccess = auth?.trialStatus.hasPremiumAccess ?? false;
  const isTrialActive = auth?.trialStatus.isTrialActive ?? false;
  const canStartTrial = auth?.trialStatus.canStartTrial ?? false;
  const trialDaysLeft = auth?.trialStatus.trialDaysLeft ?? 0;

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState("");
  const [billingReference, setBillingReference] = useState("");
  const [billingUrl, setBillingUrl] = useState("");

  const [showTesterModal, setShowTesterModal] = useState(false);

  const [testerPassword, setTesterPassword] = useState("");
  const [testerLoading, setTesterLoading] = useState(false);
  const [testerError, setTesterError] = useState("");

  const BASE_URL = "http://10.34.119.209:3000";

  const startTrialCheckout = async () => {
    try {
      if (!auth?.user?.id || !auth?.profile?.email) {
        setBillingError("Please sign in before starting your trial.");
        setShowPaymentModal(true);
        return;
      }

      setBillingLoading(true);
      setBillingError("");
      setBillingReference("");
      setBillingUrl("");

      const res = await fetch(`${BASE_URL}/billing/start-trial`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: auth.user.id,
          email: auth.profile.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBillingError(data?.error || "Unable to start trial checkout.");
        setShowPaymentModal(true);
        return;
      }

      setBillingReference(String(data.reference ?? ""));
      setBillingUrl(String(data.authorizationUrl ?? ""));
      setShowPaymentModal(true);

      if (data.authorizationUrl) {
        await Linking.openURL(String(data.authorizationUrl));
      }
    } catch (error: any) {
      setBillingError(error?.message || "Unable to open Paystack checkout.");
      setShowPaymentModal(true);
    } finally {
      setBillingLoading(false);
    }
  };

  const verifyTrialCheckout = async () => {
    try {
      if (!auth?.user?.id || !billingReference) {
        setBillingError("Checkout reference is missing.");
        return;
      }

      setBillingLoading(true);
      setBillingError("");

      const res = await fetch(`${BASE_URL}/billing/verify-trial`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: auth.user.id,
          reference: billingReference,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBillingError(data?.error || "Trial verification failed.");
        return;
      }

      await auth.refreshProfile();

      setBillingReference("");
      setBillingUrl("");
      setShowPaymentModal(false);
    } catch (error: any) {
      setBillingError(error?.message || "Unable to verify trial checkout.");
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

      const res = await fetch(`${BASE_URL}/tester/activate`, {
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
          ai_credits: Number(data?.aiCredits ?? 300),
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
      {showPaymentModal && (
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
                Premium Trial Setup
              </Text>

              <Text
                style={{
                  color: theme.muted,
                  fontSize: 14,
                  lineHeight: 22,
                  marginBottom: 18,
                }}
              >
                Complete the Paystack checkout to authorize your card. You will
                not be charged today. After checkout, return here and verify
                your trial setup.
              </Text>

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
                  Trial terms:
                </Text>

                <Text style={{ color: theme.muted, lineHeight: 21 }}>
                  • 7 days of Premium access{"\n"}• ₦0 due today{"\n"}• We’ll
                  notify you 2 days before billing{"\n"}• Cancel anytime before
                  the trial ends{"\n"}• If not cancelled, your plan renews at
                  ₦3,500/month
                </Text>
              </View>

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
                <TouchableOpacity
                  onPress={() => Linking.openURL(billingUrl)}
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
                    Reopen Paystack Checkout
                  </Text>
                </TouchableOpacity>
              )}

              {!!billingReference && (
                <TouchableOpacity
                  onPress={verifyTrialCheckout}
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
                      : "I’ve Completed Checkout"}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  setShowPaymentModal(false);
                  setBillingError("");
                }}
                style={{
                  backgroundColor: billingReference
                    ? theme.innerCard
                    : theme.primary,
                  paddingVertical: 13,
                  borderRadius: 15,
                  alignItems: "center",
                  borderWidth: billingReference ? 1 : 0,
                  borderColor: billingReference ? theme.border : "transparent",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "900" }}>
                  {billingReference ? "Close" : "I Understand"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {showTesterModal && (
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
                Enter the tester password to unlock Premium mode and AI credits
                for testing.
              </Text>

              <TextInput
                value={testerPassword}
                onChangeText={(text) => {
                  setTesterPassword(text);
                  setTesterError("");
                }}
                placeholder="Tester password"
                placeholderTextColor={theme.muted}
                secureTextEntry
                autoCapitalize="none"
                style={{
                  backgroundColor: theme.innerCard,
                  color: theme.text,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 13,
                  marginBottom: 10,
                }}
              />

              {!!testerError && (
                <Text
                  style={{
                    color: "#f87171",
                    fontSize: 13,
                    marginBottom: 12,
                    fontWeight: "700",
                  }}
                >
                  {testerError}
                </Text>
              )}

              <TouchableOpacity
                onPress={activateTesterMode}
                disabled={testerLoading}
                style={{
                  backgroundColor: theme.primary,
                  paddingVertical: 14,
                  borderRadius: 15,
                  alignItems: "center",
                  marginBottom: 10,
                  opacity: testerLoading ? 0.65 : 1,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "900" }}>
                  {testerLoading ? "Activating..." : "Unlock Tester Mode"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowTesterModal(false);
                  setTesterPassword("");
                  setTesterError("");
                }}
                style={{
                  backgroundColor: theme.innerCard,
                  paddingVertical: 13,
                  borderRadius: 15,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <Text style={{ color: theme.text, fontWeight: "800" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 22,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: theme.card,
              borderWidth: 1,
              borderColor: theme.border,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            <Text
              style={{ color: theme.text, fontSize: 18, fontWeight: "800" }}
            >
              ←
            </Text>
          </TouchableOpacity>

          <Text style={{ color: theme.text, fontSize: 30, fontWeight: "900" }}>
            Choose Your Plan
          </Text>
        </View>

        

        <Text style={{ color: theme.muted, marginTop: 8, marginBottom: 24 }}>
          Start on Free. Premium begins with a 7-day trial before monthly
          billing.
        </Text>

        <PlanCard
          title="Free Plan"
          price="₦0"
          features={[
            "Manual Goal Tracking",
            "1 Active Goal Card",
            "Basic Themes",
            "No AI Coach Access",
          ]}
          active={currentPlan === "free" && !isTrialActive}
          theme={theme}
        />

        <PlanCard
          title="Premium Plan"
          price="7 days free, then ₦3,500 / month"
          features={[
            "Card required to start trial",
            "₦0 due today",
            "Cancel anytime before billing starts",
            "Reminder 2 days before trial ends",
            "300 AI credits monthly",
            "Unlimited goal cards",
            "Premium themes",
            "Goal Coach planning and editing",
          ]}
          highlight
          active={currentPlan === "premium" || isTrialActive}
          activeLabel={
            isTrialActive
              ? `TRIAL ACTIVE • ${trialDaysLeft} DAY${trialDaysLeft === 1 ? "" : "S"} LEFT`
              : "CURRENT PLAN"
          }
          theme={theme}
          action={
            currentPlan === "premium" ||
            isTrialActive ? null : canStartTrial ? (
              <TouchableOpacity
                onPress={startTrialCheckout}
                style={{
                  backgroundColor: theme.primary,
                  paddingVertical: 14,
                  borderRadius: 15,
                  alignItems: "center",
                  marginTop: 16,
                }}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "900", fontSize: 15 }}
                >
                  {billingLoading
                    ? "Opening Checkout..."
                    : "Start 7-Day Free Trial"}
                </Text>
              </TouchableOpacity>
            ) : (
              <View
                style={{
                  backgroundColor: theme.innerCard,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: theme.border,
                  padding: 13,
                  marginTop: 16,
                }}
              >
                <Text
                  style={{
                    color: theme.muted,
                    fontSize: 13,
                    lineHeight: 19,
                    fontWeight: "700",
                  }}
                >
                  Your free trial has already been used. Premium billing will be
                  available when payments are connected.
                </Text>
              </View>
            )
          }
        />

        {currentPlan !== "premium" && !isTrialActive && (
          <PlanCard
            title="Tester Access"
            price="Invite only"
            features={[
              "For approved app testers",
              "Unlocks Premium features for testing",
              "Includes AI credits",
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

function PlanCard({
  title,
  price,
  features,
  highlight,
  outlined,
  active,
  activeLabel = "CURRENT PLAN",
  action,
  theme,
}: any) {
  return (
    <View
      style={{
        backgroundColor: highlight ? theme.primarySoft : theme.card,
        borderColor: highlight ? theme.primary : theme.border,

        borderWidth: 1,
        borderRadius: 22,
        padding: 20,
        marginBottom: 16,
      }}
    >
      <Text style={{ color: theme.text, fontSize: 20, fontWeight: "900" }}>
        {title}
      </Text>

      <Text
        style={{
          color: highlight ? theme.primary : theme.text,
          fontSize: 24,
          fontWeight: "900",
          marginTop: 6,
        }}
      >
        {price}
      </Text>

      <View style={{ marginTop: 14 }}>
        {features.map((f: string, i: number) => (
          <Text
            key={i}
            style={{ color: theme.text, marginBottom: 6, fontWeight: "600" }}
          >
            • {f}
          </Text>
        ))}
      </View>

      {action}

      {active && (
        <View
          style={{
            marginTop: 14,
            backgroundColor: "#22c55e",
            paddingVertical: 6,
            borderRadius: 999,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 12 }}>
            {activeLabel}
          </Text>
        </View>
      )}
    </View>
  );
}
