import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ViewStyle,
  Text,
  Image,
  ImageSourcePropType,
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
import FastImage from 'react-native-fast-image';

const { height, width } = Dimensions.get('window');

export interface CardItem {
  title: string;
  content: string;
  image: ImageSourcePropType | { uri: string };
}

interface CardSwiperProps {
  style?: ViewStyle;
  cardStyle?: ViewStyle;
  cards: CardItem[];
  renderCard?: (item: CardItem, index: number) => React.ReactNode;
  loop?: boolean;
  horizontal?: boolean;
  onSwipe?: (direction: 'up' | 'down' | 'left' | 'right', index: number) => void;
  onReachEnd?: () => void; // Callback when trying to swipe beyond last card
  onReachStart?: () => void; // Callback when trying to swipe before first card
}

export default function Card({
  style,
  cardStyle,
  cards,
  renderCard,
  loop = false,
  horizontal = false,
  onSwipe,
  onReachEnd,
  onReachStart,
}: CardSwiperProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const nextCardScale = useSharedValue(0.92);
  const nextCardOpacity = useSharedValue(0);
  const prevCardScale = useSharedValue(0.92);
  const prevCardOpacity = useSharedValue(0);

  useEffect(() => {
    cards.forEach(card => {
      if (typeof card.image === 'number') {
        Image.prefetch(Image.resolveAssetSource(card.image).uri);
      }
    });
    return () => {
      translateY.value = 0;
      translateX.value = 0;
      scale.value = 1;
    };
  }, [cards]);

  const changeIndex = (direction: 'up' | 'down' | 'left' | 'right') => {
    setTimeout(() => {
      let newIndex = currentIndex;
      if (direction === 'up' || direction === 'left') {
        newIndex = currentIndex + 1;
      } else if (direction === 'down' || direction === 'right') {
        newIndex = currentIndex - 1;
      }

      if (loop) {
        newIndex = (newIndex + cards.length) % cards.length;
      } else {
        // Check if we're at boundaries and call appropriate callbacks
        if (newIndex < 0) {
          onReachStart?.();
          return;
        }
        if (newIndex >= cards.length) {
          onReachEnd?.();
          return;
        }
      }

      if (newIndex >= 0 && newIndex < cards.length) {
        onSwipe?.(direction, newIndex);
        setCurrentIndex(newIndex);
      }

      translateY.value = 0;
      translateX.value = 0;
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
      if (horizontal) {
        translateX.value = e.translationX;
      } else {
        translateY.value = e.translationY;
      }

      const progress = Math.min(
        Math.abs(horizontal ? e.translationX : e.translationY) / (horizontal ? width : height),1);
      scale.value = 1 - progress * 0.1;
      opacity.value = 1 - progress * 0.8;

      if (
        ((horizontal && e.translationX < 0) || (!horizontal && e.translationY < 0)) &&
        (loop || currentIndex < cards.length - 1)
      ) {
        const nextProgress = progress;
        nextCardScale.value = 0.92 + nextProgress * 0.08;
        nextCardOpacity.value = nextProgress * 0.7;
      } else if (
        ((horizontal && e.translationX > 0) || (!horizontal && e.translationY > 0)) &&
        (loop || currentIndex > 0)
      ) {
        const prevProgress = progress;
        prevCardScale.value = 0.92 + prevProgress * 0.08;
        prevCardOpacity.value = prevProgress * 0.7;
      }
    })
    .onEnd(e => {
      const threshold = horizontal ? width * 0.15 : height * 0.15;
      const velocityThreshold = 600;
      const velocity = horizontal ? e.velocityX : e.velocityY;
      const translation = horizontal ? e.translationX : e.translationY;

      let direction: 'up' | 'down' | 'left' | 'right' | null = null;
      let shouldSwipe = false;

      if (translation < -threshold || velocity < -velocityThreshold) {
        direction = horizontal ? 'left' : 'up';
        shouldSwipe = loop || currentIndex < cards.length - 1;

        // Check if we're at the end and should call onReachEnd
        if (!loop && currentIndex >= cards.length - 1) {
          runOnJS(onReachEnd)();
        }
      } else if (translation > threshold || velocity > velocityThreshold) {
        direction = horizontal ? 'right' : 'down';
        shouldSwipe = loop || currentIndex > 0;

        // Check if we're at the start and should call onReachStart
        if (!loop && currentIndex <= 0) {
          runOnJS(onReachStart)();
        }
      }

      if (shouldSwipe && direction) {
        if (horizontal) {
          translateX.value = withTiming(
            direction === 'left' ? -width : width,
            { duration: 300 }
          );
        } else {
          translateY.value = withTiming(
            direction === 'up' ? -height : height,
            { duration: 300 }
          );
        }

        scale.value = withTiming(0, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });

        if (direction === 'left' || direction === 'up') {
          nextCardScale.value = withTiming(1, { duration: 300 });
          nextCardOpacity.value = withTiming(0.7, { duration: 300 }, () =>
            runOnJS(changeIndex)(direction!)
          );
        } else {
          prevCardScale.value = withTiming(1, { duration: 300 });
          prevCardOpacity.value = withTiming(0.7, { duration: 300 }, () =>
            runOnJS(changeIndex)(direction!)
          );
        }
      } else {
        if (horizontal) {
          translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
        } else {
          translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
        }
        scale.value = withSpring(1);
        opacity.value = withTiming(1);
        nextCardScale.value = withTiming(0.92);
        nextCardOpacity.value = withTiming(0);
        prevCardScale.value = withTiming(0.92);
        prevCardOpacity.value = withTiming(0);
      }
    });

  // ... rest of the component remains the same ...
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: horizontal ? 0 : translateY.value },
      { translateX: horizontal ? translateX.value : 0 },
      { scale: scale.value },
    ],
    opacity: opacity.value,
    zIndex: 10,
    useHardwareTextureAndroid: true,
    shouldRasterizeIOS: true,
  }));

  const nextCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: nextCardScale.value },
      {
        translateY: horizontal ? 0 : interpolate(nextCardOpacity.value, [0, 0.7], [60, 0])
      },
      {
        translateX: horizontal ? interpolate(nextCardOpacity.value, [0, 0.7], [60, 0]) : 0
      },
    ],
    opacity: nextCardOpacity.value,
    zIndex: 5,
    useHardwareTextureAndroid: true,
    shouldRasterizeIOS: true,
  }));

  const prevCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: prevCardScale.value },
      {
        translateY: horizontal ? 0 : interpolate(prevCardOpacity.value, [0, 0.7], [-60, 0])
      },
      {
        translateX: horizontal ? interpolate(prevCardOpacity.value, [0, 0.7], [-60, 0]) : 0
      },
    ],
    opacity: prevCardOpacity.value,
    zIndex: 1,
    useHardwareTextureAndroid: true,
    shouldRasterizeIOS: true,
  }));

  const renderDefault = (item: CardItem, index: number) => (
    <View style={styles.defaultCardContent}>
      <FastImage
        source={item.image}
        style={{ width: '100%', height: 200, borderRadius: 10 }}
        resizeMode={FastImage.resizeMode.cover}
        fallback={true}
      />
      <Text style={styles.title}>{item.title}</Text>
      <Text>{item.content}</Text>
    </View>
  );

  const getKey = (prefix: string, index: number) =>
    `${prefix}-${cards[index % cards.length]?.title || index}`;

  return (
    <View style={[styles.container, style]}>
      {currentIndex < cards.length - 1 &&
        ((horizontal && translateX.value >= 0) || (!horizontal && translateY.value >= 0)) && (
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

      {currentIndex > 0 &&
        ((horizontal && translateX.value <= 0) || (!horizontal && translateY.value <= 0)) && (
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