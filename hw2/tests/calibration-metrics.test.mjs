import assert from 'node:assert/strict';
import {calibrationMetrics} from '../dist/calibration-metrics.js';
const high=calibrationMetrics([500,600,700,800,900],[12,12,12,12,12],1280,720);
assert.equal(high.meanError,700);assert.equal(high.pass,true);assert.equal(high.qualityPass,false);assert.equal(high.errorGateEnabled,false);
assert.equal(calibrationMetrics([40],[1,0,0,0,0],1280,720).pass,true,'sparse estimates are reported rather than rejected for error');
const missing=calibrationMetrics([],[0,0,0,0,0],1280,720);assert.equal(missing.meanError,null);assert.equal(missing.pass,false,'a working gaze stream is still required');
console.log('PASS: high error is recorded, not gated; absent data is not fabricated');
