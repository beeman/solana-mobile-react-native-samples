import React, { useState } from 'react'
import { View, StyleSheet, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import { AppText } from '@/components/app-text'
import { Colors } from '@/constants/colors'
import { useColorScheme } from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { LinearGradient } from 'expo-linear-gradient'

interface WelcomeModalProps {
  visible: boolean
  onSubmit: (name: string) => Promise<void>
  isLoading?: boolean
}

export function WelcomeModal({ visible, onSubmit, isLoading = false }: WelcomeModalProps) {
  const [name, setName] = useState('')
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = Colors[isDark ? 'dark' : 'light']

  const handleSubmit = async () => {
    if (name.trim()) {
      await onSubmit(name.trim())
      setName('')
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
        />

        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <LinearGradient
            colors={colors.gradientMint}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <MaterialIcons name="waving-hand" size={40} color="#041015" />
          </LinearGradient>

          <AppText style={[styles.title, { color: colors.text }]}>Welcome!</AppText>
          <AppText style={[styles.subtitle, { color: colors.textSecondary }]}>
            Lets get started. What should we call you?
          </AppText>

          <View style={[styles.inputContainer, { borderColor: colors.border }]}>
            <MaterialIcons name="person" size={20} color={colors.textSecondary} />
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
            {!isLoading && <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />}
          </TouchableOpacity>

          <AppText style={[styles.hint, { color: colors.textSecondary }]}>
            You can always change this later in settings
          </AppText>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'IBMPlexSans-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'IBMPlexSans-Regular',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'IBMPlexSans-Medium',
  },
  submitButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans-SemiBold',
    color: '#FFFFFF',
  },
  hint: {
    fontSize: 12,
    fontFamily: 'IBMPlexSans-Regular',
    textAlign: 'center',
  },
})
