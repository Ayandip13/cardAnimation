import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ViewStyle,
  Text,
  Image,
  ImageProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { height, width } = Dimensions.get('window');

export interface CardItem {
  title: string;
  content: string;
  image: ImageProps;
}

interface CardSwiperProps {
  style?: ViewStyle;
  cardStyle?: ViewStyle;
  cards: CardItem[];
  renderCard?: (item: CardItem, index: number) => React.ReactNode;
  loop?: boolean;
  onSwipe?: (direction: 'up' | 'down', index: number) => void;
}

export default function CardSwiper({
  style,
  cardStyle,
  cards,
  renderCard,
  loop = false,
  onSwipe,
}: CardSwiperProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const nextCardScale = useSharedValue(0.92);
  const nextCardOpacity = useSharedValue(0);
  const prevCardScale = useSharedValue(0.92);
  const prevCardOpacity = useSharedValue(0);

  const changeIndex = (direction: 'up' | 'down') => {
    setTimeout(() => {
      let newIndex = direction === 'up' ? currentIndex + 1 : currentIndex - 1;
      if (loop) newIndex = (newIndex + cards.length) % cards.length;
      if (newIndex >= 0 && newIndex < cards.length) {
        onSwipe?.(direction, newIndex);
        setCurrentIndex(newIndex);
      }
      translateY.value = 0;
      scale.value = 1;
      opacity.value = 1;
      nextCardScale.value = 0.92;
      nextCardOpacity.value = 0;
      prevCardScale.value = 0.92;
      prevCardOpacity.value = 0;
    }, 100);
  };

  const gesture = Gesture.Pan()
    .onUpdate(e => {
      translateY.value = e.translationY;
      const progress = Math.min(Math.abs(e.translationY) / height, 1);
      scale.value = 1 - progress * 0.1;
      opacity.value = 1 - progress * 0.8;

      if (e.translationY < 0 && (loop || currentIndex < cards.length - 1)) {
        const nextProgress = progress;
        nextCardScale.value = 0.92 + nextProgress * 0.08;
        nextCardOpacity.value = nextProgress * 0.7;
      } else if (e.translationY > 0 && (loop || currentIndex > 0)) {
        const prevProgress = progress;
        prevCardScale.value = 0.92 + prevProgress * 0.08;
        prevCardOpacity.value = prevProgress * 0.7;
      }
    })
    .onEnd(e => {
      const isSwipeUp = e.translationY < -height * 0.15;
      const isSwipeDown = e.translationY > height * 0.15;
      const velocityThreshold = 600;

      if (
        (isSwipeUp || e.velocityY < -velocityThreshold) &&
        (loop || currentIndex < cards.length - 1)
      ) {
        translateY.value = withTiming(-height, { duration: 300 });
        scale.value = withTiming(0.8, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        nextCardScale.value = withTiming(1, { duration: 300 });
        nextCardOpacity.value = withTiming(0.7, { duration: 300 }, () =>
          runOnJS(changeIndex)('up'),
        );
      } else if (
        (isSwipeDown || e.velocityY > velocityThreshold) &&
        (loop || currentIndex > 0)
      ) {
        translateY.value = withTiming(height, { duration: 300 });
        scale.value = withTiming(0.8, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        prevCardScale.value = withTiming(1, { duration: 300 });
        prevCardOpacity.value = withTiming(0.7, { duration: 300 }, () =>
          runOnJS(changeIndex)('down'),
        );
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
        scale.value = withSpring(1);
        opacity.value = withTiming(1);
        nextCardScale.value = withTiming(0.92);
        nextCardOpacity.value = withTiming(0);
        prevCardScale.value = withTiming(0.92);
        prevCardOpacity.value = withTiming(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
    zIndex: 10,
  }));

  const nextCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: nextCardScale.value },
      { translateY: interpolate(nextCardOpacity.value, [0, 0.7], [60, 0]) },
    ],
    opacity: nextCardOpacity.value,
    zIndex: 5,
  }));

  const prevCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: prevCardScale.value },
      { translateY: interpolate(prevCardOpacity.value, [0, 0.7], [-60, 0]) },
    ],
    opacity: prevCardOpacity.value,
    zIndex: 1,
  }));

  const renderDefault = (item: CardItem, index: number) => (
    <View style={styles.defaultCardContent}>
      <Image
        source={item.image}
        style={{ width: '100%', height: 200, borderRadius: 10 }}
        resizeMode="cover"
        fadeDuration={0} // 💡 Prevents flicker
      />
      <Text style={styles.title}>{item.title}</Text>
      <Text>{item.content}</Text>
    </View>
  );

  const getKey = (prefix: string, index: number) =>
    `${prefix}-${cards[index % cards.length]?.title || index}`;

  return (
    <View style={[styles.container, style]}>
      {currentIndex < cards.length - 1 && translateY.value >= 0 && (
        <Animated.View
          key={getKey('next', currentIndex + 1)}
          style={[styles.card, cardStyle, nextCardStyle]}>
          {renderCard
            ? renderCard(cards[(currentIndex + 1) % cards.length], currentIndex + 1)
            : renderDefault(cards[(currentIndex + 1) % cards.length], currentIndex + 1)}
        </Animated.View>
      )}

      <GestureDetector gesture={gesture}>
        <Animated.View
          key={getKey('current', currentIndex)}
          style={[styles.card, cardStyle, animatedStyle]}>
          {renderCard
            ? renderCard(cards[currentIndex], currentIndex)
            : renderDefault(cards[currentIndex], currentIndex)}
        </Animated.View>
      </GestureDetector>

      {currentIndex > 0 && translateY.value <= 0 && (
        <Animated.View
          key={getKey('prev', currentIndex - 1)}
          style={[styles.card, cardStyle, prevCardStyle]}>
          {renderCard
            ? renderCard(cards[(currentIndex - 1 + cards.length) % cards.length], currentIndex - 1)
            : renderDefault(cards[(currentIndex - 1 + cards.length) % cards.length], currentIndex - 1)}
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    justifyContent: 'center',
    position: 'absolute',
  },
  defaultCardContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    color: '#333',
  },
});
