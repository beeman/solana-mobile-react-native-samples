import { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { AppText } from '@/components/app-text';
import { useDomainLookup, SearchMode, resolveAddressToDomain } from '@/hooks/use-domain-lookup';
import { useAuth } from '@/components/auth/auth-provider';
import { router, Redirect } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ellipsify } from '@/utils/ellipsify';
import Toast from 'react-native-toast-message';

export default function Index() {
  const { isAuthenticated, signOut, selectedAccount } = useAuth();
  const [searchMode, setSearchMode] = useState<SearchMode>('domain');
  const [inputValue, setInputValue] = useState('');
  const [copied, setCopied] = useState(false);
  const [userDomain, setUserDomain] = useState<string | null>(null);
  const [isLoadingDomain, setIsLoadingDomain] = useState(true);
  const { result, searchDomain, searchPublicKey } = useDomainLookup();

  // Fetch user's .skr domain on mount
  useEffect(() => {
    if (selectedAccount?.publicKey) {
      setIsLoadingDomain(true);
      const pubkeyStr = selectedAccount.publicKey.toBase58();
      resolveAddressToDomain(pubkeyStr)
        .then(setUserDomain)
        .finally(() => setIsLoadingDomain(false));
    }
  }, [selectedAccount?.publicKey]);

  // Show toast notifications for search results
  useEffect(() => {
    if (result.error) {
      Toast.show({
        type: 'error',
        text1: 'Lookup Failed',
        text2: result.error,
        position: 'top',
        visibilityTime: 4000,
      });
    } else if (result.result) {
      Toast.show({
        type: 'success',
        text1: 'Found!',
        text2: searchMode === 'domain' ? 'Wallet address found' : 'Domain found',
        position: 'top',
        visibilityTime: 2000,
      });
    }
  }, [result.error, result.result]);

  if (!isAuthenticated) {
    return <Redirect href="/sign-in" />;
  }

  // Show loading screen while fetching domain
  if (isLoadingDomain) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#9333ea', '#a855f7', '#c084fc']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#ffffff" />
        </LinearGradient>
      </View>
    );
  }

  // Display name: domain if available, otherwise truncated pubkey
  const hasDomain = !!userDomain;
  const displayName = userDomain
    || (selectedAccount?.publicKey
        ? ellipsify(selectedAccount.publicKey.toBase58(), 4)
        : 'User');

  const handleSearch = () => {
    if (!inputValue.trim()) return;

    if (searchMode === 'domain') {
      searchDomain(inputValue.trim());
    } else {
      searchPublicKey(inputValue.trim());
    }
  };

  const handleDisconnect = async () => {
    await signOut();
    router.replace('/sign-in');
  };

  const handleCopy = () => {
    if (result.result) {
      Clipboard.setString(result.result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#9333ea', '#a855f7', '#c084fc']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeAreaTop} edges={['top']}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Animated.View
              style={styles.headerContent}
              entering={FadeInDown.duration(600).delay(100)}
            >
              <View style={styles.headerTop}>
                <View style={styles.headerLeft}>
                  <AppText style={styles.welcomeText}>Welcome,</AppText>
                  <AppText style={styles.displayName}>{displayName}</AppText>
                  {!hasDomain && (
                    <AppText style={styles.noSkrHint}>
                      No .skr domain linked to this wallet
                    </AppText>
                  )}
                </View>
                <Pressable style={styles.logoutButton} onPress={handleDisconnect}>
                  <AppText style={styles.logoutText}>Sign Out</AppText>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </SafeAreaView>

        {/* Main Content Card - Bottom with rounded top */}
        <View style={styles.contentCard}>
          <Animated.View
            entering={FadeInUp.duration(700).delay(200)}
            style={{ flex: 1 }}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
            {/* Toggle */}
            <View style={styles.toggleContainer}>
              <Pressable
                style={[
                  styles.toggleButton,
                  searchMode === 'domain' && styles.toggleButtonActive,
                ]}
                onPress={() => {
                  setSearchMode('domain');
                  setInputValue('');
                }}
              >
                <AppText
                  style={[
                    styles.toggleText,
                    searchMode === 'domain' && styles.toggleTextActive,
                  ]}
                >
                  Domain
                </AppText>
              </Pressable>
              <Pressable
                style={[
                  styles.toggleButton,
                  searchMode === 'pubkey' && styles.toggleButtonActive,
                ]}
                onPress={() => {
                  setSearchMode('pubkey');
                  setInputValue('');
                }}
              >
                <AppText
                  style={[
                    styles.toggleText,
                    searchMode === 'pubkey' && styles.toggleTextActive,
                  ]}
                >
                  Address
                </AppText>
              </Pressable>
            </View>

            {/* Input Section */}
            <View style={styles.inputSection}>
              <AppText style={styles.label}>
                {searchMode === 'domain' ? 'Domain Name' : 'Wallet Address'}
              </AppText>
              <TextInput
                style={styles.input}
                placeholder={searchMode === 'domain' ? 'example.skr' : 'Enter wallet address'}
                placeholderTextColor="#94a3b8"
                value={inputValue}
                onChangeText={setInputValue}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Search Button */}
            <Pressable
              style={[
                styles.searchButton,
                !inputValue.trim() && styles.searchButtonDisabled,
              ]}
              onPress={handleSearch}
              disabled={!inputValue.trim() || result.isLoading}
            >
              <LinearGradient
                colors={inputValue.trim() ? ['#9333ea', '#a855f7'] : ['#cbd5e1', '#94a3b8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.searchGradient}
              >
                {result.isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <AppText style={styles.searchText}>Search</AppText>
                )}
              </LinearGradient>
            </Pressable>

            {/* Results Section */}
            {result.result && (
              <View style={styles.resultSection}>
                <View style={styles.resultHeader}>
                  <AppText style={styles.resultTitle}>Result</AppText>
                  <View style={styles.successBadge}>
                    <AppText style={styles.badgeText}>Found</AppText>
                  </View>
                </View>
                <View style={styles.resultContent}>
                  <AppText style={styles.resultLabel}>
                    {searchMode === 'domain' ? 'WALLET ADDRESS' : 'DOMAIN NAME'}
                  </AppText>
                  <View style={styles.resultValueContainer}>
                    <AppText style={styles.resultValue} selectable>
                      {result.result}
                    </AppText>
                    <Pressable style={styles.copyButton} onPress={handleCopy}>
                      <MaterialIcons
                        name={copied ? 'check' : 'content-copy'}
                        size={20}
                        color="#ffffff"
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            </ScrollView>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeAreaTop: {
    zIndex: 1,
  },
  headerSection: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerContent: {
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  welcomeText: {
    fontSize: 14,
    color: '#f3e8ff',
    fontWeight: '500',
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
  noSkrHint: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  contentCard: {
    position: 'absolute',
    top: 160,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  scrollContent: {
    padding: 24,
    gap: 24,
    paddingBottom: 40,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#e9d5ff',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#ffffff',
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9333ea',
  },
  toggleTextActive: {
    color: '#0f172a',
  },
  inputSection: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#0f172a',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  searchButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#9333ea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  searchButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  searchGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  searchText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  resultSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  successBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  resultContent: {
    gap: 10,
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
  },
  resultValueContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  resultValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'monospace',
    lineHeight: 22,
    flex: 1,
  },
  copyButton: {
    backgroundColor: '#9333ea',
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
