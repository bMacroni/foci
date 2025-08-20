import { Animated, Easing } from 'react-native';

// Animation constants
export const ANIMATION_CONFIG = {
  FAST: { duration: 200, easing: Easing.out(Easing.cubic) },
  MEDIUM: { duration: 300, easing: Easing.out(Easing.cubic) },
  SLOW: { duration: 500, easing: Easing.out(Easing.cubic) },
  SPRING: { 
    tension: 100, 
    friction: 8,
    useNativeDriver: true 
  },
  BOUNCE: { 
    tension: 200, 
    friction: 3,
    useNativeDriver: true 
  }
};

// Common animation values
export const createAnimatedValue = (initialValue: number = 0) => 
  new Animated.Value(initialValue);

// Fade animations
export const fadeIn = (value: Animated.Value, duration: number = 300) => {
  return Animated.timing(value, {
    toValue: 1,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  });
};

export const fadeOut = (value: Animated.Value, duration: number = 300) => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    easing: Easing.in(Easing.cubic),
    useNativeDriver: true,
  });
};

// Scale animations
export const scaleIn = (value: Animated.Value, _duration: number = 300) => {
  return Animated.spring(value, {
    toValue: 1,
    ...ANIMATION_CONFIG.SPRING,
  });
};

export const scaleOut = (value: Animated.Value, _duration: number = 300) => {
  return Animated.spring(value, {
    toValue: 0.95,
    ...ANIMATION_CONFIG.SPRING,
  });
};

// Slide animations
export const slideInUp = (value: Animated.Value, duration: number = 300) => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  });
};

export const slideInDown = (value: Animated.Value, duration: number = 300) => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  });
};

// Pulse animation
export const pulse = (value: Animated.Value) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: 1.1,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  );
};

// Stagger animation for multiple items
export const staggerAnimation = (
  values: Animated.Value[],
  delay: number = 50,
  animation: (value: Animated.Value) => Animated.CompositeAnimation
) => {
  return values.map((value, index) => 
    Animated.sequence([
      Animated.delay(index * delay),
      animation(value),
    ])
  );
};

// Loading skeleton animation
export const skeletonAnimation = (value: Animated.Value) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: 0.3,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(value, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
    ])
  );
};

// Haptic feedback implementation
import HapticFeedback from 'react-native-haptic-feedback';

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  try {
    const hapticType = type === 'light' ? 'impactLight' : type === 'medium' ? 'impactMedium' : 'impactHeavy';
    HapticFeedback.trigger(hapticType, hapticOptions);
  } catch (_error) {
    console.warn(`Haptic feedback: ${type}`);
  }
};

// Animation hooks
export const useFadeAnimation = (initialValue: number = 0) => {
  const opacity = createAnimatedValue(initialValue);
  
  const doFadeIn = () => Animated.timing(opacity, {
    toValue: 1,
    duration: 300,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  }).start();
  
  const doFadeOut = () => Animated.timing(opacity, {
    toValue: 0,
    duration: 300,
    easing: Easing.in(Easing.cubic),
    useNativeDriver: true,
  }).start();
  
  return { opacity, fadeIn: doFadeIn, fadeOut: doFadeOut };
};

export const useScaleAnimation = (initialValue: number = 1) => {
  const scale = createAnimatedValue(initialValue);
  
  const doScaleIn = () => Animated.spring(scale, {
    toValue: 1,
    ...ANIMATION_CONFIG.SPRING,
  }).start();
  
  const doScaleOut = () => Animated.spring(scale, {
    toValue: 0.95,
    ...ANIMATION_CONFIG.SPRING,
  }).start();
  
  return { scale, scaleIn: doScaleIn, scaleOut: doScaleOut };
}; 