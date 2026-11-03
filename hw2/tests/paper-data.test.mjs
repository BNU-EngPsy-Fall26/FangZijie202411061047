import assert from 'node:assert/strict';
import {descriptiveSessions,signature,analyze} from '../dist/analysis.js';
import {comparePaper,paperComparisonHTML} from '../dist/paper-data.js';
const trial=(extra={})=>({cond:0,correct:1,invalid:0,anticipatory:0,rt:500,...extra});
const sessions=[{participant:'TEST1',trials:[trial({priority:'road',event:'panel'}),trial({priority:'panel',event:'panel',rt:600}),trial({priority:'road',event:'panel',cond:1,rt:100})]},{participant:'TEST2',trials:[trial({priority:'road',event:'panel',rt:700})]}];
const drive=comparePaper(sessions,'drive');assert.equal(drive[0].original,1700);assert.equal(drive[0].current,600);assert.equal(drive[0].difference,-1100);assert.equal(drive[0].n,2);assert.equal(drive[1].original,760);assert.equal(drive[1].current,600);assert.equal(drive.length,2);
const r=comparePaper([{participant:'TEST',trials:[trial({angle:0,mirror:false}),trial({angle:0,mirror:true,rt:600}),trial({angle:0,mirror:false,cond:1,rt:200}),trial({angle:60,mirror:true,correct:0,rt:300})]}],'rotate');assert.equal(r[0].current,500);assert.equal(r[0].approximate,true);assert.equal(r[1].current,600);assert.equal(r[1].difference,-3200);assert.equal(r.length,2);
const maps=comparePaper([],'map');assert.deepEqual(maps.map(r=>r.original),[3050,2560,2760]);assert.ok(maps.every(r=>r.current===null&&r.difference===null));assert.ok(paperComparisonHTML([],'map').includes('p.93'));assert.ok(!paperComparisonHTML([],'rotate').includes('96.8%'));for(const id of ['drive','map','rotate'])assert.ok(comparePaper([],id).every(r=>r.measure==='rt')); 
console.log('PASS paper numeric comparison: unit conversion, equal-person weighting, baseline filters, null originals, approximate values and RT-only comparisons');

const pilot={id:'pilot1',participant:'PILOT_TEST',experiment:'drive',protocol:'starparcel-v4-adaptive-2026-11-03',tier:'quick',mode:'formal',courseEligible:false,created:'2026-11-03',trials:[trial({priority:'road',event:'panel',rt:500})]};
const key=signature(pilot),descriptive=descriptiveSessions([pilot,{...pilot,id:'duplicate',created:'2026-11-04'},{...pilot,id:'demo',mode:'demo'},{...pilot,id:'other-tier',tier:'medium'}],key);
assert.equal(descriptive.length,1);assert.equal(comparePaper(descriptive,'drive')[0].current,500);assert.equal(analyze([pilot],key).sessions.length,0);
assert.ok(comparePaper([],'drive')[0].missingReason.includes('尚未读取'));
assert.ok(comparePaper([{trials:[trial({priority:'panel',event:'speed'})]}],'drive')[0].missingReason.includes('没有这一对应条件'));
assert.ok(comparePaper([{trials:[trial({priority:'road',event:'panel',correct:0})]}],'drive')[0].missingReason.includes('没有有效'));
console.log('PASS quick pilot descriptive RT is visible without relaxing full-study inference; duplicates/modes/tiers isolated and missing reasons distinguished');
