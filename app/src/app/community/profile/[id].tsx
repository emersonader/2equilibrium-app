import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Layout } from '@/constants';
import { Card, Button, Badge } from '@/components/ui';
import { UserAvatar, FollowButton, ActivityCardCompact } from '@/components/community';
import { useCommunityStore, useUserStore } from '@/stores';
import * as communityService from '@/services/communityService';
import type { PublicProfile, ActivityFeedItem } from '@/services/database.types';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile: currentUser } = useUserStore();
  const { followUser, unfollowUser } = useCommunityStore();

  const [profileData, setProfileData] = useState<PublicProfile | null>(null);
  const [userPosts, setUserPosts] = useState<ActivityFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [stats, setStats] = useState<{ currentStreak?: number; badgeCount?: number }>({});

  const isOwnProfile = currentUser?.id === id;

  const loadProfile = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const profile = await communityService.getPublicProfile(id);
      setProfileData(profile);

      if (profile) {
        // Load follow status
        const followStatus = await communityService.isFollowing(id);
        setIsFollowing(followStatus);

        // Load counts
        const { followers, following } = await communityService.getFollowCounts(id);
        setFollowerCount(followers);
        setFollowingCount(following);

        // Load user posts
        const posts = await communityService.getUserPosts(id);
        setUserPosts(posts);

        // Get stats from metadata if available
        if (profile.show_streak || profile.show_badges) {
          // These would come from the user's progress data
          // For now using placeholder logic
          setStats({
            currentStreak: profile.show_streak ? 0 : undefined,
            badgeCount: profile.show_badges ? 0 : undefined,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleFollow = async () => {
    if (!id) return;

    try {
      if (isFollowing) {
        await unfollowUser(id);
        setIsFollowing(false);
        setFollowerCount((c) => c - 1);
      } else {
        await followUser(id);
        setIsFollowing(true);
        setFollowerCount((c) => c + 1);
      }
    } catch (error) {
      console.error('Follow action failed:', error);
    }
  };

  const handleEncourage = async (postId: string) => {
    const { toggleEncouragement } = useCommunityStore.getState();
    await toggleEncouragement(postId);
    // Refresh posts to get updated counts
    if (id) {
      const posts = await communityService.getUserPosts(id);
      setUserPosts(posts);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.orange} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profileData) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.notFoundContainer}>
          <Ionicons name="person-outline" size={64} color={Colors.text.muted} />
          <Text style={styles.notFoundTitle}>Profile Not Found</Text>
          <Text style={styles.notFoundText}>
            This user's profile is not available.
          </Text>
          <Button
            title="Go Back"
            variant="outline"
            onPress={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {profileData.display_name}
        </Text>
        {isOwnProfile ? (
          <TouchableOpacity
            onPress={() => router.push('/community/settings')}
            style={styles.backButton}
          >
            <Ionicons name="settings-outline" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <UserAvatar
            name={profileData.display_name}
            avatarUrl={profileData.avatar_url}
            size="xlarge"
          />
          <Text style={styles.displayName}>{profileData.display_name}</Text>
          {profileData.bio && (
            <Text style={styles.bio}>{profileData.bio}</Text>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statValue}>{followerCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statValue}>{followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
            {profileData.show_streak && stats.currentStreak !== undefined && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.currentStreak}</Text>
                  <Text style={styles.statLabel}>Day Streak</Text>
                </View>
              </>
            )}
          </View>

          {/* Follow Button */}
          {!isOwnProfile && (
            <FollowButton
              isFollowing={isFollowing}
              onPress={handleFollow}
              size="md"
            />
          )}

          {isOwnProfile && (
            <Button
              title="Edit Profile"
              variant="outline"
              size="sm"
              onPress={() => router.push('/community/settings')}
            />
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {userPosts.length > 0 ? (
            userPosts.map((post) => (
              <ActivityCardCompact
                key={post.id}
                post={post}
                onEncourage={handleEncourage}
              />
            ))
          ) : (
            <Card variant="outlined" style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {isOwnProfile
                  ? "You haven't shared any updates yet."
                  : "This user hasn't shared any updates yet."}
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h5,
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing['4xl'],
  },

  // Profile header
  profileHeader: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  displayName: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginTop: Spacing.md,
  },
  bio: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    maxWidth: 280,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  statValue: {
    ...Typography.h4,
    color: Colors.text.primary,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.ui.border,
  },

  // Sections
  section: {
    padding: Layout.screenPaddingHorizontal,
    paddingTop: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },

  // Empty state
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },

  // Not found state
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['3xl'],
    gap: Spacing.md,
  },
  notFoundTitle: {
    ...Typography.h4,
    color: Colors.text.primary,
  },
  notFoundText: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
});
