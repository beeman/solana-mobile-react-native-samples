import { AppPage } from '@/components/app-page'
import { AppText } from '@/components/app-text'
import { FloatingActionButton } from '@/components/floating-action-button'
import { AddFriendModal } from '@/components/friends/AddFriendModal'
import { EmptyState } from '@/components/friends/EmptyState'
import { FriendRow } from '@/components/friends/FriendRow'
import { useAuth } from '@/components/auth/auth-provider'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { useScrollContext } from '@/components/tab-bar/scroll-context'
import { useToast } from '@/components/toast/toast-provider'
import { useAppTheme } from '@/hooks/use-app-theme'
import { useAppStore } from '@/store/app-store'
import { ellipsify } from '@/utils/ellipsify'
import { displayAddress } from '@/utils/display-address'
import { addFriend as addFriendAPI } from '@/api/friends'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { PublicKey } from '@solana/web3.js'
import { useRouter } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import {
  Animated,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

const AVATAR_PALETTE = [
  '#8E6BFF',
  '#6366F1',
  '#8B5CF6',
  '#A855F7',
  '#9333EA',
  '#7C3AED',
  '#6D28D9',
  '#5B21B6',
]

export default function FriendsScreen() {
  const router = useRouter()
  const { palette, cardStyle, isDark } = useAppTheme()
  const { account } = useMobileWallet()
  const { user } = useAuth()
  const { scrollY, handleScroll } = useScrollContext()

  const { friends, addFriend, removeFriend } = useAppStore()
  const { showToast } = useToast()

  const [showAddFriend, setShowAddFriend] = useState(false)
  const [addressInput, setAddressInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const onBack = useCallback(() => router.back(), [router])
  const toggleAddFriend = useCallback(() => {
    setShowAddFriend((v) => !v)
    setAddressInput('')
  }, [])

  const onSearchChange = useCallback((t: string) => setSearchTerm(t), [])

  const getAvatarColor = useCallback((seed: string) => {
    return AVATAR_PALETTE[seed.charCodeAt(0) % AVATAR_PALETTE.length]
  }, [])

  const handleAddFriend = useCallback(async () => {
    if (!user) {
      showToast({
        title: 'Not authenticated',
        message: 'Please connect your wallet first',
        type: 'error',
      })
      return
    }

    try {
      const input = addressInput.trim()

      // Call backend API to add friend (supports both address and domain)
      const friendData = await addFriendAPI({
        currentUserAddress: user.address,
        address: input,
      })

      // Check if already exists
      const exists = friends.some((f) => f.address === friendData.address)
      if (exists) {
        showToast({
          title: 'Already added',
          message: 'This friend is already on your list',
          type: 'warning',
        })
        return
      }

      // Update local store with friend data from API response
      const publicKey = new PublicKey(friendData.address)
      addFriend(publicKey, friendData.address, friendData.displayName, friendData.domain)

      setAddressInput('')
      setShowAddFriend(false)
      showToast({
        title: 'Friend added',
        message: friendData.displayName || displayAddress(friendData.address, friendData.domain, 12),
        type: 'success',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add friend'
      showToast({
        title: 'Error',
        message: errorMessage,
        type: 'error',
      })
    }
  }, [addressInput, friends, addFriend, showToast, user])

  const handleRemoveFriend = useCallback(
    (id: string, name?: string) => {
      const friend = friends.find((f) => f.id === id)
      const friendName = friend?.displayName || name || displayAddress(friend?.address || id, friend?.domain, 12)
      removeFriend(id)
      showToast({
        title: 'Friend removed',
        message: `${friendName} has been removed from your friends list`,
        type: 'success',
      })
    },
    [removeFriend, friends, showToast]
  )

  const filteredFriends = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (q.length === 0) {
      return friends
    }
    return friends.filter((f) => {
      const n = (f.displayName || '').toLowerCase()
      const a = f.address.toLowerCase()
      const d = (f.domain || '').toLowerCase()
      return n.includes(q) || a.includes(q) || d.includes(q)
    })
  }, [friends, searchTerm])

  return (
    <AppPage>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={[styles.gradient, { backgroundColor: palette.surfaceMuted }]}>
          <AddFriendModal
            visible={showAddFriend}
            addressInput={addressInput}
            palette={palette}
            isDark={isDark}
            cardStyle={cardStyle}
            onClose={toggleAddFriend}
            onAddressChange={setAddressInput}
            onSubmit={handleAddFriend}
          />

          <Animated.ScrollView
            style={[styles.scrollView, { backgroundColor: palette.surfaceMuted }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            stickyHeaderIndices={[1]}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false, listener: handleScroll }
            )}
          >
            <View style={[styles.header, { backgroundColor: palette.surfaceMuted }]}>
              <TouchableOpacity onPress={onBack} style={styles.navButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialIcons name="chevron-left" size={24} color={palette.text} />
              </TouchableOpacity>

              <AppText style={[styles.headerTitle, { color: palette.text }]}>Friends</AppText>

              <TouchableOpacity
                onPress={toggleAddFriend}
                style={[styles.navButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)' }]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="person-add" size={24} color={palette.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.stickyHeader, { backgroundColor: palette.surfaceMuted }]}>
              <View style={[styles.searchBox, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                <MaterialIcons name="search" size={20} color={palette.textSecondary} />
                <TextInput
                  value={searchTerm}
                  onChangeText={onSearchChange}
                  placeholder="Search friends..."
                  placeholderTextColor={palette.textSecondary}
                  style={[styles.searchInput, { color: palette.text }]}
                  keyboardAppearance={isDark ? 'dark' : 'light'}
                />
                {searchTerm.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchTerm('')}>
                    <MaterialIcons name="close" size={18} color={palette.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {friends.length === 0 ? (
              <EmptyState palette={palette} type="none" />
            ) : filteredFriends.length === 0 ? (
              <EmptyState palette={palette} type="search" />
            ) : (
              <View style={styles.listContainer}>
                {filteredFriends.map((friend, index) => (
                  <FriendRow
                    key={friend.id}
                    friend={friend}
                    palette={palette}
                    isDark={isDark}
                    cardStyle={cardStyle}
                    onRemove={handleRemoveFriend}
                    avatarColor={getAvatarColor(friend.id)}
                    isLast={index === filteredFriends.length - 1}
                    accountAddress={account?.address}
                    showToast={showToast}
                  />
                ))}
              </View>
            )}
          </Animated.ScrollView>
          <FloatingActionButton scrollY={scrollY} />
        </View>
      </GestureHandlerRootView>
    </AppPage>
  )
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'IBMPlexSans-Bold',
  },
  stickyHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 5,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  listContainer: {
    marginTop: 8,
  },
})
