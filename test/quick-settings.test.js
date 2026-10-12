import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../src/sidekick-display.js',import.meta.url),'utf8');
const context=vm.createContext({structuredClone,AbortController,clearTimeout:()=>{context.timer=undefined;},setTimeout:(fn,ms)=>{context.timer={fn,ms};return 1;}});
vm.runInContext('globalThis.methods=new class {'+source.slice(source.indexOf('  _withLocalSettings('),source.indexOf('  _openQuickSettings('))+'}',context);
test('local overrides preserve shared page cards and advanced configuration',()=>{
 const raw={sidebar:{enabled:true,style:'white',buttons:[{id:'camera',card:{type:'picture-entity'}}]},background:{fit:'fit',darken:30},clock:{format:'24'}};
 const updated=context.methods._withLocalSettings.call({_baseConfig:raw},{sidebar:{style:'dark',buttons:[],enabled:false},background:{day:'custom',fit:'fill'},clock:{format:'12'},idle_return:{seconds:30}});
 assert.equal(updated.sidebar.style,'dark');assert.equal(updated.sidebar.enabled,true);assert.equal(updated.sidebar.buttons.length,1);assert.equal(updated.background.fit,'fit');assert.equal(updated.clock.format,'24');assert.equal(updated.idle_return.seconds,30);assert.equal(raw.sidebar.style,'white');
});
test('Home hold requires five seconds on Home and cancels on movement/release',()=>{
 const callbacks={},rootCallbacks={};const button={addEventListener:(name,fn)=>callbacks[name]=fn};
 const card={_page:'home',shadowRoot:{addEventListener:(name,fn)=>rootCallbacks[name]=fn},_openQuickSettings(){this.opened=true;}};
 context.editorDialog=()=>null;context.methods._installHomeHold.call(card,button);
 callbacks.pointerdown({button:0,pointerId:1,clientX:10,clientY:10});assert.equal(context.timer.ms,5000);context.timer.fn();assert.equal(card.opened,true);
 card.opened=false;callbacks.pointerdown({button:0,pointerId:1,clientX:10,clientY:10});rootCallbacks.pointermove({pointerId:1,clientX:30,clientY:10});
 assert.equal(context.timer,undefined);
 // Early release also clears a pending hold.
 callbacks.pointerdown({button:0,pointerId:1,clientX:10,clientY:10});
 let cleared=0;context.clearTimeout=()=>cleared++;rootCallbacks.pointerup({pointerId:1});assert.ok(cleared);
 card._page='camera';context.timer=undefined;callbacks.pointerdown({button:0,pointerId:1,clientX:0,clientY:0});assert.equal(context.timer,undefined);
});

const saveContext=vm.createContext({normalizeConfig:c=>c,localStorage:{setItem:(key,value)=>{saveContext.saved={key,value};}}});
vm.runInContext('globalThis.save=({'+source.slice(source.indexOf('  _saveQuickSettings('),source.indexOf('  _resetIdle()'))+'})._saveQuickSettings',saveContext);
test('each change persists immediately and storage failure keeps prior settings',()=>{
 const card={_localKey:'this-display',_localOverrides:{},_config:{original:true},_withLocalSettings:overrides=>({sidebar:overrides.sidebar})};
 assert.equal(saveContext.save.call(card,{sidebar:{style:'dark'}}),true);
 assert.equal(saveContext.saved.key,'this-display');assert.equal(JSON.parse(saveContext.saved.value).sidebar.style,'dark');assert.equal(card._config.sidebar.style,'dark');
 saveContext.localStorage.setItem=()=>{throw Error('storage blocked');};
 assert.equal(saveContext.save.call(card,{sidebar:{style:'white'}}),false);assert.equal(card._config.sidebar.style,'dark');
});
const idleContext=vm.createContext({editorDialog:()=>null,clearTimeout:()=>{},setTimeout:(fn,ms)=>{idleContext.timer={fn,ms};}});
vm.runInContext('globalThis.idle=({'+source.slice(source.indexOf('  _resetIdle() {'),source.indexOf('  _leave('))+'})._resetIdle',idleContext);
test('quick settings uses Auto Return Home timer even with Home selected',()=>{
 const card={isConnected:true,_quickPanel:{},_page:'home',_config:{idle_return:{seconds:15}},shadowRoot:{querySelector:()=>null},_navigate:page=>card.destination=page};
 idleContext.idle.call(card);assert.equal(idleContext.timer.ms,15000);idleContext.timer.fn();assert.equal(card.destination,'home');
 idleContext.timer=undefined;card._config.idle_return.seconds=0;idleContext.idle.call(card);assert.equal(idleContext.timer,undefined);
});
const releaseContext=vm.createContext({nav:{hasPointerCapture:()=>false},card:{_quickPanel:{},_heldHome:false,_navigate:page=>releaseContext.destination=page}});
vm.runInContext(source.slice(source.indexOf('  function finish(event,cancelled=false){'),source.indexOf("  nav.addEventListener('pointerup',event=>finish(event));"))+';globalThis.finish=finish;',releaseContext);
test('navbar pointer capture closes quick settings on a tap, preserving long-press release',()=>{
 releaseContext.drag={id:1,moved:false};releaseContext.finish({pointerId:1});assert.equal(releaseContext.destination,'home');
 releaseContext.destination=undefined;releaseContext.card._heldHome=true;releaseContext.drag={id:1,moved:false};releaseContext.finish({pointerId:1});assert.equal(releaseContext.destination,undefined);
});
