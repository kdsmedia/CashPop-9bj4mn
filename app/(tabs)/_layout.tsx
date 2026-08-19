import React from 'react';
import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSize } from '@/constants/theme';
import { AdmobBanner } from '@/components/feature/AdmobBanner';

function TabBarWithAd({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: Colors.tabBg }}>
      <AdmobBanner />
      {children}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  const tabBarStyle = {
    height: Platform.select({ ios: insets.bottom + 60, android: insets.bottom + 60, default: 70 }),
    paddingTop: 8,
    paddingBottom: Platform.select({ ios: insets.bottom + 8, android: insets.bottom + 8, default: 8 }),
    backgroundColor: Colors.tabBg,
    borderTopWidth: 1,
    borderTopColor: Colors.tabBorder,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarLabelStyle: { fontSize: FontSize.xs, fontWeight: '600' },
      }}
      tabBar={(props) => {
        const DefaultTabBar = require('@react-navigation/bottom-tabs').BottomTabBar;
        return (
          <TabBarWithAd>
            <DefaultTabBar {...props} />
          </TabBarWithAd>
        );
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mining',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="currency-bitcoin" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tugas',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="task-alt" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="booster"
        options={{
          title: 'Booster',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="rocket-launch" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Dompet',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="account-balance-wallet" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
