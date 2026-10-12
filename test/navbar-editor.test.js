import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../src/sidekick-display.js',import.meta.url),'utf8');
const block=source.slice(source.indexOf("    const navbar=this._section('Navbar');"),source.indexOf("    if(tab==='notifications')"));
const render=vm.runInNewContext(`(function(){${block}})`,{
  tab:'settings',document:{createElement:()=>({append(){}})},defaults:{sidebar:{}},select:(name,label,options)=>({name,label,options})
});
function editor(config) {
  const controls=[],forms=[],notes=[];
  const e={_rawConfig:structuredClone(config),_section:()=>({append(node){if(node.textContent)notes.push(node.textContent);}}),
    _selector(parent,label,value,options,onChange){controls.push({parent,label,value,options,onChange});},
    _form(parent,path,schema){forms.push({path,schema});},_list(){},_change(path,value){this._rawConfig[path]=value;}};
  render.call(e);return {e,controls,forms,notes};
}
test('Navbar presets preserve custom YAML until explicitly selected and store numeric choices',()=>{
  const original={sidebar:{enabled:true,scale:87,blur:false,color:'red',buttons:[{id:'home'}]},idle_return:{seconds:15,custom:true}};
  const {e,controls,forms,notes}=editor(original);
  assert.equal(controls.find(c=>c.label==='Size').value,'');
  assert.equal(controls.find(c=>c.label==='Auto Return Home').value,'15');
  assert.ok(!notes.includes('Current YAML: 15 seconds. Choose an option to change it.'));
  assert.deepEqual(e._rawConfig,original);
  assert.deepEqual(Array.from(forms[0].schema,s=>s.name),['side']);
  controls.find(c=>c.label==='Size').onChange('125');
  controls.find(c=>c.label==='Auto Return Home').onChange('30');
  assert.equal(e._rawConfig.sidebar.scale,125);assert.equal(e._rawConfig.sidebar.color,'red');
  assert.equal(e._rawConfig.idle_return.seconds,30);assert.equal(e._rawConfig.idle_return.custom,true);
});
test('None hides remaining Navbar controls and keeps underlying settings',()=>{
  const {e,controls,forms}=editor({sidebar:{enabled:false,scale:125,buttons:[{id:'home'}]},idle_return:{seconds:60}});
  assert.deepEqual(controls.map(c=>c.label),['Navbar Style']);assert.equal(forms.length,0);
  controls[0].onChange('white');assert.equal(e._rawConfig.sidebar.enabled,true);assert.equal(e._rawConfig.sidebar.scale,125);assert.equal(e._rawConfig.sidebar.buttons.length,1);
});
test('Navbar style and size share two columns, and dropdown defaults are first',()=>{
  const {controls}=editor({sidebar:{enabled:true}});
  const style=controls.find(c=>c.label==='Navbar Style'),size=controls.find(c=>c.label==='Size'),idle=controls.find(c=>c.label==='Auto Return Home');
  assert.equal(style.parent,size.parent);assert.equal(style.parent.className,'columns two');
  assert.equal(size.options[0][0],'100');assert.equal(size.value,'100');assert.equal(idle.options[0][0],'15');assert.equal(idle.value,'15');
});
