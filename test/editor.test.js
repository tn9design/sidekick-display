import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../src/sidekick-display.js',import.meta.url),'utf8');
class Element { constructor(){this.shadowRoot={childElementCount:0};} attachShadow(){} dispatchEvent(event){this.lastEvent=event;} }
const reorders=[];
const context=vm.createContext({installCardReorder:(entry,index,move)=>{reorders.push(move);return {};},HTMLElement:Element,structuredClone,FormData,URL,window:{location:{href:"http://ha.local/display"}},resolveNight:()=>({night:false,source:"fixed"}),weatherReading:()=>({}),backgroundCandidates:()=>[],BACKGROUND:"test",ANIMATED_BACKGROUND:{value:"http://ha.local/backgrounds/stockpot-animated.svg",label:"Stockpot (Animated)"},BACKGROUND_IMAGES:[{value:"default",label:"Stockpot Inspo (Default)"}],document:{createElement:()=>({append(){},setAttribute(){},addEventListener(type,callback){this.callback=callback;}})},CustomEvent:class{constructor(type,options){this.type=type;Object.assign(this,options);}},normalizeConfig:c=>{if(c.card_style?.corner_radius>64)throw Error('Invalid radius');return {...c,day_night:{mode:"day"},weather:{entity:""},background:{}};}});
vm.runInContext(source.slice(source.indexOf('export class SidekickDisplayEditor'),source.indexOf("if (!customElements.get('sidekick-display-editor'))")).replace('export class','class')+';globalThis.Editor=SidekickDisplayEditor;',context);
function editor(config){const e=new context.Editor();e._render=()=>{};e.setConfig(config);e._probeKey="[]";return e;}
test('visual changes retain unknown fields and nested child YAML without mutating caller',()=>{
 const raw={advanced:{keep:true},sidebar:{custom:'keep',buttons:[{id:'test',name:'Test',card:{type:'custom:example',deep:{a:1},card_mod:{style:'x'}}}]},card_style:{custom:'keep'}};
 const e=editor(raw);e._change('card_style',{...raw.card_style,corner_radius:24});e._change('sidebar.buttons.0.name','Changed');
 assert.equal(e.lastEvent.detail.config.sidebar.buttons[0].card.deep.a,1);assert.equal(e.lastEvent.detail.config.sidebar.custom,'keep');assert.equal(e.lastEvent.detail.config.advanced.keep,true);assert.equal(raw.sidebar.buttons[0].name,'Test');
 e.lastEvent.detail.config.advanced.keep=false;assert.equal(e._rawConfig.advanced.keep,true);
});
test('last button removal keeps other sidebar fields',()=>{const e=editor({sidebar:{enabled:true,custom:42,buttons:[{id:'a'}]}});e._change('sidebar.buttons',[],true);assert.deepEqual(e.lastEvent.detail.config.sidebar.buttons,[]);assert.equal(e._rawConfig.sidebar.custom,42);});
test('invalid draft is retained, reported and can recover',()=>{const e=editor({card_style:{corner_radius:12}});e._change('card_style.corner_radius',65);assert.equal(e._error,'Invalid radius');assert.equal(e.lastEvent.detail.config.card_style.corner_radius,65);e._change('card_style.corner_radius',24);assert.equal(e._error,'');});

test('section forms cannot overwrite newer child edits with stale arrays',()=>{
 const e=editor({sidebar:{enabled:true,buttons:[{card:{type:'markdown',content:'original'}}],advanced:42}});
 let form;e._form({append(value){form=value;}},'sidebar',[{name:'enabled'}]);
 e._change('sidebar.buttons.0.card.content','new child draft');
 form.callback({stopPropagation(){},detail:{value:{enabled:false,buttons:[{card:{content:'stale'}}]}}});
 assert.equal(e._rawConfig.sidebar.buttons[0].card.content,'new child draft');assert.equal(e._rawConfig.sidebar.advanced,42);assert.equal(e._rawConfig.sidebar.enabled,false);
});
test('ordinary desktop/phone and mismatched display URLs do not subscribe to automation requests',()=>{
 const method=source.slice(source.indexOf('  _syncReception() {'),source.indexOf('  _appearanceHass() {'));
 const reception=vm.createContext({URL,window:{location:{href:'http://ha.local/display?edit=1'}}});
 vm.runInContext('globalThis.sync=({'+method+'})._syncReception',reception);
 let calls=0;const card={isConnected:true,_config:{automation:{display_id:'office',helper:'input_text.office'}},_hass:{connected:true,connection:{connected:true,subscribeMessage(){calls++;}}}};
 for(const href of ['http://ha.local/display?edit=1','http://ha.local/display','http://ha.local/display?clock_display=other']){reception.window.location.href=href;reception.sync.call(card);}
 assert.equal(calls,0);
});

