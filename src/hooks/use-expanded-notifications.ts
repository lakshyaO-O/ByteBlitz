'use client';

import { useNotifications } from './use-notifications';
import { NotificationType } from '@/app/lib/types';

export function useExpandedNotifications(userId: string | null) {
  const base = useNotifications(userId);

  const getByType = (type: NotificationType) =>
    base.notifications.filter(n => n.type === type);

  const getUnreadByType = (type: NotificationType) =>
    base.notifications.filter(n => n.type === type && !n.read);

  const getContestReminders = () => getByType('contest_reminder');
  const getAchievementUnlocks = () => getByType('achievement_unlock');
  const getRankChanges = () => getByType('rank_change');
  const getChallengeInvitations = () => getByType('challenge_invitation');
  const getAnnouncements = () => getByType('announcement');

  const unreadByCategory = {
    friend_requests: getUnreadByType('friend_request').length,
    matches: getUnreadByType('match_finished').length + getUnreadByType('match_invitation').length,
    contests: getUnreadByType('contest_reminder').length,
    achievements: getUnreadByType('achievement_unlock').length,
    rank: getUnreadByType('rank_change').length,
  };

  return {
    ...base,
    getByType,
    getUnreadByType,
    getContestReminders,
    getAchievementUnlocks,
    getRankChanges,
    getChallengeInvitations,
    getAnnouncements,
    unreadByCategory,
  };
}
