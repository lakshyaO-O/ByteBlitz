export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'support' | 'user';

export type AdminPermission =
  | 'users.read'
  | 'users.write'
  | 'users.ban'
  | 'users.mute'
  | 'users.delete'
  | 'users.role'
  | 'users.password'
  | 'users.session'
  | 'problems.read'
  | 'problems.write'
  | 'problems.delete'
  | 'problems.publish'
  | 'shop.read'
  | 'shop.write'
  | 'shop.delete'
  | 'challenges.read'
  | 'challenges.write'
  | 'settings.read'
  | 'settings.write'
  | 'analytics.read'
  | 'moderation.read'
  | 'moderation.write'
  | 'moderation.delete'
  | 'community.read'
  | 'community.write'
  | 'community.delete'
  | 'audit.read'
  | 'admin.manage';

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: ['*'] as unknown as AdminPermission[],
  admin: [
    'users.read', 'users.write', 'users.ban', 'users.mute', 'users.role', 'users.password', 'users.session',
    'problems.read', 'problems.write', 'problems.delete', 'problems.publish',
    'shop.read', 'shop.write', 'shop.delete',
    'challenges.read', 'challenges.write',
    'settings.read', 'settings.write',
    'analytics.read',
    'moderation.read', 'moderation.write',
    'community.read', 'community.write', 'community.delete',
    'audit.read',
  ],
  moderator: [
    'users.read', 'users.mute',
    'problems.read', 'problems.write', 'problems.publish',
    'moderation.read', 'moderation.write', 'moderation.delete',
    'community.read', 'community.write', 'community.delete',
    'analytics.read',
  ],
  support: [
    'users.read',
    'moderation.read',
    'community.read',
  ],
  user: [],
};

export function hasPermission(role: AdminRole, permission: AdminPermission): boolean {
  if (role === 'super_admin') return true;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getRoleLevel(role: AdminRole): number {
  const levels: Record<AdminRole, number> = {
    super_admin: 100,
    admin: 80,
    moderator: 50,
    support: 30,
    user: 0,
  };
  return levels[role] ?? 0;
}

export function canManageRole(actorRole: AdminRole, targetRole: AdminRole): boolean {
  if (actorRole === 'super_admin') return true;
  if (actorRole === 'admin') return targetRole === 'moderator' || targetRole === 'support' || targetRole === 'user';
  return false;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  performedByEmail: string;
  performedByRole: AdminRole;
  targetType: 'user' | 'problem' | 'shop_item' | 'challenge' | 'setting' | 'community' | 'moderation' | 'announcement';
  targetId: string;
  targetLabel?: string;
  details: Record<string, unknown>;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  timestamp: string;
  ipAddress?: string;
  severity: 'info' | 'warning' | 'critical';
}

export const AUDIT_LOG_ACTIONS = {
  USER_ROLE_CHANGE: 'user.role.change',
  USER_BAN: 'user.ban',
  USER_UNBAN: 'user.unban',
  USER_DELETE: 'user.delete',
  USER_UPDATE: 'user.update',
  PROBLEM_CREATE: 'problem.create',
  PROBLEM_UPDATE: 'problem.update',
  PROBLEM_DELETE: 'problem.delete',
  PROBLEM_PUBLISH: 'problem.publish',
  PROBLEM_UNPUBLISH: 'problem.unpublish',
  SHOP_CREATE: 'shop.create',
  SHOP_UPDATE: 'shop.update',
  SHOP_DELETE: 'shop.delete',
  CHALLENGE_SET: 'challenge.set',
  SETTINGS_UPDATE: 'settings.update',
  MODERATION_ACTION: 'moderation.action',
  COMMUNITY_DELETE: 'community.delete',
  ANNOUNCEMENT_CREATE: 'announcement.create',
  ADMIN_PROMOTE: 'admin.promote',
} as const;

export interface AdminVerificationResult {
  uid: string;
  role: AdminRole;
  isAdmin: boolean;
  permissions: AdminPermission[];
}

export interface ConfirmDialogConfig {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive' | 'warning';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}