test('upload success stores an HA image reference and preserves background settings',async()=>{
 const e=editor({background:{fit:'fit',advanced:'keep'}});e.isConnected=true;
 e._pendingUpload=new File(['png'],'example.png',{type:'image/png'});let request;
 e._hass={fetchWithAuth:async(url,options)=>{request={url,options};return {ok:true,json:async()=>({id:'a'.repeat(32),name:'example.png',content_type:'image/png'})};}};
 await e._uploadImage();assert.equal(request.url,'/api/image/upload');assert.equal(request.options.method,'POST');assert.equal(e._rawConfig.background.day,'/api/image/serve/'+ 'a'.repeat(32)+'/original');assert.equal(e._rawConfig.background.day,e._rawConfig.background.night);assert.equal(e._rawConfig.background.advanced,'keep');assert.equal(e._pendingUpload,undefined);
});
test('failed and incompatible uploads retain configuration and pending selection',async()=>{
 const e=editor({background:{day:'original'}});e.isConnected=true;e._pendingUpload=new File(['x'],'bad.webp',{type:'image/webp'});let calls=0;e._hass={fetchWithAuth:async()=>{calls++;return {ok:false,status:500};}};
 await e._uploadImage();assert.equal(calls,0);assert.equal(e._rawConfig.background.day,'original');assert.match(e._uploadError,/JPEG/);
 e._pendingUpload=new File(['x'],'valid.png',{type:'image/png'});await e._uploadImage();assert.equal(calls,1);assert.equal(e._rawConfig.background.day,'original');assert.ok(e._pendingUpload);assert.equal(e._uploading,false);assert.match(e._uploadError,/failed/);
});
test('Show Date dropdown translates strings into booleans without touching hidden clock settings',()=>{
 const e=editor({clock:{timezone:'America/Chicago',date_format:'short',show_date:true}});let form;e._form({append(value){form=value;}},'clock',[{name:'show_date'}]);
 assert.equal(form.data.show_date,'true');form.callback({stopPropagation(){},detail:{value:{show_date:'false'}}});assert.equal(e._rawConfig.clock.show_date,false);assert.equal(e._rawConfig.clock.timezone,'America/Chicago');assert.equal(e._rawConfig.clock.date_format,'short');
});

test('custom background dropdown appears only when images exist; preset hides upload controls',()=>{
 const e=editor({});let selectors=[],buttons=[];e._selector=(parent,label,value,options)=>selectors.push({label,value,options});e._button=(parent,label)=>buttons.push(label);
 e._backgroundChoice='custom';e._images=[];e._backgroundControls({append(){}});assert.deepEqual(selectors.map(s=>s.label),['Background Image']);assert.deepEqual(buttons,['Upload']);
 selectors=[];buttons=[];e._images=[{id:'a'.repeat(32),name:'first.png'}];e._backgroundControls({append(){}});assert.deepEqual(selectors.map(s=>s.label),['Background Image','Uploaded Image']);assert.deepEqual(buttons,['Upload']);
 selectors=[];buttons=[];e._backgroundChoice='default';e._backgroundControls({append(){}});assert.deepEqual(selectors.map(s=>s.label),['Background Image']);assert.deepEqual(buttons,[]);
});

test('absolute uploaded-image URL displays the matching library option without rewriting config',()=>{
 const id='b'.repeat(32),current=`http://ha.local/api/image/serve/${id}/original`;const e=editor({background:{day:current}});let selector;
 e._selector=(parent,label,value)=>{if(label==='Uploaded Image')selector=value;};e._button=()=>{};e._backgroundChoice='custom';e._images=[{id,name:'absolute.png'}];e._backgroundControls({append(){}});assert.equal(selector,`/api/image/serve/${id}/original`);assert.equal(e._rawConfig.background.day,current);
});

