import type { WordItem } from '../types';
import { DEFAULT_WORDS } from '../data/defaultWords';

export interface MiniComboSentences {
  ko: string;
  en: string;
  ja: {
    before: string;
    term: string;
    reading: string;
    after: string;
    spoken: string;
  };
}

type Category = 'place' | 'person' | 'object' | 'food' | 'drink' | 'animal' | 'body' | 'nature' | 'color' | 'shape' | 'time' | 'other';

export const firstMeaning = (text: string): string =>
  text.split('/')[0].trim().replace(/\s*\([^)]*\)\s*$/, '');

export const hasFinalConsonant = (text: string): boolean => {
  const lastHangul = [...text].reverse().find((char) => /[가-힣]/.test(char));
  return lastHangul ? (lastHangul.charCodeAt(0) - 0xac00) % 28 !== 0 : false;
};

const copula = (word: string) => hasFinalConsonant(word) ? '이에요' : '예요';
const subject = (word: string) => hasFinalConsonant(word) ? '이' : '가';
const object = (word: string) => hasFinalConsonant(word) ? '을' : '를';

const lowerEnglish = (word: string) => /^(Godzilla|Earth)$/i.test(word)
  ? word
  : word.charAt(0).toLowerCase() + word.slice(1);

const article = (word: string): 'a' | 'an' => {
  const lower = word.toLowerCase();
  if (/^(honest|hour|heir)/.test(lower)) return 'an';
  if (/^(university|uniform|unicorn|european|one\b)/.test(lower)) return 'a';
  return /^[aeiou]/.test(lower) ? 'an' : 'a';
};

const inSet = (value: string, values: string) => values.split('|').includes(value);

const defaultWordIndex = new Map(
  DEFAULT_WORDS.map((word, index) => [`${word.ko}\u0000${word.en}\u0000${word.ja}`, index + 1])
);

const getDefaultIndex = (word: WordItem): number | null =>
  defaultWordIndex.get(`${word.ko}\u0000${word.en}\u0000${word.ja}`) ?? null;

const getCategory = (word: WordItem, ko: string, en: string): Category => {
  const index = getDefaultIndex(word);
  if (index !== null) {
    if ([1, 4, 18, 141, 142, 150, 177, 178, 179, 180].includes(index)) return 'place';
    if ([2, 3].includes(index) || (index >= 21 && index <= 35)) return 'person';
    if ((index >= 5 && index <= 17) || index === 20 || (index >= 143 && index <= 160) || [170, 171, 172, 174].includes(index)) return 'object';
    if (index >= 36 && index <= 50) return 'body';
    if (index >= 51 && index <= 75) return 'animal';
    if ([77, 78, 99].includes(index)) return 'drink';
    if (index === 19 || (index >= 76 && index <= 100)) return 'food';
    if (index >= 101 && index <= 125) return 'nature';
    if (index >= 126 && index <= 135) return 'color';
    if (index >= 136 && index <= 140) return 'shape';
    if (index >= 161 && index <= 169) return 'time';
  }

  const english = en.toLowerCase();
  if (inSet(ko, '학교|교실|방|집|공원|도서관|병원|운동장|놀이터|동물원|가게|화장실|식당|수영장|마트|도서실') ||
      inSet(english, 'school|classroom|room|house|home|park|library|hospital|playground|zoo|shop|store|restaurant|bathroom')) return 'place';
  if (inSet(ko, '선생님|친구|엄마|아빠|형|오빠|누나|언니|동생|남동생|여동생|할아버지|할머니|가족|아기|아이|의사|경찰관|소방관|요리사') ||
      inSet(english, 'teacher|friend|mom|dad|mother|father|older brother|older sister|younger brother|younger sister|brother|sister|family|baby|doctor')) return 'person';
  if (inSet(ko, '물|우유|주스|음료|차|커피') || inSet(english, 'water|milk|juice|tea|coffee')) return 'drink';
  if (inSet(ko, '밥|빵|사과|바나나|포도|딸기|수박|귤|복숭아|고기|생선|달걀|채소|당근|감자|옥수수|과자|사탕|초콜릿|아이스크림|케이크|라면|점심|음식') ||
      inSet(english, 'rice|bread|apple|banana|grape|strawberry|watermelon|tangerine|peach|meat|egg|vegetable|carrot|potato|corn|snack|candy|chocolate|ice cream|cake|ramen|lunch|food')) return 'food';
  if (inSet(ko, '책|공책|연필|지우개|가방|필통|가위|풀|자|색연필|옷|우산|시계|공|장난감|컴퓨터|전화기') ||
      inSet(english, 'book|notebook|pencil|eraser|bag|pencil case|scissors|glue|ruler|colored pencil|clothes|shirt|umbrella|uniform|clock|ball|toy|computer|phone')) return 'object';
  return 'other';
};

