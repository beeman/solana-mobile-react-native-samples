import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, StyleSheet, Pressable, TouchableOpacity, Modal, ScrollView } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { AppText } from '@/components/app-text'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { displayAddress } from '@/utils/display-address'
import { DeleteFriendModal } from './DeleteFriendModal'

const SWIPE_THRESHOLD = 30
const DELETE_THRESHOLD = 25

interface FriendRowProps {
  friend: any
  palette: any
  isDark: boolean
  cardStyle: any
  onRemove: (id: string, name?: string) => void
  avatarColor: string
  isLast: boolean
  accountAddress?: string
  showToast: (options: { title: string; message?: string; type?: 'success' | 'info' | 'warning' | 'error' }) => void
}

export function FriendRow({
  friend,
  palette,
  isDark,
  cardStyle,
  onRemove,
  avatarColor,
  isLast,
  accountAddress,
  showToast,
}: FriendRowProps) {
  const translateX = useSharedValue(0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      translateX.value = e.translationX
    })
    .onEnd((e) => {
      if (e.translationX < -DELETE_THRESHOLD) {
        runOnJS(setShowDeleteModal)(true)
        translateX.value = withSpring(0)
      } else {
        translateX.value = withSpring(0)
      }
    })

  const animatedRowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  const animatedDeleteIconStyle = useAnimatedStyle(() => {
    const progress = Math.max(0, Math.min(1, Math.abs(translateX.value) / 20))
    return {
      opacity: withTiming(progress, { duration: 50 }),
      transform: [{ scale: withTiming(0.85 + progress * 0.15, { duration: 50 }) }],
    }
  })

  const animatedDeleteBgStyle = useAnimatedStyle(() => {
    const progress = Math.max(0, Math.min(1, Math.abs(translateX.value) / 80))
    return {
      opacity: withTiming(Math.min(progress, 1), { duration: 50 }),
      backgroundColor: '#FF3B30',
    }
  })

  const animatedRowBgStyle = useAnimatedStyle(() => {
    let bgColor = palette.surfaceMuted
    if (translateX.value < -5) {
      bgColor = '#FF3B30'
    }
    return {
      backgroundColor: withTiming(bgColor, { duration: 50 }),
    }
  })

  const handleConfirmDelete = useCallback(() => {
    setShowDeleteModal(false)
    onRemove(friend.id, friend.displayName)
  }, [friend.id, friend.displayName, onRemove])

  return (
    <View>
      <View style={styles.swipeContainer}>
        <Reanimated.View style={[styles.swipeBackground, styles.deleteBackground, animatedDeleteBgStyle]}>
          <Reanimated.View style={[styles.swipeIconWrapper, animatedDeleteIconStyle]}>
            <View style={styles.swipeIconCircle}>
              <MaterialIcons name="delete-outline" size={24} color="#FFFFFF" />
            </View>
          </Reanimated.View>
        </Reanimated.View>

        <GestureDetector gesture={panGesture}>
          <Reanimated.View style={[animatedRowStyle, animatedRowBgStyle]}>
            <Pressable
              onPress={() => {}}
              style={({ pressed }) => [
                styles.friendRow,
                {
                  backgroundColor: pressed
                    ? isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'
                    : palette.surfaceMuted,
                },
              ]}
            >
              <View style={[styles.avatarContainer, { backgroundColor: avatarColor }]}>
                <Text style={styles.avatarText}>
                  {(friend.displayName || friend.address).slice(0, 1).toUpperCase()}
                </Text>
              </View>

              <View style={styles.friendContent}>
                {friend.displayName ? (
                  <>
                    <AppText style={[styles.friendName, { color: palette.text }]} numberOfLines={1}>
                      {friend.displayName}
                    </AppText>
                    <AppText style={[styles.friendAddress, { color: palette.textSecondary }]} numberOfLines={1}>
                      {displayAddress(friend.address, friend.domain, 12)}
                    </AppText>
                  </>
                ) : (
                  <AppText style={[styles.friendName, { color: palette.text }]} numberOfLines={1}>
                    {displayAddress(friend.address, friend.domain, 16)}
                  </AppText>
                )}
              </View>
            </Pressable>
          </Reanimated.View>
        </GestureDetector>
      </View>

      {!isLast && <View style={[styles.separator, { backgroundColor: palette.border }]} />}

      <DeleteFriendModal
        visible={showDeleteModal}
        friend={friend}
        palette={palette}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  swipeContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  swipeBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  deleteBackground: {
    right: 0,
    backgroundColor: '#FF3B30',
  },
  addBackground: {
    left: 0,
    backgroundColor: '#34C759',
  },
  swipeIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 60,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  friendContent: {
    flex: 1,
    justifyContent: 'center',
  },
  friendName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  friendAddress: {
    fontSize: 13,
    opacity: 0.7,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 76,
    marginRight: 16,
  },
})

