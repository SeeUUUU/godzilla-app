import { initializeApp } from "firebase/app";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDoc,
  setDoc,
  type DocumentReference,
  type Firestore,
} from "firebase/firestore";
import {
  getAuth,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import type { GameState, UnlockedMonsterRecord, WordItem, DailyDualQuest, LearningAnalyticsData } from "./types";
import type { EarnedCoupon } from "./data/gachaRewards";
import type { EquippedAtomicGear } from "./data/atomicPartsData";

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : ({} as Record<string, string>);

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "mock-api-key",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "mock-domain",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "mock-project",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "mock-bucket",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "mock-sender",
  appId: env.VITE_FIREBASE_APP_ID || "mock-app-id",
};

// 환경 변수 누락 및 Mock 키 사용 여부 점검
if (!env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey === "mock-api-key") {
  console.warn(
    "[Firebase Config Warning] VITE_FIREBASE_API_KEY 환경 변수가 설정되지 않았거나 올바르지 않습니다. .env 파일을 확인해 주세요."
  );
}

const app = initializeApp(firebaseConfig);

const initFirestoreWithOfflineCache = (): Firestore => {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    return getFirestore(app);
  }
};

export const db = initFirestoreWithOfflineCache();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ─────────────────────────────────────────────
// 허용할 구글 이메일 화이트리스트 (직접 등록 + .env VITE_ALLOWED_EMAILS 연동)
// ─────────────────────────────────────────────
export const ALLOWED_EMAILS: string[] = [
  '내구글계정@gmail.com',
  // 추가할 가족/지인 구글 계정 이메일을 여기에 입력하세요
];

/**
 * 허용된 이메일 목록 반환 (.env 환경 변수와 ALLOWED_EMAILS 배열 통합)
 */
export const getAllowedEmails = (): string[] => {
  const envRaw = env.VITE_ALLOWED_EMAILS || "";
  const fromEnv = envRaw
    .split(",")
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);

  const fromCode = ALLOWED_EMAILS
    .map((e) => e.trim().toLowerCase())
    .filter((e) => Boolean(e) && !e.includes('내구글계정@gmail.com'));

  return Array.from(new Set([...fromCode, ...fromEnv]));
};

export const isEmailAllowed = (email: string | null | undefined): boolean => {
  const allowedList = getAllowedEmails();
  // 화이트리스트가 정의되어 있으면 반드시 일치해야만 허용
  if (allowedList.length === 0) return true;
  if (!email) return false;
  return allowedList.includes(email.toLowerCase().trim());
};

/**
 * 구글 팝업 로그인 실행
 */
export const signInWithGoogle = async (): Promise<User> => {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
};

/**
 * 로그아웃 실행
 */
export const signOutUser = async (): Promise<void> => {
  await signOut(auth);
};

let pendingAnonymousSignIn: Promise<User | null> | null = null;

/**
 * 비로그인 상태일 때 Firebase 익명 로그인(signInAnonymously)을 자동 수행합니다.
 * 중복 호출을 방지하며, 오프라인이나 mock 환경에서 실패 시 null을 반환하고 로컬 스토리지 모드로 안전 폴백합니다.
 */
export const ensureAnonymousAuth = async (): Promise<User | null> => {
  if (auth.currentUser) return auth.currentUser;
  if (firebaseConfig.apiKey === "mock-api-key") return null;
  if (pendingAnonymousSignIn) return pendingAnonymousSignIn;

  pendingAnonymousSignIn = signInAnonymously(auth)
    .then((cred) => cred.user)
    .catch((error) => {
      console.warn("[Firebase Auth] Anonymous sign-in skipped (using local storage fallback):", error);
      return null;
    })
    .finally(() => {
      pendingAnonymousSignIn = null;
    });

  return pendingAnonymousSignIn;
};

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
  atomicUnlockedParts?: string[];
  atomicUnlockedTitles?: string[];
  atomicEquippedGear?: EquippedAtomicGear;
  learningAnalytics?: LearningAnalyticsData;
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
 * 현재 로그인된 플레이어의 UID를 반환하는 헬퍼
 * 타인 문서 덮어쓰기 방지를 위해 외부 playerId 인자를 받지 않고 오직 auth.currentUser.uid만 반환합니다.
 */
export const getTargetPlayerId = (): string | null => {
  return auth.currentUser?.uid ?? null;
};

/**
 * players 컬렉션 내 현재 인증된 플레이어의 DocumentReference 반환
 * 비로그인 상태일 경우 null 반환
 */
export const getPlayerDocRef = (): DocumentReference | null => {
  const uid = getTargetPlayerId();
  if (!uid) return null;
  return doc(db, PLAYER_COLLECTION, uid);
};

/**
 * Firestore에서 플레이어 데이터 조회 (auth.currentUser.uid 기반)
 * 비로그인 상태일 경우 안전하게 null 반환 (로컬 스토리지 사용)
 */
export const fetchPlayerDataFromFirestore = async (): Promise<PlayerFirestoreData | null> => {
  const docRef = getPlayerDocRef();
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
  data: Partial<PlayerFirestoreData>
): Promise<boolean> => {
  const docRef = getPlayerDocRef();
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
  initialFallback?: Partial<PlayerFirestoreData>
): Promise<{ data: PlayerFirestoreData; isNewlyCreated: boolean } | null> => {
  const uid = getTargetPlayerId();
  const docRef = getPlayerDocRef();
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
  initialData: PlayerFirestoreData
): Promise<boolean> => {
  const docRef = getPlayerDocRef();
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
