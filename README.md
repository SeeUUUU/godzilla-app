# 🦖 고질라 3개 국어 단어 배틀 (Godzilla 3-Language Word Battle)

> **초등학생 눈높이에 맞춘 게이미피케이션 다국어(한국어·영어·일본어) 단어 학습 및 실생활 보상 연동 웹 애플리케이션**

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)

---

## 🌟 프로젝트 개요

**고질라 3개 국어 단어 배틀**은 아이가 한국어-영어-일본어 3개 언어로 이루어진 단어 카드를 매칭하여 고질라와 함께 괴수를 물리치고, 단어 발음 연습과 일상 회화 문장을 자연스럽게 익히며 실생활 보상(게임 보너스 시간 쿠폰)을 획득하는 인터랙티브 에듀테인먼트 게임입니다.

---

## ✨ 최근 주요 업데이트 및 핵심 기능

### 1. 💬 3개 국어 미니 콤보 회화 시스템 (`SentenceComboModal`)
- **화면 중앙 대형 모달 UI**: 배틀존 상단 작은 배너 형태에서 화면 중앙의 몰입감 높은 대형 다크 모달로 개편. 초등 2학년 눈높이에 맞춘 시원한 텍스트 폰트 적용.
- **문맥 및 카테고리 맞춤 문법 체계**:
  - **사물 (This is a/an ~ / これは ~です)**: 임의의 수식어를 배제하고 표준 문장(`이것은 [단어](이)에요!`) 매핑. 영어 부정관사(a/an) 정확 적용.
  - **장소 (This is our/my ~ / ここは ~です)**: 지시대명사 '여기'(`여기는 [단어](이)에요!`) 사용.
  - **인물 (This is my ~ / こちらは ~です)**: 자연스러운 인칭 지시대명사(`이분은 선생님이에요!`, `이쪽은 제 친구예요!`) 적용.
  - **한국어 종성(받침) 자동 판별**: 끝 글자 받침 유무에 따라 `'이에요'` / `'예요'` 문법 자동 처리.
  - **일본어 루비 후리가나**: 한자 상단에 요미가나 후리가나(`<ruby><rt>`) 및 자연스러운 띄어쓰기 표기.
- **TTS 끝까지 청취 필수 잠금 로직**:
  - 브라우저 Web Speech API의 `utterance.onend` 이벤트를 연동하여, 3개 국어 음성을 **실제로 끝까지 모두 들었을 때만** 하단 `[⚡ 다음 단어 공격하기! 💥]` 버튼 잠금 해제.
  - 음성 재생 중 `"재생 중... 🔊"` 피드백 및 중복 연타 방지.
- **포효(발음 연습) 모달과 유기적 시퀀스 체이닝**:
  - **포효 ON**: 단어 매칭 성공 ➔ 포효(음성인식 발음 연습) 모달 완료 ➔ 곧바로 미니 콤보 회화 모달 연결.
  - **포효 OFF**: 단어 매칭 즉시 미니 콤보 회화 모달 노출.

---

### 2. 👾 오답 레이드 보스 5종 & 도감 10종 보물상자 순환 루프
- **5대 악역 레이드 보스 분기**:
  - 오답 노트 레이드 진입 시 고질라 세계관의 5대 악역 보스(킹기도라, 메카고질라, 스페이스고질라, 데스토로이아, 가이강) 중 1종이 랜덤 출현.
  - 보스별 고유 비주얼, 체력바, 사운드, 레이드 전용 피버 연출.
- **도감 10종 완성 ➔ 황금 보물상자 순환 수집 루프**:
  - 도감에서 몬스터 카드 10종을 수집하면 🎁 황금 보물상자 교환 가능.
  - 보물상자 수령 시 보유 카드가 10장 차감(-10)되며, 새로운 보물상자를 향해 다시 카드를 수집할 수 있는 **무한 동기부여 재수집 사이클** 완성.

---

### 3. 🎟️ 쿠폰함 실생활 연동 & '아빠 도장 쾅!' 시스템 (`CouponModal`)
- **비밀번호(PIN) 없는 직관적인 간편 인증**:
  - 번거롭고 딱딱한 숫자 PIN 입력창을 전면 제거.
  - [쿠폰 사용하기 🎫] 클릭 시 부모-아이 간 실생활 신뢰 기반 확인 팝업(`"정말 쿠폰을 사용할까요? 아빠에게 보여주고 도장을 찍으세요!"`) 제공.
- **'아빠 도장 쾅!' 스탬프 슬램 연출**:
  - `[아빠 도장 쾅! 찍기 🔴]` 클릭 시 쿠폰 카드 중앙에 회전하며 쿵! 찍히는 큼직한 붉은색 원형 도장(`★ 아빠 인증 ★ / 사용 완료 ✔️ / 오늘 날짜`) 애니메이션(`dadStampSlam`).
  - WebAudio 기반 묵직한 도장 물리 타격음(`playDadStampSlamSound`), 화면 미세 흔들림(`screenShake`), 햅틱 진동(`navigator.vibrate`), 축하 콘페티 폭죽 연출.
  - 1초 후 보유 쿠폰 1장 차감 및 [사용한 쿠폰 내역]으로 이동.
- **상단 2분할 탭 분리**:
  - `[보유 중인 쿠폰 (N장)]`: 황금빛 카드 테마와 즉시 사용 버튼.
  - `[사용한 쿠폰 내역 (M장)]`: 흑백/차분한 다크 슬레이트 톤과 빨간색 '사용 완료' 도장 훈장, 사용 날짜/시간(`YYYY.MM.DD HH:mm`)을 영구 보존하여 아이가 보상에 대한 뿌듯한 성취감을 느낄 수 있는 명예의 훈장 보관함 역할.
  - `localStorage` 및 Firebase Firestore 실시간 자동 동기화.

---

### 4. 📱 반응형 UI & 레이아웃 최적화
- **상단 헤더(Header) 2줄 정돈**:
  - 모바일 및 좁은 화면에서도 가로 스크롤(오버플로우)이 발생하지 않도록 상단 헤더 컴포넌트를 정돈된 2줄 그리드 형태로 재배치.
- **스테이지 클리어 창 최적화**:
  - 불필요한 내부 스크롤을 제거하고 단어 카드의 높이와 패딩을 최적화하여 한 화면에서 클리어 결과와 학습 단어 요약이 한눈에 들어오도록 개선.

---

## 🏗️ 기술 스택 및 아키텍처

- **Frontend Core**: React 19, TypeScript 6, Vite 8
- **Styling**: TailwindCSS 3.4, PostCSS, Custom CSS Keyframes
- **State & Storage**:
  - LocalStorage 기반 오프라인 완벽 구동
  - Firebase Firestore 클라우드 양방향 백업 및 실시간 동기화
- **Audio & Media**:
  - Web Audio API (합성 기반 묵직한 열선 빔, 도장 타격음, 상자 오픈음)
  - Web Speech API (브라우저 내장 다국어 TTS 음성 합성 및 음성인식 STT)
  - Canvas Confetti (축하 파티클 시스템)

---

## 🚀 시작하기

### 설치 및 로컬 실행

```bash
# 저장소 클론
git clone https://github.com/SeeUUUU/godzilla-app.git
cd godzilla-app

# 의존성 패키지 설치
npm install

# 로컬 개발 서버 실행
npm run dev
```

### 빌드 및 타입 검사

```bash
# TypeScript 타입 검사
npx tsc --noEmit

# 프로덕션 빌드
npm run build

# 빌드 결과물 미리보기
npm run preview
```
