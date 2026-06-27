'use client';

import { useState, useEffect } from 'react';
import { 
  onSnapshot, 
  Query, 
  DocumentData, 
  QuerySnapshot 
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';
import { firebaseConfig } from '../config';

const MOCK_PROBLEMS = [
  {
    id: 'fizz-buzz',
    title: 'FizzBuzz Puzzle',
    category: 'Logic',
    difficulty: 'Easy',
    points: 10,
    problemStatement: 'Write a program that outputs the string representation of numbers from 1 to n. But for multiples of three it should output "Fizz" instead of the number and for the multiples of five output "Buzz". For numbers which are multiples of both three and five output "FizzBuzz".'
  },
  {
    id: 'two-sum',
    title: 'Two Sum Matchup',
    category: 'Arrays',
    difficulty: 'Medium',
    points: 20,
    problemStatement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.'
  },
  {
    id: 'reverse-string',
    title: 'String Inversion',
    category: 'Strings',
    difficulty: 'Easy',
    points: 5,
    problemStatement: 'Write a function that reverses a string. The input string is given as an array of characters s. You must do this by modifying the input array in-place with O(1) extra memory.'
  },
  {
    id: 'valid-parentheses',
    title: 'Bracket Validator',
    category: 'Stacks',
    difficulty: 'Medium',
    points: 15,
    problemStatement: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid. An input string is valid if open brackets are closed by the same type of brackets.'
  }
];

const MOCK_USERS = [
  { id: '1', username: 'SyntaxSamurai', rating: 2150, tier: 'Master', wins: 85, losses: 12 },
  { id: '2', username: 'BinaryBoss', rating: 1890, tier: 'Expert', wins: 62, losses: 18 },
  { id: '3', username: 'RecursionQueen', rating: 1650, tier: 'Advanced', wins: 45, losses: 20 },
  { id: '4', username: 'NullPointer', rating: 1420, tier: 'Intermediate', wins: 28, losses: 15 },
  { id: '5', username: 'Guest Coder', rating: 1200, tier: 'Beginner', wins: 5, losses: 3 }
];

export function useCollection(query: Query | null) {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const isDemoMode = firebaseConfig.apiKey === 'demo-key';

    if (isDemoMode) {
      const getMockCollection = () => {
        const queryPath = (query as any)?._query?.path?.toString() || '';
        
        if (queryPath.includes('problems')) {
          setData(MOCK_PROBLEMS);
        } else if (queryPath.includes('users')) {
          const stored = localStorage.getItem('mock_user');
          const list = [...MOCK_USERS];
          if (stored) {
            const userObj = JSON.parse(stored);
            const userDb = localStorage.getItem('mock_firestore_db');
            const parsedDb = userDb ? JSON.parse(userDb) : {};
            const userStats = parsedDb[`users/${userObj.uid}`] || {};
            
            const filtered = list.filter(u => u.username !== 'Guest Coder');
            filtered.push({
              id: userObj.uid,
              username: userObj.displayName,
              rating: userStats.rating || 1200,
              tier: userStats.tier || 'Beginner',
              wins: userStats.wins || 5,
              losses: userStats.losses || 3
            });
            setData(filtered.sort((a,b) => b.rating - a.rating));
          } else {
            setData(list);
          }
        } else {
          setData([]);
        }
        setLoading(false);
      };

      getMockCollection();
      
      window.addEventListener('mock-db-change', getMockCollection);
      window.addEventListener('mock-auth-change', getMockCollection);
      return () => {
        window.removeEventListener('mock-db-change', getMockCollection);
        window.removeEventListener('mock-auth-change', getMockCollection);
      };
    }

    if (!query) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setData(items);
        setLoading(false);
      },
      async (err) => {
        const permissionError = new FirestorePermissionError({
          path: (query as any)._query?.path?.toString() || 'unknown',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, loading, error };
}