interface SpecialSentence {
  ko: string;
  en: string;
  jaBefore: string;
  jaAfter: string;
}

// 공통 명사 틀에 넣으면 어색한 날씨, 일상, 감정, 동작은 짧은 생활 문장으로 쓴다.
const SPECIAL: Record<string, SpecialSentence> = {
  하늘: { ko: '하늘이 정말 파래요!', en: 'The sky is so blue!', jaBefore: '', jaAfter: 'がとても青いです！' },
  우주: { ko: '우주에는 별이 많아요!', en: 'There are many stars in space!', jaBefore: '', jaAfter: 'には星がたくさんあります！' },
  지구: { ko: '지구는 우리의 집이에요!', en: 'Earth is our home!', jaBefore: '', jaAfter: 'は私たちの家です！' },
  비: { ko: '비가 와요! 우산을 써요!', en: "It's raining! Let's use an umbrella!", jaBefore: '', jaAfter: 'が降っています！傘をさしましょう！' },
  눈: { ko: '눈이 와요! 눈사람을 만들어요!', en: "It's snowing! Let's make a snowman!", jaBefore: '', jaAfter: 'が降っています！雪だるまを作りましょう！' },
  바람: { ko: '바람이 시원하게 불어요!', en: 'The wind feels cool!', jaBefore: '', jaAfter: 'が気持ちよく吹いています！' },
  불: { ko: '불은 뜨거워요! 조심해요!', en: 'Fire is hot! Be careful!', jaBefore: '', jaAfter: 'は熱いです！気をつけて！' },
  봄: { ko: '봄이 왔어요! 꽃이 피어요!', en: 'Spring is here! Flowers are blooming!', jaBefore: '', jaAfter: 'が来ました！花が咲いています！' },
  여름: { ko: '여름에는 수박이 맛있어요!', en: 'Watermelon tastes great in summer!', jaBefore: '', jaAfter: 'はスイカがおいしいです！' },
  가을: { ko: '가을에는 나뭇잎이 물들어요!', en: 'The leaves change color in autumn!', jaBefore: '', jaAfter: 'は葉っぱの色が変わります！' },
  겨울: { ko: '겨울에는 따뜻한 옷을 입어요!', en: 'I wear warm clothes in winter!', jaBefore: '', jaAfter: 'は暖かい服を着ます！' },
  날씨: { ko: '오늘 날씨가 정말 좋아요!', en: 'The weather is nice today!', jaBefore: '今日の', jaAfter: 'はとてもいいです！' },
  아침: { ko: '좋은 아침이에요! 잘 잤어요?', en: 'Good morning! Did you sleep well?', jaBefore: '', jaAfter: 'です！おはよう！' },
  점심: { ko: '점심 먹을 시간이에요!', en: "It's time for lunch!", jaBefore: '', jaAfter: 'ご飯の時間です！' },
  저녁: { ko: '저녁이 되었어요! 밥 먹어요!', en: "It's evening! Let's eat!", jaBefore: '', jaAfter: 'です！ご飯を食べましょう！' },
  밤: { ko: '밤이에요! 잘 자요!', en: "It's night. Good night!", jaBefore: '', jaAfter: 'です！おやすみ！' },
  오늘: { ko: '오늘은 무엇을 하고 놀까요?', en: 'What shall we play today?', jaBefore: '', jaAfter: 'は何をして遊ぼうか？' },
  내일: { ko: '내일 또 만나요!', en: 'See you tomorrow!', jaBefore: '', jaAfter: 'また会おう！' },
  어제: { ko: '어제 정말 재미있었어요!', en: 'Yesterday was so much fun!', jaBefore: '', jaAfter: 'はとても楽しかったです！' },
  하루: { ko: '즐거운 하루를 보내요!', en: 'Have a nice day!', jaBefore: '楽しい', jaAfter: 'を過ごしてね！' },
  시간: { ko: '지금은 놀 시간이에요!', en: "It's time to play!", jaBefore: '今は遊ぶ', jaAfter: 'です！' },
  마음: { ko: '마음이 따뜻해요!', en: 'My heart feels warm!', jaBefore: '', jaAfter: 'があたたかいです！' },
  꿈: { ko: '어젯밤 멋진 꿈을 꿨어요!', en: 'I had a wonderful dream last night!', jaBefore: '昨夜、すてきな', jaAfter: 'を見ました！' },
  생일: { ko: '생일 축하해요!', en: 'Happy birthday!', jaBefore: '', jaAfter: 'おめでとう！' },
  놀이: { ko: '친구와 재미있게 놀아요!', en: "Let's play with a friend!", jaBefore: '友達と', jaAfter: 'ましょう！' },
  기쁘다: { ko: '친구를 만나서 기뻐요!', en: 'I am happy to see my friend!', jaBefore: '友達に会えて', jaAfter: 'です！' },
  슬프다: { ko: '슬플 때는 친구에게 말해요!', en: 'I talk to a friend when I feel sad!', jaBefore: '', jaAfter: 'ときは友達に話します！' },
  즐겁다: { ko: '친구와 놀면 즐거워요!', en: 'Playing with friends is fun!', jaBefore: '友達と遊ぶと', jaAfter: 'です！' },
  크다: { ko: '이 공룡은 정말 커요!', en: 'This dinosaur is very big!', jaBefore: 'この恐竜はとても', jaAfter: 'です！' },
  작다: { ko: '이 개미는 정말 작아요!', en: 'This ant is very small!', jaBefore: 'このアリはとても', jaAfter: 'です！' },
  많다: { ko: '공원에 친구가 많아요!', en: 'There are many friends at the park!', jaBefore: '公園には友達が', jaAfter: 'です！' },
  적다: { ko: '오늘은 사람이 적어요!', en: 'There are few people today!', jaBefore: '今日は人が', jaAfter: 'です！' },
  빠르다: { ko: '기차가 정말 빨라요!', en: 'The train is very fast!', jaBefore: '電車はとても', jaAfter: 'です！' },
  느리다: { ko: '거북이는 정말 느려요!', en: 'The turtle is so slow!', jaBefore: '亀はとても', jaAfter: 'です！' },
  좋다: { ko: '오늘은 기분이 좋아요!', en: 'I feel good today!', jaBefore: '今日は気分が', jaAfter: 'です！' },
  먹다: { ko: '친구와 함께 밥을 먹어요!', en: 'I eat food with my friend!', jaBefore: '友達とご飯を', jaAfter: 'よ！' },
  마시다: { ko: '물을 한 모금 마셔요!', en: 'I drink a glass of water!', jaBefore: '水を', jaAfter: 'よ！' },
  자다: { ko: '밤에는 푹 자요!', en: 'I sleep well at night!', jaBefore: '夜はぐっすり', jaAfter: 'よ！' },
  일어나다: { ko: '아침에 일어나요!', en: 'I wake up in the morning!', jaBefore: '朝、', jaAfter: 'よ！' },
  가다: { ko: '친구와 공원에 가요!', en: 'I go to the park with my friend!', jaBefore: '友達と公園に', jaAfter: 'よ！' },
  오다: { ko: '친구가 우리 집에 와요!', en: 'My friend comes to my house!', jaBefore: '友達が家に', jaAfter: 'よ！' },
  보다: { ko: '함께 그림을 봐요!', en: "Let's look at the picture!", jaBefore: '一緒に絵を', jaAfter: 'よ！' },
  듣다: { ko: '함께 노래를 들어요!', en: "Let's listen to a song!", jaBefore: '一緒に歌を', jaAfter: 'よ！' },
  말하다: { ko: '친구와 함께 말해요!', en: 'I talk with my friend!', jaBefore: '友達と', jaAfter: 'よ！' },
  달리다: { ko: '운동장에서 신나게 달려요!', en: 'I run on the playground!', jaBefore: '校庭で元気に', jaAfter: 'よ！' },
};