test('connecting an editor closes previously open main and nested sections',()=>{
 const e=editor({});const sections=[{open:true},{open:true}];e.shadowRoot={querySelectorAll(){return sections;}};e._loadImages=()=>{};e.connectedCallback();assert.ok(sections.every(section=>section.open===false));
});

test('disabled page retains content and leaves icon and enable controls visible',()=>{
 const raw={sidebar:{buttons:[{id:'a',name:'Camera',icon:'mdi:camera',enabled:false,card:{type:'custom:camera',deep:{keep:1}}}]}};
 const e=editor(raw),controls=[],forms=[],buttons=[];e.shadowRoot={append(){}};e._selector=(p,label,value,options,onChange)=>controls.push({label,onChange});e._form=(p,path,schema)=>{forms.push(Array.from(schema,f=>f.name));return {addEventListener(){}};};e._button=(p,label)=>buttons.push(label);e._previewPage=page=>e.preview=page;
 e._pageEditor(0);assert.deepEqual(forms,[['icon']]);assert.deepEqual(buttons,[]);assert.equal(e.preview,'home');controls[0].onChange('on');assert.equal(e._rawConfig.sidebar.buttons[0].enabled,true);assert.deepEqual(e._rawConfig.sidebar.buttons[0].card,raw.sidebar.buttons[0].card);
});

test('page card ordering preserves vertical stack metadata and nested child options',()=>{
 const first={type:'markdown',content:'First',card_mod:{style:'keep'}},second={type:'grid',cards:[{type:'button',entity:'light.test'}]};
 const e=editor({sidebar:{buttons:[{id:'a',name:'Page',icon:'mdi:view-grid',card:{type:'vertical-stack',title:'Retain',custom:42,cards:[first,second]}}]}}),buttons=[];
 e.shadowRoot={append(){}};e._selector=()=>{};e._form=()=>({addEventListener(){}});e._card=()=>{};e._previewPage=()=>{};e._button=(p,label,action,disabled)=>buttons.push({label,action,disabled});
 reorders.length=0;e._pageEditor(0);reorders[0](0,1);assert.equal(e._rawConfig.sidebar.buttons[0].card.custom,42);assert.equal(e._rawConfig.sidebar.buttons[0].card.title,'Retain');assert.deepEqual(e._rawConfig.sidebar.buttons[0].card.cards,[second,first]);
});

test('reordering after native child edits retains the newest child configuration',()=>{
 const e=editor({sidebar:{buttons:[{id:'a',name:'Page',icon:'mdi:view-grid',card:{type:'vertical-stack',cards:[{type:'markdown',content:'old'},{type:'markdown',content:'second'}]}}]}}),buttons=[];
 e.shadowRoot={append(){}};e._selector=()=>{};e._form=()=>({addEventListener(){}});e._card=()=>{};e._previewPage=()=>{};e._button=(p,label,action,disabled)=>buttons.push({label,action,disabled});reorders.length=0;e._pageEditor(0);
 e._change('sidebar.buttons.0.card.cards.0.content','new');reorders[0](0,1);assert.equal(e._rawConfig.sidebar.buttons[0].card.cards[1].content,'new');
});

test('animated Stockpot is last and preserves background settings through selection and reopening',()=>{
 const e=editor({background:{fit:'fit',darkening:17,position_x:30,advanced:'keep'}});let select;
 e._selector=(parent,label,value,options,onChange)=>{select={value,options,onChange};};
 e._backgroundControls({append(){}});
 assert.equal(select.options.at(-1).label,'Stockpot (Animated)');
 const value=select.options.at(-1).value;select.onChange(value);
 assert.equal(e._rawConfig.background.day,value);assert.equal(e._rawConfig.background.night,value);
 assert.equal(e._rawConfig.background.fit,'fit');assert.equal(e._rawConfig.background.darkening,17);assert.equal(e._rawConfig.background.advanced,'keep');
 e._backgroundChoice=undefined;e._backgroundControls({append(){}});assert.equal(select.value,value);
});
