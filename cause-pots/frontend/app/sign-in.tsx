import { router } from 'expo-router'
import { useAuth } from '@/components/auth/auth-provider'
import { AppText } from '@/components/app-text'
import { AppView } from '@/components/app-view'
import { AppConfig } from '@/constants/app-config'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ActivityIndicator, View, StyleSheet, useColorScheme, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image'
import { Colors } from '@/constants/colors'
import { LinearGradient } from 'expo-linear-gradient'
import { useToast } from '@/components/toast/toast-provider'
import { useState } from 'react'

export default function SignIn() {
  const { signIn } = useAuth()
  const { showToast } = useToast()
  const [isConnecting, setIsConnecting] = useState(false)
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = Colors[isDark ? 'dark' : 'light']

  return (
    <AppView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
          {/* Spacer */}
          <View style={styles.topSpacer} />

          {/* Main content */}
          <View style={styles.contentContainer}>
            {/* Logo with gradient background */}
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={colors.gradientMint}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <Image
                  source={require('../assets/images/logo.png')}
                  style={styles.logo}
                  contentFit="contain"
                />
              </LinearGradient>
            </View>

            {/* Title */}
            <View style={styles.textContainer}>
              <AppText
                type="title"
                style={[styles.title, { color: colors.textPrimary }]}
              >
                {AppConfig.name}
              </AppText>
            </View>
          </View>

          {/* Connect button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.accentGreen }, isConnecting && styles.buttonDisabled]}
              onPress={async () => {
                if (isConnecting) return

                setIsConnecting(true)
                try {
                  await signIn()
                  router.replace('/')
                } catch (error) {
                  // Check if user cancelled
                  const errorMessage = error instanceof Error ? error.message : String(error)
                  const errorName = error instanceof Error ? error.constructor.name : ''

                  // Detect user cancellation (MWA authorization failed or common rejection patterns)
                  const isCancelled =
                    errorName === 'SolanaMobileWalletAdapterProtocolError' ||
                    errorMessage === '-1/authorization request failed'

                  if (isCancelled) {
                    showToast({
                      title: 'Connection failed',
                      message: 'Failed to connect wallet. Please try again.',
                      type: 'error',
                    })
                  }
                } finally {
                  setIsConnecting(false)
                }
              }}
              activeOpacity={0.8}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <AppText style={styles.buttonText}>Connect Wallet</AppText>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
    </AppView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  topSpacer: {
    height: 80,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 32,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGradient: {
    width: 160,
    height: 160,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  logo: {
    width: 192,
    height: 192,
  },
  textContainer: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '800',
    letterSpacing: -1,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    marginTop: 'auto',
  },
  button: {
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
})
