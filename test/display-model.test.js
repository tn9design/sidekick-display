import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeDisplay,resolveNight,formatClock,weatherReading,backgroundCandidates} from '../src/display-model.js';

test('day/night source recovery, inversion and last-valid fallback', () => {
  const settings = {mode:'entity',entity:'input_boolean.night',invert:false};
  assert.deepEqual(resolveNight(settings,{'input_boolean.night':{state:'on'}},false),{night:true,source:'entity'});
  assert.equal(resolveNight({...settings,invert:true},{'input_boolean.night':{state:'on'}}).night,false);
  assert.deepEqual(resolveNight(settings,{'input_boolean.night':{state:'unavailable'},'sun.sun':{state:'above_horizon'}},true),{night:false,source:'sun'});
  assert.deepEqual(resolveNight(settings,{},true),{night:true,source:'retained'});
  assert.deepEqual(resolveNight(settings,{}),{night:false,source:'default'});
  assert.equal(resolveNight(settings,{'input_boolean.night':{state:'off'}},true).night,false);
  assert.equal(resolveNight({mode:'night'},{'sun.sun':{state:'above_horizon'}}).night,true);
});

test('clock timezone/date boundary and midnight use 00 rather than 24', () => {
  const config = normalizeDisplay({clock:{format:'24',timezone:'America/Chicago',date_format:'mdy'}}).clock;
  const now = new Date('2026-10-12T05:00:00Z');
  const midnight = formatClock(config,{locale:{language:'en',time_format:'12'}},now);
  assert.equal(midnight.digits,'00:00'); assert.equal(midnight.period,''); assert.equal(midnight.date,'10/12/2026');
  const previous = formatClock({...config,timezone:'America/Los_Angeles',date_format:'dmy'},null,now);
  assert.equal(previous.digits,'22:00'); assert.equal(previous.date,'11/10/2026');
  const twelve = formatClock({...config,format:'auto'},{locale:{language:'en',time_format:'12'}},now);
  assert.equal(twelve.digits,'12:00'); assert.equal(twelve.period,'AM');
});

test('clock follows timezone DST and HA language', () => {
  const c = normalizeDisplay({clock:{format:'24'}}).clock;
  const hass = {locale:{language:'fr'},config:{time_zone:'America/Chicago'}};
  assert.equal(formatClock(c,hass,new Date('2026-11-01T06:30Z')).digits,'1:30');
  assert.equal(formatClock(c,hass,new Date('2026-11-01T07:30Z')).digits,'1:30');
  assert.match(formatClock(c,hass,new Date('2026-10-11T18:00Z')).date,/dimanche/);
});

test('weather never displays invalid/stale disconnected readings; recovery restores unit', () => {
  const entity='weather.test';
  const hass={connected:true,states:{[entity]:{state:'sunny',attributes:{temperature:83.2,temperature_unit:'°F'}}}};
  assert.equal(weatherReading(entity,hass).reading.unit,'°F');
  assert.equal(weatherReading(entity,{...hass,connected:false}).reading,null);
  assert.equal(weatherReading(entity,{states:{[entity]:{state:'unavailable',attributes:{temperature:83.2,temperature_unit:'°F'}}}}).reading,null);
  assert.equal(weatherReading(entity,{states:{[entity]:{state:'sunny',attributes:{temperature:null,temperature_unit:'°F'}}}}).reading,null);
  assert.equal(weatherReading(entity,{states:{}}).reading,null);
  assert.equal(weatherReading('',hass).diagnostic,null);
  assert.equal(weatherReading(entity,hass).reading.temperature,83.2);
});

test('image candidate order falls through night, day, bundled, then runtime solid', () => {
  assert.deepEqual(backgroundCandidates({day:'/day.svg',night:'/night.svg'},true,'/bundled.svg'),['/night.svg','/day.svg','/bundled.svg']);
  assert.deepEqual(backgroundCandidates({day:'/day.svg',night:''},true,'/bundled.svg'),['/day.svg','/bundled.svg']);
  assert.deepEqual(backgroundCandidates({day:'/day.svg',night:'/night.svg'},false,'/bundled.svg'),['/day.svg','/bundled.svg']);
});

test('invalid configuration bounds and timezone are rejected', () => {
  for (const config of [{clock:{scale:151}},{clock:{timezone:'Invalid/Zone'}},{day_night:{dimming:91}},{background:{darkening:-1}},{background:{fit:'stretch'}},{clock:{show_date:'false'}},{weather:{entity:'sensor.temperature'}},{sidebar:{opacity:101}}]) assert.throws(()=>normalizeDisplay(config));
  const defaults=normalizeDisplay({}); assert.equal(defaults.day_night.dimming,50); assert.equal(defaults.background.darkening,20);
});

test('approved navigation defaults and all four style values', () => {
  const defaults=normalizeDisplay({});
  assert.equal(defaults.sidebar.style,'white');
  assert.equal(defaults.sidebar.opacity,100);
  assert.equal(defaults.appearance.mode,'auto');
  for(const style of ['white','dark','glass','refracting','standard']) assert.equal(normalizeDisplay({sidebar:{style}}).sidebar.style,style);
});

test('weather display modes default to condition and reject invalid values',()=>{
 assert.equal(normalizeDisplay({}).weather.mode,'condition');
 for(const mode of ['off','temperature','condition'])assert.equal(normalizeDisplay({weather:{entity:'weather.test',mode,advanced:'keep'}}).weather.mode,mode);
 assert.throws(()=>normalizeDisplay({weather:{mode:'invalid'}}));
});


test('clock defaults to twelve hours and normalizes legacy auto without modifying source',()=>{
  assert.equal(normalizeDisplay({}).clock.format,'12');
  const legacy={clock:{format:'auto',timezone:'America/Chicago',date_format:'mdy'}};
  const normalized=normalizeDisplay(legacy);
  assert.equal(normalized.clock.format,'12');
  assert.equal(legacy.clock.format,'auto');
  assert.equal(normalized.clock.timezone,'America/Chicago');
  assert.equal(normalized.clock.date_format,'mdy');
  assert.equal(formatClock(normalized.clock,{locale:{language:'en',time_format:'24'}},new Date('2026-10-12T05:00Z')).period,'AM');
  assert.equal(normalizeDisplay({clock:{format:'24'}}).clock.format,'24');
  assert.throws(()=>normalizeDisplay({clock:{format:'invalid'}}));
});
