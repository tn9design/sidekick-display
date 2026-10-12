export function installStage4Effects(card) {
 const doc=card.ownerDocument,win=doc.defaultView;
 if(!card._installStage4Navigation){
 // Animate resets within the existing timer duration; do not delay expiry.
 for(const [method,animationField] of [['_resetIdle','_idleAnimation'],['_resetTemporaryTimer','_temporaryAnimation']]){
  const reset=card[method];
  card[method]=function(...args){
   if(method==='_resetIdle'&&this._temporary)return reset.apply(this,args);
   const track=this.shadowRoot.querySelector('.idle-track'),progress=track?.firstElementChild;
   const visible=track&&!track.hidden;
   const transform=progress&&win.getComputedStyle(progress).transform;
   const scale=transform&&transform!=='none'?new win.DOMMatrixReadOnly(transform).m11:1;
   const result=reset.apply(this,args),animation=this[animationField];
   if(!visible||track.hidden||!animation||win.matchMedia('(prefers-reduced-motion: reduce)').matches)return result;
   const duration=animation.effect.getTiming().duration;
   const rewind=Math.min(120,duration/4);
   animation.cancel();
   this[animationField]=progress.animate([
    {transform:`scaleX(${Math.max(0,Math.min(1,scale))})`,offset:0,easing:'ease-out'},
    {transform:'scaleX(1)',offset:rewind/duration,easing:'linear'},
    {transform:'scaleX(0)',offset:1}
   ],{duration,easing:'linear',fill:'forwards'});
   return result;
  };
 }
 let stopCameraLoading=()=>{};
 const cameraHeight=(parent,config)=>`${(Math.min(parent.clientWidth-32,720)-24)*9/16+24}px`;
 const renderContent=card._renderContent;
 card._renderContent=function(generation){
  renderContent.call(this,generation);
  const button=this._config.sidebar.buttons.find(b=>b.id===this._page);
  if(!button||!this._isLiveCamera(button.card))return;
  const parent=this.shadowRoot.querySelector('main .page');
  if(!parent||this._child)return;
  const placeholder=doc.createElement('section');
  placeholder.className='notification-card camera';
  placeholder.style.cssText='display:flex;align-items:center;justify-content:center;box-sizing:border-box';
  placeholder.style.height=cameraHeight(parent,button.card);
  placeholder.setAttribute('role','status');placeholder.textContent='Loading camera…';
  parent.replaceChildren(placeholder);
 };
 const mount=card._mount;
 card._mount=async function(generation){
  const target=this._config.sidebar.buttons.find(button=>button.id===this._page);
  if(target&&this._isLiveCamera(target.card))target.card.aspect_ratio='16:9';
  await mount.call(this,generation);
  if(generation!==this._generation||!this._child)return;
  const button=this._config.sidebar.buttons.find(b=>b.id===this._page);
  if(!button||!this._isLiveCamera(button.card))return;
  const child=this._child,parent=child.parentElement;
  if(!parent?.classList.contains('page'))return;
  const backing=doc.createElement('section');
  backing.className='notification-card camera';
  backing.setAttribute('aria-label',button.name||'Camera');
  child.replaceWith(backing);backing.append(child);
  backing.style.position='relative';backing.style.height=cameraHeight(parent,button.card);
  child.style.cssText+=';position:absolute;top:12px;left:12px;width:calc(100% - 24px)';
  child.style.visibility='hidden';
  const message=doc.createElement('div');
  message.setAttribute('role','status');message.setAttribute('aria-live','polite');
  message.textContent='Loading camera…';
  message.style.cssText='position:absolute;inset:12px;display:flex;align-items:center;justify-content:center;text-align:center';
  backing.append(message);
  stopCameraLoading();
  let timer;
  const stop=()=>{clearInterval(timer);child.style.removeProperty('visibility');};
  stopCameraLoading=stop;
  function inspect(){
   if(generation!==card._generation||!backing.isConnected){stop();return;}
   const videos=[];let failed=false;
   function scan(root){if(root.shadowRoot)scan(root.shadowRoot);for(const element of root.querySelectorAll('*')){
    if(element.localName==='video')videos.push(element);
    if(element.textContent?.trim()==='Unable to play media.')failed=true;
    if(element.shadowRoot)scan(element.shadowRoot);
   }}
   scan(child);
   if(videos.some(video=>video.readyState>=2&&video.videoWidth>0&&video.videoHeight>0)){
    stop();message.remove();
    // Keep the same native frame and backing dimensions after playback starts.
   }else if(failed||videos.some(video=>video.error)){
    clearInterval(timer);message.textContent='Camera unavailable';
   }
  }
  timer=setInterval(inspect,250);inspect();
 };

 card._installStage4Navigation=()=>{
 let navigate=card._navigate;let active,homeLayer;
 function settle(){
  if(!active)return;
  const transition=active;active=undefined;
  transition.animations.forEach(animation=>animation.cancel());
  transition.main.replaceChildren(...transition.incoming.childNodes);
  transition.oldChild?.remove();transition.track.remove();
  if(card._page!=='home'&&homeLayer){
   homeLayer.style.cssText='position:absolute;inset:0;opacity:0;pointer-events:none;z-index:0';
   homeLayer.inert=true;homeLayer.setAttribute('aria-hidden','true');
   transition.main.append(homeLayer);
  }
 }
 card._navigate=function(page){
  const target=this._config.sidebar.buttons.find(b=>b.id===page);
  if(page!=='home'&&!target)return;
  settle();
  if(page!==this._page)stopCameraLoading();
  if(card._motionEnabled===false||win.matchMedia('(prefers-reduced-motion: reduce)').matches||this._temporary||page===this._page||(target&&target.destination!=='internal'))return navigate.call(this,page);
  const main=this.shadowRoot.querySelector('main'),height=main.clientHeight,oldChild=this._child,fromHome=this._page==='home',toHome=page==='home';
  if(fromHome)homeLayer=main.querySelector('.home');
  else homeLayer?.remove();
  const slot=top=>{const element=doc.createElement('div');element.style.cssText=`position:absolute;left:0;right:0;top:${top}px;height:${height}px;display:flex;flex-direction:column;overflow:hidden;min-height:0`;return element;};
  const outgoing=slot(0);outgoing.inert=true;outgoing.setAttribute('aria-hidden','true');outgoing.append(...main.childNodes);
  // Preserve the existing child only in its isolated outgoing slot. Normal
  // navigation advances the mount generation and starts the real nav animation.
  this._child=undefined;
  navigate.call(this,page);
  const incoming=slot(toHome?0:height);incoming.append(...main.childNodes);
  if(toHome)homeLayer=incoming.querySelector('.home');
  const track=doc.createElement('div');track.style.cssText='position:absolute;inset:0;min-height:0';
  // Current content is first in DOM order so asynchronous production mounts
  // query its .page, never the previous page's .page.
  track.append(incoming,outgoing);main.style.overflow='hidden';main.append(track);
  const frames=[
   {transform:'translateY(0)',offset:0,easing:'cubic-bezier(.2,.8,.2,1)'},
   {transform:`translateY(-${height}px)`,offset:.7,easing:'ease-in-out'},
   {transform:`translateY(-${height-3}px)`,offset:.85,easing:'ease-out'},
   {transform:`translateY(-${height}px)`,offset:1}
  ];
  const options={duration:400,fill:'both',easing:'linear'};
  let animations;
  if(fromHome||toHome){
   const stationary=fromHome?outgoing:incoming;
   const moving=fromHome?incoming:outgoing;
   stationary.style.zIndex='0';moving.style.zIndex='1';
   if(toHome){homeLayer.style.removeProperty('opacity');homeLayer.style.removeProperty('position');homeLayer.style.removeProperty('inset');homeLayer.style.removeProperty('z-index');homeLayer.style.removeProperty('pointer-events');homeLayer.inert=false;homeLayer.removeAttribute('aria-hidden');}
   animations=[stationary.animate([{opacity:fromHome?1:0},{opacity:fromHome?0:1}],{...options,duration:fromHome?40:400,easing:'ease-out'}),moving.animate(frames,options)];
  }else animations=[track.animate(frames,options)];
  const transition={main,incoming,track,oldChild,animations};active=transition;
  Promise.all(animations.map(animation=>animation.finished)).then(()=>{if(active===transition)settle();}).catch(()=>{});
 };

 card._settlePageTransition=settle;
 card._clearStage4Effects=()=>{stopCameraLoading();settle();homeLayer=undefined;};

 };
 }
 card._installStage4Navigation();
}
