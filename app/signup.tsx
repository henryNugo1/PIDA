import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useContext, useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";

const genderOptions = ["Male", "Female", "Others"];

const currentYear = new Date().getFullYear();

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

export default function SignupScreen() {
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

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");

  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [dobAttempted, setDobAttempted] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordTouched, setPasswordTouched] = useState(false);
  const [passwordAttempted, setPasswordAttempted] = useState(false);
  const [passwordSubmitAttempt, setPasswordSubmitAttempt] = useState(0);
  const [confirmAttempted, setConfirmAttempted] = useState(false);
  const [formError, setFormError] = useState("");

  const monthInputRef = useRef<TextInput>(null);
  const yearInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordShake = useRef(new Animated.Value(0)).current;
  const dobShake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (passwordSubmitAttempt === 0) return;

    passwordShake.setValue(0);

    Animated.sequence([
      Animated.timing(passwordShake, {
        toValue: 1,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(passwordShake, {
        toValue: -1,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(passwordShake, {
        toValue: 1,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(passwordShake, {
        toValue: 0,
        duration: 55,
        useNativeDriver: true,
      }),
    ]).start();
  }, [passwordSubmitAttempt, passwordShake]);

  useEffect(() => {
    if (!dobAttempted || isDateOfBirthValid()) return;

    dobShake.setValue(0);

    Animated.sequence([
      Animated.timing(dobShake, {
        toValue: 1,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(dobShake, {
        toValue: -1,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(dobShake, {
        toValue: 1,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(dobShake, {
        toValue: 0,
        duration: 55,
        useNativeDriver: true,
      }),
    ]).start();
  }, [dobAttempted, birthDay, birthMonth, birthYear, dobShake]);

  if (!auth) return null;

  const formatApiDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const buildDateOfBirth = () => {
    const day = Number(birthDay);
    const month = Number(birthMonth);
    const year = Number(birthYear);

    if (!day || !month || !year) return null;
    if (birthYear.length !== 4) return null;
    if (year < 1900 || year > currentYear) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > getDaysInMonth(year, month)) return null;

    const selectedDate = new Date(year, month - 1, day);

    if (selectedDate > new Date()) return null;

    return selectedDate;
  };

  const isDateOfBirthValid = () => {
    return buildDateOfBirth() !== null;
  };

  const updateDateOfBirthIfValid = () => {
    const nextDate = buildDateOfBirth();
    setDateOfBirth(nextDate);
    return nextDate;
  };

  const handleDayChange = (value: string) => {
    const clean = value.replace(/\D/g, "").slice(0, 2);
    setBirthDay(clean);
    setDateOfBirth(null);
    setDobAttempted(false);

    if (clean.length === 2) {
      monthInputRef.current?.focus();
    }
  };

  const handleMonthChange = (value: string) => {
    const clean = value.replace(/\D/g, "").slice(0, 2);
    setBirthMonth(clean);
    setDateOfBirth(null);
    setDobAttempted(false);

    if (clean.length === 2) {
      yearInputRef.current?.focus();
    }
  };

  const handleYearChange = (value: string) => {
    const clean = value.replace(/\D/g, "").slice(0, 4);
    setBirthYear(clean);
    setDateOfBirth(null);
    setDobAttempted(false);

    if (clean.length === 4) {
      setTimeout(() => {
        updateDateOfBirthIfValid();
        emailInputRef.current?.focus();
      }, 0);
    }
  };

  const passwordChecks = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);
  const passwordHasError = passwordAttempted && !isPasswordStrong;

  const confirmHasError =
    confirmAttempted &&
    confirmPassword.length > 0 &&
    password !== confirmPassword;

  const shouldShowPasswordRules =
    passwordTouched || passwordAttempted || password.length > 0;

  const triggerPasswordError = () => {
    setPasswordAttempted(true);
    setPasswordSubmitAttempt((value) => value + 1);
    Vibration.vibrate(80);
  };

  const triggerDobError = () => {
    setDobAttempted(true);
    Vibration.vibrate(80);
  };

  const handleSignup = async () => {
    setFormError("");

    if (!firstName.trim()) {
      setFormError("Please enter your first name.");
      return;
    }

    if (!lastName.trim()) {
      setFormError("Please enter your last name.");
      return;
    }

    if (!gender) {
      setFormError("Please select your gender.");
      return;
    }

    const validDob = updateDateOfBirthIfValid();

    if (!validDob) {
      setFormError("Please enter a valid date of birth.");
      triggerDobError();
      return;
    }

    if (!email.trim()) {
      setFormError("Please enter your email address.");
      return;
    }

    if (!isPasswordStrong) {
      triggerPasswordError();
      return;
    }

    if (password !== confirmPassword) {
      setConfirmAttempted(true);
      setFormError("Both passwords must match.");
      Vibration.vibrate(80);
      return;
    }

    const result = await auth.signUp(email.trim(), password, {
      first_name: firstName.trim(),
      middle_name: middleName.trim(),
      last_name: lastName.trim(),
      gender,
      date_of_birth: formatApiDate(validDob),
    });

    if (result.error) {
      const message = result.error.toLowerCase();

      if (
        message.includes("email rate limit") ||
        message.includes("email rate exceeded")
      ) {
        setFormError(
          "Too many signup emails were sent. Please wait a few minutes and try again.",
        );
        return;
      }

      setFormError(result.error);
      return;
    }

    router.replace("/login");
  };

  const dobHasError = dobAttempted && !isDateOfBirthValid();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: UI.screen }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: 20,
            paddingTop: 28,
            paddingBottom: 90,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ color: UI.text, fontSize: 32, fontWeight: "900" }}>
            Create Account
          </Text>

          <Text style={{ color: UI.muted, marginTop: 8, marginBottom: 24 }}>
            Set up your profile so your plans feel more personal.
          </Text>

          {!!formError && (
            <Text
              style={{
                color: "#ef4444",
                fontWeight: "800",
                marginBottom: 12,
              }}
            >
              {formError}
            </Text>
          )}

          <View style={panelStyle(UI)}>
            <Text style={sectionTitle(UI)}>Personal Details</Text>

            <TextInput
              placeholder="First Name"
              placeholderTextColor={UI.muted}
              value={firstName}
              onChangeText={setFirstName}
              returnKeyType="next"
              style={inputStyle(UI)}
            />

            <TextInput
              placeholder="Middle Name Optional"
              placeholderTextColor={UI.muted}
              value={middleName}
              onChangeText={setMiddleName}
              returnKeyType="next"
              style={inputStyle(UI)}
            />

            <TextInput
              placeholder="Last Name"
              placeholderTextColor={UI.muted}
              value={lastName}
              onChangeText={setLastName}
              returnKeyType="next"
              style={inputStyle(UI)}
            />

            <TouchableOpacity
              onPress={() => setShowGenderModal(true)}
              style={inputStyle(UI)}
            >
              <Text style={{ color: gender ? UI.text : UI.muted }}>
                {gender || "Select Gender"}
              </Text>
            </TouchableOpacity>

            <Animated.View
              style={{
                transform: [
                  {
                    translateX: dobShake.interpolate({
                      inputRange: [-1, 1],
                      outputRange: [-8, 8],
                    }),
                  },
                ],
              }}
            >
              <Text
                style={{
                  color: UI.muted,
                  fontSize: 12,
                  fontWeight: "800",
                  marginBottom: 8,
                }}
              >
                Date of Birth
              </Text>

              <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                <TextInput
                  placeholder="DD"
                  placeholderTextColor={UI.muted}
                  value={birthDay}
                  onChangeText={handleDayChange}
                  keyboardType="number-pad"
                  maxLength={2}
                  returnKeyType="next"
                  style={[
                    inputStyle(UI),
                    {
                      flex: 1,
                      textAlign: "center",
                      borderColor: dobHasError ? "#ef4444" : UI.border,
                      marginBottom: 0,
                    },
                  ]}
                />

                <TextInput
                  ref={monthInputRef}
                  placeholder="MM"
                  placeholderTextColor={UI.muted}
                  value={birthMonth}
                  onChangeText={handleMonthChange}
                  keyboardType="number-pad"
                  maxLength={2}
                  returnKeyType="next"
                  style={[
                    inputStyle(UI),
                    {
                      flex: 1,
                      textAlign: "center",
                      borderColor: dobHasError ? "#ef4444" : UI.border,
                      marginBottom: 0,
                    },
                  ]}
                />

                <TextInput
                  ref={yearInputRef}
                  placeholder="YYYY"
                  placeholderTextColor={UI.muted}
                  value={birthYear}
                  onChangeText={handleYearChange}
                  keyboardType="number-pad"
                  maxLength={4}
                  returnKeyType="next"
                  style={[
                    inputStyle(UI),
                    {
                      flex: 1.4,
                      textAlign: "center",
                      borderColor: dobHasError ? "#ef4444" : UI.border,
                      marginBottom: 0,
                    },
                  ]}
                />
              </View>

              <Text
                style={{
                  color: dobHasError ? "#ef4444" : UI.muted,
                  fontSize: 12,
                  fontWeight: "700",
                  marginBottom: 12,
                }}
              >
                {dateOfBirth
                  ? `DOB: ${formatDisplayDate(dateOfBirth)}`
                  : "Use dd/mm/yyyy, for example 09/05/2004"}
              </Text>
            </Animated.View>
          </View>

          <View style={panelStyle(UI)}>
            <Text style={sectionTitle(UI)}>Login Details</Text>

            <TextInput
              ref={emailInputRef}
              placeholder="Email Address"
              placeholderTextColor={UI.muted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              style={inputStyle(UI)}
            />

            <Animated.View
              style={{
                transform: [
                  {
                    translateX: passwordShake.interpolate({
                      inputRange: [-1, 1],
                      outputRange: [-8, 8],
                    }),
                  },
                ],
              }}
            >
              <View
                style={[
                  passwordInputWrapStyle(UI),
                  {
                    borderColor: passwordHasError ? "#ef4444" : UI.border,
                    marginBottom: 8,
                  },
                ]}
              >
                <TextInput
                  placeholder="Password"
                  placeholderTextColor={UI.muted}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setPasswordTouched(true);
                    setPasswordAttempted(false);
                  }}
                  onBlur={() => setPasswordTouched(true)}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
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
            </Animated.View>

            <View style={{ marginBottom: 12 }}>
              <PasswordRule
                label="At least 8 characters"
                passed={passwordChecks.minLength}
                active={shouldShowPasswordRules}
                failedSubmitTick={passwordSubmitAttempt}
                UI={UI}
              />
              <PasswordRule
                label="One uppercase letter"
                passed={passwordChecks.uppercase}
                active={shouldShowPasswordRules}
                failedSubmitTick={passwordSubmitAttempt}
                UI={UI}
              />
              <PasswordRule
                label="One number"
                passed={passwordChecks.number}
                active={shouldShowPasswordRules}
                failedSubmitTick={passwordSubmitAttempt}
                UI={UI}
              />
              <PasswordRule
                label="One symbol"
                passed={passwordChecks.symbol}
                active={shouldShowPasswordRules}
                failedSubmitTick={passwordSubmitAttempt}
                UI={UI}
              />
            </View>

            <View
              style={[
                passwordInputWrapStyle(UI),
                {
                  borderColor: confirmHasError ? "#ef4444" : UI.border,
                },
              ]}
            >
              <TextInput
                placeholder="Confirm Password"
                placeholderTextColor={UI.muted}
                value={confirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  setConfirmAttempted(false);
                }}
                onBlur={() => setConfirmAttempted(true)}
                secureTextEntry={!showConfirmPassword}
                returnKeyType="done"
                style={passwordInputTextStyle(UI)}
              />

              <TouchableOpacity
                onPress={() => setShowConfirmPassword((value) => !value)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={UI.muted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSignup}
            style={{
              backgroundColor: UI.primary,
              padding: 16,
              borderRadius: 16,
              alignItems: "center",
              marginTop: 18,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
              Create Account
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/login")}
            style={{ marginTop: 20, alignItems: "center" }}
          >
            <Text style={{ color: UI.primary, fontWeight: "800" }}>
              Already have an account? Sign in
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showGenderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowGenderModal(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.65)",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: UI.card,
              borderColor: UI.border,
              borderWidth: 1,
              borderRadius: 22,
              padding: 18,
            }}
          >
            <Text
              style={{
                color: UI.text,
                fontSize: 20,
                fontWeight: "900",
                marginBottom: 14,
              }}
            >
              Select Gender
            </Text>

            {genderOptions.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => {
                  setGender(item);
                  setShowGenderModal(false);
                }}
                style={{
                  padding: 15,
                  borderRadius: 14,
                  backgroundColor: gender === item ? UI.primary : "transparent",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    color: gender === item ? "#fff" : UI.text,
                    fontWeight: "800",
                  }}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function PasswordRule({
  label,
  passed,
  active,
  failedSubmitTick,
  UI,
}: {
  label: string;
  passed: boolean;
  active: boolean;
  failedSubmitTick: number;
  UI: any;
}) {
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active || passed || failedSubmitTick === 0) return;

    shake.setValue(0);

    Animated.sequence([
      Animated.timing(shake, {
        toValue: 1,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: -1,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: 1,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: 0,
        duration: 55,
        useNativeDriver: true,
      }),
    ]).start();
  }, [active, passed, failedSubmitTick, shake]);

  const color = !active ? UI.muted : passed ? "#22c55e" : "#ef4444";

  return (
    <Animated.Text
      style={{
        color,
        fontSize: 12,
        fontWeight: "700",
        marginBottom: 5,
        transform: [
          {
            translateX: shake.interpolate({
              inputRange: [-1, 1],
              outputRange: [-7, 7],
            }),
          },
        ],
      }}
    >
      {passed ? "✓" : "•"} {label}
    </Animated.Text>
  );
}

function sectionTitle(UI: any) {
  return {
    color: UI.text,
    fontSize: 15,
    fontWeight: "900" as const,
    marginBottom: 12,
  };
}

function panelStyle(UI: any) {
  return {
    backgroundColor: UI.card,
    borderColor: UI.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  };
}

function inputStyle(UI: any) {
  return {
    backgroundColor: UI.screen,
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
    backgroundColor: UI.screen,
    borderColor: UI.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
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
