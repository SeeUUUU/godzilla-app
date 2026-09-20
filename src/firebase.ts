import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import type { GameState, UnlockedMonsterRecord } from "./types";
import type { EarnedCoupon } from "./data/gachaRewards";

const firebaseConfig = {
  apiKey: "AIzaSyBqBxYJk41xcM1opcPLLhHs6HD97h6LgWA",
  authDomain: "godzilla-app-94148.firebaseapp.com",
  projectId: "godzilla-app-94148",
  storageBucket: "godzilla-app-94148.firebasestorage.app",
  messagingSenderId: "948663044378",
  appId: "1:948663044378:web:3693a923e8c7b01fb604a3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// 단일 플레이어 프로필 관리 상수
export const PLAYER_COLLECTION = "players";
export const DEFAULT_PLAYER_ID = "player_main";

export interface PlayerFirestoreData {
  gameState?: GameState;
  eggCount?: number;
  attendanceRecords?: string[];
  weeklyRewardClaimedWeek?: string | null;
  unlockedMonsters?: Record<string, UnlockedMonsterRecord>;
  coupons?: EarnedCoupon[];
  updatedAt?: string;
}

// Firestore에서 플레이어 데이터 조회
export const fetchPlayerDataFromFirestore = async (
  playerId: string = DEFAULT_PLAYER_ID
): Promise<PlayerFirestoreData | null> => {
  try {
    const docRef = doc(db, PLAYER_COLLECTION, playerId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as PlayerFirestoreData;
    }
    return null;
  } catch (error) {
    console.warn("[Firestore] Failed to fetch player data (using local storage):", error);
    return null;
  }
};

// Firestore에 플레이어 데이터 병합 저장 (merge: true)
export const savePlayerDataToFirestore = async (
  data: Partial<PlayerFirestoreData>,
  playerId: string = DEFAULT_PLAYER_ID
): Promise<boolean> => {
  try {
    const docRef = doc(db, PLAYER_COLLECTION, playerId);
    await setDoc(
      docRef,
      {
        ...data,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.warn("[Firestore] Failed to save player data:", error);
    return false;
  }
};
