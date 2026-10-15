import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, type DocumentReference } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import type { GameState, UnlockedMonsterRecord, WordItem, DailyDualQuest } from "./types";
import type { EarnedCoupon } from "./data/gachaRewards";

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : ({} as Record<string, string>);

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "mock-api-key",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "mock-domain",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "mock-project",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "mock-bucket",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "mock-sender",
  appId: env.VITE_FIREBASE_APP_ID || "mock-app-id",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// 플레이어 컬렉션 상수
export const PLAYER_COLLECTION = "players";

/**
 * @deprecated 사용자별 문서 격리를 위해 auth.currentUser.uid를 사용합니다.
 */
export const DEFAULT_PLAYER_ID = "player_main";

export interface PlayerFirestoreData {
  gameState?: GameState;
  eggCount?: number;
  attendanceRecords?: string[];
  stampCount?: number;
  cumulativeAttendanceDays?: number;
  weeklyRewardClaimedWeek?: string | null;
  unlockedMonsters?: Record<string, UnlockedMonsterRecord>;
  coupons?: EarnedCoupon[];
  wrongWordList?: WordItem[];
  hasClaimedCodexReward?: boolean;
  treasureBoxCount?: number;
  cycleCount?: number;
  isInfiniteMode?: boolean;
  stageIndex?: number;
  equippedPartnerId?: string | null;
  dailyDualQuest?: DailyDualQuest;
  mathStageIndex?: number;
  updatedAt?: string;
}

/**
 * 신규 플레이어 생성을 위한 기본값 반환
 */
export const getDefaultPlayerData = (
  today: string = new Date().toISOString().slice(0, 10)
): PlayerFirestoreData => ({
  gameState: { level: 1, exp: 0, streak: 0, cycleCount: 1 },
  eggCount: 0,
  treasureBoxCount: 1,
  attendanceRecords: [],
  stampCount: 0,
  cumulativeAttendanceDays: 0,
  weeklyRewardClaimedWeek: null,
  unlockedMonsters: {},
  coupons: [],
  wrongWordList: [],
  hasClaimedCodexReward: false,
  cycleCount: 1,
  isInfiniteMode: false,
  stageIndex: 0,
  equippedPartnerId: null,
  dailyDualQuest: { date: today, languageDone: false, mathDone: false },
  mathStageIndex: 0,
  updatedAt: new Date().toISOString(),
});

/**
 * 현재 대상 플레이어의 UID를 반환하는 헬퍼
 * 1) 명시적으로 전달된 playerId가 있으면 우선 사용
 * 2) 없으면 로그인된 auth.currentUser.uid 사용
 * 3) 둘 다 없으면 null (비로그인 상태)
 */
export const getTargetPlayerId = (playerId?: string): string | null => {
  if (playerId && playerId.trim()) return playerId.trim();
  return auth.currentUser?.uid ?? null;
};

/**
 * players 컬렉션 내 해당 플레이어의 DocumentReference 반환
 * 비로그인 상태일 경우 null 반환
 */
export const getPlayerDocRef = (
  playerId?: string
): DocumentReference | null => {
  const uid = getTargetPlayerId(playerId);
  if (!uid) return null;
  return doc(db, PLAYER_COLLECTION, uid);
};

/**
 * Firestore에서 플레이어 데이터 조회 (auth.currentUser.uid 기반)
 * 비로그인 상태일 경우 안전하게 null 반환 (로컬 스토리지 사용)
 */
export const fetchPlayerDataFromFirestore = async (
  playerId?: string
): Promise<PlayerFirestoreData | null> => {
  const docRef = getPlayerDocRef(playerId);
  if (!docRef) {
    // 비로그인 상태 예외 처리: 원격 호출 없이 즉시 null 반환
    return null;
  }

  try {
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

/**
 * Firestore에 플레이어 데이터 병합 저장 (merge: true, auth.currentUser.uid 기반)
 * 비로그인 상태일 경우 저장을 안전하게 건너뛰고 false 반환
 */
export const savePlayerDataToFirestore = async (
  data: Partial<PlayerFirestoreData>,
  playerId?: string
): Promise<boolean> => {
  const docRef = getPlayerDocRef(playerId);
  if (!docRef) {
    // 비로그인 상태 예외 처리: Firestore 저장 건너뜀 (로컬 스토리지로 정상 동작)
    return false;
  }

  try {
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

/**
 * 로그인 시 해당 UID 문서가 없으면 기본값으로 초기 문서를 생성하고,
 * 이미 존재하면 기존 문서를 반환하는 함수
 * 비로그인 상태일 경우 null 반환
 */
export const ensurePlayerDocument = async (
  playerId?: string,
  initialFallback?: Partial<PlayerFirestoreData>
): Promise<{ data: PlayerFirestoreData; isNewlyCreated: boolean } | null> => {
  const uid = getTargetPlayerId(playerId);
  const docRef = getPlayerDocRef(playerId);
  if (!uid || !docRef) {
    // 비로그인 상태 예외 처리
    return null;
  }

  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return {
        data: snap.data() as PlayerFirestoreData,
        isNewlyCreated: false,
      };
    }

    // UID 문서가 없으면 기본값(및 로컬 데이터 폴백)으로 초기 문서 생성
    const newDocData: PlayerFirestoreData = {
      ...getDefaultPlayerData(),
      ...initialFallback,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(docRef, newDocData);
    console.log(`[Firestore] Initialized new player document for UID: ${uid}`);
    return {
      data: newDocData,
      isNewlyCreated: true,
    };
  } catch (error) {
    console.warn(`[Firestore] Failed to ensure player document for UID (${uid}):`, error);
    return null;
  }
};

/**
 * Firestore 플레이어 데이터 전체 초기화 (setDoc으로 문서 완전 덮어쓰기)
 * 비로그인 상태일 경우 false 반환
 */
export const resetAllPlayerDataToFirestore = async (
  initialData: PlayerFirestoreData,
  playerId?: string
): Promise<boolean> => {
  const docRef = getPlayerDocRef(playerId);
  if (!docRef) {
    console.warn("[Firestore] User is not authenticated. Cannot reset document.");
    return false;
  }

  try {
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
