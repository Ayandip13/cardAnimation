import 'react-native-gesture-handler';
import { View, Text } from 'react-native'
import React from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Card from './screens/Card'; // or wherever your component is

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Card />
    </GestureHandlerRootView>
  );
}

