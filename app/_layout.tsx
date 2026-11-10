import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { SplashView } from '../src/components/auth/SplashView';
import { CartSync } from '../src/components/CartSync';
import { PushRegistrar } from '../src/components/PushRegistrar';
import { Colors } from '../src/constants/colors';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootNavigator() {
  const { loading } = useAuth();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  if (loading) {
    return <SplashView />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar style="auto" />
            <CartSync />
            <PushRegistrar />
            <RootNavigator />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </View>
  );
}
