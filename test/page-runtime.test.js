import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {normalizeDisplay} from '../src/display-model.js';
import {normalizeAutomation} from '../src/automation-model.js';
const source=await readFile(new URL('../src/sidekick-display.js',import.meta.url),'utf8');
const context=vm.createContext({normalizeDisplay,normalizeAutomation,structuredClone,CSS:{supports:()=>true},URL,window:{location:{href:'http://ha.local/display',origin:'http://ha.local'}}});
vm.runInContext(source.slice(source.indexOf('function validateCard'),source.indexOf('function editorDialog')).replace('export function','function')+';globalThis.normalize=normalizeConfig;',context);
test('disabled slots retain raw data while runtime includes only enabled pages',()=>{
 const raw={sidebar:{enabled:true,buttons:[{id:'a',name:'On',icon:'mdi:camera',card:{type:'markdown',content:'active'}},{id:'b',name:'Off',icon:'mdi:lightbulb',enabled:false}]}};
 const config=context.normalize(raw);assert.deepEqual(Array.from(config.sidebar.buttons,b=>b.id),['a']);assert.equal(raw.sidebar.buttons.length,2);assert.equal(raw.sidebar.buttons[1].enabled,false);
});
test('all disabled slots hide runtime navbar and reject invalid enabled flag',()=>{
 const raw={sidebar:{enabled:true,buttons:[{id:'a',name:'Off',icon:'mdi:camera',enabled:false}]}};
 assert.equal(context.normalize(raw).sidebar.enabled,false);raw.sidebar.buttons[0].enabled='false';assert.throws(()=>context.normalize(raw),/enabled/);
});
