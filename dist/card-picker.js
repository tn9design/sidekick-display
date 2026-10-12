const CARD_CHOICES = [
  {type:'tile',name:'Tile',description:'A compact control for one device.',icon:'mdi:lightbulb-outline',kind:'tile',domains:['light','switch','sensor']},
  {type:'entities',name:'Entities',description:'Several devices or readings in a simple list.',icon:'mdi:format-list-bulleted',kind:'list',domains:['light','switch','sensor']},
  {type:'button',name:'Button',description:'One large button for a device or action.',icon:'mdi:gesture-tap-button',kind:'button',domains:['light','switch']},
  {type:'gauge',name:'Gauge',description:'A numeric reading shown on a curved scale.',icon:'mdi:gauge',kind:'gauge',domains:['sensor']},
  {type:'picture-entity',name:'Camera / Picture',description:'Show a camera feed or an entity image.',icon:'mdi:camera-outline',kind:'camera',domains:['camera']},
  {type:'weather-forecast',name:'Weather',description:'Current weather and a forecast.',icon:'mdi:weather-partly-cloudy',kind:'weather',domains:['weather']},
  {type:'markdown',name:'Text',description:'Add a message, instructions, or formatted text.',icon:'mdi:text-box-outline',kind:'text',domains:[]},
];

export function openCardPicker(parent, onSelect, hass) {
  const dialog=document.createElement('dialog');
  dialog.className='sidekick-card-picker';
  dialog.setAttribute('aria-label','Add New Card');
  dialog.innerHTML=`<style>
.sidekick-card-picker{box-sizing:border-box;width:min(680px,92vw);max-height:85vh;padding:22px;border:1px solid var(--divider-color,#ddd);border-radius:16px;background:var(--card-background-color,#fff);color:var(--primary-text-color,#222);font-family:inherit;overflow:auto}
.sidekick-card-picker::backdrop{background:rgba(0,0,0,.45)}
.sidekick-card-picker header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}
.sidekick-card-picker h2{font-size:20px;margin:0}.sidekick-card-picker .close{border:0;background:transparent;color:inherit;font-size:26px;cursor:pointer;padding:0 8px}
.sidekick-card-picker input{box-sizing:border-box;width:100%;padding:12px;border:1px solid var(--divider-color,#ccc);border-radius:8px;background:var(--secondary-background-color,#fafafa);color:inherit;font:inherit;margin-bottom:16px}
.sidekick-card-picker .choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.sidekick-card-picker .choice{text-align:left;padding:14px;border:1px solid var(--divider-color,#ddd);border-radius:10px;background:var(--card-background-color,#fff);color:inherit;cursor:pointer;font:inherit;min-width:0}
.sidekick-card-picker .choice:hover,.sidekick-card-picker .choice:focus-visible{border-color:var(--primary-color,#03a9f4);outline:2px solid var(--primary-color,#03a9f4);outline-offset:1px}
.sidekick-card-picker strong{display:block;font-size:15px}.sidekick-card-picker p{font-size:13px;color:var(--secondary-text-color,#777);margin:10px 0 0;line-height:1.4}
.sidekick-card-picker .sample{height:78px;display:flex;align-items:center;justify-content:center;gap:12px;margin-top:12px;border-radius:8px;background:var(--secondary-background-color,#f3f5f7);overflow:hidden;pointer-events:none}
.sidekick-card-picker ha-icon{--mdc-icon-size:32px;color:var(--primary-color,#03a9f4)}
.sidekick-card-picker .sample.list{flex-direction:column;gap:7px}.sidekick-card-picker .line{width:72%;height:7px;border-radius:4px;background:var(--divider-color,#ccd2d7)}
.sidekick-card-picker .switch{width:34px;height:18px;border-radius:12px;background:var(--primary-color,#03a9f4)}.sidekick-card-picker .switch:after{content:'';display:block;width:14px;height:14px;border-radius:50%;background:white;margin:2px 2px 2px auto}
.sidekick-card-picker .sample.gauge:before{content:'72';display:grid;place-items:center;box-sizing:border-box;width:70px;height:58px;border:9px solid var(--primary-color,#03a9f4);border-bottom:0;border-radius:60px 60px 0 0;font-size:21px}
.sidekick-card-picker .sample.camera{background:linear-gradient(150deg,#40646b,#1d3038)}.sidekick-card-picker .sample.camera ha-icon{color:#fff}.sidekick-card-picker .sample.text{align-items:flex-start;flex-direction:column;padding:0 18px;gap:7px}
.sidekick-card-picker .empty{grid-column:1/-1}.sidekick-card-picker .note{font-size:12px;margin-top:15px}
@media(max-width:450px){.sidekick-card-picker .choices{grid-template-columns:1fr}}
</style><header><h2>Add New Card</h2><button class="close" type="button" aria-label="Close card picker">×</button></header><input type="search" placeholder="Search cards" aria-label="Search cards"><div class="choices"></div><p class="note">Examples are illustrative. Configure your entities after adding a card.</p>`;
  const choices=dialog.querySelector('.choices');
  const keys=Object.keys(hass?.states??{});
  const configFor=choice=>{
    const entity=choice.domains.flatMap(domain=>keys.filter(key=>key.startsWith(`${domain}.`)))[0]??'';
    if(choice.type==='entities')return {type:'entities',entities:entity?[entity]:[]};
    if(choice.type==='markdown')return {type:'markdown',content:'Your text here'};
    if(choice.type==='gauge')return {type:'gauge',entity,min:0,max:100};
    if(choice.type==='picture-entity')return {type:'picture-entity',entity,camera_view:'live',show_name:false,show_state:false};
    return {type:choice.type,entity};
  };
  const render=query=>{
    choices.replaceChildren();
    for(const choice of CARD_CHOICES.filter(item=>`${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase()))){
      const button=document.createElement('button');button.className='choice';button.type='button';
      button.innerHTML=`<strong>${choice.name}</strong><div class="sample ${choice.kind}">${choice.kind==='list'?'<span class="line"></span><span class="line"></span><span class="line"></span>':choice.kind==='gauge'?'':choice.kind==='text'?'<b>Hello!</b><span class="line"></span>':`<ha-icon icon="${choice.icon}"></ha-icon>${choice.kind==='tile'?'<span class="switch"></span>':choice.kind==='weather'?'<b>72°</b>':''}`}</div><p>${choice.description}</p>`;
      button.addEventListener('click',()=>{dialog.close();onSelect(configFor(choice));});choices.append(button);
    }
    if(!choices.childElementCount){const empty=document.createElement('p');empty.className='empty';empty.textContent='No matching cards.';choices.append(empty);}
  };
  dialog.querySelector('.close').addEventListener('click',()=>dialog.close());
  dialog.querySelector('input').addEventListener('input',event=>render(event.target.value));
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  parent.append(dialog);render('');dialog.showModal();
  return dialog;
}
