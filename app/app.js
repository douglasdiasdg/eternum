import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

if (!__DEV__) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}

export default function App() {
  return (
    <View>
      <Text>Memorial ETERNUM</Text>
      <StatusBar style="auto" />
    </View>
  );
}
