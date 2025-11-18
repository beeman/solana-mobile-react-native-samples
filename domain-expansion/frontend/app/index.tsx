import { useState } from 'react';
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
import { useDomainLookup, SearchMode } from '@/hooks/use-domain-lookup';
import { useAuth } from '@/components/auth/auth-provider';
import { router, Redirect } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInDown, SlideInUp } from 'react-native-reanimated';

export default function Index() {
  const { isAuthenticated, signOut } = useAuth();
  const [searchMode, setSearchMode] = useState<SearchMode>('domain');
  const [inputValue, setInputValue] = useState('');
  const [copied, setCopied] = useState(false);
  const { result, searchDomain, searchPublicKey } = useDomainLookup();

  if (!isAuthenticated) {
    return <Redirect href="/sign-in" />;
  }

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
                <View>
                  <AppText style={styles.title}>Domain Lookup</AppText>
                  <AppText style={styles.subtitle}>Solana Name Service</AppText>
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

            {/* Error Section */}
            {result.error && (
              <View style={styles.errorSection}>
                <AppText style={styles.errorTitle}>Error</AppText>
                <AppText style={styles.errorMessage}>{result.error}</AppText>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#f3e8ff',
    fontWeight: '500',
    marginTop: 4,
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
  errorSection: {
    backgroundColor: '#fee2e2',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ef4444',
  },
  errorMessage: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});
