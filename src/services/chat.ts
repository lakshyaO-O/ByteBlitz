'use client';

import { initializeFirebase } from '@/firebase';
import {
  doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, limit, serverTimestamp,
  onSnapshot, Timestamp, increment, runTransaction, writeBatch,
  arrayUnion, arrayRemove,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData, QuerySnapshot } from 'firebase/firestore';
import {
  getStorage, getDownloadURL, ref, uploadBytes,
} from 'firebase/storage';
import type {
  ChatDoc, ChatMessage, LastMessage, MessageType,
  MessageReactions, ReplyTo,
} from '@/config/chat';
import { getChatId, MESSAGE_BATCH_SIZE } from '@/config/chat';

function chatRef(chatId: string) {
  const { firestore: db } = initializeFirebase();
  return db ? doc(db, 'chats', chatId) : null;
}

function messagesColRef(chatId: string) {
  const { firestore: db } = initializeFirebase();
  return db ? collection(db, 'chats', chatId, 'messages') : null;
}

// ===== CREATE CHAT =====

export async function createOrGetChat(uid1: string, uid2: string): Promise<string | null> {
  const { firestore: db } = initializeFirebase();
  if (!db || !uid1 || !uid2) return null;
  const chatId = getChatId(uid1, uid2);
  const ref = doc(db, 'chats', chatId);
  const snap = await getDoc(ref);
  if (snap.exists()) return chatId;

  const [user1Snap, user2Snap] = await Promise.all([
    getDoc(doc(db, 'users', uid1)),
    getDoc(doc(db, 'users', uid2)),
  ]);
  const u1 = user1Snap.data();
  const u2 = user2Snap.data();
  const participantData: Record<string, { username: string; photoURL: string }> = {
    [uid1]: { username: u1?.username || 'User', photoURL: u1?.photoURL || '' },
    [uid2]: { username: u2?.username || 'User', photoURL: u2?.photoURL || '' },
  };

  await setDoc(ref, {
    type: 'one-to-one',
    participants: [uid1, uid2],
    participantData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: null,
    lastMessageSenderId: null,
    lastMessageAt: null,
    unreadCount: { [uid1]: 0, [uid2]: 0 },
  });

  return chatId;
}

// ===== SEND MESSAGE =====

export async function sendMessage(
  chatId: string, senderId: string,
  text: string, type: MessageType = 'text',
  replyTo: ReplyTo | null = null,
  file?: File,
): Promise<string | null> {
  const { firestore: db, app } = initializeFirebase();
  if (!db) return null;
  const storage = app ? getStorage(app) : null;

  const messagesRef = messagesColRef(chatId);
  if (!messagesRef) return null;

  let fileUrl: string | null = null;
  let fileName: string | null = null;
  let fileSize: number | null = null;

  if (file && storage) {
    const storageRef = ref(storage, `chat-files/${chatId}/${Date.now()}_${file.name}`);
    const uploadResult = await uploadBytes(storageRef, file);
    fileUrl = await getDownloadURL(uploadResult.ref);
    fileName = file.name;
    fileSize = file.size;
  }

  const chatDoc = await getDoc(doc(db, 'chats', chatId));
  const participants = chatDoc.data()?.participants || [];
  const otherUid = participants.find((p: string) => p !== senderId);

  const msgRef = await addDoc(messagesRef, {
    chatId, senderId, text, type,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    edited: false, deleted: false,
    replyTo, reactions: {} as MessageReactions,
    readBy: [senderId],
    fileUrl, fileName, fileSize,
  });

  const lastMsg: LastMessage = {
    text: type === 'image' ? '📷 Image' : type === 'file' ? `📎 ${fileName || 'File'}` : text.slice(0, 100),
    senderId,
    createdAt: serverTimestamp(),
    type,
  };

  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: lastMsg,
    lastMessageSenderId: senderId,
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    [`unreadCount.${senderId}`]: 0,
    ...(otherUid ? { [`unreadCount.${otherUid}`]: increment(1) } : {}),
  });

  return msgRef.id;
}

// ===== MARK READ =====

export async function markChatRead(chatId: string, userId: string): Promise<void> {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  await updateDoc(doc(db, 'chats', chatId), {
    [`unreadCount.${userId}`]: 0,
  });
}

// ===== EDIT MESSAGE =====

export async function editMessage(chatId: string, messageId: string, newText: string): Promise<void> {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
    text: newText, edited: true, updatedAt: serverTimestamp(),
  });
}

// ===== DELETE MESSAGE =====

export async function deleteMessage(chatId: string, messageId: string): Promise<void> {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
    deleted: true, text: '', updatedAt: serverTimestamp(),
  });
}

