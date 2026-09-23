import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import type { GameState, UnlockedMonsterRecord, WordItem } from "./types";
import type { EarnedCoupon } from "./data/gachaRewards";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
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
  wrongWordList?: WordItem[];
  hasClaimedCodexReward?: boolean;
  treasureBoxCount?: number;
  cycleCount?: number;
  isInfiniteMode?: boolean;
  stageIndex?: number;
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

// Firestore 플레이어 데이터 전체 초기화 (setDoc으로 문서 완전 덮어쓰기)
export const resetAllPlayerDataToFirestore = async (
  initialData: PlayerFirestoreData,
  playerId: string = DEFAULT_PLAYER_ID
): Promise<boolean> => {
  try {
    const docRef = doc(db, PLAYER_COLLECTION, playerId);
    await setDoc(docRef, {
      ...initialData,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.warn("[Firestore] Failed to reset player data:", error);
    return false;
  }
};

