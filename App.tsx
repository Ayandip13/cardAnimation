import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Card from './screens/Card';
import { Alert, Image, Text, View } from 'react-native';

export default function App() {
  const sampleCard = [
    { title: 'news1', content: 'News1 content...', image: require('./assets/download.jpeg') },
    { title: 'news2', content: 'News2 content...', image: require('./assets/download.png') },
    { title: 'news3', content: 'News3 content...', image: require('./assets/download.webp') },
    { title: 'news4', content: 'News4 content...', image: require('./assets/download(1).jpeg') },
    { title: 'news5', content: 'News5 content...', image: require('./assets/download(2).png') },
    { title: 'news6', content: 'News6 content...', image: require('./assets/download(3).jpeg') },
    { title: 'news7', content: 'News7 content...', image: require('./assets/download(4).png') },
  ];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Card
        cards={sampleCard}
        onSwipe={(dir, idx) => console.log(`Swiped ${dir} to index ${idx}`)}
        renderCard={(item, index) => (
          <View style={{ alignItems: 'center' }}>
            {item.image && (
              <Image
                source={item.image}
                style={{ width: 200, height: 180, resizeMode: 'cover', borderRadius: 10, marginBottom: 10 }}
              />
            )}
            <Text style={{ fontSize: 24 }}>
              {index + 1}. {item.title}
            </Text>
            <Text style={{ marginTop: 10 }}>{item.content}</Text>
          </View>
        )}
        style={{ backgroundColor: '#fff' }}
        cardStyle={{
          backgroundColor: '#A4CCD9',
          borderRadius: 20,
          padding: 32,
          height: '60%',
          width: '70%',
          elevation: 0,
        }}
        loop={true}
        horizontal={true}
      />
    </GestureHandlerRootView>
  );
}