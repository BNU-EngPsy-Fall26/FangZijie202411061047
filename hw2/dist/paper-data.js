// Values transcribed from the original papers, not from other studies or simulated data.
// Missing/unverified values remain null. Seconds are explicitly converted to milliseconds.
import {mean} from './analysis.js';
const rt=rows=>mean(rows.filter(t=>!t.invalid&&t.correct===1&&!t.anticipatory&&typeof t.rt==='number'&&Number.isFinite(t.rt)&&t.rt>=150).map(t=>t.rt));
const originalDrive='https://www.researchgate.net/publication/6981582_Modeling_drivers%27_visual_attention_allocation_while_interacting_with_in-vehicle_technologies';
const originalRotation='https://www.cs.virginia.edu/~evans/cs1120-f09/ps/ps3/mental-rotation.pdf';
export const paperData={
 drive:[
  {id:'panel_road_rt',label:'道路优先：仪表反应时',unit:'ms',original:1700,originalText:'1.70 s = 1700 ms',source:'实验 1，IVT performance 结果段（表 1 对应边际均值）',url:originalDrive,measure:'rt',filter:t=>t.cond===0&&t.priority==='road'&&t.event==='panel',note:'原文为数字串出现至启动口头回答按钮；本项目为常规温度告警至 J 键。任务不同，仅描述对照。'},
  {id:'panel_priority_rt',label:'仪表优先：仪表反应时',unit:'ms',original:760,originalText:'0.76 s = 760 ms',source:'实验 1，IVT performance 结果段（表 1 对应边际均值）',url:originalDrive,measure:'rt',filter:t=>t.cond===0&&t.priority==='panel'&&t.event==='panel',note:'原文为数字串任务；本项目为常规温度告警。未将新增显著提示与原文基线混合。'},
 ],
 map:[0,1,2].flatMap(cond=>[
  {id:'map_'+cond+'_rt',label:['北向上','航向向上','北向上＋注视自适应扇形'][cond]+'：反应时',unit:'ms',original:[3050,2560,2760][cond],originalText:['3.05 s = 3050 ms','2.56 s = 2560 ms','2.76 s = 2760 ms'][cond],source:'Aretz (1991) p.93，ERF and WRF Turns / Response time data',url:'https://doi.org/10.1177/001872089103300107',measure:'rt',filter:t=>t.cond===cond,note:'原文为 ERF/WRF 转向任务、各航向与飞行难度合并的均值；本项目只测四方向判断的正确 RT。原文 wedge 为静态，本版追加注视触发边界增强。仅作跨任务数值参照。'},
 ]),
 rotate:[
  {id:'rotate_zero_rt',label:'无共同参照框、同形 0°：正确 RT',unit:'ms',original:1000,approximate:true,originalText:'约 1 s ≈ 1000 ms',source:'原文 p.703，结果段对 0° 的概述（近似值）',url:originalRotation,measure:'rt',filter:t=>t.cond===0&&!t.mirror&&t.angle===0,note:'原文明确为约值，不是从图中精确读出的点。形状、按键与呈现设备不同。'},
  {id:'rotate_mirror_rt',label:'无坐标轴、镜像：正确 RT',unit:'ms',original:3800,originalText:'3.8 s = 3800 ms',source:'原文 p.703，different pairs 总体均值',url:originalRotation,measure:'rt',filter:t=>t.cond===0&&Boolean(t.mirror),note:'原文覆盖更广角度与两种旋转轴；本项目只有 0°/60°/120°，此处为跨任务参照。'},
 ]
};
export function comparePaper(sessions,experiment){return (paperData[experiment]||[]).map(({filter,...b})=>{const values=sessions.map(s=>{const trials=s.trials.filter(filter);return {participant:s.participant,value:rt(trials)};}).filter(o=>typeof o.value==='number'&&Number.isFinite(o.value)),current=mean(values.map(x=>x.value));const matched=sessions.flatMap(s=>s.trials.filter(filter));const missingReason=values.length?'':!sessions.length?'当前版本尚未读取摄像头采集记录':!matched.length?'记录中没有这一对应条件':'该条件没有有效、正确且不少于 150 ms 的反应（可能错误、超时或中断）';return {...b,missingReason,current,n:values.length,difference:current!==null&&b.original!==null?current-b.original:null,individuals:values};});}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=x=>typeof x==='number'&&Number.isFinite(x)?x.toFixed(1):'—';
export function paperComparisonHTML(sessions,experiment){const rows=comparePaper(sessions,experiment);return `<section class="panel"><h3>${({drive:"兔兔驾驶舱",map:"星图寻路记",rotate:"旋转包裹站"})[experiment]} · 原文数据 vs 本次结果</h3><p class="spaced">按对应条件并排显示反应时，差值为“本项目 − 原文”。多人结果先按人计算，再等权平均；单次结果仅描述。缺少原文数值时保留待核实，不生成差值。</p><div class="analysis-table"><table class="result-table"><thead><tr><th>指标与对应条件</th><th>原文数值</th><th>本项目实测</th><th>与原文差值</th><th>本项目有效人数</th><th>记录状态</th><th>原文出处与可比性</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.label)}</td><td>${esc(r.originalText)}</td><td>${num(r.current)} ms</td><td>${r.difference===null?'—':(r.approximate?'约 ':'')+num(r.difference)+' '+r.unit}</td><td>${r.n}</td><td>${r.n?'已计算':esc(r.missingReason)}</td><td><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.source)} ↗</a><p class="small">${esc(r.note)}</p></td></tr>`).join('')}</tbody></table></div><p class="small spaced">此表为数值描述对照，不对独立的原文样本与本项目样本做配对检验，也不将更快直接判定为复现成功。新增条件的改进效果请看本项目内部的配对比较。</p></section>`;}
