import test from 'node:test';
import assert from 'node:assert/strict';
import {addDay,canPlace,autoPlace,parseText} from '../logic.js';
const p={id:'a',bed:'5C-01',start:'2026-10-23',end:'2026-10-27',preference:'5>8>J'};
test('出院前一天為最後占床日，出院當日可接新病人',()=>{assert.equal(addDay(p.end,-1),'2026-10-26');assert.equal(canPlace({id:'b',start:'2026-10-27',end:'2026-10-30'},p.bed,[p]),true);assert.equal(canPlace({id:'b',start:'2026-10-26',end:'2026-10-30'},p.bed,[p]),false);});
test('完整區間重疊與自己的移動',()=>{assert.equal(canPlace({...p,id:'b',start:'2026-10-22',end:'2026-10-29'},p.bed,[p]),false);assert.equal(canPlace(p,p.bed,[p]),true);});
test('自動排床依意願，保留實體床位，不可拆開區間',()=>{const beds=[{id:'5C-01',tier:'5'},{id:'5D-01',tier:'8'}];const result=autoPlace([p,{...p,id:'b',bed:'V1'},{...p,id:'c',bed:'V2'}],beds);assert.equal(result.patients[0].bed,'5C-01');assert.equal(result.patients[1].bed,'5D-01');assert.equal(result.patients[2].bed,'V2');assert.deepEqual(result.unplaced,['c']);});
test('標籤文字整理保留完整內容，辨識多病人',()=>{const raw='姓名：陳先生\n日期：10/23\n出院日期：10/27\n病歷號：1234\n診斷：膽結石\n目的：手術\n主治醫師：王醫師\n意願：J>5>8';const result=parseText(raw+'\n\n姓名：林小姐\n日期：10/28',2026);assert.equal(result.length,2);assert.equal(result[0].start,'2026-10-23');assert.equal(result[0].end,'2026-10-27');assert.equal(result[0].raw,raw);assert.equal(result[0].doctor,'王醫師');assert.equal(result[1].end,'2026-11-01');});
test('未定義隔離規則前，特殊床不自動分配',()=>{const result=autoPlace([{...p,bed:'V1'}],[{id:'5C-12-1',tier:'5',isolation:'I'}]);assert.equal(result.patients[0].bed,'V1');});
