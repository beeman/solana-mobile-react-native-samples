import { useState } from 'react';
import { router, Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/components/auth/auth-provider';
import { AppText } from '@/components/app-text';
import { AppConfig } from '@/constants/app-config';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, View, StyleSheet, Pressable, Image } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { AnimatedSplash } from '@/components/animated-splash';

export default function SignIn() {
  const { signIn, isLoading, isAuthenticated } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  if (showSplash) {
    return (
      <AnimatedSplash
        onAnimationComplete={() => setShowSplash(false)}
      />
    );
  }

  return (
    <Animated.View
      style={styles.container}
      entering={FadeIn.duration(800)}
      exiting={FadeOut.duration(400)}
    >
      <SafeAreaView style={styles.safeArea}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9333ea" />
          </View>
        ) : (
          <View style={styles.content}>
            {/* Top Section - Logo and Name */}
            <View style={styles.topSection}>
              <Image
                source={require('@/assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <AppText style={styles.title}>{AppConfig.name}</AppText>
              <AppText style={styles.subtitle}>Solana Name Service</AppText>
            </View>

            {/* Bottom Section - Connect Button */}
            <View style={styles.bottomSection}>
              <Pressable
                style={styles.connectButton}
                onPress={async () => {
                  await signIn();
                  router.replace('/');
                }}
              >
                <LinearGradient
                  colors={['#9333ea', '#a855f7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <AppText style={styles.buttonText}>Connect Wallet</AppText>
                </LinearGradient>
              </Pressable>

              <AppText style={styles.helperText}>
                Connect with Phantom, Solflare, or any Solana wallet
              </AppText>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 32,
    paddingTop: '20%',
    paddingBottom: '10%',
  },
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: -20,
  },
  bottomSection: {
    gap: 12,
    paddingBottom: 16,
  },
  logo: {
    width: 150,
    height: 150,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: -0.3,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  connectButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#9333ea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  helperText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