export const buildMiniComboSentences = (word: WordItem): MiniComboSentences => {
  const ko = firstMeaning(word.ko);
  const en = lowerEnglish(firstMeaning(word.en));
  const ja = firstMeaning(word.ja);
  const reading = firstMeaning(word.jaKana || word.ja);
  const japanese = (before: string, after: string) => ({
    before, term: ja, reading, after, spoken: `${before}${reading}${after}`,
  });

  const special = SPECIAL[ko];
  if (special && !(ko === '눈' && en.toLowerCase() !== 'snow')) {
    return { ko: special.ko, en: special.en, ja: japanese(special.jaBefore, special.jaAfter) };
  }

  const category = getCategory(word, ko, en);
  if (category === 'place') {
    const english = (en === 'home' || en === 'house') ? 'This is my home!' : `This is the ${en}!`;
    return { ko: `여기는 ${ko}${copula(ko)}!`, en: english, ja: japanese('ここは', 'です！') };
  }
  if (category === 'person') {
    const isElder = inSet(ko, '선생님|할아버지|할머니|아빠|엄마|의사|경찰관|소방관|요리사');
    const profession = inSet(ko, '의사|경찰관|소방관|요리사');
    const introKo = isElder ? '이분은' : '이쪽은';
    const myPrefix = inSet(ko, '아빠|엄마|형|오빠|누나|언니|남동생|여동생|동생|할아버지|할머니|가족') ? '우리 ' : ko === '친구' ? '제 ' : '';
    return {
      ko: `${introKo} ${myPrefix}${ko}${copula(ko)}!`,
      en: profession ? `This is ${article(en)} ${en}!` : ko === '친구' ? 'This is my friend!' : `This is my ${en}!`,
      ja: japanese('こちらは', 'です！'),
    };
  }
  if (category === 'object') {
    const mass = inSet(en.toLowerCase(), 'glue|homework|money|hair');
    const english = en.toLowerCase() === 'scissors' ? 'These are scissors!' :
      en.toLowerCase() === 'clothes' ? 'These are clothes!' :
      mass ? `This is ${en}!` : `This is ${article(en)} ${en}!`;
    return { ko: `이것은 ${ko}${copula(ko)}!`, en: english, ja: japanese('これは', 'です！') };
  }
  if (category === 'drink') {
    return { ko: `시원한 ${ko}${copula(ko)}!`, en: `It's cool ${en}!`, ja: japanese('つめたい', 'です！') };
  }
  if (category === 'food') {
    const countable = inSet(en.toLowerCase(), 'apple|banana|grape|strawberry|watermelon|tangerine|peach|egg|carrot|potato|snack|cake|vegetable');
    const english = countable
      ? `It's a delicious ${en}!`
      : en.toLowerCase() === 'fish dish'
      ? `It's a delicious fish dish!`
      : `It's delicious ${en}!`;
    return { ko: `맛있는 ${ko}${copula(ko)}!`, en: english, ja: japanese('おいしい', 'です！') };
  }
  if (category === 'animal') {
    const english = en === 'Godzilla' ? 'Look! There is Godzilla!' : `Look! There is ${article(en)} ${en}!`;
    return { ko: `저기 ${ko}${subject(ko)} 있어요!`, en: english, ja: japanese('あそこに', 'がいます！') };
  }
  if (category === 'body') {
    return { ko: `내 ${ko}${object(ko)} 봐요!`, en: `Look at my ${en}!`, ja: japanese('私の', 'を見て！') };
  }
  if (category === 'nature') {
    return { ko: `저기 ${ko}${object(ko)} 봐요!`, en: `Look at the ${en}!`, ja: japanese('あそこの', 'を見て！') };
  }
  if (category === 'color') {
    return { ko: `나는 ${ko}${object(ko)} 좋아해요!`, en: `I like ${en}!`, ja: japanese('私は', 'が好きです！') };
  }
  if (category === 'shape') {
    return { ko: `나는 ${ko}${object(ko)} 그려요!`, en: `I draw ${article(en)} ${en}!`, ja: japanese('', 'を描きます！') };
  }
  return { ko: `${ko}${copula(ko)}! 함께 알아봐요!`, en: `Look, it's ${en}!`, ja: japanese('「', '」ですね！') };
};
