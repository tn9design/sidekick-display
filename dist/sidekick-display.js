import {installCardReorder} from './card-reorder.js';
import {openCardPicker} from './card-picker.js?v=v.0.5.101226.713';
import {installStage4Effects} from './stage4-effects.js?v=v.0.5.101226.713';
import {normalizeDisplay, resolveNight, formatClock, weatherReading, backgroundCandidates, FONTS} from './display-model.js?v=v.0.5.101226.713';
import {normalizeAutomation, RequestGate} from './automation-model.js?v=v.0.5.101226.713';
const BUILD_VERSION = 'v.0.5.101226.713';
const PREVIEW_BUILD = new URL(import.meta.url).pathname.includes('/sidekick-display-stage4/');
const BACKGROUND = new URL('./stockpotomage.png', import.meta.url).href;
const BACKGROUND_IMAGES = [
  ['', 'Stockpot Inspo (Default)'],
  ['./background.svg','Abstract Waves'],
  ...['blue-topology','faceted-balance','floating-ink','lagoon-simplified','nebula-geometry','precision-lattice','prismatic-wash'].map(name=>[`./${name}.png`,name.split('-').map(word=>word[0].toUpperCase()+word.slice(1)).join(' ')]),
].map(([path,label])=>({value:path ? new URL(path,import.meta.url).href : 'default',label}));
const ANIMATED_BACKGROUND = {value:new URL('./stockpot-animated.svg',import.meta.url).href,label:'Stockpot (Animated)'};

const STYLE = `
:host{display:block;min-width:0;font-family:system-ui,sans-serif;color:white}
.notification-backdrop{position:absolute;inset:0;z-index:25;background:#0009;display:flex;align-items:flex-start;justify-content:center;padding:12px 24px 0;box-sizing:border-box;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;animation:notification-fade-in 260ms ease-out}
.notification-stack{width:624px;max-width:100%;flex-shrink:0;outline:none;display:flex;flex-direction:column;gap:12px}
.notification-card{flex-shrink:0;min-width:0;outline:none}.notification-card>*{display:block}.notification-card.camera{padding:12px;border-radius:var(--sidekick-card-radius);background:var(--sidekick-card-fill,var(--card-background-color,#fff));box-sizing:border-box}
.notification-backdrop.closing{pointer-events:none;animation:notification-fade-out 250ms ease-in forwards}.notification-backdrop.closing .notification-stack{animation:notification-exit 250ms ease-in forwards}
@keyframes notification-fade-in{from{opacity:0}to{opacity:1}}@keyframes notification-fade-out{from{opacity:1}to{opacity:0}}@keyframes notification-exit{from{transform:translateY(0)}to{transform:translateY(calc(-1 * var(--notification-travel,100vh)))}}
@media(prefers-reduced-motion:reduce){.notification-backdrop,.notification-backdrop.closing,.notification-backdrop.closing .notification-stack{animation:none}}

.shell{position:relative;display:flex;box-sizing:border-box;width:100%;overflow:hidden;background:#173f48;border-radius:0;isolation:isolate}
.background{position:absolute;inset:0;width:100%;height:100%;z-index:-2;pointer-events:none}.background[hidden]{display:none}
.dim{position:absolute;inset:0;background:#000;z-index:28;pointer-events:none}
.build-stamp{position:absolute;bottom:0;left:0;right:0;text-align:center;max-width:100%;font:9px system-ui,sans-serif;color:#fff;opacity:.35;pointer-events:none;z-index:32;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.idle-track{position:absolute;top:0;left:0;width:100%;height:1px;background:black;z-index:30;pointer-events:none}.idle-track[hidden]{display:none}.idle-progress{width:100%;height:100%;background:var(--sidekick-accent);opacity:1;transform-origin:right center}
.main{flex:1;min-width:0;min-height:0;position:relative;display:flex;flex-direction:column}
.home{flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:16px;box-sizing:border-box;text-align:center;overflow:hidden}
.time{font-weight:300;line-height:1.05;white-space:nowrap;font-variant-numeric:tabular-nums;text-shadow:0 2px 18px #102e3866}
.weather{height:34px;width:max-content;max-width:100%;display:flex;align-items:center;justify-content:center;gap:6px;margin-top:10px;padding:4px 14px;border:1px solid color-mix(in srgb,currentColor 28%,transparent);border-radius:999px;box-sizing:border-box;line-height:1.2}.weather[hidden],.date[hidden]{display:none}.weather ha-icon[hidden]{display:none}.weather span{display:block;line-height:1;transform:none}.weather ha-icon{--mdc-icon-size:19px;display:flex;align-items:center;justify-content:center;width:19px;height:19px;flex-shrink:0;line-height:1}
.period{font-size:.24em;margin-left:.35em;font-weight:500}.date{margin-top:-.36em;line-height:1.3}
nav{position:relative;display:flex;flex-direction:column;align-self:center;gap:8px;padding:8px;margin:16px;background:transparent;border-radius:999px;flex-shrink:0;max-height:calc(100% - 32px);overflow-y:auto;box-sizing:border-box}
nav::before{content:"";position:absolute;inset:0;background:var(--sidekick-strip);opacity:var(--sidekick-opacity);border-radius:inherit;pointer-events:none}
nav.glass{box-shadow:inset 1px 1px 0 #ffffff70,inset -1px -1px 0 #10212b40,0 5px 14px #071b2630;outline:1px solid #ffffff30}nav.glass::before{opacity:calc(var(--sidekick-opacity) * .3)}nav.glass::after{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,#ffffff38,transparent 44%,#ffffff08 75%,#ffffff18);pointer-events:none}nav.glass.blur{backdrop-filter:blur(6px) saturate(140%);-webkit-backdrop-filter:blur(6px) saturate(140%)}
.selection{position:absolute;top:8px;left:8px;width:var(--sidekick-button-size,48px);height:var(--sidekick-button-size,48px);border-radius:999px;background:var(--sidekick-accent);pointer-events:none;transition:none}nav.glass .selection{background:linear-gradient(135deg,#ffffff30,#ffffff05),var(--sidekick-accent);box-shadow:inset 0 1px 0 #ffffff60,inset 0 -1px 0 #12263320,0 2px 5px #071b2618}
button{-webkit-tap-highlight-color:transparent;position:relative;width:var(--sidekick-button-size,48px);height:var(--sidekick-button-size,48px);min-height:48px;border:0;border-radius:999px;background:transparent;color:var(--sidekick-icon);cursor:pointer;display:grid;place-items:center;padding:0;flex-shrink:0}
button:focus-visible{outline:3px solid #ffcfaa;outline-offset:1px}
@media(prefers-reduced-motion:reduce){.selection{transition:none}}

ha-icon{--mdc-icon-size:var(--sidekick-icon-size,26px)}.page{--ha-card-border-radius:var(--sidekick-card-radius,24px);overflow:auto;flex:1;min-height:0;box-sizing:border-box;padding:16px;overscroll-behavior:contain}.page>*{display:block;max-width:720px;margin:0 auto}
.connection{position:absolute;top:6px;left:8px;font-size:12px;z-index:31;padding:3px 6px;background:#182f38cc;border-radius:8px;pointer-events:none}.connection[hidden]{display:none}
.notice{position:absolute;bottom:4px;left:8px;right:8px;font-size:12px;background:#182f38;color:white;padding:4px 8px;border-radius:4px}.error{padding:20px;background:#182f38;border-radius:12px}
`;

function validateCard(card) {
  if (!card || typeof card !== 'object' || Array.isArray(card) || typeof card.type !== 'string' || !card.type.trim()) throw new Error('Internal pages need an inline HA card with a type.');
  if (['vertical-stack','horizontal-stack','grid'].includes(card.type)) {
    if (!Array.isArray(card.cards) || (!card.cards.length && card.type!=='vertical-stack')) throw new Error('Stack and grid pages need a nonempty cards list.');
    card.cards.forEach(validateCard);
  }
}

export function normalizeConfig(config) {
  if (!config || typeof config !== 'object') throw new Error('Sidekick Display needs a configuration.');
  const sidebar = config.sidebar ?? {};
  if (sidebar.enabled !== undefined && typeof sidebar.enabled !== 'boolean') throw new Error('sidebar.enabled must be true or false.');
  const buttons = sidebar.buttons ?? [];
  if (!Array.isArray(buttons) || buttons.length > 4) throw new Error('Sidebar supports zero to four destination buttons.');
  if (sidebar.side && !['left','right'].includes(sidebar.side)) throw new Error('sidebar.side must be left or right.');
  const ids = new Set(['home']);
  for (const button of buttons) {
    if (!button || !/^[a-z][a-z0-9_-]*$/.test(button.id) || ids.has(button.id)) throw new Error('Each button needs a unique ID; home is reserved.');
    if (typeof button.name !== 'string' || !button.name.trim() || typeof button.icon !== 'string' || !/^mdi:[a-z0-9-]+$/.test(button.icon)) throw new Error('Each button needs a name and mdi: icon.');
    const destination = button.destination ?? 'internal';
    if (!['internal','ha-view','url'].includes(destination)) throw new Error('Button destination must be internal, ha-view, or url.');
    if (button.enabled!==undefined && typeof button.enabled!=='boolean')throw new Error('Page enabled must be true or false.');
    if (destination === 'internal') {
      if(button.enabled!==false || button.card)validateCard(button.card);
    } else {
      if (typeof button.url !== 'string' || !button.url.trim()) throw new Error('Navigation buttons need a URL.');
      if (destination === 'ha-view' && (!button.url.startsWith('/') || button.url.startsWith('//'))) throw new Error('HA views need a local absolute path.');
      const url = new URL(button.url, window.location.href);
      if (destination === 'ha-view' && url.origin !== window.location.origin) throw new Error('HA views must stay on this Home Assistant origin.');
      if (!['http:','https:'].includes(url.protocol)) throw new Error('Navigation URLs must use HTTP or HTTPS.');
      if (url.username || url.password) throw new Error('Navigation URLs must not include credentials.');
    }
    ids.add(button.id);
  }
  const cardStyle = config.card_style ?? {};
  if (!cardStyle || typeof cardStyle !== 'object' || Array.isArray(cardStyle)) throw new Error('card_style must be an object.');
  const corner_radius = cardStyle.corner_radius ?? 12;
  const background = cardStyle.background ?? 'auto';
  if (!Number.isFinite(corner_radius) || corner_radius < 0 || corner_radius > 64) throw new Error('card_style.corner_radius must be between 0 and 64.');
  if (typeof background !== 'string' || (background !== 'auto' && !CSS.supports('color',background))) throw new Error('card_style.background must be a CSS color or auto.');
  const automation = normalizeAutomation(config.automation);
  for (const page of automation.pages) validateCard(page.card);
  const idle = config.idle_return ?? {};
  const seconds = idle.seconds ?? 15;
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0 || seconds > 86400) throw new Error('idle_return.seconds must be between 0 (off) and 86400.');
  const display = normalizeDisplay(config);
  if (display.clock.color === 'auto' || display.background.color === 'auto') throw new Error('Clock and background colors must be explicit CSS colors.');
  for (const color of [display.clock.color,display.background.color,display.sidebar.color,display.sidebar.icon_color,display.sidebar.accent]) {
    if (color !== 'auto' && !CSS.supports('color',color)) throw new Error('Colors must be valid CSS colors, or auto for sidebar colors.');
  }
  return { ...config, ...display, automation, card_style:{corner_radius,background}, idle_return: {seconds}, sidebar: { ...display.sidebar, enabled: sidebar.enabled === true && buttons.some(b=>b.enabled!==false), side: sidebar.side ?? 'right', buttons: buttons.filter(b=>b.enabled!==false).map(b => ({...b, destination:b.destination ?? 'internal', card: b.card ? structuredClone(b.card) : undefined})) } };
}


