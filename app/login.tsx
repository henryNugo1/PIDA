import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useContext, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";

export default function LoginScreen() {
  const auth = useContext(AuthContext);
  const themeCtx = useContext(ThemeContext);
  const theme = themeCtx?.theme;

  const UI = theme ?? {
    screen: "#050505",
    card: "#0f0f0f",
    border: "#262626",
    text: "#ffffff",
    muted: "#a3a3a3",
    primary: "#2563eb",
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  if (!auth) return null;

  const handleLogin = async () => {
    setLoginError("");

    const result = await auth.signIn(email.trim(), password);

    if (result.error) {
      setLoginError("Invalid credentials");
      return;
    }

    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: UI.screen, padding: 20 }}>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={{ color: UI.text, fontSize: 30, fontWeight: "900" }}>
          Welcome Back
        </Text>

        <Text style={{ color: UI.muted, marginTop: 8, marginBottom: 24 }}>
          Sign in to continue your goals.
        </Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor={UI.muted}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setLoginError("");
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          style={inputStyle(UI)}
        />

        <View
          style={[
            passwordInputWrapStyle(UI),
            {
              borderColor: loginError ? "#ef4444" : UI.border,
              marginBottom: loginError ? 6 : 18,
            },
          ]}
        >
          <TextInput
            placeholder="Password"
            placeholderTextColor={UI.muted}
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setLoginError("");
            }}
            secureTextEntry={!showPassword}
            style={passwordInputTextStyle(UI)}
          />

          <TouchableOpacity
            onPress={() => setShowPassword((value) => !value)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={UI.muted}
            />
          </TouchableOpacity>
        </View>

        {!!loginError && (
          <Text
            style={{
              color: "#ef4444",
              fontSize: 12,
              fontWeight: "800",
              marginBottom: 14,
            }}
          >
            {loginError}
          </Text>
        )}

        <TouchableOpacity
          onPress={handleLogin}
          style={{
            backgroundColor: UI.primary,
            padding: 15,
            borderRadius: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "800" }}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/signup")}
          style={{ marginTop: 18, alignItems: "center" }}
        >
          <Text style={{ color: UI.primary, fontWeight: "700" }}>
            Don&apos;t have an account? Create one
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function inputStyle(UI: any) {
  return {
    backgroundColor: UI.card,
    color: UI.text,
    borderColor: UI.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  };
}

function passwordInputWrapStyle(UI: any) {
  return {
    backgroundColor: UI.card,
    borderColor: UI.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row" as const,
    alignItems: "center" as const,
  };
}

function passwordInputTextStyle(UI: any) {
  return {
    flex: 1,
    color: UI.text,
    paddingVertical: 14,
    paddingRight: 12,
  };
}
