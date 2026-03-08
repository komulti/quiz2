import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { LeaderboardEntry, WrongNote, SessionHistory } from '../types';

export interface UserRecord {
  leaderboard: LeaderboardEntry[];
  wrongNotes:  WrongNote[];
  history:     SessionHistory[];
}

const TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), TIMEOUT_MS)
    ),
  ]);
}

export async function loadUserRecord(nickname: string): Promise<UserRecord | null> {
  const snap = await withTimeout(getDoc(doc(db, 'users', nickname)));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    leaderboard: data.leaderboard ?? [],
    wrongNotes:  data.wrongNotes  ?? [],
    history:     data.history     ?? [],
  };
}

export async function saveUserRecord(nickname: string, record: UserRecord): Promise<void> {
  await withTimeout(setDoc(doc(db, 'users', nickname), {
    ...record,
    updatedAt: serverTimestamp(),
  }));
}
