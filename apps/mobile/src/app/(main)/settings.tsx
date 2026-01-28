import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { LoadingSpinner, Card } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing, fontSize, fontWeight, borderRadius } from '@/theme/spacing';

interface FamilyMember {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MEMBER';
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
}

export default function SettingsScreen() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const {
    data: members,
    isLoading: membersLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['family-members'],
    queryFn: () => api.family.members() as Promise<FamilyMember[]>,
  });

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
            } catch {
              Alert.alert('Error', 'Failed to logout');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const getRoleIcon = (role: string) => {
    return role === 'ADMIN' ? 'shield-checkmark' : 'person';
  };

  const getRoleColor = (role: string) => {
    return role === 'ADMIN' ? colors.primary[600] : colors.gray[500];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return colors.success[600];
      case 'PENDING':
        return colors.warning[600];
      case 'SUSPENDED':
        return colors.error[600];
      default:
        return colors.gray[500];
    }
  };

  if (authLoading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary[600]}
          />
        }
      >
        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: getRoleColor(user?.role || 'MEMBER') },
              ]}
            >
              <Ionicons
                name={getRoleIcon(user?.role || 'MEMBER') as keyof typeof Ionicons.glyphMap}
                size={12}
                color={colors.white}
              />
            </View>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>
              {user?.role === 'ADMIN' ? 'Family Admin' : 'Family Member'}
            </Text>
          </View>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Family Members</Text>
          {membersLoading ? (
            <Card style={styles.loadingCard}>
              <LoadingSpinner size="small" />
              <Text style={styles.loadingText}>Loading members...</Text>
            </Card>
          ) : (
            <Card style={styles.membersCard}>
              {members?.map((member, index) => (
                <View
                  key={member.id}
                  style={[
                    styles.memberRow,
                    index < (members?.length || 0) - 1 && styles.memberRowBorder,
                  ]}
                >
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {member.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      {member.id === user?.id && (
                        <Text style={styles.youBadge}>You</Text>
                      )}
                    </View>
                    <Text style={styles.memberEmail}>{member.email}</Text>
                  </View>
                  <View style={styles.memberMeta}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusColor(member.status) },
                      ]}
                    />
                    <Ionicons
                      name={getRoleIcon(member.role) as keyof typeof Ionicons.glyphMap}
                      size={16}
                      color={getRoleColor(member.role)}
                    />
                  </View>
                </View>
              ))}
              {(!members || members.length === 0) && (
                <Text style={styles.noMembers}>No family members found</Text>
              )}
            </Card>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Info</Text>
          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            <View style={[styles.infoRow, styles.infoRowBorder]}>
              <Text style={styles.infoLabel}>Platform</Text>
              <Text style={styles.infoValue}>React Native (Expo)</Text>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <LoadingSpinner size="small" color={colors.error[600]} />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={20} color={colors.error[600]} />
                <Text style={styles.logoutText}>Logout</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
  },
  profileCard: {
    padding: spacing[6],
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing[3],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
  roleBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  userEmail: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing[1],
  },
  roleContainer: {
    marginTop: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.full,
  },
  roleLabel: {
    fontSize: fontSize.sm,
    color: colors.primary[700],
    fontWeight: fontWeight.medium,
  },
  section: {
    marginTop: spacing[6],
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing[3],
    marginLeft: spacing[1],
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    gap: spacing[3],
  },
  loadingText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  membersCard: {
    padding: spacing[2],
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
  },
  memberRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  memberAvatarText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[600],
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  memberName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  youBadge: {
    fontSize: fontSize.xs,
    color: colors.primary[600],
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.full,
  },
  memberEmail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing[0.5],
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  noMembers: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing[4],
  },
  infoCard: {
    padding: spacing[2],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[3],
  },
  infoRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  infoLabel: {
    fontSize: fontSize.base,
    color: colors.text,
  },
  infoValue: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.error[200],
    gap: spacing[2],
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.error[600],
  },
});
