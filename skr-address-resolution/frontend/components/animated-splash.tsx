import { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';

interface AnimatedSplashProps {
  onAnimationComplete?: () => void;
}

export function AnimatedSplash({ onAnimationComplete }: AnimatedSplashProps) {
  const containerOpacity = useSharedValue(1);
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    // Play animation
    animationRef.current?.play();

    // Wait for animation to play, then fade out and transition
    const timeout = setTimeout(() => {
      containerOpacity.value = withDelay(
        500,
        withTiming(0, { duration: 600 }, (finished) => {
          if (finished && onAnimationComplete) {
            runOnJS(onAnimationComplete)();
          }
        })
      );
    }, 1000); // Animation plays for ~1 seconds

    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.content}>
        {/* Arrow Transition Animation */}
        <LottieView
          ref={animationRef}
          source={require('@/assets/lottie/arrow-transition.json')}
          autoPlay
          loop={false}
          resizeMode="cover"
          style={styles.animation}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  animation: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
