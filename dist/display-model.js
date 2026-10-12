export const FONTS = {
  system: 'system-ui,sans-serif',
  rounded: 'ui-rounded,"Arial Rounded MT Bold",system-ui,sans-serif',
  monospace: 'ui-monospace,"Roboto Mono",monospace',
};

function choice(value, fallback, choices, name) {
  const result = value ?? fallback;
  if (!choices.includes(result)) throw new Error(`${name} must be ${choices.join(', ')}.`);
  return result;
}
function number(value, fallback, min, max, name) {
  const result = value ?? fallback;
  if (typeof result !== 'number' || !Number.isFinite(result) || result < min || result > max) throw new Error(`${name} must be between ${min} and ${max}.`);
  return result;
}
function bool(value, fallback, name) {
  if (value !== undefined && typeof value !== 'boolean') throw new Error(`${name} must be true or false.`);
  return value ?? fallback;
}
function text(value, fallback, name) {
  if (value !== undefined && typeof value !== 'string') throw new Error(`${name} must be text.`);
  return value ?? fallback;
}
export function normalizeDisplay(config) {
  const c = config.clock ?? {}, b = config.background ?? {}, n = config.day_night ?? {}, a = config.appearance ?? {}, w = config.weather ?? {}, s = config.sidebar ?? {};
  const timezone = text(c.timezone, '', 'clock.timezone');
  if (timezone) { try { new Intl.DateTimeFormat('en', {timeZone:timezone}); } catch { throw new Error('clock.timezone must be a valid IANA timezone.'); } }
  const entity = text(w.entity, '', 'weather.entity');
  if (entity && !/^weather\.[a-z0-9_]+$/.test(entity)) throw new Error('weather.entity must be a weather entity ID.');
  return {
    clock: {format:choice(c.format === 'auto' ? '12' : c.format,'12',['12','24'],'clock.format'), timezone, show_date:bool(c.show_date,true,'clock.show_date'), date_format:choice(c.date_format,'long',['long','short','mdy','dmy'],'clock.date_format'), font:choice(c.font,'system',Object.keys(FONTS),'clock.font'), color:text(c.color,'#ffffff','clock.color'), scale:number(c.scale,100,75,150,'clock.scale')},
    background: {day:text(b.day,'','background.day'), night:text(b.night,'','background.night'), fit:choice(b.fit,'fill',['fill','fit'],'background.fit'), color:text(b.color,'#173f48','background.color'), position_x:number(b.position_x,50,0,100,'background.position_x'), position_y:number(b.position_y,50,0,100,'background.position_y'), darkening:number(b.darkening,20,0,100,'background.darkening')},
    day_night: {mode:choice(n.mode,'auto',['auto','entity','day','night'],'day_night.mode'), entity:text(n.entity,'','day_night.entity'), invert:bool(n.invert,false,'day_night.invert'), dimming:number(n.dimming,50,0,90,'day_night.dimming')},
    appearance: {mode:choice(a.mode,'auto',['auto','dark','light'],'appearance.mode')},
    weather: {...w,entity,mode:choice(w.mode,'condition',['off','temperature','condition'],'weather.mode')},
    sidebar: {...s, scale:number(s.scale,100,75,125,'sidebar.scale'), style:choice(s.style,'white',['white','dark','glass','refracting','standard'],'sidebar.style'), blur:bool(s.blur,true,'sidebar.blur'), color:text(s.color,'auto','sidebar.color'), opacity:number(s.opacity,['glass','refracting'].includes(s.style) ? 80 : 100,0,100,'sidebar.opacity'), icon_color:text(s.icon_color,'auto','sidebar.icon_color'), accent:text(s.accent,'auto','sidebar.accent')},
  };
}

export function resolveNight(settings, states, lastNight) {
  if (settings.mode === 'day') return {night:false,source:'fixed'};
  if (settings.mode === 'night') return {night:true,source:'fixed'};
  const state = states?.[settings.entity]?.state;
  if (settings.mode === 'entity' && ['on','off'].includes(state)) return {night:(state === 'on') !== settings.invert,source:'entity'};
  const sun = states?.['sun.sun']?.state;
  if (sun === 'above_horizon' || sun === 'below_horizon') return {night:sun === 'below_horizon',source:'sun'};
  return {night:lastNight ?? false,source:lastNight === undefined ? 'default' : 'retained'};
}

export function formatClock(settings, hass, now = new Date(), language = 'en') {
  const locale = hass?.locale?.language || language;
  const timeZone = settings.timezone || hass?.config?.time_zone;
  const zone = timeZone ? {timeZone} : {};
  const format = settings.format === 'auto' ? hass?.locale?.time_format : settings.format;
  const options = {hour:'numeric', minute:'2-digit', ...zone};
  if (format === '24') options.hourCycle = 'h23';
  if (format === '12') options.hourCycle = 'h12';
  const parts = new Intl.DateTimeFormat(locale,options).formatToParts(now);
  let date;
  if (settings.date_format === 'mdy' || settings.date_format === 'dmy') {
    const p = new Intl.DateTimeFormat(locale,{year:'numeric',month:'2-digit',day:'2-digit',...zone}).formatToParts(now);
    const value = type => p.find(x => x.type === type)?.value;
    date = (settings.date_format === 'mdy' ? ['month','day','year'] : ['day','month','year']).map(value).join('/');
  } else {
    date = new Intl.DateTimeFormat(locale,{weekday:settings.date_format === 'long' ? 'long' : 'short',month:settings.date_format === 'long' ? 'long' : 'short',day:'numeric',...zone}).format(now);
  }
  return {digits:parts.filter(p => p.type !== 'dayPeriod').map(p => p.value).join('').trim(),period:parts.find(p => p.type === 'dayPeriod')?.value ?? '',date};
}

const WEATHER_ICONS = {'clear-night':'weather-night',cloudy:'weather-cloudy',exceptional:'alert-circle-outline',fog:'weather-fog',hail:'weather-hail',lightning:'weather-lightning','lightning-rainy':'weather-lightning-rainy',partlycloudy:'weather-partly-cloudy',pouring:'weather-pouring',rainy:'weather-rainy',snowy:'weather-snowy','snowy-rainy':'weather-snowy-rainy',sunny:'weather-sunny',windy:'weather-windy','windy-variant':'weather-windy-variant'};
export function weatherReading(entity, hass) {
  if (!entity) return {reading:null,diagnostic:null};
  const state = hass?.states?.[entity], temperature = state?.attributes?.temperature, unit = state?.attributes?.temperature_unit;
  if (hass?.connected === false || !state || !WEATHER_ICONS[state.state] || typeof temperature !== 'number' || !Number.isFinite(temperature) || !unit) return {reading:null,diagnostic:'Configured weather is missing or unavailable; weather is hidden.'};
  return {reading:{icon:`mdi:${WEATHER_ICONS[state.state]}`,condition:state.state,temperature,unit},diagnostic:null};
}

export function backgroundCandidates(settings, night, bundled) {
  return [...new Set([...(night ? [settings.night] : []),settings.day,bundled].filter(Boolean))];
}
