import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { LeaderboardEntry, WrongNote, SessionHistory } from '../types';

export interface UserRecord {
  leaderboard: LeaderboardEntry[];
  wrongNotes:  WrongNote[];
  history:     SessionHistory[];
}

export async function loadUserRecord(nickname: string): Promise<UserRecord | null> {
  try {
    const snap = await getDoc(doc(db, 'users', nickname));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      leaderboard: data.leaderboard ?? [],
      wrongNotes:  data.wrongNotes  ?? [],
      history:     data.history     ?? [],
    };
  } catch {
    return null;
  }
}

export async function saveUserRecord(nickname: string, record: UserRecord): Promise<void> {
  try {
    await setDoc(doc(db, 'users', nickname), {
      ...record,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    console.error('Firestore 저장 오류:', e);
  }
}
