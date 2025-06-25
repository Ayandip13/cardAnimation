import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
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

  const changeIndex = (direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? currentIndex + 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    translateY.value = 0;
    scale.value = 1;
    opacity.value = 1;
  };

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      translateY.value = e.translationY;

      // Scale down and fade out slightly as user swipes
      const progress = Math.min(Math.abs(e.translationY) / height, 1);
      scale.value = 1 - progress * 0.1;
      opacity.value = 1 - progress * 0.5;
    })
    .onEnd((e) => {
      const isSwipeUp = e.translationY < -height * 0.2; // 20% of screen height
      const isSwipeDown = e.translationY > height * 0.2;
      const velocityThreshold = 800; // Fast swipe

      if ((isSwipeUp || e.velocityY < -velocityThreshold) && currentIndex < cards.length - 1) {
        // Swipe up - go to next card
        translateY.value = withTiming(-height, { duration: 300 }, () => {
          runOnJS(changeIndex)('up');
        });
      } else if ((isSwipeDown || e.velocityY > velocityThreshold) && currentIndex > 0) {
        // Swipe down - go to previous card
        translateY.value = withTiming(height, { duration: 300 }, () => {
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
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const nextCardStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: 0.9 + (Math.max(translateY.value, 0) / height) * 0.1
      },
    ],
    opacity: 0.7 + (Math.max(translateY.value, 0) / height) * 0.3,
  }));

  const prevCardStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: 0.9 - (Math.min(translateY.value, 0) / height) * 0.1
      },
    ],
    opacity: 0.7 - (Math.min(translateY.value, 0) / height) * 0.3,
  }));

  return (
    <View style={[styles.container, style]}>
      {/* Next Card (behind current) */}
      {currentIndex < cards.length - 1 && (
        <Animated.View style={[styles.card, cardStyle, styles.behindCard, nextCardStyle]}>
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

      {/* Previous Card (below if exists) */}
      {currentIndex > 0 && (
        <Animated.View style={[styles.card, cardStyle, styles.prevCard, prevCardStyle]}>
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
  },
  card: {
    height: height * 0.8,
    width: width * 0.9,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    justifyContent: 'center',
    position: 'absolute',
  },
  behindCard: {
    top: 30,
    zIndex: -1,
    opacity: 0.7,
    transform: [{ scale: 0.9 }],
  },
  prevCard: {
    top: height * 0.85,
    zIndex: -2,
    opacity: 0.7,
    transform: [{ scale: 0.9 }],
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});