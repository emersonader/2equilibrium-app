import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Card } from '@/components/ui/Card';
import { UserAvatar } from './UserAvatar';
import { EncourageButton } from './EncourageButton';
import type { ActivityFeedItem, PostType } from '@/services/database.types';

interface ActivityCardProps {
  post: ActivityFeedItem;
  onUserPress?: (userId: string) => void;
  onEncourage: (postId: string) => Promise<void>;
  isOwnPost?: boolean;
  onDelete?: (postId: string) => void;
}

// Get icon and color based on post type
function getPostTypeIcon(type: PostType): { icon: string; color: string } {
  switch (type) {
    case 'badge':
      return { icon: 'ribbon', color: Colors.primary.orange };
    case 'streak':
      return { icon: 'flame', color: Colors.status.warning };
    case 'milestone':
      return { icon: 'trophy', color: Colors.primary.tiffanyBlue };
    case 'chapter':
      return { icon: 'book', color: Colors.chapter.mindful };
    case 'custom':
    default:
      return { icon: 'chatbubble', color: Colors.text.secondary };
  }
}

// Format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ActivityCard({
  post,
  onUserPress,
  onEncourage,
  isOwnPost = false,
  onDelete,
}: ActivityCardProps) {
  const { icon, color } = getPostTypeIcon(post.post_type);
  const timeAgo = formatTimeAgo(post.created_at);

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => onUserPress?.(post.user_id)}
          activeOpacity={0.7}
        >
          <UserAvatar
            name={post.display_name}
            avatarUrl={post.avatar_url}
            size="medium"
          />
          <View style={styles.userText}>
            <Text style={styles.userName}>{post.display_name}</Text>
            <Text style={styles.timeAgo}>{timeAgo}</Text>
          </View>
        </TouchableOpacity>

        {/* Post type indicator */}
        <View style={[styles.typeIndicator, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={16} color={color} />
        </View>
      </View>

      {/* Content */}
      {post.content && (
        <Text style={styles.content}>{post.content}</Text>
      )}

      {/* Metadata badge (for badges/milestones) */}
      {post.metadata?.badge_name && (
        <View style={styles.metadataBadge}>
          <Ionicons name="ribbon" size={16} color={Colors.primary.orange} />
          <Text style={styles.metadataText}>{post.metadata.badge_name}</Text>
        </View>
      )}

      {post.metadata?.streak_count && (
        <View style={styles.metadataBadge}>
          <Ionicons name="flame" size={16} color={Colors.status.warning} />
          <Text style={styles.metadataText}>
            {post.metadata.streak_count}-day streak
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <EncourageButton
          count={post.encouragement_count}
          hasEncouraged={post.has_encouraged}
          onPress={() => onEncourage(post.id)}
        />

        {isOwnPost && onDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(post.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.text.muted} />
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
}

// Compact version for lists
export function ActivityCardCompact({
  post,
  onUserPress,
  onEncourage,
}: {
  post: ActivityFeedItem;
  onUserPress?: (userId: string) => void;
  onEncourage: (postId: string) => Promise<void>;
}) {
  const { icon, color } = getPostTypeIcon(post.post_type);
  const timeAgo = formatTimeAgo(post.created_at);

  return (
    <View style={styles.compactCard}>
      <TouchableOpacity
        onPress={() => onUserPress?.(post.user_id)}
        activeOpacity={0.7}
      >
        <UserAvatar
          name={post.display_name}
          avatarUrl={post.avatar_url}
          size="small"
        />
      </TouchableOpacity>

      <View style={styles.compactContent}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactUserName}>{post.display_name}</Text>
          <Text style={styles.compactTime}>{timeAgo}</Text>
        </View>
        {post.content && (
          <Text style={styles.compactText} numberOfLines={2}>
            {post.content}
          </Text>
        )}
      </View>

      <EncourageButton
        count={post.encouragement_count}
        hasEncouraged={post.has_encouraged}
        onPress={() => onEncourage(post.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userText: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  userName: {
    ...Typography.textStyles.body,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  timeAgo: {
    ...Typography.textStyles.caption,
    color: Colors.text.muted,
    marginTop: 2,
  },
  typeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    ...Typography.textStyles.body,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  metadataBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.borderRadius.md,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  metadataText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.border,
  },
  deleteButton: {
    padding: Spacing.xs,
  },

  // Compact styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  compactContent: {
    flex: 1,
    marginLeft: Spacing.sm,
    marginRight: Spacing.sm,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactUserName: {
    ...Typography.textStyles.bodySmall,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  compactTime: {
    ...Typography.textStyles.caption,
    color: Colors.text.muted,
    marginLeft: Spacing.xs,
  },
  compactText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.text.secondary,
    marginTop: 2,
  },
});

export default ActivityCard;
