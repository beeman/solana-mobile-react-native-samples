import { AppPage } from '@/components/app-page'
import { AppText } from '@/components/app-text'
import { AppView } from '@/components/app-view'
import { AlertModal, AlertButton } from '@/components/pots/AlertModal'
import { ContributeModal } from '@/components/pots/ContributeModal'
import { ContributionList } from '@/components/pots/ContributionList'
import { ContributorList } from '@/components/pots/ContributorList'
import { EditPotModal } from '@/components/pots/EditPotModal'
import { PotActions } from '@/components/pots/PotActions'
import { PotHeader } from '@/components/pots/PotHeader'
import { PotInfoCard } from '@/components/pots/PotInfoCard'
import { PotProgressCard } from '@/components/pots/PotProgressCard'
import { PotTabs } from '@/components/pots/PotTabs'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { useToast } from '@/components/toast/toast-provider'
import { Colors } from '@/constants/colors'
import { PotCategory, useAppStore } from '@/store/app-store'
import { usePotProgram } from '@/hooks/use-pot-program'
import { useCurrencyConversion } from '@/hooks/use-currency-conversion'
import { ellipsify } from '@/utils/ellipsify'
import { displayAddress } from '@/utils/display-address'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import { ScrollView, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native'
import { PublicKey } from '@solana/web3.js'

export default function PotDetailsScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = Colors[isDark ? 'dark' : 'light']
  const { account, connection } = useMobileWallet()
  const { getPotById, addContribution, releasePot, updatePot, friends, fetchActivities, refreshPot } = useAppStore()
  const { showToast } = useToast()
  const {
    contribute: contributeOnChain,
    signRelease: signReleaseOnChain,
    releaseFunds: releaseFundsOnChain,
    isLoading: isBlockchainLoading,
    programService
  } = usePotProgram()
  const { usdToSol, solPrice } = useCurrencyConversion()
  const pot = id ? getPotById(id) : null

  const [showContributeModal, setShowContributeModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [contributionAmount, setContributionAmount] = useState('')
  const [contributionCurrency, setContributionCurrency] = useState<'SOL' | 'USDC'>('SOL')
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [activeTab, setActiveTab] = useState<'contributions' | 'contributors'>('contributions')
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

  if (!pot) {
    return (
      <AppPage>
        <AppView style={styles.emptyContainer}>
          <AppText>Pot not found</AppText>
          <TouchableOpacity onPress={() => router.back()}>
            <AppText style={[styles.backButton, { color: colors.accentGreen }]}>Go Back</AppText>
          </TouchableOpacity>
        </AppView>
      </AppPage>
    )
  }

  if (!account) {
    return (
      <AppPage>
        <AppView style={styles.emptyContainer}>
          <AppText>Please connect your wallet</AppText>
        </AppView>
      </AppPage>
    )
  }

  const userAddress = account.publicKey.toBase58()
  const totalContributed = pot.contributions.reduce((sum, c) => sum + c.amount, 0)
  const progress = Math.min((totalContributed / pot.targetAmount) * 100, 100)
  const isTargetReached = progress >= 100
  const isContributor = pot.contributors.includes(userAddress) || pot.creatorAddress === userAddress

  // Check if unlock time has passed
  const now = Date.now()
  const unlockTime = pot.unlockTimestamp ? pot.unlockTimestamp * 1000 : new Date(pot.targetDate).getTime()
  const hasUnlockTimePassed = now >= unlockTime

  // Multi-sig logic
  const currentSignatures = pot.signatures?.length || 0
  const requiredSignatures = pot.signersRequired || 1
  const hasAlreadySigned = pot.signatures?.includes(userAddress) || false
  const hasEnoughSignatures = currentSignatures >= requiredSignatures

  // Can sign if: is contributor, unlock time passed, hasn't signed yet, not released
  const canSign = isContributor && hasUnlockTimePassed && !hasAlreadySigned && !pot.isReleased

  // Can release if: unlock time passed, enough signatures, target reached, not released
  const isReleaseable = hasUnlockTimePassed && hasEnoughSignatures && isTargetReached && !pot.isReleased

  const handleContribute = async () => {
    const amount = parseFloat(contributionAmount)
    if (isNaN(amount) || amount <= 0) {
      setAlertModal({
        visible: true,
        title: 'Error',
        message: 'Please enter a valid amount greater than 0',
      })
      return
    }

    const currency = pot.currency

    try {
      // Use the stored pot pubkey from blockchain
      const potPubkey = pot.potPubkey || pot.id

      if (!pot.potPubkey) {
        setAlertModal({
          visible: true,
          title: 'Error',
          message: 'Pot not yet on blockchain. Please try again later.',
        })
        return
      }

      // Convert to SOL if currency is USDC
      // Blockchain always uses SOL, USDC is just for display
      const amountInSol = currency === 'USDC' ? usdToSol(amount) : amount

      // Contribute on blockchain (always in SOL)
      const signature = await contributeOnChain({
        potPubkey,
        amount: amountInSol,
      })

      // Update local store with display amount
      await addContribution({
        potId: pot.id,
        contributorAddress: userAddress,
        amount, // Store display amount
        currency,
        transactionSignature: signature, // Store blockchain tx signature
      })

      // Refetch activities to include the new contribution with tx signature
      await fetchActivities(userAddress)

      setContributionAmount('')
      setShowContributeModal(false)
      showToast({
        title: 'Contribution sent',
        message: currency === 'USDC'
          ? `+$${amount.toFixed(2)} (≈${amountInSol.toFixed(4)} SOL) into ${pot.name}`
          : `+${amount.toFixed(4)} ${currency} into ${pot.name}`,
        type: 'success',
      })
    } catch (error) {
      console.error('Error contributing:', error)
      showToast({
        title: 'Contribution failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
      })
    }
  }

  const handleSignRelease = async () => {
    if (!account || !connection) {
      setAlertModal({
        visible: true,
        title: 'Error',
        message: 'Wallet not connected',
      })
      return
    }

    try {
      const potPubkey = pot.potPubkey || pot.id

      if (!pot.potPubkey) {
        setAlertModal({
          visible: true,
          title: 'Error',
          message: 'Pot not yet on blockchain. Please try again later.',
        })
        return
      }

      // Sign the release transaction
      const signature = await signReleaseOnChain(potPubkey)

      // Update backend with signature
      await import('@/api/pots').then(api =>
        api.signPotRelease(pot.id, userAddress, signature)
      )

      // Refetch pot data to get updated signatures
      await refreshPot(pot.id)

      // Refetch activities to include the new sign_release activity
      await fetchActivities(userAddress)

      showToast({
        title: 'Release signed',
        message: `Your signature has been recorded (${currentSignatures + 1}/${requiredSignatures})`,
        type: 'success',
      })
    } catch (error) {
      console.error('Error signing release:', error)
      showToast({
        title: 'Sign failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
      })
    }
  }

  const handleRelease = () => {
    if (pot.isReleased) {
      setAlertModal({
        visible: true,
        title: 'Already Released',
        message: 'This pot has already been released.',
      })
      return
    }

    setAlertModal({
      visible: true,
      title: 'Release Pot',
      message: `Funds will be released to the pot creator (${ellipsify(pot.creatorAddress, 8)}). Continue?`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Release',
          onPress: async () => {
            try {
              const potPubkey = pot.potPubkey || pot.id
              const recipient = pot.creatorAddress // Funds go to the creator

              if (!pot.potPubkey) {
                setAlertModal({
                  visible: true,
                  title: 'Error',
                  message: 'Pot not yet on blockchain. Please try again later.',
                })
                return
              }

              // Release funds on blockchain
              const signature = await releaseFundsOnChain({
                potPubkey,
                recipient,
              })

              // Update local store
              await releasePot(pot.id, userAddress, signature)

              // Refetch activities to include the release activity with tx signature
              await fetchActivities(userAddress)

              showToast({
                title: 'Pot released',
                message: `Funds sent to creator ${ellipsify(pot.creatorAddress, 8)}`,
                type: 'success',
              })
            } catch (error) {
              console.error('Error releasing pot:', error)
              showToast({
                title: 'Release failed',
                message: error instanceof Error ? error.message : 'Unknown error',
                type: 'error',
              })
            }
          },
        },
      ],
    })
  }

  const handleEdit = (name: string, description: string) => {
    if (!name.trim()) {
      setAlertModal({
        visible: true,
        title: 'Error',
        message: 'Please enter a pot name',
      })
      return
    }

    updatePot(pot.id, {
      name: name.trim(),
      description: description.trim() || undefined,
    })

    setShowEditModal(false)
    setEditName('')
    setEditDescription('')
    showToast({
      title: 'Pot updated',
      message: 'Details saved for everyone',
      type: 'info',
    })
  }

  const getContributorName = useCallback(
    (address: string) => {
      if (address === pot.creatorAddress) return 'Creator'
      const friend = friends.find((f) => f.address === address)
      return friend?.displayName || displayAddress(address, friend?.domain, 8)
    },
    [pot.creatorAddress, friends]
  )

  const getContributorDomain = useCallback(
    (address: string) => {
      const friend = friends.find((f) => f.address === address)
      return friend?.domain
    },
    [friends]
  )

  const getCategoryIcon = useCallback((category: PotCategory) => {
    switch (category) {
      case 'Goal': return 'flag'
      case 'Emergency': return 'emergency'
      case 'Bills': return 'receipt'
      case 'Events': return 'event'
      case 'Others': return 'category'
      default: return 'savings'
    }
  }, [])

  const getCategoryColor = useCallback((category: PotCategory) => {
    switch (category) {
      case 'Goal': return '#22E1A2'
      case 'Emergency': return '#FF6B6B'
      case 'Bills': return '#4ECDC4'
      case 'Events': return '#FFD93D'
      case 'Others': return '#95A5A6'
      default: return colors.accentGreen
    }
  }, [colors.accentGreen])

  return (
    <AppPage>
      <PotHeader
        potName={pot.name}
        colors={colors}
        onBack={() => router.back()}
        onEdit={
          !pot.isReleased
            ? () => {
                setEditName(pot.name)
                setEditDescription(pot.description || '')
                setShowEditModal(true)
              }
            : undefined
        }
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {pot.description && (
          <AppText style={[styles.description, { color: colors.textSecondary }]}>{pot.description}</AppText>
        )}

        <PotProgressCard
          progress={progress}
          totalContributed={totalContributed}
          targetAmount={pot.targetAmount}
          currency={pot.currency}
          colors={colors}
        />

        <PotInfoCard pot={pot} colors={colors} getCategoryIcon={getCategoryIcon} getCategoryColor={getCategoryColor} getContributorDomain={getContributorDomain} />

        <PotActions
          isContributor={isContributor}
          isReleased={pot.isReleased}
          isReleaseable={isReleaseable}
          isTargetReached={isTargetReached}
          progress={progress}
          colors={colors}
          canSign={canSign}
          hasEnoughSignatures={hasEnoughSignatures}
          currentSignatures={currentSignatures}
          requiredSignatures={requiredSignatures}
          onContribute={() => {
            setContributionCurrency(pot.currency)
            setShowContributeModal(true)
          }}
          onSignRelease={handleSignRelease}
          onRelease={handleRelease}
        />

        <PotTabs
          activeTab={activeTab}
          contributionsCount={pot.contributions.length}
          contributorsCount={pot.contributors.length}
          colors={colors}
          onTabChange={setActiveTab}
        />

        {activeTab === 'contributions' && (
          <ContributionList
            contributions={pot.contributions}
            getContributorName={getContributorName}
            colors={colors}
          />
        )}

        {activeTab === 'contributors' && (
          <ContributorList
            contributors={pot.contributors}
            creatorAddress={pot.creatorAddress}
            getContributorName={getContributorName}
            getContributorDomain={getContributorDomain}
            colors={colors}
          />
        )}
      </ScrollView>

      <ContributeModal
        visible={showContributeModal}
        amount={contributionAmount}
        currency={pot.currency}
        potName={pot.name}
        colors={colors}
        onClose={() => {
          setShowContributeModal(false)
          setContributionAmount('')
        }}
        onAmountChange={setContributionAmount}
        onSubmit={handleContribute}
      />

      <EditPotModal
        visible={showEditModal}
        name={editName || pot.name}
        description={editDescription || pot.description || ''}
        colors={colors}
        onClose={() => {
          setShowEditModal(false)
          setEditName('')
          setEditDescription('')
        }}
        onNameChange={setEditName}
        onDescriptionChange={setEditDescription}
        onSubmit={() => handleEdit(editName || pot.name, editDescription || pot.description || '')}
      />

      <AlertModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        buttons={alertModal.buttons}
        colors={colors}
        onClose={() => setAlertModal({ visible: false, title: '', message: '', buttons: [] })}
      />
    </AppPage>
  )
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
  },
  description: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
})
