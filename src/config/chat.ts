export type MessageType = 'text' | 'image' | 'file' | 'system';

export interface MessageReactions {
  [emoji: string]: string[];
}

export interface ReplyTo {
  messageId: string;
  text: string;
  senderId: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  type: MessageType;
  createdAt: any;
  updatedAt: any;
  edited: boolean;
  deleted: boolean;
  replyTo: ReplyTo | null;
  reactions: MessageReactions;
  readBy: string[];
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
}

export interface LastMessage {
  text: string;
  senderId: string;
  createdAt: any;
  type: MessageType;
}

export interface ChatDoc {
  id: string;
  type: 'one-to-one';
  participants: string[];
  createdAt: any;
  updatedAt: any;
  lastMessage: LastMessage | null;
  lastMessageSenderId: string | null;
  lastMessageAt: any | null;
  unreadCount: Record<string, number>;
  participantData: Record<string, { username: string; photoURL: string }>;
}

export interface TypingUser {
  userId: string;
  typing: boolean;
}

const EMOJI_LIST = [
  '👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '💯', '✅',
  '❌', '⭐', '👀', '🙏', '💪', '🚀', '👎', '💡', '📌', '🎯',
  '💻', '⚡', '🏆', '🫡', '✨', '💀', '🤝', '🧠', '🛠️', '📚',
  '🐛', '🔧', '💾', '🔗', '📊', '🎮', '🤖', '👨‍💻', '👩‍💻', '🧑‍💻',
];

export function getChatId(uid1: string, uid2: string): string {
  const sorted = [uid1, uid2].sort();
  return `chat_${sorted[0]}_${sorted[1]}`;
}

export function getOtherParticipant(chat: ChatDoc, myUid: string): string | null {
  return chat.participants.find(p => p !== myUid) || null;
}

export function getEmojiList(): string[] {
  return EMOJI_LIST;
}

export const MESSAGE_BATCH_SIZE = 50;
