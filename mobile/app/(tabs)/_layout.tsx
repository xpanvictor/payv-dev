import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { WalletColors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

function TabBarIcon({
  name,
  color,
}: {
  name: keyof typeof MaterialIcons.glyphMap;
  color: string;
}) {
  return (
    <MaterialIcons
      name={name}
      size={24}
      color={color}
    />
  );
}

/**
 * Bottom tab navigation layout matching the wallet design.
 * Features: Home, Browser, Swap (center), NFTs, Settings
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: WalletColors.primary,
        tabBarInactiveTintColor: WalletColors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="dashboard" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="browser"
        options={{
          title: 'Browser',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="public" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="swap"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.swapButton}>
              <MaterialIcons name="swap-calls" size={24} color={WalletColors.white} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="nfts"
        options={{
          title: 'NFTs',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="grid-view" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="settings" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(30, 25, 51, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    height: 80,
    paddingTop: 8,
    paddingBottom: 24,
  },
  tabBarLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 10,
  },
  swapButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: WalletColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: WalletColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 4,
    borderColor: WalletColors.surfaceDark,
  },
});
