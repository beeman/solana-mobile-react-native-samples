import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAppTheme } from '@/hooks/use-app-theme'
import * as Clipboard from 'expo-clipboard'
import { useToast } from '@/components/toast/toast-provider'
import { useAppStore, ActivityType } from '@/store/app-store'
import { displayAddress } from '@/utils/display-address'

export default function ActivityDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { palette, isDark } = useAppTheme()
  const { showToast } = useToast()
  const { activities, getFriendByAddress } = useAppStore()

  const activity = activities.find((a) => a.id === id)
  const friend = activity?.friendAddress ? getFriendByAddress(activity.friendAddress) : null

  const getActivityIcon = (type: ActivityType): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'pot_created':
        return 'add-circle'
      case 'contribution':
        return 'cash'
      case 'release':
        return 'checkmark-done-circle'
      case 'sign_release':
        return 'create-outline'
      case 'friend_added':
        return 'person-add'
      default:
        return 'information-circle'
    }
  }

  const getActivityColor = (type: ActivityType): string => {
    switch (type) {
      case 'pot_created':
        return '#10B981' // Green
      case 'contribution':
        return '#3B82F6' // Blue
      case 'release':
        return '#8B5CF6' // Purple
      case 'sign_release':
        return '#F59E0B' // Amber
      case 'friend_added':
        return '#F59E0B' // Amber
      default:
        return '#6B7280' // Gray
    }
  }

  const getActivityTitle = (type: ActivityType): string => {
    switch (type) {
      case 'pot_created':
        return 'Pot Created'
      case 'contribution':
        return 'Contribution Made'
      case 'release':
        return 'Funds Released'
      case 'sign_release':
        return 'Signed for Release'
      case 'friend_added':
        return 'Friend Added'
      default:
        return 'Activity'
    }
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const openTransactionInExplorer = () => {
    if (activity?.transactionSignature) {
      const explorerUrl = `https://explorer.solana.com/tx/${activity.transactionSignature}?cluster=devnet`
      Linking.openURL(explorerUrl).catch(() => {
        showToast({
          title: 'Error',
          message: 'Could not open Solana Explorer',
          type: 'error',
        })
      })
    }
  }

  const copyTransactionSignature = async () => {
    if (activity?.transactionSignature) {
      try {
        await Clipboard.setStringAsync(activity.transactionSignature)
        showToast({
          title: 'Copied!',
          message: 'Transaction hash copied to clipboard',
          type: 'success',
        })
      } catch (error) {
        showToast({
          title: 'Error',
          message: 'Failed to copy transaction hash',
          type: 'error',
        })
      }
    }
  }

  if (!activity) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: palette.background }]}
        edges={['top']}
      >
        <View style={[styles.header, { borderBottomColor: palette.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={palette.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: palette.text }]}>Activity Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={{ color: palette.text }}>Activity not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: palette.background }]}
      edges={['top']}
    >
      <View style={[styles.header, { borderBottomColor: palette.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>Activity Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Activity Icon Header */}
        <View style={styles.iconHeader}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: getActivityColor(activity.type) },
            ]}
          >
            <Ionicons name={getActivityIcon(activity.type)} size={48} color="#FFFFFF" />
          </View>
        </View>

        {/* Activity Type */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>
            Activity Type
          </Text>
          <Text style={[styles.sectionContent, { color: palette.text }]}>
            {getActivityTitle(activity.type)}
          </Text>
        </View>

        {/* User Name (if available) */}
        {(activity.userName || activity.userId) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>
              Performed By
            </Text>
            <Text style={[styles.sectionContent, { color: palette.text }]}>
              {activity.userName || (() => {
                const userFriend = activity.userId ? getFriendByAddress(activity.userId) : null;
                return activity.userId ? displayAddress(activity.userId, userFriend?.domain, 8) : 'Someone';
              })()}
            </Text>
          </View>
        )}

        {/* Pot Name (if exists) */}
        {activity.potName && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>Pot</Text>
            <Text style={[styles.sectionContent, { color: palette.text }]}>
              {activity.potName}
            </Text>
          </View>
        )}

        {/* Friend Address (if exists) */}
        {activity.friendAddress && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>
              Friend Added
            </Text>
            <Text style={[styles.sectionContent, { color: palette.text }]}>
              {friend?.displayName || displayAddress(activity.friendAddress, friend?.domain, 8)}
            </Text>
          </View>
        )}

        {/* Amount (if exists) */}
        {activity.amount && activity.currency && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>Amount</Text>
            <Text
              style={[
                styles.amountText,
                {
                  color:
                    activity.type === 'contribution'
                      ? palette.accent ?? '#10B981'
                      : palette.text,
                },
              ]}
            >
              {activity.currency === 'SOL'
                ? `${activity.amount.toFixed(4)} SOL`
                : `$${activity.amount.toFixed(2)} USD`}
            </Text>
          </View>
        )}

        {/* Date and Time */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>
            Date & Time
          </Text>
          <Text style={[styles.sectionContent, { color: palette.text }]}>
            {formatDate(activity.timestamp)}
          </Text>
        </View>

        {/* Transaction Hash (if exists) */}
        {activity.transactionSignature && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>
              Transaction Hash
            </Text>
            <TouchableOpacity
              style={[
                styles.signatureContainer,
                { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', borderColor: palette.border },
              ]}
              onPress={copyTransactionSignature}
            >
              <Text
                style={[styles.signatureText, { color: palette.text }]}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {activity.transactionSignature}
              </Text>
              <Ionicons name="copy-outline" size={20} color={palette.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.explorerButton,
                { backgroundColor: palette.accent ?? '#10B981' },
              ]}
              onPress={openTransactionInExplorer}
            >
              <Ionicons name="open-outline" size={20} color="#FFFFFF" />
              <Text style={styles.explorerButtonText}>View on Solana Explorer</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  iconHeader: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  amountText: {
    fontSize: 28,
    fontWeight: '700',
  },
  signatureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  signatureText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '400',
    marginRight: 8,
  },
  explorerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  explorerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
