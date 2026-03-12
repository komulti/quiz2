import { doc, getDoc, setDoc, serverTimestamp, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
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

export async function saveGlobalLeaderboardEntry(entry: LeaderboardEntry): Promise<void> {
  await withTimeout(setDoc(doc(db, 'globalLeaderboard', entry.id), {
    ...entry,
    createdAt: serverTimestamp(),
  }));
}

export async function loadGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
  const q = query(
    collection(db, 'globalLeaderboard'),
    orderBy('percent', 'desc'),
    orderBy('timeSeconds', 'asc'),
    limit(10)
  );
  const snap = await withTimeout(getDocs(q));
  return snap.docs.map((d) => d.data() as LeaderboardEntry);
}
