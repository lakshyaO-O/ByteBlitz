import { z } from 'zod';

export const settingsUpdateSchema = z.object({
  section: z.string().min(1, 'Section is required'),
  data: z.record(z.unknown()).refine(v => Object.keys(v).length > 0, 'Data must not be empty'),
});

export const userActionSchema = z.object({
  action: z.enum(['updateRole', 'ban', 'unban', 'updateProfile', 'delete', 'mute', 'unmute', 'resetPassword', 'forceLogout', 'bulk']),
  targetUid: z.string().min(1, 'Target UID is required'),
  data: z.record(z.unknown()).optional().default({}),
});

export const bulkUserActionSchema = z.object({
  action: z.literal('bulk'),
  targetUid: z.string().min(1),
  data: z.object({
    uids: z.array(z.string()).min(1, 'At least one UID required'),
    bulkAction: z.enum(['ban', 'unban', 'updateRole']),
    role: z.string().optional(),
  }),
});

export const problemActionSchema = z.object({
  action: z.enum(['create', 'saveContent', 'delete', 'togglePublish', 'archive', 'restore', 'getVersions', 'restoreVersion']),
  problemId: z.string().optional(),
  data: z.record(z.unknown()).optional().default({}),
});

export const reportActionSchema = z.object({
  reportId: z.string().min(1, 'Report ID is required'),
  action: z.enum(['resolve', 'dismiss', 'approve', 'reject', 'delete', 'warn', 'mute', 'ban']),
  reason: z.string().optional().default(''),
});

export const shopActionSchema = z.object({
  action: z.enum(['create', 'update', 'delete']),
  itemId: z.string().optional(),
  data: z.record(z.unknown()).optional().default({}),
});

export const setupSchema = z.object({}).strict();
