import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { Colors } from '../../src/constants/colors';

export default function AuthLayout() {
  const { session, loading } = useAuth();

  if (!loading && session) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
}
