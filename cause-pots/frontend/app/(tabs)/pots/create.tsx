import React, { useMemo, useState } from 'react'
import { Platform, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { PublicKey } from '@solana/web3.js'
import { AppPage } from '@/components/app-page'
import { AppText } from '@/components/app-text'
import { AlertModal, AlertButton } from '@/components/pots/AlertModal'
import { Colors } from '@/constants/colors'
import { useToast } from '@/components/toast/toast-provider'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { useAppStore, PotCategory } from '@/store/app-store'
import { usePotProgram } from '@/hooks/use-pot-program'
import { useCurrencyConversion } from '@/hooks/use-currency-conversion'
import { CreatePotHeader } from '@/components/pots/create/CreatePotHeader'
import { OverviewSection } from '@/components/pots/create/OverviewSection'
import { GoalSection } from '@/components/pots/create/GoalSection'
import { CategorySelector } from '@/components/pots/create/CategorySelector'
import { ContributorSelector } from '@/components/pots/create/ContributorSelector'
import { DatePickerModal } from '@/components/pots/create/DatePickerModal'

const getDefaultTargetDateString = () =>
  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

const dayMs = 24 * 60 * 60 * 1000
const formatDate = (d: Date) => d.toISOString().slice(0, 10)

const today = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

const tomorrow = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function CreatePotScreen() {
  const router = useRouter()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = Colors[isDark ? 'dark' : 'light']

  const { account } = useMobileWallet()
  const { friends, createPot } = useAppStore()
  const { showToast } = useToast()
  const { createPot: createPotOnChain, isLoading: isCreatingOnChain, programService } = usePotProgram()
  const { solPrice, usdToSol } = useCurrencyConversion()

  const palette = useMemo(
    () => ({
      gradient: isDark ? ['#05070E', '#04060A', '#030407'] : ['#EEF1FF', '#F8FAFF', '#FFFFFF'],
      surface: isDark ? 'rgba(12,14,21,0.94)' : '#FFFFFF',
      surfaceMuted: isDark ? 'rgba(255,255,255,0.05)' : '#F3F6FF',
      border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
      label: isDark ? 'rgba(255,255,255,0.65)' : '#76809A',
      text: colors.text,
      textSecondary: colors.textSecondary,
      accent: colors.accentGreen ?? '#22E1A2',
      accentSecondary: '#6DF8CD',
      accentMuted: isDark ? 'rgba(34,225,162,0.18)' : 'rgba(34,225,162,0.12)',
      chipAvatarBg: isDark ? '#0C1525' : '#E2E7FF',
      chipAvatarText: isDark ? '#66F5C6' : '#1A1F2C',
    }),
    [isDark, colors],
  )

  const cardStyle = useMemo(
    () => ({
      backgroundColor: palette.surface,
      borderColor: palette.border,
      shadowColor: isDark ? '#000000' : '#9FB4FF',
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: isDark ? 2 : 6,
    }),
    [palette, isDark],
  )

  const inputBaseStyle = useMemo(
    () => ({
      backgroundColor: palette.surfaceMuted,
      borderColor: palette.border,
      color: palette.text,
    }),
    [palette],
  )

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<'SOL' | 'USDC'>('SOL')
  const [category, setCategory] = useState<PotCategory>('Goal')
  const [contributors, setContributors] = useState<Set<string>>(new Set())
  const [signersRequired, setSignersRequired] = useState(1)

  const [targetDate, setTargetDate] = useState(getDefaultTargetDateString)
  const [showPicker, setShowPicker] = useState(false)
  const [showCustomPicker, setShowCustomPicker] = useState(false)
  const [customDate, setCustomDate] = useState(() => {
    const parsed = new Date(getDefaultTargetDateString())
    return isNaN(parsed.getTime()) ? tomorrow() : parsed
  })
  const isIOS = Platform.OS === 'ios'

  const [alertModal, setAlertModal] = useState<{
    visible: boolean
    title: string
    message: string
    buttons?: AlertButton[]
  }>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  })

  const { fetchActivities } = useAppStore()

  const ensureFuture = (date: Date) => {
    const min = today()
    return date.getTime() < min.getTime() ? min : date
  }

  const numAmount = parseFloat(amount)
  const dateObj = new Date(targetDate)

  // Calculate SOL equivalent if USDC is selected
  const solEquivalent = useMemo(() => {
    if (currency === 'USDC' && !isNaN(numAmount) && numAmount > 0) {
      return usdToSol(numAmount)
    }
    return numAmount
  }, [currency, numAmount, usdToSol])

  const valid =
    name.trim().length > 0 &&
    !isNaN(numAmount) &&
    numAmount > 0 &&
    !isNaN(dateObj.getTime()) &&
    dateObj >= today() &&
    contributors.size > 0 &&
    category !== undefined &&
    signersRequired > 0 &&
    signersRequired <= contributors.size + 1

  const applyDate = (d: Date) => {
    const n = ensureFuture(d)
    setCustomDate(n)
    setTargetDate(formatDate(n))
    setShowPicker(false)
    setShowCustomPicker(false)
  }

  const pickQuick = (days: number) => applyDate(new Date(Date.now() + days * dayMs))

  const openDateOverlay = () => {
    setCustomDate(ensureFuture(new Date(targetDate)))
    setShowPicker(true)
    setShowCustomPicker(false)
  }

  const toggleContributor = (addr: string) =>
    setContributors((prev) => {
      const next = new Set(prev)
      next.has(addr) ? next.delete(addr) : next.add(addr)
      return next
    })

  const create = async () => {
    if (!account) {
      setAlertModal({
        visible: true,
        title: 'Connect wallet',
        message: 'Please connect wallet.',
      })
      return
    }
    if (!valid) {
      setAlertModal({
        visible: true,
        title: 'Invalid',
        message: 'Fill required fields properly.',
      })
      return
    }

    try {
      const creatorAddress = account.publicKey.toBase58()
      const uniqueContributors = new Set([creatorAddress, ...Array.from(contributors)])
      const allContributors = Array.from(uniqueContributors)

      // Calculate unlock days from target date
      const now = new Date()
      const target = new Date(targetDate)

      // Check if target date is today (same calendar day)
      const isSameDay = now.toDateString() === target.toDateString()

      let unlockDays: number
      if (isSameDay) {
        // Same day = immediate unlock (0 days)
        unlockDays = 0
      } else {
        // Calculate days difference
        unlockDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      }

      // Create pot on blockchain - always use SOL amount
      // If USDC is selected, solEquivalent contains the converted SOL amount
      const targetAmountInSol = currency === 'USDC' ? solEquivalent : numAmount

      const { signature, potPubkey } = await createPotOnChain({
        name: name.trim(),
        description: description.trim() || '',
        targetAmount: targetAmountInSol,
        unlockDays, // Send 0 for same day, otherwise calculated days
        signersRequired, // Use user-specified value
        contributors: allContributors, // Add all contributors on-chain in same tx
      })

      // Close any open modals first
      setShowPicker(false)
      setShowCustomPicker(false)

      // Calculate unlock timestamp for backend
      const unlockTimestamp = Math.floor(new Date(targetDate).getTime() / 1000)

      // Get vault PDA
      const [vaultPDA] = programService.getVaultPDA(new PublicKey(potPubkey))

      // Save to backend database via store
      // Store the display amount (USD if USDC selected, SOL if SOL selected)
      // But note that blockchain always uses SOL
      await createPot({
        name: name.trim(),
        description: description.trim() || undefined,
        creatorAddress,
        potPubkey, // Store the blockchain PDA
        vaultPubkey: vaultPDA.toBase58(), // Store vault PDA
        targetAmount: numAmount, // Store original display amount
        targetDate: new Date(targetDate),
        unlockTimestamp, // Unix timestamp
        currency, // Store selected currency for display
        category,
        signersRequired,
        signatures: [],
        recipientAddress: creatorAddress, // Default recipient is creator
        contributors: allContributors,
        transactionSignature: signature, // Store blockchain tx signature
      })

      // Refetch activities to include the new pot creation activity with tx signature
      if (account) {
        await fetchActivities(account.publicKey.toBase58())
      }

      // Use requestAnimationFrame to ensure all state updates complete
      requestAnimationFrame(() => {
        router.back()

        // Show toast after navigation
        setTimeout(() => {
          showToast({
            title: 'Pot created',
            message: `${name.trim()} is ready to fund`,
            type: 'success',
          })
        }, 200)
      })
    } catch (error) {
      console.error('Error creating pot:', error)
      showToast({
        title: 'Failed to create pot',
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
      })
    }
  }

  if (!account) {
    return (
      <AppPage>
        <View style={styles.disconnected}>
          <Text style={[styles.disconnectedText, { color: palette.textSecondary }]}>
            Please connect your wallet
          </Text>
        </View>
      </AppPage>
    )
  }

  return (
    <AppPage>
      <LinearGradient
        colors={palette.gradient}
        locations={isDark ? [0, 0.55, 1] : [0, 0.5, 1]}
        style={styles.gradient}
      >
        <View style={styles.screen}>
          <CreatePotHeader
            palette={palette}
            isValid={valid}
            onCancel={() => router.back()}
            onCreate={create}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Platform.OS === 'ios' ? 48 : 32 },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <OverviewSection
              name={name}
              description={description}
              targetDate={targetDate}
              palette={palette}
              inputBaseStyle={inputBaseStyle}
              isDark={isDark}
              onNameChange={setName}
              onDescriptionChange={setDescription}
              onDatePress={openDateOverlay}
            />

            <GoalSection
              amount={amount}
              currency={currency}
              palette={palette}
              inputBaseStyle={inputBaseStyle}
              isDark={isDark}
              onAmountChange={setAmount}
              onCurrencyChange={setCurrency}
              solEquivalent={currency === 'USDC' ? solEquivalent : undefined}
              solPrice={solPrice || undefined}
            />

            <CategorySelector
              category={category}
              palette={palette}
              cardStyle={cardStyle}
              onCategoryChange={setCategory}
            />

            <ContributorSelector
              friends={friends}
              selectedContributors={contributors}
              palette={palette}
              cardStyle={cardStyle}
              onToggleContributor={toggleContributor}
            />

            {/* Signers Required Section */}
            <View style={[styles.card, cardStyle]}>
              <AppText style={[styles.sectionTitle, { color: palette.text }]}>
                Multi-Signature Release
              </AppText>
              <AppText style={[styles.sectionSubtitle, { color: palette.textSecondary }]}>
                How many contributors must approve to release funds?
              </AppText>

              <View style={styles.signersRow}>
                {[1, 2, 3, 'all'].map((option) => {
                  const totalCount = contributors.size + 1
                  const value = option === 'all' ? totalCount : option as number
                  const isSelected = signersRequired === value
                  const label = option === 'all' ? `All (${totalCount})` : `${option}`
                  const isDisabled = value > totalCount

                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.signerOption,
                        {
                          backgroundColor: isSelected ? palette.accent : palette.surfaceMuted,
                          borderColor: isSelected ? palette.accent : palette.border,
                        },
                        isDisabled && styles.signerOptionDisabled,
                      ]}
                      onPress={() => !isDisabled && setSignersRequired(value)}
                      disabled={isDisabled}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.signerOptionText,
                          {
                            color: isSelected ? '#041015' : isDisabled ? palette.textSecondary : palette.text,
                          },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              {signersRequired > contributors.size + 1 && (
                <AppText style={[styles.warningText, { color: '#FF6B6B' }]}>
                  Not enough contributors selected
                </AppText>
              )}
            </View>

            <TouchableOpacity
              style={[styles.primaryButtonWrapper, { shadowColor: palette.accent }]}
              onPress={create}
              activeOpacity={0.9}
              disabled={!valid || isCreatingOnChain}
            >
              <LinearGradient
                colors={[palette.accent, palette.accentSecondary]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[styles.primaryButton, { opacity: valid && !isCreatingOnChain ? 1 : 0.5 }]}
              >
                <Text style={styles.primaryButtonText}>
                  {isCreatingOnChain ? 'Creating...' : 'Create pot'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <DatePickerModal
          visible={showPicker}
          customDate={customDate}
          showCustomPicker={showCustomPicker}
          palette={palette}
          cardStyle={cardStyle}
          isDark={isDark}
          isIOS={isIOS}
          onClose={() => {
            setShowPicker(false)
            setShowCustomPicker(false)
          }}
          onQuickSelect={pickQuick}
          onCustomDateChange={setCustomDate}
          onShowCustomPicker={() => setShowCustomPicker((s) => !s)}
          onApplyDate={applyDate}
        />

        <AlertModal
          visible={alertModal.visible}
          title={alertModal.title}
          message={alertModal.message}
          buttons={alertModal.buttons}
          colors={colors}
          onClose={() => setAlertModal({ visible: false, title: '', message: '', buttons: [] })}
        />
      </LinearGradient>
    </AppPage>
  )
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  disconnected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  disconnectedText: {
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: 18,
    gap: 16,
  },
  primaryButtonWrapper: {
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#041015',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  signersRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  signerOption: {
    flex: 1,
    minWidth: 60,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signerOptionDisabled: {
    opacity: 0.4,
  },
  signerOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  warningText: {
    fontSize: 12,
    marginTop: 8,
  },
})
