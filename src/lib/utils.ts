import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Tier } from "@/app/lib/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateElo(playerRating: number, opponentRating: number, result: 1 | 0 | 0.5, kFactor: number = 32) {
  const expected = 1 / (1 + 10 ** ((opponentRating - playerRating) / 400));
  return Math.round(playerRating + kFactor * (result - expected));
}

export function getTier(rating: number): Tier {
  if (rating < 800) return 'Beginner';
  if (rating < 1200) return 'Learner';
  if (rating < 1600) return 'Intermediate';
  if (rating < 2000) return 'Advanced';
  if (rating < 2400) return 'Expert';
  return 'Master';
}

export function getTierColor(tier: Tier): string {
  switch (tier) {
    case 'Beginner': return 'text-gray-400';
    case 'Learner': return 'text-green-400';
    case 'Intermediate': return 'text-blue-400';
    case 'Advanced': return 'text-purple-400';
    case 'Expert': return 'text-orange-400';
    case 'Master': return 'text-red-500 font-bold';
    default: return 'text-white';
  }
}
