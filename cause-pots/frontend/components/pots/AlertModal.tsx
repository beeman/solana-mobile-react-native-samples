import React from 'react'
import { View, StyleSheet, Text, TouchableOpacity, Modal } from 'react-native'
import { AppText } from '@/components/app-text'

export interface AlertButton {
  text: string
  style?: 'default' | 'cancel' | 'destructive'
  onPress?: () => void
}

interface AlertModalProps {
  visible: boolean
  title: string
  message: string
  buttons?: AlertButton[]
  colors: any
  onClose: () => void
}

export function AlertModal({
  visible,
  title,
  message,
  buttons = [{ text: 'OK', style: 'default' }],
  colors,
  onClose,
}: AlertModalProps) {
  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress()
    }
    onClose()
  }

  const getButtonStyle = (button: AlertButton, index: number) => {
    const isLastButton = index === buttons.length - 1
    const isCancel = button.style === 'cancel'

    if (isCancel) {
      return {
        backgroundColor: 'transparent',
        borderColor: colors.border,
      }
    }

    if (button.style === 'destructive') {
      return {
        backgroundColor: '#FF6B6B',
        borderColor: '#FF6B6B',
      }
    }

    // Default style for primary action (usually last button)
    if (isLastButton && buttons.length > 1) {
      return {
        backgroundColor: colors.accentGreen,
        borderColor: colors.accentGreen,
      }
    }

    return {
      backgroundColor: colors.accentGreen,
      borderColor: colors.accentGreen,
    }
  }

  const getButtonTextColor = (button: AlertButton) => {
    if (button.style === 'cancel') {
      return colors.text
    }
    return '#000'
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
          <AppText type="title" style={styles.modalTitle}>
            {title}
          </AppText>
          <AppText style={[styles.modalMessage, { color: colors.textSecondary }]}>
            {message}
          </AppText>
          <View style={styles.modalActions}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.modalButton,
                  getButtonStyle(button, index),
                  buttons.length === 1 && styles.modalButtonSingle,
                ]}
                onPress={() => handleButtonPress(button)}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    { color: getButtonTextColor(button) },
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 50,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalButtonSingle: {
    flex: 0,
    minWidth: 100,
    alignSelf: 'flex-end',
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
})
