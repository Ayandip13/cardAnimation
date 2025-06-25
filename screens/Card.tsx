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

// const defaultCards = [
//   { title: 'News 1', content: 'This is the first news' },
//   { title: 'News 2', content: 'This is the second news' },
//   { title: 'News 3', content: 'This is the third news' },
//   { title: 'News 4', content: 'This is the fourth news' },
//   { title: 'News 5', content: 'This is the fifth news' },
// ];

interface CardSwiperProps {
  style?: ViewStyle;
  cardStyle?: ViewStyle;
  cards: { title: string; content: string }[]; 
}


export default function Card({
  style,
  cardStyle,
  cards 
}: CardSwiperProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const translateY = useSharedValue(0);

  const changeIndex = (newIndex: number) => {
    setCurrentIndex(newIndex);
    translateY.value = 0;
  };

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY < -100 && currentIndex < cards.length - 1) {
        translateY.value = withTiming(-height, {}, () => {
          runOnJS(changeIndex)(currentIndex + 1);
        });
      } else if (e.translationY > 100 && currentIndex > 0) {
        translateY.value = withTiming(height, {}, () => {
          runOnJS(changeIndex)(currentIndex - 1);
        });
      } else {
        translateY.value = withTiming(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
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
    opacity: 0.9,
    zIndex: -1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
