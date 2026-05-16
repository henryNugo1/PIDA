import { ReactNode, useEffect, useRef } from "react";
import { Animated, Text, TouchableOpacity, ViewStyle } from "react-native";

type Props = {
  title?: string;
  children?: ReactNode;
  onPress: () => void;
  theme: any;
  style?: ViewStyle;
};

export default function ThemeButton({
  title,
  children,
  onPress,
  theme,
  style,
}: Props) {
  const pulse = useRef(new Animated.Value(0)).current;

  const isLava = theme.effect === "lava";

  useEffect(() => {
    if (!isLava) return;

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [isLava]);

  const glow = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,90,0,0.35)", "rgba(255,120,0,0.9)"],
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} >
      <Animated.View
        style={[
          {
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",

            backgroundColor: isLava ? "#ff5a00" : theme.primary,
            borderColor: isLava ? glow : theme.primary,
            borderWidth: 1.5,

            shadowColor: isLava ? "#ff5a00" : "#000",
            shadowOpacity: isLava ? 0.7 : 0.2,
            shadowRadius: isLava ? 14 : 6,
            shadowOffset: { width: 0, height: 0 },

            elevation: isLava ? 10 : 3,
          },
          style,
        ]}
      >
        {title ? (
          <Text
            style={{
              color: "#fff",
              fontWeight: "700",
              fontSize: 14,
            }}
          >
            {title}
          </Text>
        ) : (
          children
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}
