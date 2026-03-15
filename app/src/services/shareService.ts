import { Share } from 'react-native';
import { captureRef } from 'react-native-view-shot';

export type AchievementType = 'badge' | 'milestone' | 'streak' | 'phase';

export interface AchievementDetails {
  title: string;
  description: string;
}

/**
 * Shares an achievement using React Native's Share API
 */
export async function shareAchievement(
  type: AchievementType,
  details: AchievementDetails
): Promise<{ success: boolean; error?: string }> {
  try {
    const message = generateShareMessage(type, details);
    
    const shareOptions = {
      message,
      url: 'https://www.2equilibrium.com', // Fallback for platforms that support URL
    };

    const result = await Share.share(shareOptions);
    
    if (result.action === Share.sharedAction) {
      return { success: true };
    } else if (result.action === Share.dismissedAction) {
      // User dismissed the share dialog
      return { success: false, error: 'Share dialog dismissed' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Share error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to share achievement'
    };
  }
}

/**
 * Generates a share message based on achievement type and details
 */
function generateShareMessage(type: AchievementType, details: AchievementDetails): string {
  const baseHashtags = '#2Equilibrium #WellnessJourney';
  const websiteUrl = 'https://www.2equilibrium.com';
  
  let message = '';
  
  switch (type) {
    case 'badge':
      message = `🏆 Just earned the ${details.title} badge on 2Equilibrium! ${details.description}`;
      break;
      
    case 'streak':
      message = `🔥 ${details.title} on my wellness journey with 2Equilibrium! ${details.description}`;
      break;
      
    case 'phase':
      message = `✨ Completed ${details.title} in my 2Equilibrium journey! ${details.description}`;
      break;
      
    case 'milestone':
      message = `🎯 ${details.description} ${baseHashtags}`;
      break;
      
    default:
      message = `🌿 ${details.title}: ${details.description}`;
      break;
  }
  
  // Add hashtags and website if not already included
  if (!message.includes('#2Equilibrium')) {
    message += ` ${baseHashtags}`;
  }
  
  // Add website URL
  message += `\n\n${websiteUrl}`;
  
  return message;
}

/**
 * Helper function to share a badge achievement
 */
export function shareBadgeAchievement(badgeName: string, description?: string) {
  return shareAchievement('badge', {
    title: badgeName,
    description: description || `Earned through dedication to my wellness journey!`,
  });
}

/**
 * Helper function to share a streak achievement
 */
export function shareStreakAchievement(days: number) {
  return shareAchievement('streak', {
    title: `${days}-day streak`,
    description: `Staying consistent with my daily wellness practices!`,
  });
}

/**
 * Helper function to share a phase completion
 */
export function sharePhaseAchievement(phaseNumber: number, phaseName: string) {
  return shareAchievement('phase', {
    title: `Phase ${phaseNumber}: ${phaseName}`,
    description: `Another step forward in my transformation! 🌿`,
  });
}

/**
 * Helper function to share a custom milestone
 */
export function shareMilestoneAchievement(description: string) {
  return shareAchievement('milestone', {
    title: 'Milestone Achieved',
    description,
  });
}

/**
 * Shares an achievement with a branded image card
 * Captures a ShareCard component and shares it as an image
 */
export async function shareAchievementCard(
  cardRef: any,
  type: AchievementType,
  details: AchievementDetails
): Promise<{ success: boolean; error?: string }> {
  try {
    // Capture the card as an image
    const imageUri = await captureRef(cardRef, {
      format: 'png',
      quality: 1.0,
      result: 'tmpfile',
    });

    const message = generateShareMessage(type, details);
    
    const shareOptions = {
      message,
      url: imageUri, // Share the image
    };

    const result = await Share.share(shareOptions);
    
    if (result.action === Share.sharedAction) {
      return { success: true };
    } else if (result.action === Share.dismissedAction) {
      return { success: false, error: 'Share dialog dismissed' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Share card error:', error);
    // Fall back to text-only sharing
    return shareAchievement(type, details);
  }
}