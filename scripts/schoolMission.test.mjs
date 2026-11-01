import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSchoolRound, SCHOOL_WORDS, parseSchoolProgress } from '../src/data/schoolMission.ts';

test('all supported ranges produce five distinct questions within the learned range',()=>{
  for(let limit=4;limit<=27;limit++) for(let n=0;n<20;n++) {
    const round=createSchoolRound(limit,[]);
    assert.equal(round.length,5);
    assert.equal(new Set(round.map(q=>q.word.id)).size,5);
    for(const q of round) {
      assert.ok(q.word.page<=limit);
      assert.equal(q.choices.length,4);
      assert.equal(new Set(q.choices).size,4);
      assert.ok(q.choices.includes(q.answer));
      const label=w=>q.kind==='reading'?w.kana:q.kind==='meaning'?w.meaning:w.text;
      assert.ok(q.choices.every(c=>SCHOOL_WORDS.some(w=>w.page<=limit&&label(w)===c)));
    }
  }
});
test('daily mix uses three recent and two earlier words when no reviews are pending',()=>{
  const round=createSchoolRound(27,[]);
  assert.equal(round.filter(q=>q.word.page>22).length,3);
  assert.equal(round.filter(q=>q.word.page<=22).length,2);
});
test('pending mistakes get priority but locked words never enter a round',()=>{
  const wrong=SCHOOL_WORDS.slice(0,2).map(w=>w.id);
  const round=createSchoolRound(27,wrong);
  for(const id of wrong) assert.ok(round.some(q=>q.word.id===id));
  const locked=SCHOOL_WORDS.find(w=>w.page===27);
  assert.ok(!createSchoolRound(10,[locked.id]).some(q=>q.word.id===locked.id));
});
test('corrupt or out-of-range progress recovers safely',()=>{
  for(const raw of [null,'{','null']) assert.equal(parseSchoolProgress(raw).limit,27);
  assert.deepEqual(parseSchoolProgress('{"limit":900,"completed":-1,"wrongIds":["unknown"]}'),{limit:27,completed:0,wrongIds:[],rewardDate:''});
  assert.equal(parseSchoolProgress('{"limit":0}').limit,4);
});
