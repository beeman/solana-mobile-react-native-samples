import React from 'react'
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native'

interface PotActionsProps {
  isContributor: boolean
  isReleased: boolean
  isReleaseable: boolean
  isTargetReached: boolean
  progress: number
  colors: any
  canSign: boolean
  hasEnoughSignatures: boolean
  currentSignatures: number
  requiredSignatures: number
  onContribute: () => void
  onSignRelease: () => void
  onRelease: () => void
}

export function PotActions({
  isContributor,
  isReleased,
  isReleaseable,
  isTargetReached,
  progress,
  colors,
  canSign,
  hasEnoughSignatures,
  currentSignatures,
  requiredSignatures,
  onContribute,
  onSignRelease,
  onRelease,
}: PotActionsProps) {
  if (!isContributor) return null

  return (
    <View style={styles.actionsContainer}>
      {!isReleased && (
        <>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.accentGreen }]}
            onPress={onContribute}
          >
            <Text style={styles.actionButtonText}>Contribute</Text>
          </TouchableOpacity>

          {/* Sign for Release button - only show if threshold NOT yet met and user can sign */}
          {!hasEnoughSignatures && canSign && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#F59E0B' }]}
              onPress={onSignRelease}
            >
              <Text style={styles.actionButtonText}>
                Sign for Release ({currentSignatures}/{requiredSignatures})
              </Text>
            </TouchableOpacity>
          )}

          {/* Release Funds button - only show if threshold met */}
          {hasEnoughSignatures && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: isReleaseable ? colors.accentPurple : colors.border,
                  opacity: isReleaseable ? 1 : 0.5,
                },
              ]}
              onPress={onRelease}
              disabled={!isReleaseable}
            >
              <Text style={[styles.actionButtonText, { color: isReleaseable ? '#FFFFFF' : colors.textSecondary }]}>
                {isTargetReached ? 'Release Funds' : `Release Funds (${progress.toFixed(0)}%)`}
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  actionsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  actionButton: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '600',
  },
})