// ===== REACT TO MESSAGE =====

export async function toggleReaction(chatId: string, messageId: string, userId: string, emoji: string): Promise<void> {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
  const snap = await getDoc(msgRef);
  if (!snap.exists()) return;
  const reactions: MessageReactions = snap.data().reactions || {};
  const current = reactions[emoji] || [];
  if (current.includes(userId)) {
    const updated = current.filter((u: string) => u !== userId);
    if (updated.length === 0) {
      const { [emoji]: _, ...rest } = reactions;
      await updateDoc(msgRef, { reactions: rest });
    } else {
      await updateDoc(msgRef, { [`reactions.${emoji}`]: updated });
    }
  } else {
    await updateDoc(msgRef, { [`reactions.${emoji}`]: arrayUnion(userId) });
  }
}

// ===== READ RECEIPT =====

export async function markMessageRead(chatId: string, messageId: string, userId: string): Promise<void> {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
    readBy: arrayUnion(userId),
  });
}

// ===== TYPING INDICATOR =====

export function setTypingStatus(chatId: string, userId: string, typing: boolean): void {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  setDoc(doc(db, 'chats', chatId, 'typing', userId), { typing, updatedAt: serverTimestamp() }, { merge: true });
}

// ===== REAL-TIME SUBSCRIPTIONS =====

export function subscribeChatList(
  userId: string,
  onData: (chats: ChatDoc[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const { firestore: db } = initializeFirebase();
  if (!db) return () => {};
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc'),
  );
  return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
    const list: ChatDoc[] = [];
    snap.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
      const data = d.data();
      list.push({ id: d.id, ...data } as ChatDoc);
    });
    onData(list);
  }, onError);
}

export function subscribeMessages(
  chatId: string,
  onData: (messages: ChatMessage[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const ref = messagesColRef(chatId);
  if (!ref) return () => {};
  const q = query(ref, orderBy('createdAt', 'asc'), limit(MESSAGE_BATCH_SIZE));
  return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
    const list: ChatMessage[] = [];
    snap.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
      list.push({ id: d.id, ...d.data() } as ChatMessage);
    });
    onData(list);
  }, onError);
}

export function subscribeTyping(
  chatId: string,
  myId: string,
  onData: (typingUsers: string[]) => void,
): () => void {
  const { firestore: db } = initializeFirebase();
  if (!db) return () => {};
  const q = query(collection(db, 'chats', chatId, 'typing'), where('typing', '==', true));
  return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
    const users: string[] = [];
    snap.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
      if (d.id !== myId) users.push(d.id);
    });
    onData(users);
  });
}

// ===== SEARCH MESSAGES =====

export async function searchMessages(
  chatId: string, queryText: string,
): Promise<ChatMessage[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];
  const ref = messagesColRef(chatId);
  if (!ref) return [];
  const q = query(ref, orderBy('createdAt', 'desc'), limit(200));
  const snap = await getDocs(q);
  const results: ChatMessage[] = [];
  const lower = queryText.toLowerCase();
  snap.forEach((d: { id: string; data: () => any }) => {
    const msg = d.data() as ChatMessage;
    if (msg.text?.toLowerCase().includes(lower) && !msg.deleted) {
      results.push({ ...msg, id: d.id });
    }
  });
  return results.slice(0, 50);
}

// ===== LOAD MORE MESSAGES (pagination) =====

export async function loadMoreMessages(
  chatId: string, oldestId: string | null,
): Promise<ChatMessage[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];
  const ref = messagesColRef(chatId);
  if (!ref) return [];
  let q;
  if (oldestId) {
    const oldestSnap = await getDoc(doc(db, 'chats', chatId, 'messages', oldestId));
    if (!oldestSnap.exists()) return [];
    q = query(ref, orderBy('createdAt', 'desc'), limit(MESSAGE_BATCH_SIZE));
  } else {
    q = query(ref, orderBy('createdAt', 'desc'), limit(MESSAGE_BATCH_SIZE));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ ...d.data(), id: d.id } as ChatMessage)).reverse();
}

// ===== GET USER PROFILE (for chat header) =====

export async function getUserProfile(userId: string): Promise<{ username: string; photoURL: string; onlineStatus: string } | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return null;
  const d = snap.data();
  return { username: d.username || 'User', photoURL: d.photoURL || '', onlineStatus: d.onlineStatus || 'offline' };
}

// ===== DELETE CHAT (soft) =====

export async function deleteChat(chatId: string): Promise<void> {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  await deleteDoc(doc(db, 'chats', chatId));
}
