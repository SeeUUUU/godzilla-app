export interface AdventureChoice { id:string; label:string; icon:string }
export interface AdventureMission {
  id:string; page:number; word:string; title:string; text:string; hint:string;
  action:string; scene:string; goal:string; story:string; choices:AdventureChoice[];
}
const movementChoices:AdventureChoice[] = [
  {id:'walk',label:'歩く',icon:'🚶'}, {id:'run',label:'走る',icon:'🏃'}, {id:'stop',label:'止まる',icon:'✋'},
];
const moves = [
  {action:'walk',word:'歩く',texts:['あるいてね！','ゆっくり あるいてね！','あるいて ください！'],hint:'걸어서 이동해 주세요.'},
  {action:'run',word:'走る',texts:['はしってね！','はしって ください！','げんきに はしってね！'],hint:'안전한 운동장에서 달려 주세요.'},
  {action:'stop',word:'止まる',texts:['とまってね！','ここで とまってね！','とまって ください！'],hint:'그 자리에서 멈춰 주세요.'},
];
const places = [
  {title:'친구와 만나는 길',goal:'🐱',story:'오늘은 친구와 함께 움직임 놀이를 해요.'},
  {title:'운동장 놀이 시간',goal:'⚽',story:'넓고 안전한 운동장이에요. 안내대로 움직여 봐요.'},
  {title:'학교 앞 작은 공원',goal:'🌳',story:'공원에서 동작 놀이가 열렸어요. 어떤 동작을 할까요?'},
];
// Vocabulary and source-image numbers checked against the school word bank.
const items = [
  {page:4,word:'雪',kana:'ゆき',emoji:'❄️',meaning:'눈'},
  {page:4,word:'顔',kana:'かお',emoji:'🙂',meaning:'얼굴'},
  {page:8,word:'雪だるま',kana:'ゆきだるま',emoji:'⛄',meaning:'눈사람'},
  {page:11,word:'絵',kana:'え',emoji:'🖼️',meaning:'그림'},
  {page:20,word:'海',kana:'うみ',emoji:'🌊',meaning:'바다'},
  {page:21,word:'雲',kana:'くも',emoji:'☁️',meaning:'구름'},
  {page:21,word:'船',kana:'ふね',emoji:'🚢',meaning:'배'},
  {page:23,word:'お茶',kana:'おちゃ',emoji:'🍵',meaning:'차'},
  {page:23,word:'三角形',kana:'さんかくけい',emoji:'🔺',meaning:'삼각형'},
];
export function mix<T>(values:readonly T[],random:()=>number=Math.random):T[] {
  const result=[...values];
  for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
export function adventurePool(limit:number):AdventureMission[] {
  if(limit<5)return [];
  const result:AdventureMission[]=moves.flatMap(move=>places.map((place,i)=>({
    id:`${move.action}-${i}`,page:5,word:move.word,...place,
    text:move.texts[i],hint:move.hint,action:move.action,scene:'move',choices:movementChoices,
  })));
  if(limit>=15)result.push({id:'north-school',page:15,word:'北',title:'학교를 찾아요',
    text:'きたへ いってね！',hint:'북쪽, 지도의 위쪽으로 이동해 주세요.',action:'north',scene:'north',goal:'🏫',story:'지도를 보고 안내하는 방향으로 움직여요.',
    choices:[{id:'west',label:'←',icon:'왼쪽'},{id:'north',label:'↑',icon:'위쪽'},{id:'east',label:'→',icon:'오른쪽'}]});
  const eligible=items.filter(item=>item.page<=limit);
  if(eligible.length>=3) for(const item of eligible) result.push({
    id:`find-${item.word}`,page:item.page,word:item.word,title:'친구의 그림 카드 부탁',
    text:`${item.kana}の カードを えらんでね！`,hint:`${item.meaning} 그림 카드를 골라 친구에게 전해 주세요.`,
    action:item.word,scene:'delivery',goal:'🐱',story:'친구가 그림 카드를 모으고 있어요. 부탁을 듣고 알맞은 카드를 전달해요.',
    choices:eligible.map(i=>({id:i.word,label:i.emoji,icon:i.meaning})),
  });
  return result;
}
export function createAdventure(limit:number,previous:readonly string[]=[],random:()=>number=Math.random):AdventureMission[] {
  const pool=adventurePool(limit);
  if(!pool.length)return [];
  const selected:AdventureMission[]=[];
  for(const mission of mix(pool,random)) {
    if(selected.filter(m=>m.word===mission.word).length>=2)continue;
    selected.push(mission);
    if(selected.length===5)break;
  }
  // Ensure a different mission set, even if the random source repeats itself.
  if(selected.every(m=>previous.includes(m.id))){
    const fresh=pool.find(m=>!previous.includes(m.id));
    if(fresh)selected[selected.length-1]=fresh;
  }
  if(selected[0].id===previous[0]){
    const swap=selected.findIndex(m=>m.text!==selected[0].text);
    if(swap>0)[selected[0],selected[swap]]=[selected[swap],selected[0]];
  }
  return selected.map(m=>{
    const correct=m.choices.find(c=>c.id===m.action)!;
    const others=mix(m.choices.filter(c=>c.id!==m.action),random).slice(0,2);
    return {...m,choices:mix([correct,...others],random)};
  });
}
export function readAdventureHistory(raw:string|null):string[] {
  try {const p:unknown=JSON.parse(raw||'[]');return Array.isArray(p)?p.filter((id):id is string=>typeof id==='string').slice(0,5):[];}catch{return [];}
}
