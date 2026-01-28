import { Stack } from 'expo-router';
import { colors } from '@/theme/colors';

export default function TransactionsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary[600],
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Transactions',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Transaction',
        }}
      />
    </Stack>
  );
}
