// Manually checked against study_source/sorted_pages, 001–027.
// Pages 001–002 are contents, not evidence that later chapters were learned.
export interface SchoolWord { id: string; page: number; text: string; kana: string; meaning: string }
const rows: [number, string, string, string][] = [
  [3,'先生','せんせい','선생님'],[3,'名前','なまえ','이름'],[3,'友だち','ともだち','친구'],
  [4,'顔','かお','얼굴'],[4,'雪','ゆき','눈 (날씨)'],[4,'楽しい','たのしい','즐겁다'],[4,'話し合う','はなしあう','서로 이야기하다'],
  [5,'食べる','たべる','먹다'],[5,'歩く','あるく','걷다'],[5,'走る','はしる','달리다'],[5,'止まる','とまる','멈추다'],
  [6,'弟','おとうと','남동생'],[6,'妹','いもうと','여동생'],[6,'今日','きょう','오늘'],
  [7,'親','おや','부모'],[8,'雪だるま','ゆきだるま','눈사람'],[8,'一生','いっしょう','일생'],[9,'大すき','だいすき','아주 좋아함'],
  [10,'一万円','いちまんえん','1만 엔'],[10,'親切','しんせつ','친절'],[10,'天才','てんさい','천재'],[10,'外国語','がいこくご','외국어'],
  [11,'台','だい','받침대'],[11,'絵','え','그림'],[11,'広い','ひろい','넓다'],[11,'地図','ちず','지도'],
  [12,'天の川','あまのがわ','은하수'],[12,'雨天','うてん','비 오는 날씨'],[13,'体','からだ','몸'],[14,'丸太','まるた','통나무'],
  [15,'大工','だいく','목수'],[15,'北','きた','북쪽'],[15,'近い','ちかい','가깝다'],[15,'引く','ひく','당기다'],
  [16,'後ろ','うしろ','뒤'],[16,'形','かたち','모양'],[16,'内','うち','안쪽'],[17,'夜','よる','밤'],[18,'五分間','ごふんかん','5분 동안'],[19,'夕方','ゆうがた','저녁 무렵'],
  [20,'海','うみ','바다'],[20,'新しい','あたらしい','새롭다'],[20,'強い','つよい','강하다'],[20,'鳴く','なく','동물이 울다'],
  [21,'雲','くも','구름'],[21,'晴れる','はれる','날이 개다'],[21,'船','ふね','배 (탈것)'],[21,'店','みせ','가게'],
  [22,'冬','ふゆ','겨울'],[22,'朝','あさ','아침'],[22,'今週','こんしゅう','이번 주'],[22,'市場','いちば','시장'],
  [23,'お茶','おちゃ','차 (음료)'],[23,'春','はる','봄'],[23,'三角形','さんかくけい','삼각형'],[23,'茶色','ちゃいろ','갈색'],
  [24,'図書館','としょかん','도서관'],[24,'長い','ながい','길다'],[25,'夏','なつ','여름'],[25,'秋','あき','가을'],
  [26,'店長','てんちょう','점장'],[26,'来週','らいしゅう','다음 주'],[27,'外国','がいこく','외국'],[27,'休日','きゅうじつ','휴일'],
];
export const SCHOOL_WORDS: SchoolWord[] = rows.map(([page,text,kana,meaning],i) => ({id:`school-${i}`,page,text,kana,meaning}));
export const MAX_SCHOOL_PAGE = 27;
export type QuestionKind = 'reading' | 'meaning' | 'listening';
export interface SchoolQuestion { word: SchoolWord; kind: QuestionKind; choices: string[]; answer: string }
export function shuffle<T>(items: T[], random = Math.random): T[] {
  const result = [...items];
  for (let i=result.length-1;i>0;i--) { const j=Math.floor(random()*(i+1)); [result[i],result[j]]=[result[j],result[i]]; }
  return result;
}
export function createSchoolRound(limit: number, wrongIds: string[], random = Math.random): SchoolQuestion[] {
  const pool = SCHOOL_WORDS.filter(w=>w.page<=Math.min(MAX_SCHOOL_PAGE,limit));
  const recent=pool.filter(w=>w.page>limit-5);
  const old=pool.filter(w=>w.page<=limit-5);
  const picked: SchoolWord[]=[];
  const add=(items: SchoolWord[],n:number)=>{ for(const w of shuffle(items,random)) { if(n<=0) break; if(!picked.some(p=>p.id===w.id)){picked.push(w);n--;} } };
  add(pool.filter(w=>wrongIds.includes(w.id)),2);
  add(recent, Math.max(0,3-picked.length));
  add(old,5-picked.length);
  add(pool,5-picked.length);
  return shuffle(picked,random).map((word,i)=>{
    const kind: QuestionKind = (['reading','meaning','listening'] as const)[i%3];
    const label=(w:SchoolWord)=>kind==='reading'?w.kana:kind==='meaning'?w.meaning:w.text;
    const answer=label(word);
    const distractors=shuffle([...new Set(pool.map(label))].filter(s=>s!==answer),random).slice(0,3);
    return {word,kind,answer,choices:shuffle([answer,...distractors],random)};
  });
}
export interface SchoolProgress { limit:number; wrongIds:string[]; completed:number; rewardDate:string }
export const emptySchoolProgress = (): SchoolProgress => ({limit:27,wrongIds:[],completed:0,rewardDate:''});
export function parseSchoolProgress(raw: string | null): SchoolProgress {
  try {
    const p=JSON.parse(raw || '{}');
    return {limit:Number.isInteger(p.limit)?Math.max(4,Math.min(27,p.limit)):27,
      wrongIds:Array.isArray(p.wrongIds)?p.wrongIds.filter((id:unknown)=>SCHOOL_WORDS.some(w=>w.id===id)):[],
      completed:Number.isInteger(p.completed)&&p.completed>=0?p.completed:0,
      rewardDate:typeof p.rewardDate==='string'?p.rewardDate:''};
  } catch { return emptySchoolProgress(); }
}
