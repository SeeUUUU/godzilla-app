import { useEffect, useRef, useState } from 'react';
import { GodzillaCharacter } from './GodzillaCharacter';
import './SchoolAdventure.css';
import { createAdventure, readAdventureHistory } from '../data/schoolAdventure';

const decorations = [{id:'sakura',label:'벚꽃나무',icon:'🌸'},{id:'house',label:'작은 집',icon:'🏡'},{id:'tree',label:'초록 나무',icon:'🌳'}];
interface Props { limit:number; userId:string; level:number; onBack:()=>void; onComplete:(reviewWords:string[])=>boolean }

export function SchoolAdventure({limit,userId,level,onBack,onComplete}:Props) {
  const historyKey=`godzilla_school_adventure_history_v1_${userId}`;
  const [stages]=useState(()=>{
    let previous:string[]=[];
    try {previous=readAdventureHistory(localStorage.getItem(historyKey));}catch{}
    return createAdventure(limit,previous);
  });
  useEffect(()=>{
    try {localStorage.setItem(historyKey,JSON.stringify(stages.map(m=>m.id)));}catch{}
  },[historyKey,stages]);
  const [index,setIndex]=useState(0);
  const [solved,setSolved]=useState(false);
  const [hint,setHint]=useState(false);
  const [motion,setMotion]=useState('');
  const [message,setMessage]=useState('');
  const [finished,setFinished]=useState(false);
  const [earned,setEarned]=useState(false);
  const [gift,setGift]=useState<string|null>(null);
  const [storageError,setStorageError]=useState(false);
  const storageKey=`godzilla_school_village_v1_${userId}`;
  const [garden,setGarden]=useState<string[]>(()=>{
    try {const p:unknown=JSON.parse(localStorage.getItem(storageKey)||'[]');return Array.isArray(p)?p.filter((id):id is string=>typeof id==='string'&&decorations.some(d=>d.id===id)).slice(0,6):[];}catch{return [];}
  });
  const review=useRef(new Set<string>());
  const locked=useRef(false);
  const done=useRef(false);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const mission=stages[index];
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);window.speechSynthesis?.cancel();},[]);
  function listen() {
    if(!('speechSynthesis' in window)){setHint(true);setMessage('소리를 사용할 수 없어 글자 힌트를 열었어요.');return;}
    window.speechSynthesis.cancel();
    const speech=new SpeechSynthesisUtterance(mission.text);
    speech.lang='ja-JP';speech.rate=0.8;
    speech.onerror=()=>{setHint(true);setMessage('소리를 재생하지 못했어요. 글자를 보고 해도 좋아요.');};
    window.speechSynthesis.speak(speech);
  }
  function act(action:string) {
    if(locked.current)return;
    if(timer.current)clearTimeout(timer.current);
    if(action===mission.action){locked.current=true;setSolved(true);setMotion(mission.scene==='delivery'?'tea':action);setMessage('성공! 고질라가 부탁을 해냈어요.');}
    else {review.current.add(mission.word);setMotion('oops');setMessage('앗, 고질라가 고개를 갸웃해요. 다시 듣거나 힌트를 보고 해볼까요?');timer.current=setTimeout(()=>setMotion(''),500);}
  }
  function next() {
    if(!solved||done.current)return;
    window.speechSynthesis?.cancel();
    if(index===stages.length-1){done.current=true;setEarned(onComplete([...review.current]));setFinished(true);return;}
    setIndex(i=>i+1);setSolved(false);setHint(false);setMotion('');setMessage('');locked.current=false;
  }
  function chooseGift(id:string) {
    if(gift)return;
    const updated=[...garden,id].slice(-6);
    try{localStorage.setItem(storageKey,JSON.stringify(updated));setGarden(updated);setGift(id);setStorageError(false);}catch{setStorageError(true);}
  }
  const choices=mission?.choices||[];
  return <section className="school-adventure" aria-label="고질라 학교 가는 길">
    <div className="adventure-top"><span>학교 가는 길 · {finished?'도착!':`${index+1} / ${stages.length}`}</span><button onClick={onBack}>← 학교 탐험으로</button></div>
    <div className="adventure-garden" aria-label="내가 꾸민 마을">🏡 {garden.map((id,i)=><span key={i}>{decorations.find(d=>d.id===id)?.icon}</span>)}<small>나의 마을</small></div>
    {finished ? <div className="adventure-finish">
      <div className="adventure-finish-character"><GodzillaCharacter level={level} isShooting={false}/></div><h3>학교에 도착했어요!</h3><p>LV.{level} 고질라와 일본어로 {stages.length}개의 부탁을 해결했어요.</p>
      <p>{earned?'+20 EXP! 오늘의 학교 보상을 받았어요.':'학교 탐험 완료! 경험치 보상은 하루 한 번이에요.'}</p>
      <h4 className="mt-5 font-bold">{gift?'마을에 새 장식이 생겼어요!':'마을에 놓을 선물을 하나 골라요.'}</h4>
      <div className="adventure-controls">{decorations.map(d=><button key={d.id} disabled={gift!==null} onClick={()=>chooseGift(d.id)} aria-pressed={gift===d.id}><span>{d.icon}</span>{d.label}</button>)}</div>
      {storageError&&<p role="alert">장식을 저장하지 못했어요. 저장 공간을 확인하고 다시 골라 주세요.</p>}
      <p className="text-sm mt-3">최근에 고른 장식 6개가 이 기기의 내 마을에 남아요.</p>
      <button className="adventure-next" onClick={onBack}>오늘은 여기까지</button>
    </div> : mission ? <>
      <h3>{mission.title}</h3><p className="adventure-story">{mission.story}</p>
      <div className={`adventure-scene scene-${mission.scene}`} role="img" aria-label={`${mission.title}. ${solved?'미션 성공':'고질라가 지시를 기다립니다'}`}>
        <div className="adventure-cloud">☁️</div><div className="adventure-sun">☀️</div>
        <div className="adventure-hill"/><div className="adventure-road"/>
        {mission.scene==='north'&&<div className="adventure-north">北 ↑</div>}
        {mission.scene==='stop'&&<div className="adventure-crossing"/>}
        <div className="adventure-goal">{mission.goal}</div>
        <div className={`adventure-actor motion-${motion}`}><div className="adventure-dino"><GodzillaCharacter level={level} isShooting={false}/></div>{motion==='tea'&&<span className="adventure-delivery">🍵</span>}{motion==='stop'&&<span className="adventure-stop">✋</span>}</div>
        {solved&&<div className="adventure-stars">✨ ⭐ ✨</div>}
      </div>
      <div className="adventure-instruction"><p lang="ja">{mission.text}</p><button onClick={listen}>🔊 안내 듣기</button><button onClick={()=>{setHint(true);review.current.add(mission.word);}}>도움말</button>{hint&&<p className="adventure-hint">{mission.hint}</p>}</div>
      <div className="adventure-controls">{choices.map(c=><button key={c.id} onClick={()=>act(c.id)} disabled={solved}><span lang="ja">{c.label}</span><small>{c.icon}</small></button>)}</div>
      <p className="adventure-feedback" role="status">{message||'안내를 듣고 고질라에게 행동을 알려 주세요.'}</p>
      {solved&&<button className="adventure-next" onClick={next}>{index===stages.length-1?'학교 도착 · 선물 고르기 🎁':'다음 장소로 →'}</button>}
      <p className="text-xs text-slate-400 mt-3">자료 {mission.page}번의 「{mission.word}」로 만든 모험 · 시간제한 없음</p>
    </> : <p>걷기·달리기를 배운 자료 5번부터 모험을 시작할 수 있어요.</p>}
  </section>;
}
