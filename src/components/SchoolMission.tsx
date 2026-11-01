import { useEffect, useRef, useState } from 'react';
import { createSchoolRound, emptySchoolProgress, parseSchoolProgress, SCHOOL_WORDS } from '../data/schoolMission';
import type { SchoolProgress, SchoolQuestion } from '../data/schoolMission';
import { SchoolAdventure } from './SchoolAdventure';

interface Props { userId:string; level:number; onClose:()=>void; onReward:(exp:number)=>void }
export function SchoolMission({userId,level,onClose,onReward}:Props) {
  const storageKey=`godzilla_school_v1_${userId}`;
  const [progress,setProgress]=useState(()=>{try{return parseSchoolProgress(localStorage.getItem(storageKey));}catch{return emptySchoolProgress();}});
  const [round,setRound]=useState<SchoolQuestion[]>([]);
  const [index,setIndex]=useState(0);
  const [selected,setSelected]=useState<string|null>(null);
  const [hint,setHint]=useState(false);
  const [score,setScore]=useState(0);
  const [finished,setFinished]=useState(false);
  const [notice,setNotice]=useState('');
  const [reward,setReward]=useState(false);
  const [adventure,setAdventure]=useState(false);
  const dialog=useRef<HTMLDivElement>(null);
  const answerLock=useRef(false);
  const completionLock=useRef(false);
  const question=round[index];
  const speechAvailable=typeof window!=='undefined' && 'speechSynthesis' in window;
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;
    const root=dialog.current;
    root?.focus();
    const keydown=(e:KeyboardEvent)=>{
      if(e.key==='Escape') onClose();
      if(e.key==='Tab') {
        const buttons=Array.from(root?.querySelectorAll<HTMLElement>('button:not(:disabled), select, [tabindex="0"]')||[]);
        const first=buttons[0],last=buttons[buttons.length-1];
        if(e.shiftKey&&(document.activeElement===first||document.activeElement===root)){e.preventDefault();last?.focus();}
        else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===root)){e.preventDefault();first?.focus();}
      }
    };
    root?.addEventListener('keydown',keydown);
    return ()=>{root?.removeEventListener('keydown',keydown);window.speechSynthesis?.cancel();previous?.focus();};
  },[onClose]);
  function save(next:SchoolProgress) {
    setProgress(next);
    try {localStorage.setItem(storageKey,JSON.stringify(next));return true;}
    catch {setNotice('기록을 저장하지 못했어요. 이 브라우저의 저장 설정을 확인해 주세요.');return false;}
  }
  function start() {
    setRound(createSchoolRound(progress.limit,progress.wrongIds));setIndex(0);setSelected(null);setHint(false);setScore(0);setFinished(false);setReward(false);
    answerLock.current=false;completionLock.current=false;
  }
  function speak() {
    if(!speechAvailable)return;
    window.speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(question.word.kana);
    utterance.lang='ja-JP';utterance.rate=0.8;
    utterance.onerror=()=>setNotice('소리를 재생하지 못했어요. 글자로 풀기를 눌러 주세요.');
    window.speechSynthesis.speak(utterance);
  }
  function answer(value:string) {
    if(answerLock.current)return;
    answerLock.current=true;setSelected(value);
    const mastered=value===question.answer&&!hint;
    if(mastered)setScore(s=>s+1);
    const wrong=new Set(progress.wrongIds);
    if(mastered)wrong.delete(question.word.id);else wrong.add(question.word.id);
    save({...progress,wrongIds:[...wrong]});
  }
  function next() {
    window.speechSynthesis?.cancel();
    if(index<round.length-1){setIndex(i=>i+1);setSelected(null);setHint(false);answerLock.current=false;return;}
    if(completionLock.current)return;
    completionLock.current=true;
    complete();
    setFinished(true);
  }
  function complete(reviewWords: string[] = []) {
    const date=new Date().toLocaleDateString('sv-SE');
    let storedDate=progress.rewardDate;
    try { storedDate=parseSchoolProgress(localStorage.getItem(storageKey)).rewardDate; } catch {}
    const earned=storedDate!==date;
    const wrongIds=[...new Set([...progress.wrongIds,...SCHOOL_WORDS.filter(w=>reviewWords.includes(w.text)).map(w=>w.id)])];
    const saved=save({...progress,wrongIds,completed:progress.completed+1,rewardDate:date});
    if(earned&&saved){onReward(20);setReward(true);}
    return earned&&saved;
  }
  const button='rounded-2xl border border-slate-600 bg-slate-800 px-4 py-3 font-bold hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-60';
  const wrongCount=progress.wrongIds.filter(id=>SCHOOL_WORDS.some(w=>w.id===id&&w.page<=progress.limit)).length;
  return <div className="school-overlay fixed inset-0 z-[10000] bg-slate-950/95 overflow-y-auto p-3 sm:p-6">
    <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="school-title" className="school-panel mx-auto max-w-2xl rounded-3xl border border-emerald-700 bg-slate-900 p-5 sm:p-8 text-white shadow-2xl">
      <div className="flex items-center justify-between gap-3"><h2 id="school-title" className="text-xl font-black">🦖 고질라 학교 탐험</h2><button className={button} onClick={onClose} aria-label="학교 탐험 닫기">닫기</button></div>
      <p className="mt-2 text-sm text-slate-300">배운 일본어로 마을을 자라게 해요. 시간제한은 없어요!</p>
      {notice&&<p role="status" className="my-3 text-amber-300">{notice}</p>}
      {adventure ? <SchoolAdventure limit={progress.limit} userId={userId} level={level} onBack={()=>setAdventure(false)} onComplete={complete}/> : !round.length ? <>
        <div className="my-6 rounded-2xl bg-emerald-950 p-5 text-center"><div className="text-5xl" aria-hidden="true">🏡 🌸 🦖 🌳</div><p className="mt-3 font-bold">오늘도 다섯 번의 작은 탐험!</p><p className="mt-2 text-sm">완료 {progress.completed}회 · 다시 볼 단어 {wrongCount}개</p></div>
        <label className="block font-bold" htmlFor="school-limit">부모 설정 · 학습 완료 이미지</label>
        <select id="school-limit" className="my-3 w-full rounded-xl bg-slate-800 p-3" value={progress.limit} onChange={e=>save({...progress,limit:Number(e.target.value)})}>
          {Array.from({length:24},(_,i)=>i+4).map(p=><option key={p} value={p}>page_{String(p).padStart(3,'0')}.jpg까지</option>)}
        </select>
        <p className="text-sm text-slate-400">이미지 순번 기준이에요. 27번은 교재 30쪽이며, 이후 자료는 출제하지 않아요. 목차는 제외했어요.</p>
        <p className="my-4 text-sm text-emerald-200">최근 5장 중심 · 헷갈린 단어 우선 · 하루 첫 완료 +20 EXP</p>
        <button className={`${button} w-full !bg-emerald-700 text-lg`} disabled={progress.limit<5} onClick={()=>setAdventure(true)}>🎒 고질라 학교 가는 길 · 모험 시작</button>
        <p className="my-3 text-sm text-emerald-200">일본어 안내에 따라 걷고, 달리고, 친구를 도와요. 완료하면 마을 장식을 골라요! (자료 5번부터)</p>
        <button className={`${button} w-full`} onClick={start}>📚 5문제 짧은 복습</button>
        <p className="mt-4 text-xs text-slate-400">학교 복습 기록과 범위는 이 기기의 로그인 계정별로 저장돼요.</p>
      </> : finished ? <div className="py-8 text-center">
        <div className="text-6xl" aria-hidden="true">🏡 🌸 🌳 🦖 🎉</div><h3 className="mt-6 text-2xl font-black">오늘의 마을 탐험 완료!</h3>
        <p className="mt-4">혼자 맞힌 문제 {score} / {round.length}</p><p className="mt-2 text-emerald-300">{reward?'고질라에게 +20 EXP를 선물했어요!':'오늘의 완료 보상은 이미 받았거나 저장하지 못했어요.'}</p>
        <p className="mt-3 text-slate-300">힌트를 썼거나 헷갈린 단어는 다음 탐험에서 다시 만나요.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3"><button className={button} onClick={onClose}>오늘은 여기까지</button><button className={button} onClick={start}>한 번 더 탐험</button></div>
      </div> : question && <div className="school-quiz mt-6">
        <div className="flex justify-between text-sm text-emerald-300"><span>미션 {index+1} / {round.length}</span><span>자료 {String(question.word.page).padStart(3,'0')}번</span></div>
        <div className="my-3 flex gap-2" aria-label={`${index}문제 완료`}>{round.map((_,i)=><div key={i} className={`h-2 flex-1 rounded-full ${i<index?'bg-emerald-400':'bg-slate-700'}`}/>)}</div>
        <div className="rounded-xl bg-emerald-950 p-3 text-center text-3xl" aria-label="문제를 풀 때마다 자라는 마을">🦖 {['🌱','🌸','🌳','🏡','🌈'].slice(0,index+(selected!==null?1:0)).join(' ')}</div>
        <div className="my-5 rounded-2xl bg-slate-800 p-6 text-center">
          <p className="mb-4 text-slate-300">{question.kind==='reading'?'어떻게 읽을까요?':question.kind==='meaning'?'무슨 뜻일까요?':'듣고 알맞은 말을 찾아 주세요.'}</p>
          {question.kind==='listening' ? <><button disabled={!speechAvailable} className={button} onClick={speak}>🔊 일본어 듣기</button><button className="block mx-auto mt-3 underline text-sm" onClick={()=>setHint(true)}>소리 대신 글자로 풀기</button></> : <p lang="ja" className="text-4xl sm:text-5xl font-bold leading-relaxed">{question.word.text}</p>}
          {question.kind!=='listening'&&<button className="mt-4 underline text-sm text-amber-300" onClick={()=>setHint(true)}>힌트 보기</button>}
          {hint&&<p className="mt-4 text-amber-200"><span lang="ja">{question.word.kana}</span> · {question.word.meaning}</p>}
        </div>
        <div className="school-choices grid grid-cols-2 gap-2">{question.choices.map(choice=><button key={choice} disabled={selected!==null} onClick={()=>answer(choice)} className={`${button} text-xl ${selected!==null&&choice===question.answer?'!bg-emerald-800 !border-emerald-300':''} ${selected===choice&&choice!==question.answer?'!border-amber-400':''}`} lang={question.kind==='meaning'?'ko':'ja'}>{choice}</button>)}</div>
        {selected!==null&&<div role="status" className="mt-5 rounded-xl bg-slate-800 p-4"><p className="font-bold">{selected===question.answer?'🌱 잘했어요! 마을에 새싹이 났어요.':'🌱 괜찮아요. 함께 익혀 봐요!'}</p><p className="mt-2"><span lang="ja">{question.word.text} → {question.word.kana}</span> · {question.word.meaning}</p><button className={`${button} mt-4 w-full !bg-emerald-700`} onClick={next}>{index===round.length-1?'탐험 마치기':'다음 미션 →'}</button></div>}
      </div>}
    </div>
  </div>;
}
