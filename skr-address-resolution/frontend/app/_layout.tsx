import { Slot } from 'expo-router';
import { AppProviders } from '@/components/app-providers';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <AppProviders>
        <Slot />
        <StatusBar style="auto" />
      </AppProviders>
      <View style={styles.toastContainer}>
        <Toast topOffset={60} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
  },
});
