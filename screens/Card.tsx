import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';

const { height, width } = Dimensions.get('window');

interface CardSwiperProps {
  style?: ViewStyle;
  cardStyle?: ViewStyle;
  cards: { title: string; content: string }[];
}

export default function CardSwiper({ style, cardStyle, cards }: CardSwiperProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const nextCardScale = useSharedValue(0.92);
  const nextCardOpacity = useSharedValue(0);
  const prevCardScale = useSharedValue(0.92);
  const prevCardOpacity = useSharedValue(0);

  const changeIndex = (direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? currentIndex + 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    translateY.value = 0;
    scale.value = 1;
    opacity.value = 1;
    nextCardScale.value = 0.92;
    nextCardOpacity.value = 0;
    prevCardScale.value = 0.92;
    prevCardOpacity.value = 0;
  };

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      translateY.value = e.translationY;

      // Scale down and fade out current card as user swipes
      const progress = Math.min(Math.abs(e.translationY) / height, 1);
      scale.value = 1 - progress * 0.1;
      opacity.value = 1 - progress * 0.8;

      // Animate next/previous cards based on direction
      if (e.translationY < 0 && currentIndex < cards.length - 1) {
        // Swiping up - animate next card
        const nextProgress = Math.min(Math.abs(e.translationY) / height, 1);
        nextCardScale.value = 0.92 + nextProgress * 0.08;
        nextCardOpacity.value = nextProgress * 0.7;
      } else if (e.translationY > 0 && currentIndex > 0) {
        // Swiping down - animate previous card
        const prevProgress = Math.min(Math.abs(e.translationY) / height, 1);
        prevCardScale.value = 0.92 + prevProgress * 0.08;
        prevCardOpacity.value = prevProgress * 0.7;
      }
    })
    .onEnd((e) => {
      const isSwipeUp = e.translationY < -height * 0.15;
      const isSwipeDown = e.translationY > height * 0.15;
      const velocityThreshold = 600;

      if ((isSwipeUp || e.velocityY < -velocityThreshold) && currentIndex < cards.length - 1) {
        // Swipe up - go to next card
        translateY.value = withTiming(-height, { duration: 300 });
        scale.value = withTiming(0.8, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        nextCardScale.value = withTiming(1, { duration: 300 });
        nextCardOpacity.value = withTiming(0.7, { duration: 300 }, () => {
          runOnJS(changeIndex)('up');
        });
      } else if ((isSwipeDown || e.velocityY > velocityThreshold) && currentIndex > 0) {
        // Swipe down - go to previous card
        translateY.value = withTiming(height, { duration: 300 });
        scale.value = withTiming(0.8, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        prevCardScale.value = withTiming(1, { duration: 300 });
        prevCardOpacity.value = withTiming(0.7, { duration: 300 }, () => {
          runOnJS(changeIndex)('down');
        });
      } else {
        // Return to center if not swiped enough
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
        scale.value = withSpring(1);
        opacity.value = withTiming(1);
        nextCardScale.value = withTiming(0.92);
        nextCardOpacity.value = withTiming(0);
        prevCardScale.value = withTiming(0.92);
        prevCardOpacity.value = withTiming(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
    zIndex: 10,
  }));

  const nextCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: nextCardScale.value },
      { translateY: 30 } // Fixed position for next card
    ],
    opacity: nextCardOpacity.value,
    zIndex: 5,
  }));

  const prevCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: prevCardScale.value },
      { translateY: 30 } // Fixed position for previous card
    ],
    opacity: prevCardOpacity.value,
    zIndex: 1,
  }));

  return (
    <View style={[styles.container, style]}>
      {/* Only show next card if we're not swiping down */}
      {currentIndex < cards.length - 1 && translateY.value >= 0 && (
        <Animated.View style={[styles.card, cardStyle, nextCardStyle]}>
          <Text style={styles.title}>{cards[currentIndex + 1].title}</Text>
          <Text>{cards[currentIndex + 1].content}</Text>
        </Animated.View>
      )}

      {/* Current Card (interactive) */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.card, cardStyle, animatedStyle]}>
          <Text style={styles.title}>{cards[currentIndex].title}</Text>
          <Text>{cards[currentIndex].content}</Text>
        </Animated.View>
      </GestureDetector>

      {/* Only show previous card if we're not swiping up */}
      {currentIndex > 0 && translateY.value <= 0 && (
        <Animated.View style={[styles.card, cardStyle, prevCardStyle]}>
          <Text style={styles.title}>{cards[currentIndex - 1].title}</Text>
          <Text>{cards[currentIndex - 1].content}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  card: {
    height: height * 0.85,
    width: width * 0.9,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    justifyContent: 'center',
    position: 'absolute',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
});