function editorDialog(node) {
  for (;node;node=node.parentElement||node.getRootNode()?.host) if(node.localName==='hui-dialog-edit-card')return node;
}

export class SidekickDisplay extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode:'open'});
    this._buildVersion = BUILD_VERSION;
    this._requestGate = new RequestGate();
    this._page = 'home';
    this._generation = 0;
    this._resize = new ResizeObserver(() => this._size());
    this._viewportChanged = () => this._size();
    this._activity = event => {
      if (!event.isTrusted || (event.type === 'pointermove' && !event.buttons && event.pointerType !== 'touch')) return;
      if (this._temporary) {
        if (!this._temporary.closing && event.composedPath().includes(this._temporary.stack)) this._resetTemporaryTimer();
      } else this._resetIdle();
    };
    this._notificationKeydown = event => this._handleNotificationKey(event);
    this._editorSelect = event => {const dialog=editorDialog(this);if(!dialog||dialog!==event.detail.dialog)return;this._editorPage=event.detail.page;this._navigate(this._config.sidebar.buttons.some(b=>b.id===this._editorPage)?this._editorPage:'home');};
    this._restore = () => { if (this._config) this._navigate('home'); };
  }
  setConfig(config) {
    const normalized = normalizeConfig(config);
    this._stopReception();
    this._cancelTemporary();
    this._requestGate = new RequestGate();
    this._config = normalized;
    clearTimeout(this._idleTimer);
    const previewPage=editorDialog(this)?.dataset.sidekickPage;
    this._page = previewPage && normalized.sidebar.buttons.some(b=>b.id===previewPage)?previewPage:'home';
    this._lastNight = undefined;
    this._backgroundKey = undefined;
    this._render();
    this._syncReception();
  }
  set hass(hass) {
    this._hass = hass;
    this._syncReception();
    this._updateDisplay();
  }
  getCardSize() { return 6; }
  static getStubConfig(hass) {
    const weather=Object.keys(hass?.states??{}).find(id=>id.startsWith('weather.'));
    const light=Object.keys(hass?.states??{}).find(id=>id.startsWith('light.'));
    return {type:'custom:sidekick-display',weather:weather?{entity:weather}:{},sidebar:{enabled:true,style:'white',buttons:[1,2,3,4].map(n=>({id:`page-${n}`,name:`Page ${n}`,icon:['mdi:view-grid','mdi:camera','mdi:weather-night','mdi:web'][n-1],enabled:true,destination:'internal',card:{type:'vertical-stack',cards:[light?{type:'tile',entity:light}:{type:'markdown',content:'Choose a light entity to set up this page.'}]}}))}};
  }
  static getConfigElement() { return document.createElement('sidekick-display-editor'); }
  connectedCallback() {
    this._syncReception();
    const previewPage=editorDialog(this)?.dataset.sidekickPage;
    this._page = previewPage && this._config?.sidebar.buttons.some(b=>b.id===previewPage)?previewPage:'home';
    this._render();
    this._resize.observe(this);
    window.addEventListener('resize',this._viewportChanged);
    window.visualViewport?.addEventListener('resize',this._viewportChanged);
    for (const type of ['pointerdown','pointermove','keydown','wheel','input','change']) this.shadowRoot.addEventListener(type,this._activity,{capture:true,passive:true});
    this.shadowRoot.addEventListener('keydown',this._notificationKeydown);
    window.addEventListener('pageshow',this._restore);
    window.addEventListener('sidekick-editor-page',this._editorSelect);
    this._timer = setInterval(() => this._clock(), 1000);
  }
  disconnectedCallback() {
    this._clearStage4Effects?.();
    this._stopReception();
    this._cancelTemporary();
    clearInterval(this._timer);
    clearTimeout(this._idleTimer);
    this._idleAnimation?.cancel();
    this._selectionAnimation?.cancel();
    for (const type of ['pointerdown','pointermove','keydown','wheel','input','change']) this.shadowRoot.removeEventListener(type,this._activity,true);
    this.shadowRoot.removeEventListener('keydown',this._notificationKeydown);
    window.removeEventListener('pageshow',this._restore);
    window.removeEventListener('sidekick-editor-page',this._editorSelect);
    this._resize.disconnect();
    window.removeEventListener('resize',this._viewportChanged);
    window.visualViewport?.removeEventListener('resize',this._viewportChanged);
    this._generation++;
    this._imageGeneration = (this._imageGeneration ?? 0) + 1;
    this._backgroundKey = undefined;
    this._child?.remove();
    this._child = undefined;
  }
  _render() {
    if (!this._config) return;
    this._clearStage4Effects?.();
    this._cancelTemporary();
    this._idleAnimation?.cancel();
    this._selectionAnimation?.cancel();
    const generation = ++this._generation;
    this._child?.remove();
    this._child = undefined;
    this._navigate = SidekickDisplay.prototype._navigate;
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><section class="shell"><img class="background" alt="" hidden><div class="dim"></div><div class="idle-track" aria-hidden="true" hidden><div class="idle-progress"></div></div><div class="connection" role="status" hidden>HA disconnected</div><main class="main"></main></section>`;
    const shell = this.shadowRoot.querySelector('.shell');
    if (PREVIEW_BUILD || this._config.preview_build_indicator === true) {
      const stamp = document.createElement('div'); stamp.className = 'build-stamp'; stamp.textContent = BUILD_VERSION; shell.append(stamp);
    }
    this._backgroundKey = undefined;
    this._clockKey = undefined;
    const sidebar = this._config.sidebar;
    if (sidebar.enabled) {
      const nav = document.createElement('nav');
      nav.setAttribute('aria-label','Display pages');
      nav.style[sidebar.side === 'left' ? 'marginRight' : 'marginLeft'] = '0';
      if (['glass','refracting'].includes(sidebar.style)) { nav.classList.add('glass'); if (sidebar.blur && CSS.supports('backdrop-filter','blur(10px)')) nav.classList.add('blur'); }
      const selection = document.createElement('div');
      selection.className = 'selection';
      selection.setAttribute('aria-hidden','true');
      nav.append(selection);
      for (const item of [{id:'home',name:'Home',icon:'mdi:home'}, ...sidebar.buttons]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.page = item.id;
        button.setAttribute('aria-label',item.name);
        button.title = item.name;
        if (item.id === this._page) button.setAttribute('aria-current','page');
        const icon = document.createElement('ha-icon');
        icon.setAttribute('icon', item.icon);
        button.append(icon);
        button.addEventListener('click',() => this._navigate(item.id));
        nav.append(button);
      }
      if (sidebar.side === 'left') shell.prepend(nav); else shell.append(nav);
    }
    this._renderContent(generation);
    this._updateDisplay();
    this._size();
    if (this.isConnected && Number.isFinite(this._buttonSize)) installNavigation(this);
    installStage4Effects(this);
  }
  _resetIdle() {
    if(editorDialog(this)){clearTimeout(this._idleTimer);return;}
    if (this._temporary) return;
    clearTimeout(this._idleTimer);
    this._idleAnimation?.cancel();
    const progress = this.shadowRoot.querySelector('.idle-progress');
    const track = this.shadowRoot.querySelector('.idle-track');
    if (track) track.hidden = true;
    if (this.isConnected && !this._temporary && this._page !== 'home' && this._config.idle_return.seconds > 0) {
      const duration = this._config.idle_return.seconds * 1000;
      if (progress) {
        track.hidden = false;
        this._idleAnimation = progress.animate([{transform:'scaleX(1)'},{transform:'scaleX(0)'}],{duration,easing:'linear',fill:'forwards'});
      }
      this._idleTimer = setTimeout(() => this._navigate('home'),duration);
    }
  }
  _leave(url, destination) {
    this._navigate('home');
    clearTimeout(this._idleTimer);
    if (destination === 'ha-view') {
      window.history.pushState(null,'',url);
      window.dispatchEvent(new Event('location-changed'));
    } else window.location.assign(url);
  }
  _navigate(page) {
    const target = this._config.sidebar.buttons.find(button => button.id === page);
    if (page !== 'home' && !target) return;
    if (target && target.destination !== 'internal') { this._leave(target.url,target.destination); return; }
    const interrupted = !!this._temporary;
    this._cancelTemporary();
    if (this._page === page && !interrupted) return;
    this._page = page;
    this._resetIdle();
    const generation = ++this._generation;
    this._child?.remove();
    this._child = undefined;
    const buttons = [...this.shadowRoot.querySelectorAll('nav button')];
    const previousIndex = buttons.findIndex(button => button.hasAttribute('aria-current'));
    buttons.forEach(button => { if (button.dataset.page === page) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current'); });
    const index = buttons.findIndex(button => button.dataset.page === page);
    const selection = this.shadowRoot.querySelector('.selection');
    if (selection) {
      const start = new DOMMatrixReadOnly(getComputedStyle(selection).transform).m42;
      this._selectionAnimation?.cancel();
      selection.style.transformOrigin = 'center center';
      const end = index * (this._buttonSize + 8);
      selection.style.transform = `translateY(${end}px)`;
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const direction = index > previousIndex ? 1 : -1;
        const frame = (position,x,y,offset,sticky=false) => ({transform:`translateY(${position + (sticky ? direction * this._buttonSize * (y - 1) / 2 : 0)}px) scale(${x},${y})`,offset});
        this._selectionAnimation = selection.animate([
          frame(start,1,1,0),
          frame(start,.88,1.35,.2,true),
          frame(start + (end - start) * .4,.88,1.35,.42,true),
          frame(end,1,1,.56),
          frame(end + direction * 6,1.18,.78,.7),
          frame(end - direction * 2,.98,1.04,.85),
          frame(end,1,1,1)
        ],{duration:400,easing:'ease-in-out'});
      }
    }
    this._clockKey = undefined;
    this._renderContent(generation);
    this._updateDisplay();
    this._size();
  }
  _renderContent(generation) {
    const main = this.shadowRoot.querySelector('main');
    if (this._page === 'home') {
      main.innerHTML = '<div class="home"><div class="time"><span class="digits"></span><span class="period"></span></div><div class="date"></div><div class="weather" hidden><ha-icon></ha-icon><span></span></div></div>';
      this._clock();
    } else {
      main.innerHTML = '<div class="page" aria-label="Page content"><div role="status">Loading…</div></div>';
      this._mount(generation);
    }
  }
  async _mount(generation) {
    if (this._hass?.connected === false) { this.shadowRoot.querySelector('.page').textContent = 'HA disconnected. Controls will return after reconnection.'; return; }
    try {
      if (typeof window.loadCardHelpers !== 'function') throw new Error('HA card helpers are unavailable. Open this card in a Home Assistant dashboard.');
      const helpers = await window.loadCardHelpers();
      if (generation !== this._generation || !this.isConnected || this._hass?.connected === false) return;
      const button = this._config.sidebar.buttons.find(b => b.id === this._page);
      const child = helpers.createCardElement(structuredClone(button.card));
      this._styleChild(child,button.card);
      child.hass = this._appearanceHass();
      this._child = child;
      this.shadowRoot.querySelector('.page').replaceChildren(child);
      const updated = child.updateComplete;
      if (updated) await updated;
    } catch (error) {
      if (generation !== this._generation) return;
      this._child?.remove();
      this._child = undefined;
      const message = document.createElement('div');
      message.className = 'error';
      message.setAttribute('role','alert');
      message.textContent = `Unable to display this page: ${error.message}`;
      this.shadowRoot.querySelector('.page')?.replaceChildren(message);
    }
  }
  _isLiveCamera(config) {
    return ['picture-entity','picture-glance'].includes(config.type) && config.camera_view === 'live' && (config.camera_image || config.entity?.startsWith('camera.'));
  }
  _styleChild(child,config) {
    child.style.setProperty('--ha-card-border-radius',`${this._config.card_style.corner_radius}px`);
    if (this._config.card_style.background !== 'auto') child.style.setProperty('--ha-card-background',this._config.card_style.background);
    if (this._isLiveCamera(config)) {
      child.style.setProperty('--ha-card-background','transparent');
      child.style.setProperty('--card-background-color','transparent');
      child.style.setProperty('--ha-card-border-radius','0px');
      child.style.setProperty('--ha-card-border-width','0');
    }
  }
  _cancelTemporary() {
    clearTimeout(this._temporaryTimer);
    clearTimeout(this._temporaryCloseTimer);
    this._temporaryAnimation?.cancel();
    const temporary = this._temporary;
    if (!temporary) return;
    this._temporary = undefined;
    for (const entry of temporary.pages) { entry.animation?.cancel(); entry.child?.remove(); }
    temporary.overlay.remove();
    this.shadowRoot.querySelector('main').inert = false;
    const nav = this.shadowRoot.querySelector('nav');
    if (nav) nav.inert = false;
    const track = this.shadowRoot.querySelector('.idle-track');
    if (track) track.hidden = true;
    if (temporary.focus?.isConnected) temporary.focus.focus();
  }
  _resetTemporaryTimer() {
    const temporary = this._temporary;
    if (!temporary || temporary.closing) return;
    clearTimeout(this._temporaryTimer);
    this._temporaryAnimation?.cancel();
    const track = this.shadowRoot.querySelector('.idle-track');
    track.hidden = false;
    const duration = temporary.seconds * 1000;
    temporary.deadline = performance.now() + duration;
    this._temporaryAnimation = track.firstElementChild.animate([{transform:'scaleX(1)'},{transform:'scaleX(0)'}],{duration,easing:'linear',fill:'forwards'});
    this._temporaryTimer = setTimeout(() => this._dismissTemporary(),duration);
  }
  _showTemporary(page) {
    this._settlePageTransition?.();
    if (this._temporary?.closing) this._cancelTemporary();
    if (this._temporary?.pages.some(entry => entry.page.id === page.id)) {
      if (!this._config.automation.ignore_repeated_alerts) { this._temporary.seconds = page.seconds; this._resetTemporaryTimer(); }
      return;
    }
    if (!this._temporary) {
      clearTimeout(this._idleTimer);
      this._idleAnimation?.cancel();
      const overlay = document.createElement('div');
      overlay.className = 'notification-backdrop';
      const stack = document.createElement('section');
      stack.className = 'notification-stack';
      stack.tabIndex = -1;
      stack.setAttribute('role','dialog');
      stack.setAttribute('aria-modal','true');
      stack.setAttribute('aria-label','Notifications');
      overlay.append(stack);
      overlay.addEventListener('click',event => { if (event.target === overlay) this._dismissTemporary(); });
      this._temporary = {pages:[],overlay,stack,seconds:page.seconds,focus:this.shadowRoot.activeElement};
      this.shadowRoot.querySelector('.shell').append(overlay);
      this.shadowRoot.querySelector('main').inert = true;
      const nav = this.shadowRoot.querySelector('nav');
      if (nav) nav.inert = true;
      stack.focus();
    }
    const temporary = this._temporary;
    const entry = {page,element:document.createElement('section')};
    entry.element.className = 'notification-card';
    if (this._isLiveCamera(page.card)) entry.element.classList.add('camera');
    entry.element.dataset.notification = page.id;
    entry.element.setAttribute('aria-label',page.name);
    entry.element.tabIndex = -1;
    entry.element.textContent = 'Loading…';
    const positions = new Map(temporary.pages.map(entry => [entry.element,entry.element.getBoundingClientRect().top]));
    temporary.pages.unshift(entry);
    temporary.stack.prepend(entry.element);
    temporary.overlay.scrollTop = 0;
    temporary.stack.style.setProperty('--notification-travel',`${this.shadowRoot.querySelector('.shell').clientHeight}px`);
    temporary.seconds = page.seconds;
    this._resetTemporaryTimer();
    this._updateDisplay();
    this._mountNotification(entry,positions);
  }
  async _mountNotification(entry,positions = new Map()) {
    const temporary = this._temporary;
    const generation = entry.generation = (entry.generation ?? 0) + 1;
    const current = () => this._temporary === temporary && !temporary.closing && entry.generation === generation && this.isConnected && this._hass?.connected !== false;
    entry.child?.remove();
    entry.child = undefined;
    if (this._hass?.connected === false) { entry.element.textContent = 'HA disconnected. Controls will return after reconnection.'; return; }
    try {
      if (typeof window.loadCardHelpers !== 'function') throw new Error('HA card helpers are unavailable.');
      const helpers = await window.loadCardHelpers();
      if (!current()) return;
      const child = helpers.createCardElement(structuredClone(entry.page.card));
      this._styleChild(child,entry.page.card);
      child.hass = this._appearanceHass();
      entry.child = child;
      entry.element.replaceChildren(child);
      const updated = child.updateComplete;
      if (updated) await updated;
      if (!current()) return;
    } catch (error) {
      if (!current()) return;
      entry.child?.remove(); entry.child = undefined;
      const message = document.createElement('div');
      message.className = 'error'; message.setAttribute('role','alert');
      message.textContent = `Unable to display this notification: ${error.message}`;
      entry.element.replaceChildren(message);
    }
    if (positions.size || temporary.pages[0] === entry) this._animateNotification(entry,positions);
  }
  _animateNotification(entry,positions) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const height = this.shadowRoot.querySelector('.shell').clientHeight;
    entry.animation?.cancel();
    entry.animation = entry.element.animate([{transform:`translateY(-${height}px)`},{transform:'translateY(0)'}],{duration:260,easing:'cubic-bezier(.2,.8,.2,1)'});
    for (const [element,top] of positions) {
      const previous = this._temporary.pages.find(item => item.element === element);
      if (!previous) continue;
      previous.animation?.cancel();
      previous.animation = element.animate([{transform:`translateY(${top - element.getBoundingClientRect().top}px)`},{transform:'translateY(0)'}],{duration:260,easing:'cubic-bezier(.2,.8,.2,1)'});
    }
  }
  _dismissTemporary() {
    const temporary = this._temporary;
    if (!temporary || temporary.closing) return;
    temporary.closing = true;
    clearTimeout(this._temporaryTimer);
    this._temporaryAnimation?.cancel();
    this.shadowRoot.querySelector('.idle-track').hidden = true;
    for (const entry of temporary.pages) entry.animation?.cancel();
    const finish = () => { if (this._temporary !== temporary) return; this._cancelTemporary(); this._resetIdle(); };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
    else { temporary.overlay.classList.add('closing'); this._temporaryCloseTimer = setTimeout(finish,260); }
  }
  _handleNotificationKey(event) {
    const temporary = this._temporary;
    if (!temporary || temporary.closing || event.defaultPrevented) return;
    if (event.key === 'Escape') { event.preventDefault(); this._dismissTemporary(); return; }
    if (event.key !== 'Tab') return;
    const nodes = [];
    const collect = root => { for (const element of root.querySelectorAll('*')) {
      if (element.matches('button,input,select,textarea,a[href],[tabindex]') && element.tabIndex >= 0 && !element.disabled && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden') nodes.push(element);
      if (element.shadowRoot) collect(element.shadowRoot);
    }};
    collect(temporary.stack);
    const current = event.composedPath().find(element => nodes.includes(element));
    const index = nodes.indexOf(current);
    const next = event.shiftKey ? (index <= 0 ? nodes.length - 1 : index - 1) : (index + 1) % nodes.length;
    event.preventDefault();
    (nodes[next] ?? temporary.stack).focus();
  }
  _stopReception() {
    this._receptionGeneration = (this._receptionGeneration ?? 0) + 1;
    if (this._receptionConnection) {
      this._receptionConnection.removeEventListener('disconnected',this._receptionLost);
      this._receptionConnection.removeEventListener('ready',this._receptionReady);
    }
    this._unsubscribeRequest?.();
    this._unsubscribeRequest = undefined;
    this._receptionConnection = undefined;
    this._requestGate?.reset();
  }
  _syncReception() {
    const settings = this._config?.automation;
    const connection = this._hass?.connection;
    const optedIn = settings?.display_id && new URL(window.location.href).searchParams.get('clock_display') === settings.display_id;
    if (!this.isConnected || !optedIn || !connection || this._hass.connected === false || connection.connected === false) {
      if (this._receptionConnection) this._stopReception();
      return;
    }
    if (this._receptionConnection === connection) return;
    this._stopReception();
    this._receptionConnection = connection;
    this._receptionLost = () => {
      this._requestGate.reset();
      this._receptionGeneration++;
    };
    this._receptionReady = () => {
      this._stopReception();
      this._syncReception();
    };
    connection.addEventListener('disconnected',this._receptionLost);
    connection.addEventListener('ready',this._receptionReady);
    const generation = this._receptionGeneration;
    const current = () => generation === this._receptionGeneration && this.isConnected && this._hass?.connected !== false;
    // Subscribe first, then snapshot. Events before the snapshot completes are baseline,
    // never delivery: this deliberately drops requests during load/reconnection.
    (async () => {
      try {
        const unsubscribe = await connection.subscribeMessage(event => {
          if (!current() || event.data?.entity_id !== settings.helper) return;
          const page = this._requestGate.receive(event.data.new_state?.state,settings.pages);
          if (page) this._showTemporary(page);
          else this._updateDisplay();
        },{type:'subscribe_events',event_type:'state_changed'},{resubscribe:false});
        if (!current()) { unsubscribe(); return; }
        this._unsubscribeRequest = unsubscribe;
        const states = await connection.sendMessagePromise({type:'get_states'});
        if (current()) this._requestGate.baseline(states.find(state => state.entity_id === settings.helper)?.state);
      } catch {
        if (current()) { this._requestGate.reset(); this._requestGate.diagnostic = 'Automation reception unavailable; reload or reconnect.'; }
      }
    })();
  }
  _appearanceHass() {
    if (!this._hass || this._config.appearance.mode === 'auto') return this._hass;
    return {...this._hass,themes:{...this._hass.themes,darkMode:this._config.appearance.mode === 'dark'}};
  }
  getDiagnostics() { return [...(this._diagnostics ?? [])]; }
  _updateDisplay() {
    if (!this._config) return;
    const shell = this.shadowRoot.querySelector('.shell');
    if (!shell) return;
    const config = this._config;
    const resolved = resolveNight(config.day_night,this._hass?.states,this._lastNight);
    this._lastNight = resolved.night;
    shell.dataset.mode = resolved.night ? 'night' : 'day';
    const dark = config.appearance.mode === 'auto' ? !!this._hass?.themes?.darkMode : config.appearance.mode === 'dark';
    shell.dataset.appearance = dark ? 'dark' : 'light';
    shell.style.background = config.background.color;
    const navDark = config.sidebar.style === 'dark' || (!['white','dark'].includes(config.sidebar.style) && dark);
    shell.style.setProperty('--sidekick-strip',config.sidebar.color === 'auto' ? (navDark ? '#142328' : '#f5f5f5') : config.sidebar.color);
    shell.style.setProperty('--sidekick-opacity',String(config.sidebar.opacity / 100));
    shell.style.setProperty('--sidekick-icon',config.sidebar.icon_color === 'auto' ? (navDark ? '#ffffff' : '#212121') : config.sidebar.icon_color);
    shell.style.setProperty('--sidekick-accent',config.sidebar.accent === 'auto' ? (navDark ? '#527e7b' : '#b7d5d3') : config.sidebar.accent);
    this.shadowRoot.querySelector('.dim').style.opacity = resolved.night ? config.day_night.dimming / 100 : 0;
    const palette = dark ? {'primary-text-color':'#e1e1e1','secondary-text-color':'#9b9b9b','primary-background-color':'#111111','secondary-background-color':'#202020','card-background-color':'#1c1c1c','ha-card-background':'#1c1c1c','divider-color':'#ffffff1f','state-icon-color':'#9b9b9b'} : {'primary-text-color':'#212121','secondary-text-color':'#727272','primary-background-color':'#fafafa','secondary-background-color':'#e5e5e5','card-background-color':'#ffffff','ha-card-background':'#ffffff','divider-color':'#0000001f','state-icon-color':'#44739e'};
    for (const [key,value] of Object.entries(palette)) {
      if (config.appearance.mode === 'auto') shell.style.removeProperty(`--${key}`);
      else shell.style.setProperty(`--${key}`,value);
    }
    shell.style.color = config.appearance.mode === 'auto' ? 'var(--primary-text-color)' : palette['primary-text-color'];
    shell.style.setProperty('--sidekick-card-radius',`${config.card_style.corner_radius}px`);
    shell.style.setProperty('--ha-card-border-radius',`${config.card_style.corner_radius}px`);
    if (config.card_style.background === 'auto') shell.style.removeProperty('--sidekick-card-fill');
    else shell.style.setProperty('--sidekick-card-fill',config.card_style.background);
    this.shadowRoot.querySelector('.connection').hidden = this._hass?.connected !== false;
    if (this._hass?.connected === false && this._page !== 'home') {
      this._generation++;
      this._child?.remove();
      this._child = undefined;
      this.shadowRoot.querySelector('.page').textContent = 'HA disconnected. Controls will return after reconnection.';
      this._offline = true;
    } else if (this._offline) {
      this._offline = false;
      if (this._page !== 'home') this._renderContent(++this._generation);
    }
    if (this._child) this._child.hass = this._appearanceHass();
    if (this._temporary && !this._temporary.closing) for (const entry of this._temporary.pages) {
      if (this._hass?.connected === false) {
        entry.generation = (entry.generation ?? 0) + 1;
        entry.child?.remove(); entry.child = undefined; entry.offline = true;
        entry.element.textContent = 'HA disconnected. Controls will return after reconnection.';
      } else if (entry.offline) { entry.offline = false; this._mountNotification(entry); }
      else if (entry.child) entry.child.hass = this._appearanceHass();
    }
    this._diagnostics = this._requestGate.diagnostic ? [this._requestGate.diagnostic] : [];
    if (config.day_night.mode === 'entity' && resolved.source !== 'entity') this._diagnostics.push('Day/night entity is missing or unavailable; using fallback.');
    if (['auto','entity'].includes(config.day_night.mode) && ['retained','default'].includes(resolved.source)) this._diagnostics.push('Sun data is unavailable; retaining the last mode, or day after loading.');
    const reading = weatherReading(config.weather.mode==='off'?'':config.weather.entity,this._hass);
    if (reading.diagnostic) this._diagnostics.push(reading.diagnostic);
    this._weather = reading.reading;
    this._loadBackground(resolved.night);
    if (this._backgroundDiagnostic) this._diagnostics.push(this._backgroundDiagnostic);
    this._clock();
  }
  _loadBackground(night) {
    const settings = this._config.background;
    const image = this.shadowRoot.querySelector('.background');
    image.style.objectFit = settings.fit === 'fill' ? 'cover' : 'contain';
    image.style.objectPosition = `${settings.position_x}% ${settings.position_y}%`;
    image.style.filter = `brightness(${1 - settings.darkening / 100})`;
    const candidates = backgroundCandidates(settings,night,BACKGROUND);
    const key = JSON.stringify(candidates);
    if (this._backgroundKey === key) return;
    this._backgroundKey = key;
    this._backgroundDiagnostic = undefined;
    image.hidden = true;
    const generation = this._imageGeneration = (this._imageGeneration ?? 0) + 1;
    const tryImage = index => {
      if (generation !== this._imageGeneration) return;
      if (index >= candidates.length) { this._backgroundDiagnostic = 'Background images could not load; using solid color.'; this._updateDisplay(); return; }
      const probe = new Image();
      probe.onload = () => {
        if (generation !== this._imageGeneration) return;
        image.src = candidates[index]; image.hidden = false;
        if (index) this._backgroundDiagnostic = 'Selected background could not load; using a fallback image.';
        this._updateDisplay();
      };
      probe.onerror = () => tryImage(index + 1);
      probe.src = candidates[index];
    };
    tryImage(0);
  }
  _clock() {
    const digits = this.shadowRoot.querySelector('.digits');
    if (!digits || !this._config) return;
    const settings = this._config.clock;
    const result = formatClock(settings,this._hass,new Date(),navigator.language);
    const key = JSON.stringify([result,settings,this._weather,this._config.weather.mode,this._hass?.locale?.language]);
    if (key === this._clockKey) return;
    this._clockKey = key;
    digits.textContent = result.digits;
    this.shadowRoot.querySelector('.period').textContent = '';
    const date = this.shadowRoot.querySelector('.date');
    date.textContent = result.date; date.hidden = !settings.show_date;
    const home = this.shadowRoot.querySelector('.home');
    home.style.fontFamily = FONTS[settings.font]; home.style.color = settings.color;
    const weather = this.shadowRoot.querySelector('.weather');
    weather.hidden = !this._weather;
    if (this._weather) {
      weather.querySelector('ha-icon').setAttribute('icon',this._weather.icon);
      const condition = (this._weather.condition === 'partlycloudy' ? 'partly cloudy' : this._weather.condition.replaceAll('-', ' ')).split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      const temperature=`${new Intl.NumberFormat(this._hass?.locale?.language || navigator.language,{maximumFractionDigits:1}).format(this._weather.temperature)} ${this._weather.unit}`;
      weather.querySelector('span').textContent=this._config.weather.mode==='temperature'?temperature:`${condition} · ${temperature}`;
      weather.querySelector('ha-icon').hidden=this._config.weather.mode==='temperature';
      weather.setAttribute('aria-label',weather.querySelector('span').textContent);
    }
    this._size();
  }
  _size() {
    const shell = this.shadowRoot.querySelector('.shell');
    if (!shell || !this.isConnected) return;
    // Render the real card at Echo dimensions inside HA's native editor.
    let editorPreview = false;
    let editToolbarHeight = 0;
    let editWrapper;
    for (let node = this; node; node = node.parentElement || node.getRootNode()?.host) {
      if (node.localName === 'hui-card-options') { editWrapper=node;editToolbarHeight = node.shadowRoot?.querySelector('.card-actions')?.getBoundingClientRect().height || 64; }
      if (node.localName === 'hui-dialog-edit-card') { editorPreview = true; break; }
    }
    if (editorPreview) {
      const scale = this.clientWidth / 860;
      this.style.position='relative';
      this.style.height = `${470 * scale}px`;
      if(!this.shadowRoot.querySelector('.editor-device-frame')){const frame=document.createElement('img');frame.className='editor-device-frame';frame.alt='';frame.src=new URL('./echo-show5-frame.svg',import.meta.url).href;frame.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5';this.shadowRoot.append(frame);}
      this.style.overflow = 'hidden';
      shell.style.width = '788px';
      shell.style.height = '393px';
      shell.style.transformOrigin = 'top left';
      shell.style.transform = `translate(${36*scale}px,${32*scale}px) scale(${scale})`;
    } else {
      this.style.position='';
      this.shadowRoot.querySelector('.editor-device-frame')?.remove();
      this.style.height = '';
      this.style.overflow = '';
      shell.style.width = '';
      shell.style.transform = '';
      shell.style.transformOrigin = '';
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const top = Math.max(0,this.getBoundingClientRect().top);
      // HA panel edit wrappers reserve 59px, but their current toolbar is 65px.
      if (editWrapper) { editWrapper.style.display="block";editWrapper.style.height = `${Math.max(0,viewportHeight - top - 8)}px`; }
      shell.style.height = `${Math.max(0,viewportHeight - top - (editToolbarHeight ? editToolbarHeight + 24 : 0))}px`;
    }
    const main = this.shadowRoot.querySelector('main');
    let size = Math.max(16,Math.min(main.clientWidth * .21, shell.clientHeight * .30, 180) * this._config.clock.scale / 100);
    const time = this.shadowRoot.querySelector('.time');
    const date = this.shadowRoot.querySelector('.date');
    const weather = this.shadowRoot.querySelector('.weather');
    if (time) {
      const applySize = () => { time.style.fontSize = `${size}px`; date.style.fontSize = `${Math.max(12,size * .25)}px`; weather.style.fontSize = `${Math.max(12,size * .127)}px`; };
      applySize();
      const home = this.shadowRoot.querySelector('.home');
      for (let attempt = 0; attempt < 6; attempt++) {
        const width = Math.max(time.scrollWidth,date.hidden ? 0 : date.scrollWidth,weather.hidden ? 0 : Math.max(weather.scrollWidth,weather.offsetWidth));
        const height = time.offsetHeight + (date.hidden ? 0 : date.offsetHeight + parseFloat(getComputedStyle(date).marginTop)) + (weather.hidden ? 0 : weather.offsetHeight + 10);
        const ratio = Math.min(1,(main.clientWidth - 32) / Math.max(1,width),(home.clientHeight - 32) / Math.max(1,height));
        if (ratio >= .999 || size <= 16) break;
        size = Math.max(16,size * ratio); applySize();
      }
    }
    const nav = this.shadowRoot.querySelector('nav');
    const count = this._config.sidebar.buttons.length + 1;
    const fitSize = (shell.clientHeight - 48 - (count - 1) * 8) / count;
    this._buttonSize = Math.max(48,Math.min(48 * this._config.sidebar.scale / 100,fitSize));
    if (nav) {
      nav.style.setProperty('--sidekick-button-size',`${this._buttonSize}px`);
      nav.style.setProperty('--sidekick-icon-size',`${26 * this._config.sidebar.scale / 100}px`);
      const index = [...nav.querySelectorAll('button')].findIndex(button => button.dataset.page === this._page);
      nav.querySelector('.selection').style.transform = `translateY(${Math.max(0,index) * (this._buttonSize + 8)}px)`;
    }
    const required = this._config.sidebar.enabled ? (this._config.sidebar.buttons.length + 1) * this._buttonSize + this._config.sidebar.buttons.length * 8 + 48 : 0;
    let notice = this.shadowRoot.querySelector('.notice');
    if (nav && shell.clientHeight < required) {
      if (!notice) { notice = document.createElement('div'); notice.className = 'notice'; notice.setAttribute('role','status'); shell.append(notice); }
      notice.textContent = 'Sidebar needs more height; scroll to reach all 48px buttons.';
    } else notice?.remove();
  }
}
// Stage 2 diagnostics accompany HA's built-in YAML editor. Full visual controls
// are intentionally deferred to the planned visual-editor stage.
export class SidekickDisplayEditor extends HTMLElement {
  constructor() { super(); this.attachShadow({mode:'open'}); this._forms=[];this._childErrors=new Map(); }
  connectedCallback() { this._render(); for(const details of this.shadowRoot.querySelectorAll('details'))details.open=false; this._loadImages(); }
  setConfig(config) {
    const next=structuredClone(config);
    if (JSON.stringify(next)===JSON.stringify(this._rawConfig)) return;
    this._rawConfig=next;this._backgroundChoice=undefined;this._childErrors.clear();
    this._render();
  }
  set hass(hass) { this._hass=hass; for(const form of this._forms) form.hass=hass; if(!this.shadowRoot.childElementCount) this._render(); else this._validate(); if(this.isConnected)this._loadImages(); }
  disconnectedCallback() { this._probeGeneration=(this._probeGeneration??0)+1;this._probeKey=undefined; }
  _change(path,value,refresh=false) {
    if(refresh && this._childErrors.size) { this._status.textContent='Fix the child-card YAML error before resetting or changing the page list.';return; }
    const config=structuredClone(this._rawConfig), keys=path.split('.');
    let target=config;
    for(const key of keys.slice(0,-1)) target=target[key]??=( {} );
    if(JSON.stringify(target[keys.at(-1)])===JSON.stringify(value)) { if(refresh)this._render();return; }
    target[keys.at(-1)]=value;
    this._rawConfig=config;
    this._validate();
    this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:structuredClone(config),error:this._error||[...this._childErrors.values()].join(' ')||undefined,guiModeAvailable:true},bubbles:true,composed:true}));
    if(refresh) this._render();
  }
  _validate() {
    try { this._config=normalizeConfig(this._rawConfig); this._error=''; }
    catch(error) { this._config=undefined; this._error=error.message; }
    const warnings=[];
    if(this._config) {
      const c=this._config, mode=resolveNight(c.day_night,this._hass?.states,this._lastNight);this._lastNight=mode.night;
      if(c.day_night.mode==='entity' && mode.source!=='entity')warnings.push('Day/night entity unavailable; using fallback.');
      if(['auto','entity'].includes(c.day_night.mode) && ['retained','default'].includes(mode.source))warnings.push('Sun unavailable; using last mode or day.');
      const weather=weatherReading(c.weather.mode==='off'?'':c.weather.entity,this._hass);if(weather.diagnostic)warnings.push(weather.diagnostic);
      const candidates=backgroundCandidates(c.background,mode.night,BACKGROUND),key=JSON.stringify(candidates);
      if(key!==this._probeKey) {
        this._probeKey=key;this._imageDiagnostic='';const generation=this._probeGeneration=(this._probeGeneration??0)+1;
        const probe=index=>{
          if(generation!==this._probeGeneration)return;
          if(index>=candidates.length){this._imageDiagnostic='Background images failed; solid color is used.';this._validate();return;}
          const image=new Image();image.onload=()=>{if(generation!==this._probeGeneration)return;this._imageDiagnostic=index?'Selected background failed; fallback image is used.':'';this._validate();};image.onerror=()=>probe(index+1);image.src=candidates[index];
        };probe(0);
      }
      if(this._imageDiagnostic)warnings.push(this._imageDiagnostic);
    }
    if(this._imageStatus)this._imageStatus.textContent=this._uploadError||this._imagesError||'';
    if(this._status){this._status.textContent=this._error || [...this._childErrors.values()].join(' ') || warnings.join(' ');this._status.hidden=!this._status.textContent;}
  }
  _section(title,help='') {
    const section=document.createElement('section');section.className='settings-group';
    const heading=document.createElement('h3');heading.textContent=title;section.append(heading);
    if(help){const p=document.createElement('p');p.textContent=help;section.append(p);}
    this.shadowRoot.append(section);return section;
  }
  _subsection(parent,title) {
    const section=document.createElement('section');section.className='settings-subgroup';
    const heading=document.createElement('h4');heading.textContent=title;section.append(heading);parent.append(section);return section;
  }
  _form(parent,path,schema,defaults={}) {
    const form=document.createElement('ha-form');
    const raw=path.split('.').reduce((v,k)=>v?.[k],this._rawConfig)??{};
    form.hass=this._hass;form.schema=schema;form.data={...defaults,...raw};
    if(path==='clock' && schema.some(field=>field.name==='format') && form.data.format==='auto')form.data.format='12';
    if(schema.some(field=>field.name==='show_date'))form.data.show_date=String(form.data.show_date);
    form.computeLabel=s=>s.label??s.name;
    form.addEventListener('value-changed',event=>{
      event.stopPropagation();
      const current=path.split('.').reduce((v,k)=>v?.[k],this._rawConfig)??{};
      const updated={...current};
      for(const field of schema) { if(Object.hasOwn(event.detail.value,field.name)) updated[field.name]=field.name==='show_date' ? (event.detail.value[field.name]===true||event.detail.value[field.name]==='true') : event.detail.value[field.name]; else delete updated[field.name]; }
      this._change(path,updated);
      if((path==='weather' && updated.mode!==current.mode)||(path==='day_night' && updated.mode!==current.mode))this._render();
    });
    parent.append(form);this._forms.push(form);return form;
  }
  _button(parent,title,action,disabled=false) {
    const button=document.createElement('button');button.type='button';button.textContent=title==='Add New Card'?'+':title;button.disabled=disabled;if(title==='↑'||title==='↓')button.setAttribute('aria-label',title==='↑'?'Move card up':'Move card down');if(title==='Add New Card'){button.setAttribute('aria-label','Add New Card');button.title='Add New Card';button.className='add-card-button';}button.addEventListener('click',action);parent.append(button);
  }
  _card(parent,path,config) {
    const editor=document.createElement('hui-card-element-editor');
    editor.hass=this._hass;editor.lovelace=this.lovelace;editor.value=structuredClone(config);
    editor.addEventListener('config-changed',event=>{
      event.stopPropagation();
      if(event.detail?.error) this._childErrors.set(path,event.detail.error); else this._childErrors.delete(path);
      if(event.detail?.config && !event.detail.error) this._change(path,event.detail.config);
      this._validate();
      this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:structuredClone(this._rawConfig),error:this._error||[...this._childErrors.values()].join(' ')||undefined,guiModeAvailable:true},bubbles:true,composed:true}));
    });
    editor.addEventListener('GUImode-changed',event=>event.stopPropagation());
    parent.append(editor);this._forms.push(editor);

  }
  _selector(parent,label,value,options,onChange) {
    const form=document.createElement('ha-form');form.hass=this._hass;
    form.schema=[{name:'selection',label,required:true,selector:{select:{mode:'dropdown',options:options.map(option=>Array.isArray(option)?{value:option[0],label:option[1]}:option)}}}];
    form.data={selection:value};form.computeLabel=s=>s.label;
    form.addEventListener('value-changed',event=>{event.stopPropagation();onChange(event.detail.value.selection);});
    parent.append(form);this._forms.push(form);return form;
  }
  async _loadImages(force=false) {
    if(!this._hass?.callWS || (!force && this._imageConnection===this._hass.connection))return;
    this._imageConnection=this._hass.connection;
    try {
      const images=await this._hass.callWS({type:'image/list'});
      if(!Array.isArray(images))throw Error('Invalid image list.');
      this._images=images.filter(image=>/^[a-f0-9]{32}$/.test(image.id)&&['image/jpeg','image/png','image/gif'].includes(image.content_type));this._imagesError='';
    } catch {this._imagesError='Uploaded images could not be listed. Check your HA connection and permissions, then retry.';}
    if(this.isConnected)this._render();
  }
  _backgroundControls(parent) {
    const current=this._rawConfig.background?.day??'';
    let currentURL;try {currentURL=new URL(current,window.location.href).href;} catch {currentURL=current;}
    const selected=!current ? BACKGROUND_IMAGES[0] : [...BACKGROUND_IMAGES,ANIMATED_BACKGROUND].find(image=>image.value===current || (image.value && current && currentURL===image.value) || (image.value==='default' && current && currentURL===BACKGROUND));
    const choice=this._backgroundChoice??selected?.value??'custom';
    this._selector(parent,'Background Image',choice,[...BACKGROUND_IMAGES,{value:'custom',label:'Custom Image'},ANIMATED_BACKGROUND],value=>{
      this._backgroundChoice=value;
      if(value!=='custom')this._change('background',{...this._rawConfig.background,day:value==='default'?'':value,night:value==='default'?'':value},true);
      else this._render();
    });
    if(choice!=='custom')return;
    const note=document.createElement('p');note.textContent='Uploads are saved in Home Assistant’s image library.';parent.append(note);
    const row=document.createElement('div');row.className='upload-row';parent.append(row);
    const options=(this._images??[]).map(image=>({value:`/api/image/serve/${image.id}/original`,label:image.name}));
    if(current && !selected && !options.some(option=>option.value===current || new URL(option.value,window.location.href).href===currentURL))options.unshift({value:current,label:'Current custom image'});
    const uploaded=options.find(option=>option.value===current || new URL(option.value,window.location.href).href===currentURL);
    if(options.length)this._selector(row,'Uploaded Image',uploaded?.value??'',options,value=>this._change('background',{...this._rawConfig.background,day:value,night:value}));
    const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/gif';input.hidden=true;
    input.addEventListener('change',()=>{this._pendingUpload=input.files?.[0];this._uploadError='';this._render();});parent.append(input);
    this._button(row,'Upload',()=>input.click(),this._uploading);
    if(this._pendingUpload) {
      const pending=document.createElement('p');pending.textContent=this._pendingUpload.name;parent.append(pending);
      this._button(parent,this._uploading?'Uploading…':'Save image',()=>this._uploadImage(),this._uploading);
      this._button(parent,'Cancel upload',()=>{this._pendingUpload=undefined;this._uploadError='';this._render();},this._uploading);
    }
    this._imageStatus=document.createElement('p');this._imageStatus.className='upload-status';this._imageStatus.setAttribute('role','status');this._imageStatus.textContent=this._uploadError||this._imagesError||'';parent.append(this._imageStatus);
    if(this._imagesError)this._button(parent,'Retry image list',()=>this._loadImages(true));
  }
  async _uploadImage() {
    const file=this._pendingUpload;if(!file || this._uploading)return;
    if(!['image/jpeg','image/png','image/gif'].includes(file.type) || file.size>10*1024*1024 || !file.size) {this._uploadError='Choose a JPEG, PNG or GIF image smaller than 10 MB.';this._render();return;}
    this._uploading=true;this._uploadError='';this._render();
    try {
      const data=new FormData();data.append('file',file);
      const response=await this._hass.fetchWithAuth('/api/image/upload',{method:'POST',body:data});
      if(!response.ok)throw Error(response.status===413?'The image is too large (maximum 10 MB).':'Image upload failed. Check the file, HA connection and permissions.');
      const image=await response.json();if(!/^[a-f0-9]{32}$/.test(image.id))throw Error('HA returned an invalid image ID.');
      this._images=[...(this._images??[]).filter(item=>item.id!==image.id),image];this._pendingUpload=undefined;
      this._change('background',{...this._rawConfig.background,day:`/api/image/serve/${image.id}/original`,night:`/api/image/serve/${image.id}/original`});
    } catch(error) {this._uploadError=error.message;}
    finally {this._uploading=false;if(this.isConnected)this._render();}
  }
  _list(parent,path,notification=false) {
    const items=path.split('.').reduce((v,k)=>v?.[k],this._rawConfig)??[];
    if(!Array.isArray(items)) { const note=document.createElement('p');note.textContent='This page list is invalid. Repair it with Show code editor.';parent.append(note);return; }
    items.forEach((item,index)=>{
      if(!item || typeof item!=='object' || Array.isArray(item)) { const note=document.createElement('p');note.textContent=`Page ${index+1} is invalid. Repair it with Show code editor.`;parent.append(note);return; }
      const box=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=item.name||`Page ${index+1}`;box.append(legend);parent.append(box);
      const schema=[{name:'id',label:'Unique page ID',selector:{text:{}}},{name:'name',label:'Name',selector:{text:{}}}];
      if(notification) schema.push({name:'seconds',label:'Duration (seconds)',selector:{number:{min:5,max:600,mode:'box'}}});
      else schema.push({name:'icon',label:'Icon',selector:{icon:{}}});
      const form=this._form(box,`${path}.${index}`,schema,{destination:'internal',seconds:30});
      form.addEventListener('value-changed',()=>{const updated=path.split('.').reduce((v,k)=>v?.[k],this._rawConfig)?.[index];if(updated?.destination!==item.destination)this._render();});
      if(notification || (item.destination??'internal')==='internal')this._card(box,`${path}.${index}.card`,item.card??{type:'markdown',content:'New page'});
      const move=delta=>{const copy=structuredClone(path.split('.').reduce((v,k)=>v?.[k],this._rawConfig));[copy[index],copy[index+delta]]=[copy[index+delta],copy[index]];this._change(path,copy,true);};
      this._button(box,'Move up',()=>move(-1),index===0);this._button(box,'Move down',()=>move(1),index===items.length-1);
      this._button(box,'Remove',()=>this._change(path,path.split('.').reduce((v,k)=>v?.[k],this._rawConfig).filter((_,i)=>i!==index),true));
    });
    this._button(parent,notification?'Add notification page':'Add button',()=>{
      const current=path.split('.').reduce((v,k)=>v?.[k],this._rawConfig)??[];
      let n=1;while(current.some(p=>p.id===`page-${n}`))n++;
      const item={id:`page-${n}`,name:`Page ${n}`,card:{type:'markdown',content:'New page'}};
      if(notification)item.seconds=30;else{item.icon=['mdi:view-grid','mdi:camera','mdi:weather-night','mdi:web'][current.length];item.destination='internal';}
      this._change(path,[...current,item],true);
    },!notification&&items.length>=4);
  }
  _previewPage(page) {
    const dialog=editorDialog(this);if(dialog)dialog.dataset.sidekickPage=page;
    window.dispatchEvent(new CustomEvent('sidekick-editor-page',{detail:{dialog:editorDialog(this),page}}));
  }
  _pageEditor(index) {
    const items=this._rawConfig.sidebar?.buttons??[];
    const item=items[index];
    const parent=document.createElement('div');parent.className='page-editor';this.shadowRoot.append(parent);
    if(!item){this._button(parent,'Create page',()=>{const copy=structuredClone(items);let n=1;while(copy.some(p=>p.id===`page-${n}`))n++;this._editorTab=`page-${copy.length}`;copy.push({id:`page-${n}`,name:`Page ${index+1}`,icon:['mdi:view-grid','mdi:camera','mdi:weather-night','mdi:web'][copy.length],enabled:true,destination:'internal',card:{type:'vertical-stack',cards:[]}});this._change('sidebar.buttons',copy,true);});this._previewPage('home');return;}
    const row=document.createElement('div');row.className='columns two';parent.append(row);
    this._selector(row,'Show in navbar',item.enabled===false?'off':'on',[['on','On (Default)'],['off','Off']],value=>this._change(`sidebar.buttons.${index}.enabled`,value==='on',true));
    const iconForm=this._form(row,`sidebar.buttons.${index}`,[{name:'icon',label:'Icon',selector:{icon:{}}}],{});
    iconForm.addEventListener('value-changed',()=>{const tab=this.shadowRoot.querySelector(`[data-page-index="${index}"] ha-icon`);tab?.setAttribute('icon',this._rawConfig.sidebar.buttons[index].icon);});
    if(item.enabled===false){this._previewPage('home');return;}
    this._form(parent,`sidebar.buttons.${index}`,[{name:'name',label:'Page name',selector:{text:{}}}],{});
    const stacked=item.card?.type==='vertical-stack';
    const cards=stacked?item.card.cards??[]:item.card?[item.card]:[];
    const currentCards=()=>{const card=this._rawConfig.sidebar.buttons[index].card;return card?.type==='vertical-stack'?card.cards??[]:card?[card]:[];};
    const save=next=>{const current=this._rawConfig.sidebar.buttons[index].card;this._change(`sidebar.buttons.${index}.card`,current?.type==='vertical-stack'?{...current,cards:next}:{type:'vertical-stack',cards:next},true);};
    cards.forEach((card,i)=>{
      const details=document.createElement('details');details.className='subsection card-section';
      const summary=document.createElement('summary');summary.textContent=card.title||card.name||`${card.type||'New Card'} ${i+1}`;details.append(summary);const entry=document.createElement('div');entry.className='card-entry';entry.append(details);parent.append(entry);
      const tools=document.createElement('div');tools.className='card-tools';entry.append(tools);
      tools.append(installCardReorder(entry,i,(from,to)=>{const copy=structuredClone(currentCards());if(to<0||to>=copy.length||from===to)return;const [moved]=copy.splice(from,1);copy.splice(to,0,moved);save(copy);}));
      this._card(details,stacked?`sidebar.buttons.${index}.card.cards.${i}`:`sidebar.buttons.${index}.card`,card);
      this._button(details,'Remove card',()=>save(currentCards().filter((_,j)=>j!==i)));
    });
    this._button(parent,'Add New Card',()=>openCardPicker(this.shadowRoot,card=>save([...currentCards(),card]),this._hass));
    this._previewPage(item.id);
  }
  _editorTabs() {
    const selected=this._editorTab??'home';
    const tabs=document.createElement('div');tabs.className='editor-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Sidekick settings');this.shadowRoot.append(tabs);
    const choices=[['home','mdi:home','Home'],...[0,1,2,3].map(i=>[`page-${i}`,this._rawConfig.sidebar?.buttons?.[i]?.icon??['mdi:view-grid','mdi:camera','mdi:weather-night','mdi:web'][i],this._rawConfig.sidebar?.buttons?.[i]?.name??`Page ${i+1}`]),['notifications','mdi:bell-outline','Notifications'],['settings','mdi:cog','Shared settings']];
    const indicator=document.createElement('span');indicator.className='tab-selection';indicator.setAttribute('aria-hidden','true');tabs.append(indicator);
    const position=Math.max(0,choices.findIndex(c=>c[0]===selected))*44;indicator.style.transform=`translateX(${position}px)`;
    if(this._tabAnimationFrom!==undefined && !window.matchMedia('(prefers-reduced-motion: reduce)').matches)indicator.animate([{transform:`translateX(${this._tabAnimationFrom}px)`},{transform:`translateX(${position}px)`}],{duration:220,easing:'ease-out'});this._tabAnimationFrom=undefined;
    for(const [id,icon,label] of choices){const button=document.createElement('button');button.type='button';button.title=label;button.setAttribute('aria-label',label);button.setAttribute('role','tab');button.setAttribute('aria-selected',String(id===selected));if(id.startsWith('page-'))button.dataset.pageIndex=id.slice(5);const image=document.createElement('ha-icon');image.setAttribute('icon',icon);button.append(image);button.addEventListener('click',()=>{if(this._childErrors.size)return;this._tabAnimationFrom=position;this._editorTab=id;this._render();});tabs.append(button);}
    return selected;
  }
  _render() {
    if(!this._rawConfig)return;
    const open=new Set([...this.shadowRoot.querySelectorAll('details[open]')].map(d=>d.querySelector('summary').textContent));
    this._forms=[];this._childErrors.clear();this.shadowRoot.replaceChildren();
    const style=document.createElement('style');style.textContent=':host{display:block;color:var(--primary-text-color);font:14px system-ui}details{border:1px solid var(--divider-color,#ccc);border-radius:12px;margin:12px 0;padding:14px}summary{cursor:pointer;font-weight:600;font-size:16px;min-height:28px}details.subsection{border:0;border-top:1px solid var(--divider-color,#ddd);border-radius:0;margin:8px 0 0;padding:8px 0 0}details.subsection>summary{font-size:14px;font-weight:500;min-height:24px;color:var(--secondary-text-color,#888);opacity:.75}p{line-height:1.5}ha-form{display:block}fieldset{min-width:0;border:1px solid var(--divider-color,#ccc);border-radius:8px;margin:12px 0;padding:12px}button{min-height:40px;padding:8px 12px;margin:6px 6px 0 0;cursor:pointer;border-radius:8px;border:1px solid var(--divider-color,#ccc);background:var(--card-background-color,#fff);color:var(--primary-text-color)}button:disabled{opacity:.3;cursor:default}.columns{display:grid;gap:12px}.columns.two{grid-template-columns:repeat(2,minmax(0,1fr))}.columns.three{grid-template-columns:repeat(3,minmax(0,1fr))}.columns>*{min-width:0}.upload-row{display:flex;align-items:end;gap:10px}.upload-row ha-form{flex:1;min-width:0}.upload-row button{flex-shrink:0;margin:0 0 8px}.upload-status{overflow-wrap:anywhere}.editor-tabs{display:flex;gap:4px;max-width:100%;justify-content:flex-start;position:relative;border-bottom:1px solid var(--divider-color,#ddd);padding-bottom:6px}.editor-tabs button{width:40px;height:40px;min-width:0;padding:8px;margin:0;border:0;border-radius:50%;flex:0 0 40px;position:relative;z-index:1;background:transparent}.editor-tabs button[aria-selected=true]{color:#fff;background:transparent;box-shadow:none}.tab-selection{position:absolute;left:0;top:0;width:40px;height:40px;border-radius:50%;background:var(--primary-color,#03a9f4);pointer-events:none}.editor-tabs ha-icon{--mdc-icon-size:24px}.card-section{margin-top:12px!important}.card-tools{display:flex;gap:4px;justify-content:flex-end}.card-tools button{min-height:32px;margin:0;padding:4px 9px}.settings-group{margin:16px 0}.settings-group h3{font-size:14px;font-weight:500;color:var(--secondary-text-color,#888);margin:16px 0 8px}.settings-group>.columns+.columns{margin-top:12px}.background-advanced{border:0;padding:0;margin:18px 0 0}.background-advanced>summary{font-size:14px;font-weight:500;color:var(--secondary-text-color,#888);min-height:32px}.background-advanced>.columns{margin-top:12px}.settings-subgroup+.settings-subgroup{margin-top:24px}.weather-fields{align-items:end}.settings-subgroup h4{font-size:14px;color:var(--secondary-text-color,#888);font-weight:500;margin:16px 0 8px}.page-editor{display:grid;gap:14px;margin-top:14px}.settings-group>ha-form+ha-form,.settings-group fieldset>ha-form+ha-form{margin-top:12px}.card-entry{position:relative;border:0;border-radius:12px;overflow:hidden;background:#f4f6f8}.card-entry details.card-section{border:0;margin:0!important;padding:0}.card-entry details.card-section>summary{box-sizing:border-box;padding:12px 92px 12px 16px;min-height:56px;font-size:14px;font-weight:600;display:flex;align-items:center;gap:12px;list-style:none;color:var(--primary-text-color);opacity:1;background:transparent}.card-entry .card-tools{position:absolute;right:16px;top:12px;gap:8px}.card-entry .card-tools button{border:0;background:transparent;color:#333;font-size:20px;font-weight:600;padding:4px 8px}.card-entry summary::before{content:"›";font-size:24px;line-height:1;transition:transform .15s}.card-entry details[open]>summary::before{transform:rotate(90deg)}.card-entry summary::-webkit-details-marker{display:none}.card-entry details.card-section>hui-card-element-editor{display:block;padding:16px;--ha-color-form-background:#fff;--ha-color-form-background-hover:#f8f9fa}.card-entry details.card-section>button,.card-entry details.card-section>p{margin:12px}.card-entry details.card-section>button:last-child{display:block;margin:8px 16px 16px auto;font-size:14px;font-weight:400;color:var(--error-color,#b3261e);border:0;background:transparent}.card-entry summary:hover{background:rgba(0,0,0,.045)}.card-entry summary:focus-visible,.editor-tabs button:focus-visible{outline:2px solid var(--primary-color,#009ac7);outline-offset:-2px}.card-tools button:not(:disabled):hover{background:rgba(0,0,0,.08)}.card-entry button:not(:disabled):hover{background:rgba(0,0,0,.06)}.editor-tabs button:not([aria-selected=true]):hover{background:rgba(0,0,0,.06)}.add-card-button{justify-self:start;min-height:36px;height:36px;width:36px;margin:0;border:1px dashed var(--primary-color,#009ac7);border-radius:12px;background:transparent;color:#333;font-size:20px;font-weight:400;padding:0}.add-card-button:hover{background:rgba(0,154,199,.06)}.card-entry.drag-over{outline:2px dashed var(--primary-color,#009ac7);outline-offset:3px}.card-tools .card-drag-handle{cursor:grab;font-size:22px;font-weight:400}.card-tools .card-drag-handle:active{cursor:grabbing}';this.shadowRoot.append(style);
    const tab=this._editorTabs();
    this._status=document.createElement('p');this._status.setAttribute('role','status');this.shadowRoot.append(this._status);this._validate();
    const text=(name,label)=>({name,label,selector:{text:{}}});
    const number=(name,label,min,max)=>({name,label,selector:{number:{min,max,mode:'box'}}});
    const bool=(name,label)=>({name,label,selector:{boolean:{}}});
    const select=(name,label,options)=>({name,label,required:true,selector:{select:{mode:'dropdown',options:options.map(o=>Array.isArray(o)?{value:o[0],label:o[1]}:o)}}});
    const entity=(name,label,domain)=>({name,label,selector:{entity:domain?{domain}:{}}});
    const defaults=normalizeDisplay({});
    const background=this._section('Background');background.hidden=tab!=='settings';
    this._backgroundControls(background);
    const advanced=document.createElement('details');advanced.className='background-advanced';const advancedTitle=document.createElement('summary');advancedTitle.textContent='Advanced settings';advanced.append(advancedTitle);background.append(advanced);
    const two=document.createElement('div');two.className='columns two';advanced.append(two);
    this._form(two,'background',[select('fit','Image Fit',[['fill','Fill'],['fit','Fit']])],defaults.background);
    this._form(two,'background',[text('color','Fallback CSS color')],defaults.background);
    const three=document.createElement('div');three.className='columns three';advanced.append(three);
    for(const [name,label] of [['position_x','Horizontal Pos.'],['position_y','Vertical Pos.'],['darkening','Darkening']])this._form(three,'background',[number(name,label,0,100)],defaults.background);
    const clock=this._section('Clock & Weather');clock.hidden=tab!=='home';clock.querySelector('h3').remove();
    const clockSettings=this._subsection(clock,'Clock');
    const clockFields=document.createElement('div');clockFields.className='columns two';clockSettings.append(clockFields);
    for(const field of [select('format','Time format',[['12','12 Hour (Default)'],['24','24 Hours']]),select('font','Clock Font',[['system','System (Default)'],['rounded','Rounded'],['monospace','Monospace']]),text('color','Clock CSS color'),number('scale','Clock size',75,150)])this._form(clockFields,'clock',[field],defaults.clock);
    const dateSettings=this._subsection(clock,'Date');
    this._form(dateSettings,'clock',[select('show_date','Show Date',[['true','On (Default)'],['false','Off']])],defaults.clock);
    const weatherSettings=this._subsection(clock,'Weather');
    const weatherFields=document.createElement('div');weatherFields.className='columns two weather-fields';weatherSettings.append(weatherFields);
    this._form(weatherFields,'weather',[select('mode','Show Weather',[['condition','Temp & Condition (Default)'],['temperature','Temp Only'],['off','Off']])],defaults.weather);
    if((this._rawConfig.weather?.mode??'condition')!=='off')this._form(weatherFields,'weather',[entity('entity','','weather')],defaults.weather);
    const styling=this._section('Styling');styling.hidden=true;
    this._form(styling,'appearance',[select('mode','Appearance',[['auto','Auto (Default)'],['light','Light'],['dark','Dark']])],{mode:'auto'});
    this._form(styling,'card_style',[number('corner_radius','Card Corners',0,64)],{corner_radius:12});
    const nightSchema=[select('mode','Mode',[['auto','Auto (Default)'],['day','Day'],['night','Night'],['entity','Custom Entity']])];
    if(this._rawConfig.day_night?.mode==='entity')nightSchema.push(entity('entity','Custom Entity'),bool('invert','Invert entity'));
    nightSchema.push(number('dimming','Night dimming',0,90));
    this._form(styling,'day_night',nightSchema,defaults.day_night);
    const navbar=this._section('Navbar');navbar.hidden=tab!=='settings';
    const sidebar=this._rawConfig.sidebar??{};
    const navbarChoices=document.createElement('div');navbarChoices.className='columns two';navbar.append(navbarChoices);
    this._selector(navbarChoices,'Navbar Style',sidebar.enabled!==true?'none':(sidebar.style==='standard'?'white':sidebar.style??'white'),[['white','Light (Default)'],['dark','Dark'],['glass','Transparent'],['refracting','Glass'],['none','None']],value=>this._change('sidebar',{...this._rawConfig.sidebar,...(value==='none'?{enabled:false}:{enabled:true,style:value})},true));
    if(sidebar.enabled===true) {
      const scale=sidebar.scale??100;
      this._selector(navbarChoices,'Size',[75,100,125].includes(scale)?String(scale):'', [['100','Medium (Default)'],['75','Small'],['125','Large']],value=>this._change('sidebar',{...this._rawConfig.sidebar,scale:Number(value)},true));
      if(![75,100,125].includes(scale)) {const note=document.createElement('p');note.textContent=`Current YAML: ${scale}%. Choose an option to change it.`;navbar.append(note);}
      const navbarBehavior=document.createElement('div');navbarBehavior.className='columns two';navbar.append(navbarBehavior);
      this._form(navbarBehavior,'sidebar',[select('side','Side',[['right','Right (Default)'],['left','Left']])],{...defaults.sidebar,...this._config?.sidebar,side:'right'});
      const seconds=this._rawConfig.idle_return?.seconds??15;
      this._selector(navbarBehavior,'Auto Return Home',[15,20,30,60,0].includes(seconds)?String(seconds):'', [['15','After 15 Seconds (Default)'],['20','After 20 Seconds'],['30','After 30 Seconds'],['60','After 1 minute'],['0','Never']],value=>this._change('idle_return',{...this._rawConfig.idle_return,seconds:Number(value)},true));
      if(![15,20,30,60,0].includes(seconds)) {const note=document.createElement('p');note.textContent=`Current YAML: ${seconds} seconds. Choose an option to change it.`;navbar.append(note);}
      // Individual pages are edited through their icon tabs.
    }
    if(tab==='notifications'){const note=document.createElement('p');note.textContent='Coming soon';this.shadowRoot.append(note);}
    if(tab.startsWith('page-'))this._pageEditor(Number(tab.slice(5)));else this._previewPage('home');
    for(const details of this.shadowRoot.querySelectorAll('details')) details.open=open.has(details.querySelector('summary').textContent);
  }
}
if (!customElements.get('sidekick-display-editor')) customElements.define('sidekick-display-editor',SidekickDisplayEditor);
if (!customElements.get('sidekick-display')) customElements.define('sidekick-display',SidekickDisplay);
window.customCards = window.customCards || [];
if (!window.customCards.some(card => card.type === 'sidekick-display')) window.customCards.push({type:'sidekick-display',name:'Sidekick Display',description:'Small-screen clock, weather, embedded HA pages and targeted temporary pages with visual configuration.',preview:true});

function installNavigation(card) {
  if(!card.shadowRoot.querySelector("nav"))return;
  const look=card._config.sidebar.style,appleLook=look==='refracting';
let slowMotion=1.25;
let motionDuration=400;
let refreshLens=()=>{};
if(appleLook){const style=document.createElement('style');style.textContent=`nav.glass .selection{background:linear-gradient(135deg,#ffffff38,#ffffff08),rgba(255,255,255,.10);box-shadow:inset 0 1px 0 #ffffff70,inset 0 -1px 0 #18312e25,0 2px 6px #071b2612}nav button[aria-current="page"]{color:#2b7470}`;card.shadowRoot.append(style);}
if(appleLook){
  // Local experiment: a foreground lens samples the icons below it.
  const root=card.shadowRoot,nav=root.querySelector('nav'),selection=nav.querySelector('.selection');
  const ns='http://www.w3.org/2000/svg',size=card._buttonSize;
  const map=document.createElement('canvas');map.width=map.height=128;
  const ctx=map.getContext('2d'),pixels=ctx.createImageData(128,128);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
    const dx=(x-63.5)/63.5,dy=(y-63.5)/63.5,r=Math.hypot(dx,dy),bend=r<1?Math.sin(Math.PI*r)*.42:0,i=(y*128+x)*4;
    pixels.data[i]=128-dx*bend*127;pixels.data[i+1]=128-dy*bend*127;pixels.data[i+2]=128;pixels.data[i+3]=255;
  }
  ctx.putImageData(pixels,0,0);
  const lens=document.createElementNS(ns,'svg');lens.setAttribute('viewBox',`0 0 ${size} ${size}`);lens.setAttribute('aria-hidden','true');
  lens.style.cssText=`position:absolute;left:8px;top:8px;width:${size}px;height:${size}px;pointer-events:none;z-index:3;overflow:visible;transform-origin:center`;
  lens.innerHTML=`<defs><clipPath id="lens-edge"><circle cx="${size/2}" cy="${size/2}" r="${size/2}"/></clipPath><filter id="refraction" x="0" y="0" width="${size}" height="${size}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feImage href="${map.toDataURL()}" x="0" y="0" width="${size}" height="${size}" result="bend"/><feDisplacementMap in="SourceGraphic" in2="bend" scale="24" xChannelSelector="R" yChannelSelector="G"/></filter></defs><g clip-path="url(#lens-edge)"><g filter="url(#refraction)" class="sample"/></g>`;
  nav.append(lens);
  const displacement=lens.querySelector('feDisplacementMap');
  const sample=lens.querySelector('.sample'),buttons=[...nav.querySelectorAll('button')];
  const copies=buttons.map(button=>{const sampleIcon=document.createElementNS(ns,'foreignObject');sampleIcon.setAttribute('width','26');sampleIcon.setAttribute('height','26');const icon=document.createElement('ha-icon');icon.setAttribute('icon',button.querySelector('ha-icon').getAttribute('icon'));icon.style.cssText='display:block;width:26px;height:26px;--mdc-icon-size:26px';sampleIcon.append(icon);sample.append(sampleIcon);return sampleIcon;});
  let until=0,raf=0;
  function draw(){
    if(!nav.isConnected){raf=0;return;}
    // Keep the moving lens expressive, then ease down to gentle resting magnification.
    const remaining=Math.max(0,until-performance.now()),strength=Math.min(1,remaining/(motionDuration*.3));
    displacement.setAttribute('scale',String(8+16*strength*strength*(3-2*strength)));
    const matrix=new DOMMatrixReadOnly(getComputedStyle(selection).transform),sy=matrix.m22,sx=matrix.m11,centerY=8+size/2+matrix.m42;
    lens.style.transform=matrix.toString();
    buttons.forEach((button,i)=>{
      const buttonTop=8+i*(size+8),y=buttonTop+size/2;
      copies[i].setAttribute('x',String((size-26)/2));copies[i].setAttribute('y',String((y-centerY)/sy+(size-26)/2));copies[i].style.color=getComputedStyle(button).color;
      button.style.maskImage=`radial-gradient(ellipse ${size*sx/2}px ${size*sy/2}px at ${size/2}px ${centerY-buttonTop}px,transparent calc(100% - .5px),black 100%)`;
    });
    raf=performance.now()<until?requestAnimationFrame(draw):0;
  }
  const previous=card._navigate.bind(card);card._navigate=page=>{previous(page);until=performance.now()+motionDuration*1.15;if(!raf)raf=requestAnimationFrame(draw);};
  refreshLens=()=>{until=performance.now()+motionDuration*1.15;if(!raf)raf=requestAnimationFrame(draw);};
  draw();
}

const timedNavigate=card._navigate.bind(card);card._navigate=page=>{
  const buttons=[...card.shadowRoot.querySelectorAll('nav button')],selection=card.shadowRoot.querySelector('.selection'),current=new DOMMatrixReadOnly(getComputedStyle(selection).transform).m42,target=Math.max(0,buttons.findIndex(button=>button.dataset.page===page))*(card._buttonSize+8);
  motionDuration=Math.min(640,400+Math.max(0,Math.abs(target-current)/(card._buttonSize+8)-1)*80)*slowMotion;
  timedNavigate(page);card._selectionAnimation?.effect.updateTiming({duration:motionDuration});
};
{
  const nav=card.shadowRoot.querySelector('nav'),selection=nav.querySelector('.selection'),buttons=[...nav.querySelectorAll('button')],step=card._buttonSize+8;
  nav.style.touchAction='none';nav.style.userSelect='none';
  let drag=null,suppressClick=false;
  nav.addEventListener('pointerdown',event=>{
    suppressClick=false;if(event.button!==0)return;
    const rect=nav.getBoundingClientRect(),scale=rect.height/nav.offsetHeight,y=(event.clientY-rect.top)/scale;
    const position=new DOMMatrixReadOnly(getComputedStyle(selection).transform).m42;
    if(Math.abs(y-(8+card._buttonSize/2+position))>card._buttonSize/2)return;
    drag={id:event.pointerId,start:event.clientY,position,scale,moved:false};
    nav.setPointerCapture(event.pointerId);
  });
  nav.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    const delta=(event.clientY-drag.start)/drag.scale;
    if(!drag.moved&&Math.abs(delta)<5)return;
    drag.moved=true;card._selectionAnimation?.cancel();
    selection.style.transform=`translateY(${Math.max(0,Math.min((buttons.length-1)*step,drag.position+delta))}px)`;
    refreshLens();
  });
  function finish(event,cancelled=false){
    if(!drag||event.pointerId!==drag.id)return;
    const moved=drag.moved;drag=null;
    if(nav.hasPointerCapture(event.pointerId))nav.releasePointerCapture(event.pointerId);
    if(!moved)return;suppressClick=true;
    const current=new DOMMatrixReadOnly(getComputedStyle(selection).transform).m42;
    const index=cancelled?buttons.findIndex(button=>button.dataset.page===card._page):Math.round(current/step),page=buttons[index].dataset.page;
    if(page!==card._page || card._temporary)card._navigate(page);
    else{
      const end=index*step;selection.style.transform=`translateY(${end}px)`;
      motionDuration=220*slowMotion;
      if(!matchMedia('(prefers-reduced-motion: reduce)').matches)card._selectionAnimation=selection.animate([{transform:`translateY(${current}px)`},{transform:`translateY(${end}px)`}],{duration:motionDuration,easing:'ease-out'});
      refreshLens();
    }
  }
  nav.addEventListener('pointerup',event=>finish(event));
  nav.addEventListener('pointercancel',event=>finish(event,true));
  nav.addEventListener('lostpointercapture',event=>finish(event,true));
  nav.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopImmediatePropagation();suppressClick=false;}},true);
}
}
