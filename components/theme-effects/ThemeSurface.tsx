import { ReactNode, useEffect, useMemo, useRef } from "react";
import { Animated, StyleProp, View, ViewStyle } from "react-native";

type ThemeSurfaceProps = {
  children: ReactNode;
  theme: any;
  style?: StyleProp<ViewStyle>;
  lavaBackground?: boolean;
};

export default function ThemeSurface({
  children,
  theme,
  style,
  lavaBackground = false,
}: ThemeSurfaceProps) {
  const lavaPan = useRef(new Animated.Value(0)).current;
  const lavaPulse = useRef(new Animated.Value(0)).current;

  const shouldShowLavaImage =
    lavaBackground && theme.effect === "lava" && theme.cardBackgroundImage;

  useEffect(() => {
    if (!shouldShowLavaImage) return;

    const panLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(lavaPan, {
          toValue: 1,
          duration: 9000,
          useNativeDriver: true,
        }),
        Animated.timing(lavaPan, {
          toValue: 0,
          duration: 9000,
          useNativeDriver: true,
        }),
      ]),
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(lavaPulse, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(lavaPulse, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ]),
    );

    panLoop.start();
    pulseLoop.start();

    return () => {
      panLoop.stop();
      pulseLoop.stop();
    };
  }, [shouldShowLavaImage, lavaPan, lavaPulse]);

  const baseStyle = useMemo(
    () => ({
      overflow: "hidden" as const,
      backgroundColor: theme.card,
      borderColor: shouldShowLavaImage ? theme.primary : theme.border,
      shadowColor: shouldShowLavaImage ? theme.primary : "#000",
      shadowOpacity: shouldShowLavaImage ? 0.34 : 0.18,
      shadowRadius: shouldShowLavaImage ? 16 : 8,
      shadowOffset: { width: 0, height: shouldShowLavaImage ? 0 : 4 },
      elevation: shouldShowLavaImage ? 9 : 3,
    }),
    [theme.card, theme.border, theme.primary, shouldShowLavaImage],
  );

  const lavaTranslateX = lavaPan.interpolate({
    inputRange: [0, 1],
    outputRange: [-16, 16],
  });

  const lavaScale = lavaPan.interpolate({
    inputRange: [0, 1],
    outputRange: [1.08, 1.16],
  });

const lavaOpacity = lavaPulse.interpolate({
  inputRange: [0, 1],
  outputRange: [0.28, 0.56],
});

  return (
    <Animated.View style={[baseStyle, style]}>
      {shouldShowLavaImage && (
        <>
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            }}
          >
            <Animated.Image
              source={theme.cardBackgroundImage}
              resizeMode="cover"
              fadeDuration={0}
              style={{
                position: "absolute",
                top: -10,
                left: -18,
                right: -18,
                bottom: -10,
                opacity: lavaOpacity,
                transform: [{ translateX: lavaTranslateX }, { scale: lavaScale }],
              }}
            />
          </Animated.View>

          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: "rgba(10,4,2,0.26)",
            }}
          />
        </>
      )}

      {children}
    </Animated.View>
  );
}
