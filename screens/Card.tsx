import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
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

export default function Card({ style, cardStyle, cards }: CardSwiperProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const changeIndex = (newIndex: number) => {
    setCurrentIndex(newIndex);
    translateY.value = 0;
    scale.value = 1;
    opacity.value = 1;
  };

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      translateY.value = e.translationY;

      const ratio = Math.min(Math.abs(e.translationY) / 300, 0.7);
      const scaleRatio = Math.min(Math.abs(e.translationY) / 1000, 0.1);

      if (e.translationY < -50 || e.translationY > 50) {
        opacity.value = 1 - ratio;
        scale.value = 1 - scaleRatio;
      }
    })
    .onEnd((e) => {
      const isSwipeUp = e.translationY < -100;
      const isSwipeDown = e.translationY > 100;

      if (isSwipeUp && currentIndex < cards.length - 1) {
        translateY.value = withTiming(-height, {}, () => {
          runOnJS(changeIndex)(currentIndex + 1);
        });
      } else if (isSwipeDown && currentIndex > 0) {
        translateY.value = withTiming(height, {}, () => {
          runOnJS(changeIndex)(currentIndex - 1);
        });
      } else {
        // Revert if not enough swipe distance
        translateY.value = withTiming(0);
        scale.value = withTiming(1);
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

  const currentCard = cards[currentIndex];
  const previousCard = cards[currentIndex - 1];

  return (
    <View style={[styles.container, style]}>
      {previousCard && (
        <Animated.View style={[styles.card, cardStyle, styles.behindCard]}>
          <Text style={styles.title}>{previousCard.title}</Text>
          <Text>{previousCard.content}</Text>
        </Animated.View>
      )}

      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.card, cardStyle, animatedStyle]}>
          <Text style={styles.title}>{currentCard.title}</Text>
          <Text>{currentCard.content}</Text>
        </Animated.View>
      </GestureDetector>
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
    height: height * 0.85,
    width: width * 0.9,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    justifyContent: 'center',
  },
  behindCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: -1,
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
