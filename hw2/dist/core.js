export const studies={
 drive:{id:'drive',title:'兔兔驾驶舱',english:'ATTENTION IN ORBIT',tag:'W5 · 选择性注意',color:'mint',icon:'↗',time:'约 5–7 分钟',brief:'前方的星路、仪表与包裹信号，哪一个先吸引你的注意？',question:'重要的信息，总会被看见吗？',source:'Horrey, Wickens & Consalus · 2006',doi:'https://doi.org/10.1037/1076-898X.12.2.67',theory:'SEEV 注意分配',conditions:['普通仪表','注视自适应仪表'],description:'同向慢速小火箭挡路时按空格；对向车道飞来的火箭不要按键。温度达到 80°C 按 J，速度超过 80 km/h 按 K。每块指定道路或温度为优先任务：优先事件 3 分，另一类 2 分，超速始终 1 分。道路/温度优先级换块前会说明规则。火箭没有文字提示；右下方温度与速度仪表显示当前读数，自适应条件仅在未采样到告警仪表时增强外圈。',prediction:'基于 SEEV 的价值 V，道路优先预计增加道路区域采样；结合显著性 S，仪表事件出现后 600 ms 仍未采样到该仪表时增强外圈，预测其相对普通仪表降低仪表事件反应时和漏报。奖励权重仅是任务价值的操作化，不等于完整模型拟合。',design:'任务优先级（道路 / 仪表）× 提示（无 / 有）× 事件类型（同向火箭 / 温度 / 超速 / 对向火箭），每格 10 次，共 160 次；事件频率与位置保持不变。',practice:8,count:160},
 map:{id:'map',title:'星图寻路记',english:'FIND YOUR NORTH',tag:'W8 · 空间认知',color:'lavender',icon:'⌁',time:'约 8–12 分钟',brief:'北方一直在那里，但转过身以后，下一站在你的哪边？',question:'地图转动时，我们怎么找到方向？',source:'Aretz · 1991',doi:'https://doi.org/10.1177/001872089103300107',theory:'空间参照系与视觉动量',conditions:['北向上','航向向上','北向上＋注视自适应扇形'],description:'看第一人称街区和右下方的地图。橘色圆点是下一站，箭头是你的航向。判断下一站相对你在左、前、右还是后，按方向键或对应按钮。',prediction:'航向向上预计减小相对方向判断成本；在北向上地图上，未在 600 ms 内采样到地图时增强扇形边界，预计相对普通北向上降低反应时。扇形本身源自 Aretz，改进点是注视触发的增强时机。',design:'3 种地图 × 4 个相对方向，每格 12 次，共 144 次；四种航向作为平衡控制变量。',practice:6,count:144},
 rotate:{id:'rotate',title:'旋转包裹站',english:'A LITTLE TWIST',tag:'W8 · 心理旋转',color:'peach',icon:'⤨',time:'约 8–12 分钟',brief:'转一转脑海中的积木，找到跨越角度的同一个形状。',question:'脑海里的旋转，需要多少时间？',source:'Shepard & Metzler · 1971',doi:'https://doi.org/10.1126/science.171.3972.701',theory:'三维物体心理旋转',conditions:['无共同参照框','有共同参照框'],description:'比较左右两个立体包裹。右边可能是同一形状的旋转，也可能是无法通过旋转重合的镜像。同形按 F，镜像按 J。参照条件显示两侧同尺度网格与 XYZ 轴，无参照条件不显示；模型始终静止，不可拖动。',prediction:'反应时间预计随角度差增加；依据外部空间参照可辅助方向编码的假设，两侧同尺度网格与 XYZ 轴构成的共同参照框预计降低判断成本，具体体现于斜率或截距，需由数据检验。',design:'共同参照框（有 / 无）× 角度（0° / 60° / 120°）× 同形 / 镜像，每格 12 次，共 144 次；每形状在每格出现 3 次。',practice:6,count:144}
};
export function driveReward(event,priority){return event==='oncoming'?0:event==='speed'?1:event===priority?3:2;}
export function evaluateResponse(trial,answer,rt){const anticipatory=rt!==null&&rt<150,correct=answer===trial.answer&&!anticipatory;return {rt,response:answer??(trial.event==='oncoming'?'withheld':'timeout'),anticipatory:+anticipatory,correct:+correct,points:correct?(trial.reward??1):0};}
export function shuffle(a){const r=[...a];for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]];}return r;}
export const tiers={
 quick:{name:'低档 · 快速版',duration:'约 5 分钟',reps:{drive:1,map:1,rotate:1},counts:{drive:16,map:12,rotate:12},eligible:false},
 medium:{name:'中档 · 标准版',duration:'约 15 分钟',reps:{drive:5,map:8,rotate:4},counts:{drive:80,map:96,rotate:48},eligible:false},
 full:{name:'高档 · 完整版',duration:'约 25–35 分钟',reps:{drive:10,map:12,rotate:12},counts:{drive:160,map:144,rotate:144},eligible:true}
};
export function makeTrials(id,practice=false,tier='full'){
 if(!tiers[tier])throw new Error('Unknown trial tier');
 const reps=practice?1:tiers[tier].reps[id];
 let a=[];
 if(id==='drive'){
  // Priority stays constant within a block. Block order is randomized and recorded.
  const priorities=shuffle(['road','panel']);
  priorities.forEach((priority,block)=>{
   let part=[];
   for(let cond=0;cond<2;cond++)for(const event of ['road','panel','speed','oncoming'])for(let k=0;k<reps;k++)part.push({cond,priority,block:block+1,event,reward:driveReward(event,priority),delay:900+Math.floor(Math.random()*1400),answer:event==='road'?'space':event==='panel'?'j':event==='speed'?'k':null,timeout:2600});
   a.push(...shuffle(practice?part.filter(t=>t.cond===['road','panel','speed','oncoming'].indexOf(t.event)%2):part));
  });
  return a;
 }
 if(id==='map')for(let cond=0;cond<3;cond++)for(let relative of [0,90,180,270])for(let k=0;k<reps;k++){
  if(practice&&relative!==cond*90&&relative!==(cond*90+180)%360)continue;
  const heading=((k+relative/90+cond)%4)*90;
  a.push({cond,heading,bearing:(heading+relative)%360,relative,answer:['up','right','down','left'][relative/90],timeout:12000});
 }
 if(id==='rotate')for(let cond=0;cond<2;cond++)for(let angle of [0,60,120])for(const mirror of [false,true])for(let k=0;k<reps;k++){
  if(practice&&Number(mirror)!==(cond+angle/60)%2)continue;
  a.push({cond,angle,mirror,shape:(k+cond+angle/60)%4,answer:mirror?'j':'f',timeout:15000});
 }
 return shuffle(a);
}
export function summarize(trials){const valid=trials.filter(t=>!t.invalid);const correct=valid.filter(t=>t.correct===1&&t.rt!==null&&!t.anticipatory);return{n:valid.length,accuracy:valid.length?Math.round(valid.filter(t=>t.correct===1).length/valid.length*100):0,rt:correct.length?Math.round(correct.reduce((s,t)=>s+t.rt,0)/correct.length):null,invalid:trials.length-valid.length};}
export function slope(trials){const pts=[0,60,120].map(a=>({x:a,y:summarize(trials.filter(t=>t.angle===a)).rt})).filter(p=>p.y!==null);if(pts.length<2)return null;const mx=pts.reduce((s,p)=>s+p.x,0)/pts.length,my=pts.reduce((s,p)=>s+p.y,0)/pts.length;return pts.reduce((s,p)=>s+(p.x-mx)*(p.y-my),0)/pts.reduce((s,p)=>s+(p.x-mx)**2,0);}
export const db={read(){try{return JSON.parse(localStorage.getItem('starparcel.sessions')||'[]');}catch{return[];}},add(s){const all=this.read();all.push(s);try{localStorage.setItem('starparcel.sessions',JSON.stringify(all));return true;}catch{return false;}}};
export function download(name,data,type='application/json'){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function csv(rows){if(!rows.length)return'';const keys=[...new Set(rows.flatMap(Object.keys))];const q=v=>'"'+String(v??'').replaceAll('"','""')+'"';return'\ufeff'+[keys.map(q).join(','),...rows.map(r=>keys.map(k=>q(r[k])).join(','))].join('\r\n');}
