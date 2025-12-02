import React from 'react'
import { AppPage } from '@/components/app-page'
import { AppText } from '@/components/app-text'
import { View, StyleSheet } from 'react-native'
import { useAppTheme } from '@/hooks/use-app-theme'

export default function TabsDemoScreen() {
  const { palette } = useAppTheme()

  return (
    <AppPage>
      <View style={styles.container}>
        <AppText style={[styles.title, { color: palette.text }]}>Demo Tab</AppText>
        <AppText style={[styles.subtitle, { color: palette.textSecondary }]}>
          This is the demo section
        </AppText>
      </View>
    </AppPage>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'IBMPlexSans-Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
})
