import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeAutomation,RequestGate} from '../src/automation-model.js';
const page = {id:'doorbell',name:'Doorbell',card:{type:'markdown'},seconds:5};
const payload = (token,id='doorbell') => JSON.stringify({page:id,request:token});
test('automation configuration bounds, stable IDs and default duration', () => {
  assert.equal(normalizeAutomation().ignore_repeated_alerts,true);
  assert.equal(normalizeAutomation({ignore_repeated_alerts:false}).ignore_repeated_alerts,false);
  assert.throws(()=>normalizeAutomation({ignore_repeated_alerts:30}));
  assert.equal(normalizeAutomation({pages:[{...page,seconds:undefined}]}).pages[0].seconds,30);
  for (const config of [null,[],{pages:[{...page,id:undefined}]},{display_id:'office'},{helper:'input_text.office'},{display_id:12,helper:'input_text.office'},{display_id:'office',helper:'sensor.office'},{pages:[page,page]},{pages:[{...page,seconds:4}]},{pages:[{...page,seconds:601}]},{pages:[{...page,id:'A'}]}]) assert.throws(()=>normalizeAutomation(config));
});
test('load and reconnect snapshots and requests during baseline are never delivered', () => {
  const gate = new RequestGate();
  assert.equal(gate.receive(payload('during-load'),[page]),null);
  gate.baseline(payload('snapshot'));
  for (const token of ['during-load','snapshot']) assert.equal(gate.receive(payload(token),[page]),null);
  assert.equal(gate.receive(payload('fresh'),[page]),page);
  gate.reset();
  assert.equal(gate.receive(payload('during-reconnect'),[page]),null);
  gate.baseline(payload('missed-offline'));
  for (const token of ['fresh','during-reconnect','missed-offline']) assert.equal(gate.receive(payload(token),[page]),null);
  assert.equal(gate.receive(payload('after-reconnect'),[page]),page);
});
test('fresh repeat requests deliver; duplicates, malformed and unknown pages do not interrupt', () => {
  const gate = new RequestGate(); gate.baseline('unknown');
  assert.equal(gate.receive(payload('one'),[page]),page);
  assert.equal(gate.receive(payload('two'),[page]),page);
  assert.equal(gate.receive(payload('one'),[page]),null);
  for(const value of ['{','null','[]','{}',JSON.stringify({page:'doorbell',request:1}),JSON.stringify({page:'doorbell',request:''}),JSON.stringify({page:'doorbell',request:'override',seconds:1}),JSON.stringify({page:[],request:'bad'}),JSON.stringify({page:'doorbell',request:'x'.repeat(129)})]) assert.equal(gate.receive(value,[page]),null);
  assert.match(gate.diagnostic,/Malformed/);
  assert.equal(gate.receive(payload('unknown','missing'),[page]),null);
  assert.match(gate.diagnostic,/Unknown/);
  assert.equal(gate.receive(payload('three'),[page]),page);
  assert.equal(gate.diagnostic,undefined);
});
