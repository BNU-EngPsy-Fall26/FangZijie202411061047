import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeTrials,tiers,summarize,slope,csv,driveReward,evaluateResponse} from '../dist/core.js';
for(let repeat=0;repeat<12;repeat++)for(const tier of Object.keys(tiers))for(const id of ['drive','map','rotate']){
 const rows=makeTrials(id,false,tier),key=t=>id==='drive'?`${t.priority}/${t.cond}/${t.event}`:id==='map'?`${t.cond}/${t.relative}`:`${t.cond}/${t.angle}/${t.mirror}`;
 assert.equal(rows.length,tiers[tier].counts[id]);
 const cells=rows.reduce((a,t)=>(a[key(t)]=(a[key(t)]||0)+1,a),{});
 assert.equal(Object.keys(cells).length,id==='drive'?16:12);
 assert(Object.values(cells).every(n=>n===tiers[tier].reps[id]));
 if(id==='rotate')for(const cond of [0,1])for(const angle of [0,60,120])for(let shape=0;shape<4;shape++)assert.equal(rows.filter(t=>t.cond===cond&&t.angle===angle&&t.shape===shape&&!t.mirror).length,rows.filter(t=>t.cond===cond&&t.angle===angle&&t.shape===shape&&t.mirror).length,'no tier may associate shape identity with answer');
}
assert.throws(()=>makeTrials('map',false,'bad-tier'));
assert.equal(Object.values(tiers.quick.counts).reduce((a,b)=>a+b),40);
assert.equal(Object.values(tiers.medium.counts).reduce((a,b)=>a+b),224);
assert.equal(Object.values(tiers.full.counts).reduce((a,b)=>a+b),448);
console.log('PASS: all three tiers retain every condition and shape/answer balance');
for(let repeat=0;repeat<20;repeat++)for(const [id,n,pn]of [['drive',160,8],['map',144,6],['rotate',144,6]]){
 const ts=makeTrials(id),practice=makeTrials(id,true);assert.equal(ts.length,n);assert.equal(practice.length,pn);
 const key=t=>id==='drive'?`${t.priority}/${t.cond}/${t.event}`:id==='map'?`${t.cond}/${t.relative}`:`${t.cond}/${t.angle}/${t.mirror}`;
 const counts=arr=>arr.reduce((a,t)=>(a[key(t)]=(a[key(t)]||0)+1,a),{});
 assert(Object.values(counts(ts)).every(v=>v===(id==='drive'?10:12)));
 assert(practice.length<=8);for(const cond of id==='map'?[0,1,2]:[0,1])assert(practice.some(t=>t.cond===cond));if(id==='drive')for(const event of ['road','panel','speed','oncoming'])assert(practice.some(t=>t.event===event));if(id==='map')for(const relative of [0,90,180,270])assert(practice.some(t=>t.relative===relative));if(id==='rotate')for(const angle of [0,60,120])assert(practice.some(t=>t.angle===angle));
 if(id==='rotate')for(let cond=0;cond<2;cond++)for(let angle of [0,60,120])for(let shape=0;shape<4;shape++)for(const mirror of [false,true])assert.equal(ts.filter(t=>t.cond===cond&&t.angle===angle&&t.shape===shape&&t.mirror===mirror).length,3,'shape must not predict answer');
 if(id==='drive')for(const block of [1,2]){const rows=ts.filter(t=>t.block===block);assert.equal(new Set(rows.map(t=>t.priority)).size,1);assert(rows.every(t=>t.reward===driveReward(t.event,t.priority)));assert.equal(rows.filter(t=>t.event==='road').length,20);assert.equal(ts.findIndex(t=>t.block===2),80);}
 if(id==='map')for(let cond=0;cond<3;cond++)for(const relative of [0,90,180,270])for(const heading of [0,90,180,270])assert.equal(ts.filter(t=>t.cond===cond&&t.relative===relative&&t.heading===heading).length,3);
}
for(const t of makeTrials('map'))assert.equal((t.bearing-t.heading+360)%360,t.relative);
const rows=[{rt:500,correct:1},{rt:100,correct:0,anticipatory:1},{rt:null,correct:0},{rt:null,correct:0,invalid:1}];assert.deepEqual(summarize(rows),{n:3,accuracy:33,rt:500,invalid:1});
assert.equal(slope([0,60,120].map(angle=>({angle,rt:500+2*angle,correct:1}))),2);
assert(csv([{a:'x"y',b:'一,二'}]).includes('"x""y"'));console.log('PASS: cell balance, mirror balance, map reference frames, exclusions, rotation slope, CSV escaping');
const scene=readFileSync(new URL('../dist/scene.js',import.meta.url),'utf8');
const shapes=JSON.parse(scene.match(/const shapes=(\[.*?\]);let pts=/)[1]);
const canon=pts=>{const mins=[0,1,2].map(i=>Math.min(...pts.map(p=>p[i])));return pts.map(p=>p.map((v,i)=>v-mins[i]).join(',')).sort().join(';');};
const permutations=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
for(const shape of shapes){const mirror=shape.map(([x,y,z])=>[-x,y,z]);let matched=false;for(const perm of permutations){const inversions=perm.reduce((n,a,i)=>n+perm.slice(i+1).filter(b=>a>b).length,0);const parity=inversions%2?-1:1;for(const sx of [-1,1])for(const sy of [-1,1])for(const sz of [-1,1]){if(parity*sx*sy*sz!==1)continue;const rotated=mirror.map(p=>[p[perm[0]]*sx,p[perm[1]]*sy,p[perm[2]]*sz]);if(canon(shape)===canon(rotated))matched=true;}}assert(!matched,'Mirror stimulus must not superimpose under any proper cube rotation');}
console.log('PASS: all four 3D cargo shapes are chiral under 24 proper cube rotations');

for(const priority of ['road','panel']){assert.equal(driveReward('speed',priority),1);assert(driveReward('road',priority)>1);assert(driveReward('panel',priority)>1);assert.equal(driveReward('oncoming',priority),0);}
assert.equal(evaluateResponse({event:'oncoming',answer:null,reward:0},null,null).correct,1);
assert.equal(evaluateResponse({event:'oncoming',answer:null,reward:0},'space',500).correct,0);
assert.equal(evaluateResponse({event:'speed',answer:'k',reward:1},'k',500).points,1);
assert.equal(evaluateResponse({event:'speed',answer:'k',reward:1},null,null).correct,0);
assert.equal(evaluateResponse({event:'road',answer:'space',reward:3},'space',100).correct,0);
console.log('PASS speed lowest reward, oncoming withholding, false alarms and anticipation');


for(const id of ['drive','map','rotate']){assert.equal(makeTrials(id,false,'quick').length,tiers.quick.counts[id]);assert(makeTrials(id,true,'quick').length<=8);}console.log('PASS restored low/medium/high counts and <=8 practice');
