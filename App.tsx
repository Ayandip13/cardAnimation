import 'react-native-gesture-handler';
import { View, Text } from 'react-native'
import React from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Card from './screens/Card'; // or wherever your component is

export default function App() {

  const sampleCard = [
    { title: 'news1', content: 'News1 content...' },
    { title: 'news2', content: 'News2 content...' },
    { title: 'news3', content: 'News3 content...' },
    { title: 'news4', content: 'News4 content...' },
    { title: 'news5', content: 'News5 content...' },
    { title: 'news6', content: 'News6 content...' },
    { title: 'news7', content: 'News7 content...' },
  ]


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Card
        cards={sampleCard}
        style={{ backgroundColor: '#98A1BC', }}
        cardStyle={{
          backgroundColor: '#fff',
          borderRadius: 10,
          padding: "32%",
          height: "70%",
          width: "90%",
          elevation:5
        }}
      />
    </GestureHandlerRootView>
  );
}

