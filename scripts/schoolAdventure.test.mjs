import {test} from 'node:test';
import assert from 'node:assert/strict';
import {adventurePool,createAdventure,readAdventureHistory} from '../src/data/schoolAdventure.ts';
import {SCHOOL_WORDS} from '../src/data/schoolMission.ts';

test('all ranges respect learned vocabulary and have five valid, distinct missions',()=>{
  assert.deepEqual(createAdventure(4),[]);
  for(let limit=5;limit<=27;limit++)for(let n=0;n<30;n++){
    const round=createAdventure(limit);
    assert.equal(round.length,5);
    assert.equal(new Set(round.map(m=>m.id)).size,5);
    for(const m of round){
      assert.ok(m.page<=limit);
      assert.ok(SCHOOL_WORDS.some(w=>w.text===m.word&&w.page===m.page));
      assert.equal(m.choices.length,3);
      assert.equal(new Set(m.choices.map(c=>c.id)).size,3);
      assert.equal(m.choices.filter(c=>c.id===m.action).length,1);
    }
  }
});
test('even an identical random seed changes the next mission set and first prompt',()=>{
  for(const limit of [5,8,15,23,27]){
    let previous=[];
    let first='';
    for(let n=0;n<50;n++){
      const round=createAdventure(limit,previous,()=>0.5);
      const ids=round.map(m=>m.id);
      assert.notDeepEqual([...ids].sort(),[...previous].sort());
      assert.notEqual(round[0].text,first);
      previous=ids;first=round[0].text;
    }
  }
});
test('selection reaches beyond the original five scenes and shuffles choices',()=>{
  const ids=new Set(),positions=new Set();
  for(let n=0;n<150;n++) for(const m of createAdventure(27)){
    ids.add(m.id);positions.add(m.choices.findIndex(c=>c.id===m.action));
  }
  assert.equal(ids.size,adventurePool(27).length);
  assert.equal(positions.size,3);
});
test('bad saved history recovers safely',()=>{
  for(const raw of ['{','null','{}'])assert.deepEqual(readAdventureHistory(raw),[]);
  assert.deepEqual(readAdventureHistory('["walk-0",7,null]'),['walk-0']);
});
