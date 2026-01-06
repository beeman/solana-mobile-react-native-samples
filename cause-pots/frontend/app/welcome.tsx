import React, { useState, useEffect, useRef } from 'react'
import { View, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import { AppText } from '@/components/app-text'
import { AppPage } from '@/components/app-page'
import { Colors } from '@/constants/colors'
import { useColorScheme } from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '@/components/auth/auth-provider'
import { updateUser, getUserById } from '@/api/users'
import { useRouter } from 'expo-router'

export default function WelcomeScreen() {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = Colors[isDark ? 'dark' : 'light']
  const { user, updateUserState } = useAuth()
  const router = useRouter()
  const hasFetchedDomain = useRef(false)

  // Proactively fetch user data in background to get domain when it's resolved (only once)
  useEffect(() => {
    if (user?.id && !hasFetchedDomain.current) {
      hasFetchedDomain.current = true
      const fetchUserWithDomain = async () => {
        try {
          // Wait a bit for backend domain resolution to complete
          await new Promise(resolve => setTimeout(resolve, 2000))
          const updatedUser = await getUserById(user.id)
          if (updatedUser.domain) {
            // Silently update user state if domain was resolved
            await updateUserState(updatedUser)
          }
        } catch (error) {
          // Silent fail - domain resolution is optional
          console.log('Background domain fetch:', error)
        }
      }
      fetchUserWithDomain()
    }
  }, [user?.id, updateUserState])

  const handleSubmit = async () => {
    if (!name.trim() || !user) return

    try {
      setIsLoading(true)

      // Update user profile with name
      const updatedUser = await updateUser(user.id, {
        name: name.trim(),
      })

      // Update auth state with new user data
      await updateUserState(updatedUser)

      // Navigate to main app (router will automatically redirect based on updated profile status)
      router.replace('/(tabs)')
    } catch (error) {
      console.error('Failed to update user name:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AppPage>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <LinearGradient
            colors={colors.gradientMint}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <MaterialIcons name="waving-hand" size={48} color="#041015" />
          </LinearGradient>

          <AppText style={[styles.title, { color: colors.text }]}>Welcome!</AppText>
          <AppText style={[styles.subtitle, { color: colors.textSecondary }]}>
            Let's get started. What should we call you?
          </AppText>

          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <MaterialIcons name="person" size={22} color={colors.textSecondary} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter your name"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              autoFocus
              maxLength={50}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.accentGreen },
              (!name.trim() || isLoading) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!name.trim() || isLoading}
            activeOpacity={0.7}
          >
            <AppText style={styles.submitButtonText}>
              {isLoading ? 'Saving...' : 'Continue'}
            </AppText>
            {!isLoading && <MaterialIcons name="arrow-forward" size={22} color="#FFFFFF" />}
          </TouchableOpacity>

          <AppText style={[styles.hint, { color: colors.textSecondary }]}>
            You can always change this later in settings
          </AppText>
        </View>
      </KeyboardAvoidingView>
    </AppPage>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontFamily: 'IBMPlexSans-Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans-Regular',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 14,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'IBMPlexSans-Medium',
  },
  submitButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 17,
    fontFamily: 'IBMPlexSans-SemiBold',
    color: '#FFFFFF',
  },
  hint: {
    fontSize: 13,
    fontFamily: 'IBMPlexSans-Regular',
    textAlign: 'center',
  },
})
