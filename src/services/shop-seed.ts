'use client';

import { initializeFirebase } from '@/firebase';
import { collection, doc, setDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import type { ShopItem, ShopItemType, ShopRarity } from '@/types';

interface SeedItem {
  name: string;
  description: string;
  type: ShopItemType;
  price: number;
  rarity: ShopRarity;
  color?: string;
  effect?: string;
  previewUrl?: string;
  featured?: boolean;
  seasonal?: boolean;
  sortOrder: number;
}

const SEED_ITEMS: SeedItem[] = [
  // ===== Avatar Frames =====
  { name: 'Classic Silver Frame', description: 'A sleek silver border for your profile avatar.', type: 'avatar_frame', price: 100, rarity: 'common', sortOrder: 10 },
  { name: 'Neon Cyan Frame', description: 'Glowing cyan avatar frame for a futuristic look.', type: 'avatar_frame', price: 250, rarity: 'rare', color: '#00e5ff', sortOrder: 11 },
  { name: 'Royal Gold Frame', description: 'Premium gold-plated avatar frame.', type: 'avatar_frame', price: 500, rarity: 'epic', color: '#ffd700', sortOrder: 12, featured: true },
  { name: 'Plasma Arc Frame', description: 'Electric plasma effect pulses around your avatar.', type: 'avatar_frame', price: 1200, rarity: 'legendary', color: '#9b59b6', effect: 'plasma', sortOrder: 13 },
  { name: 'Void Crystal Frame', description: 'Dark crystalline frame with shimmering facets.', type: 'avatar_frame', price: 2500, rarity: 'mythic', color: '#2c3e50', effect: 'crystal', sortOrder: 14, featured: true },
  { name: 'Minimalist Line Frame', description: 'Clean, thin-line border for a modern look.', type: 'avatar_frame', price: 75, rarity: 'common', sortOrder: 15 },

  // ===== Profile Themes =====
  { name: 'Midnight Blue Theme', description: 'Deep blue profile theme with subtle gradients.', type: 'profile_theme', price: 150, rarity: 'common', color: '#1a237e', sortOrder: 20 },
  { name: 'Matrix Green Theme', description: 'Digital rain inspired green-on-black theme.', type: 'profile_theme', price: 300, rarity: 'rare', color: '#00c853', effect: 'matrix', sortOrder: 21 },
  { name: 'Sunset Horizon Theme', description: 'Warm sunset gradient profile background.', type: 'profile_theme', price: 300, rarity: 'rare', color: '#ff6f00', sortOrder: 22 },
  { name: 'Galaxy Nebula Theme', description: 'Swirling nebula colors across your profile.', type: 'profile_theme', price: 600, rarity: 'epic', color: '#7b1fa2', effect: 'nebula', sortOrder: 23, featured: true },
  { name: 'Cherry Blossom Theme', description: 'Delicate pink sakura-themed profile.', type: 'profile_theme', price: 600, rarity: 'epic', color: '#f48fb1', sortOrder: 24, seasonal: true },
  { name: 'Cyberpunk 2077 Theme', description: 'Neon-soaked futuristic city theme.', type: 'profile_theme', price: 1000, rarity: 'legendary', color: '#ff1744', effect: 'cyberpunk', sortOrder: 25, featured: true },
  { name: 'Arctic Frost Theme', description: 'Ice-cold blue and white profile theme.', type: 'profile_theme', price: 200, rarity: 'common', color: '#e0f7fa', sortOrder: 26 },

  // ===== Name Colors =====
  { name: 'Silver Name', description: 'Your username appears in metallic silver.', type: 'name_color', price: 80, rarity: 'common', color: '#bdbdbd', sortOrder: 30 },
  { name: 'Electric Blue Name', description: 'Bright blue username color.', type: 'name_color', price: 200, rarity: 'rare', color: '#2979ff', sortOrder: 31 },
  { name: 'Lava Red Name', description: 'Intense red-hot username color.', type: 'name_color', price: 200, rarity: 'rare', color: '#d50000', sortOrder: 32 },
  { name: 'Emerald Green Name', description: 'Rich emerald green username.', type: 'name_color', price: 200, rarity: 'rare', color: '#00c853', sortOrder: 33 },
  { name: 'Rainbow Gradient Name', description: 'Your name cycles through rainbow colors.', type: 'name_color', price: 800, rarity: 'legendary', color: 'rainbow', effect: 'rainbow', sortOrder: 34, featured: true },
  { name: 'Neon Purple Name', description: 'Glowing purple username.', type: 'name_color', price: 400, rarity: 'epic', color: '#d500f9', sortOrder: 35 },

  // ===== Badges =====
  { name: 'Early Adopter Badge', description: 'For being among the first DevRann users.', type: 'badge', price: 0, rarity: 'legendary', color: '#ffd700', sortOrder: 40 },
  { name: 'Community Star Badge', description: 'Awarded for helping others in the community.', type: 'badge', price: 300, rarity: 'rare', color: '#2979ff', sortOrder: 41 },
  { name: 'Ace Pilot Badge', description: 'Win 50 Arena matches to unlock. Buy if you are close.', type: 'badge', price: 800, rarity: 'epic', color: '#d50000', sortOrder: 42 },
  { name: 'Collector Badge', description: 'Own 20+ shop items.', type: 'badge', price: 500, rarity: 'rare', color: '#7b1fa2', sortOrder: 43 },
  { name: 'Diamond Hand Badge', description: 'A badge for those who never give up.', type: 'badge', price: 1500, rarity: 'mythic', color: '#00e5ff', effect: 'shimmer', sortOrder: 44, featured: true },

  // ===== Titles =====
  { name: 'The Coder', description: 'Equip "The Coder" title on your profile.', type: 'title', price: 100, rarity: 'common', sortOrder: 50 },
  { name: 'Bug Hunter', description: 'Equip "Bug Hunter" title.', type: 'title', price: 250, rarity: 'rare', sortOrder: 51 },
  { name: 'Arena Champion', description: 'Equip "Arena Champion" title.', type: 'title', price: 700, rarity: 'epic', sortOrder: 52, featured: true },
  { name: 'Code Legend', description: 'Equip "Code Legend" title.', type: 'title', price: 2000, rarity: 'mythic', sortOrder: 53 },
  { name: 'Problem Solver', description: 'Equip "Problem Solver" title.', type: 'title', price: 150, rarity: 'common', sortOrder: 54 },
  { name: 'Syntax Wizard', description: 'Equip "Syntax Wizard" title.', type: 'title', price: 400, rarity: 'rare', sortOrder: 55 },

  // ===== CodeAce Skins =====
  { name: 'Classic CodeAce', description: 'Default CodeAce skin — clean and simple.', type: 'code_ace_skin', price: 0, rarity: 'common', sortOrder: 60 },
  { name: 'Neon CodeAce', description: 'CodeAce with glowing neon accents.', type: 'code_ace_skin', price: 400, rarity: 'rare', color: '#00e5ff', sortOrder: 61 },
  { name: 'Shadow CodeAce', description: 'Dark, sleek CodeAce skin with shadow effects.', type: 'code_ace_skin', price: 750, rarity: 'epic', color: '#212121', effect: 'shadow', sortOrder: 62 },
  { name: 'Golden CodeAce', description: 'Premium golden CodeAce skin.', type: 'code_ace_skin', price: 1800, rarity: 'legendary', color: '#ffd700', effect: 'glow', sortOrder: 63, featured: true },
  { name: 'Pixel CodeAce', description: 'Retro pixel-art CodeAce skin.', type: 'code_ace_skin', price: 300, rarity: 'rare', color: '#76ff03', sortOrder: 64 },

  // ===== Loading Themes =====
  { name: 'Default Loader', description: 'Standard loading animation.', type: 'loading_theme', price: 0, rarity: 'common', sortOrder: 70 },
  { name: 'Spinning Cube', description: '3D cube spins while content loads.', type: 'loading_theme', price: 200, rarity: 'common', sortOrder: 71 },
  { name: 'Typing Dots', description: 'Animated typing indicator as a loader.', type: 'loading_theme', price: 250, rarity: 'rare', sortOrder: 72 },
  { name: 'Progress Pulse', description: 'Pulsing gradient progress bar.', type: 'loading_theme', price: 350, rarity: 'rare', sortOrder: 73 },
  { name: 'Code Rain Loader', description: 'Matrix-style code rain during loading.', type: 'loading_theme', price: 900, rarity: 'epic', color: '#00c853', effect: 'code_rain', sortOrder: 74, featured: true },
  { name: 'Orbital Rings', description: 'Satellite rings orbit while loading.', type: 'loading_theme', price: 1500, rarity: 'legendary', color: '#7c4dff', effect: 'orbit', sortOrder: 75 },

  // ===== Chat Emojis =====
  { name: 'DevRann Emoji Pack', description: 'Custom DevRann-branded emojis for chat.', type: 'chat_emoji', price: 150, rarity: 'common', sortOrder: 80 },
  { name: 'Animated Emoji Pack', description: 'Animated emojis for expressive chat.', type: 'chat_emoji', price: 400, rarity: 'rare', sortOrder: 81 },
  { name: 'Code Symbols Pack', description: 'Programming-themed emoji set for chat.', type: 'chat_emoji', price: 300, rarity: 'rare', sortOrder: 82 },
  { name: 'Premium Emoji Pack', description: 'Exclusive premium animated emoji set.', type: 'chat_emoji', price: 1000, rarity: 'legendary', sortOrder: 83, featured: true },

  // ===== Arena Effects =====
  { name: 'Sparks Effect', description: 'Sparks fly when you solve a problem in Arena.', type: 'arena_effect', price: 250, rarity: 'common', effect: 'sparks', sortOrder: 90 },
  { name: 'Fire Trail', description: 'Your cursor leaves a fiery trail in battle.', type: 'arena_effect', price: 500, rarity: 'rare', color: '#ff6d00', effect: 'fire_trail', sortOrder: 91 },
  { name: 'Lightning Strike', description: 'Lightning bolts on correct submissions.', type: 'arena_effect', price: 800, rarity: 'epic', color: '#ffd600', effect: 'lightning', sortOrder: 92 },
  { name: 'Victory Confetti', description: 'Confetti burst when you win a match.', type: 'arena_effect', price: 1200, rarity: 'legendary', color: '#ff4081', effect: 'confetti', sortOrder: 93, featured: true },
  { name: 'Aura Pulse', description: 'A pulsing aura around your avatar in Arena.', type: 'arena_effect', price: 2000, rarity: 'mythic', color: '#7c4dff', effect: 'aura_pulse', sortOrder: 94 },

  // ===== Profile Backgrounds =====
  { name: 'Solid Carbon Background', description: 'Clean dark carbon fiber background.', type: 'profile_background', price: 100, rarity: 'common', sortOrder: 100 },
  { name: 'Gradient Wave Background', description: 'Smooth animated wave gradient.', type: 'profile_background', price: 350, rarity: 'rare', color: '#1a237e', effect: 'wave', sortOrder: 101 },
  { name: 'Particle Field Background', description: 'Floating particles on your profile.', type: 'profile_background', price: 700, rarity: 'epic', color: '#311b92', effect: 'particles', sortOrder: 102 },
  { name: 'City Skyline Background', description: 'Animated night city skyline.', type: 'profile_background', price: 1400, rarity: 'legendary', color: '#0d47a1', effect: 'city', sortOrder: 103, featured: true },
  { name: 'Aurora Borealis Background', description: 'Northern lights dance across your profile.', type: 'profile_background', price: 3000, rarity: 'mythic', color: '#00e5ff', effect: 'aurora', sortOrder: 104 },

  // ===== Seasonal Collectibles =====
  { name: 'Summer 2026 Frame', description: 'Limited edition summer avatar frame.', type: 'seasonal_collectible', price: 500, rarity: 'epic', color: '#ffab00', sortOrder: 110, seasonal: true, featured: true },
  { name: 'Holiday Snow Globe', description: 'Winter holiday profile background.', type: 'seasonal_collectible', price: 800, rarity: 'legendary', color: '#e0f7fa', effect: 'snow', sortOrder: 111, seasonal: true },
  { name: 'Halloween Pumpkin Badge', description: 'Spooky pumpkin profile badge.', type: 'seasonal_collectible', price: 300, rarity: 'rare', color: '#ff6d00', sortOrder: 112, seasonal: true },
];

export async function seedShopItems(): Promise<number> {
  const { firestore: db } = initializeFirebase();
  if (!db) return 0;

  const existing = await getDocs(query(collection(db, 'shopItems'), where('available', '==', true)));
  if (existing.size > 0) {
    return existing.size;
  }

  let count = 0;
  for (const item of SEED_ITEMS) {
    const ref = doc(collection(db, 'shopItems'));
    await setDoc(ref, {
      name: item.name,
      description: item.description,
      type: item.type,
      price: item.price,
      currency: 'devcoins',
      rarity: item.rarity,
      color: item.color || null,
      effect: item.effect || null,
      previewUrl: null,
      available: true,
      limited: false,
      seasonal: item.seasonal || false,
      featured: item.featured || false,
      expiresAt: null,
      sortOrder: item.sortOrder,
      createdAt: new Date().toISOString(),
    });
    count++;
  }

  return count;
}

export { SEED_ITEMS };
