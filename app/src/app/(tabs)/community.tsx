import React, { useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, Layout } from '@/constants';
import { Card, Button } from '@/components/ui';
import { ActivityCard, UserAvatar, SocialLinksBar } from '@/components/community';
import { useCommunityStore, useUserStore, useSubscriptionStore } from '@/stores';
import { hasFeature } from '@/constants/featureFlags';
import * as communityService from '@/services/communityService';
import type { ActivityFeedItem } from '@/services/database.types';

const ENCOURAGEMENT_COUNT_KEY = 'lastSeenEncouragementCount';

export default function CommunityScreen() {
  const router = useRouter();
  const { profile } = useUserStore();
  const { currentTier: tier } = useSubscriptionStore();
  const {
    feed,
    feedLoading,
    hasMoreFeed,
    loadFeed,
    loadMoreFeed,
    toggleEncouragement,
    deletePost,
    createPost,
  } = useCommunityStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [newEncouragements, setNewEncouragements] = useState(0);
  const [previewFeed, setPreviewFeed] = useState<ActivityFeedItem[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Check feature flags separately for viewing vs posting
  const canViewFeed = hasFeature(tier, 'communityFeed');
  const canPost = hasFeature(tier, 'communityPosting');
  const isFreeUser = tier === 'none';

  // Check if user has community access (any active subscription)
  const hasCommunityAccess = true; // TODO: restore hasFeature(tier, 'communityCircle') before App Store submission

  const [hasLoaded, setHasLoaded] = useState(false);

  // Check for new encouragements on focus
  const checkEncouragements = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(ENCOURAGEMENT_COUNT_KEY);
      const lastSeen = stored ? parseInt(stored, 10) : 0;
      const { totalCount, newCount } = await communityService.checkNewEncouragements(lastSeen);
      setNewEncouragements(newCount);
      // Update last seen count
      await AsyncStorage.setItem(ENCOURAGEMENT_COUNT_KEY, totalCount.toString());
    } catch (e) {
      console.warn('Failed to check encouragements:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isFreeUser) {
        // Load preview feed for free users
        if (!previewLoading && previewFeed.length === 0) {
          setPreviewLoading(true);
          communityService.getPublicFeed(3, 0)
            .then(setPreviewFeed)
            .catch((e) => console.warn('Preview feed unavailable:', e))
            .finally(() => setPreviewLoading(false));
        }
        return;
      }

      if (hasCommunityAccess && !hasLoaded) {
        setHasLoaded(true);
        loadFeed().catch((e) => console.warn('Community feed unavailable:', e));
      }

      // Check for new encouragements
      checkEncouragements();
    }, [hasCommunityAccess, hasLoaded, isFreeUser])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadFeed();
    setIsRefreshing(false);
  };

  const handleLoadMore = () => {
    if (hasMoreFeed && !feedLoading) {
      loadMoreFeed();
    }
  };

  const handleUserPress = (userId: string) => {
    router.push(`/community/profile/${userId}`);
  };

  const handleEncourage = async (postId: string) => {
    await toggleEncouragement(postId);
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePost(postId),
        },
      ]
    );
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;

    setIsPosting(true);
    try {
      await createPost('custom', newPostContent.trim());
      setNewPostContent('');
      setShowCreatePost(false);
      await loadFeed(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const renderPost = ({ item }: { item: ActivityFeedItem }) => (
    <ActivityCard
      post={item}
      onUserPress={handleUserPress}
      onEncourage={handleEncourage}
      isOwnPost={item.user_id === profile?.id}
      onDelete={handleDeletePost}
    />
  );

  const renderEmpty = () => {
    if (feedLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={64} color={Colors.text.muted} />
        <Text style={styles.emptyTitle}>No Posts Yet</Text>
        <Text style={styles.emptyText}>
          Be the first to share your wellness journey! Complete lessons and earn badges to automatically share your progress.
        </Text>
        <Button
          title="Create a Post"
          variant="primary"
          onPress={() => setShowCreatePost(true)}
          style={styles.emptyButton}
        />
      </View>
    );
  };

  const renderFooter = () => {
    if (!hasMoreFeed) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={Colors.primary.orange} />
      </View>
    );
  };

  // Free user preview — read-only view of first 3 posts with CTA
  if (isFreeUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Community</Text>
        </View>
        <SocialLinksBar title="Follow us" />
        <View style={styles.previewContainer}>
          {previewLoading ? (
            <ActivityIndicator size="large" color={Colors.primary.orange} style={{ marginTop: Spacing.xl }} />
          ) : previewFeed.length > 0 ? (
            <>
              {previewFeed.map((post) => (
                <View key={post.id} style={styles.previewPost}>
                  <ActivityCard
                    post={post}
                    onUserPress={() => {}}
                    onEncourage={async () => {}}
                    isOwnPost={false}
                    onDelete={() => {}}
                  />
                </View>
              ))}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={Colors.text.muted} />
              <Text style={styles.emptyText}>Community posts will appear here.</Text>
            </View>
          )}

          {/* CTA Card */}
          <Card style={styles.ctaCard}>
            <Ionicons name="people-circle-outline" size={48} color={Colors.primary.orange} />
            <Text style={styles.ctaTitle}>Join the Community</Text>
            <Text style={styles.ctaText}>
              Subscribe to share your journey and connect with others on the path to wellness.
            </Text>
            <Button
              title="Subscribe Now"
              variant="primary"
              onPress={() => router.push('/onboarding/subscription')}
              style={styles.ctaButton}
            />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  // Locked state for users without community access
  if (!hasCommunityAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Community</Text>
        </View>
        <View style={styles.lockedContainer}>
          <SocialLinksBar title="Follow us" />
          <View style={styles.lockedContent}>
            <Ionicons name="lock-closed" size={64} color={Colors.text.muted} />
            <Text style={styles.lockedTitle}>Unlock Community</Text>
            <Text style={styles.lockedText}>
              Subscribe to connect with fellow wellness seekers, share your journey, and encourage others on their path.
            </Text>
            <Button
              title="View Plans"
              variant="primary"
              onPress={() => router.push('/onboarding/subscription')}
              style={styles.lockedButton}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <View style={styles.headerActions}>
          {newEncouragements > 0 && (
            <View style={styles.encouragementBadge}>
              <Ionicons name="heart" size={16} color="#fff" />
              <Text style={styles.encouragementBadgeText}>{newEncouragements}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/community/settings')}
          >
            <Ionicons name="settings-outline" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Create Post Button */}
      <TouchableOpacity
        style={styles.createPostButton}
        onPress={() => setShowCreatePost(true)}
        activeOpacity={0.7}
      >
        <UserAvatar
          name={profile?.full_name || 'You'}
          avatarId={profile?.avatar_id}
          size="small"
        />
        <Text style={styles.createPostPlaceholder}>Share your wellness moment...</Text>
        <Ionicons name="add-circle" size={28} color={Colors.primary.orange} />
      </TouchableOpacity>

      {/* Create Post Modal/Inline */}
      {showCreatePost && (
        <Card style={styles.createPostCard}>
          <View style={styles.createPostHeader}>
            <Text style={styles.createPostTitle}>New Post</Text>
            <TouchableOpacity onPress={() => setShowCreatePost(false)}>
              <Ionicons name="close" size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.createPostInput}
            placeholder="What's on your mind?"
            placeholderTextColor={Colors.text.muted}
            multiline
            maxLength={500}
            value={newPostContent}
            onChangeText={setNewPostContent}
            autoFocus
          />
          <View style={styles.createPostFooter}>
            <Text style={styles.charCount}>{newPostContent.length}/500</Text>
            <Button
              title="Post"
              variant="primary"
              size="sm"
              onPress={handleCreatePost}
              disabled={!newPostContent.trim() || isPosting}
              loading={isPosting}
            />
          </View>
        </Card>
      )}

      {/* Social Links */}
      <View style={styles.socialLinksContainer}>
        <SocialLinksBar />
      </View>

      {/* Feed */}
      <FlatList
        data={feed}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary.orange}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingVertical: Spacing.md,
  },
  title: {
    ...Typography.h1,
    color: Colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.xs,
  },

  // Create post
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Layout.screenPaddingHorizontal,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: Spacing.borderRadius.lg,
    gap: Spacing.sm,
  },
  createPostPlaceholder: {
    flex: 1,
    ...Typography.body,
    color: Colors.text.muted,
  },
  createPostCard: {
    marginHorizontal: Layout.screenPaddingHorizontal,
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  createPostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  createPostTitle: {
    ...Typography.h5,
    color: Colors.text.primary,
  },
  createPostInput: {
    ...Typography.body,
    color: Colors.text.primary,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: Spacing.md,
  },
  createPostFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    ...Typography.caption,
    color: Colors.text.muted,
  },

  // Social links
  socialLinksContainer: {
    marginHorizontal: Layout.screenPaddingHorizontal,
    marginBottom: Spacing.md,
  },

  // Feed
  feedContent: {
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingBottom: Spacing['4xl'],
  },
  separator: {
    height: Spacing.md,
  },
  footer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['3xl'],
  },
  emptyTitle: {
    ...Typography.h4,
    color: Colors.text.primary,
    marginTop: Spacing.lg,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  emptyButton: {
    minWidth: 150,
  },

  // Locked state
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing['3xl'],
  },
  lockedContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginTop: Spacing.lg,
  },
  lockedText: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    maxWidth: 300,
  },
  lockedButton: {
    minWidth: 150,
  },

  // Free user preview
  previewContainer: {
    flex: 1,
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingTop: Spacing.md,
  },
  previewPost: {
    marginBottom: Spacing.md,
    opacity: 0.85,
  },
  ctaCard: {
    alignItems: 'center' as const,
    padding: Spacing.xl,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  ctaTitle: {
    ...Typography.h4,
    color: Colors.text.primary,
    marginTop: Spacing.md,
  },
  ctaText: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center' as const,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    maxWidth: 280,
  },
  ctaButton: {
    minWidth: 180,
  },

  // Encouragement badge
  encouragementBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.primary.orange,
    borderRadius: 12,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    gap: 4,
  },
  encouragementBadgeText: {
    ...Typography.caption,
    color: '#fff',
    fontWeight: '600' as const,
  },
});
