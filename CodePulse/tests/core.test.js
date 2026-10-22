'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../public/agent-core.js');
test('TC1 prioritises Graphs when count is zero', () => {
 const r=C.runCoach({profile:{visibility:'public',solvedProblems:[{canonicalId:'x',title:'X',topic:'Arrays'}]}});
 assert.equal(r.plan.priorityTopics[0],'Graphs'); assert.equal(r.summary.graphCount,0);
});
test('TC2 private profile requests export', () => {
 const r=C.runCoach({profile:{visibility:'private'}}); assert.equal(r.status,'needs_export'); assert.equal(r.plan,null);
});
test('TC3 duplicate canonical problem is counted once', () => {
 const r=C.deduplicate([{canonicalId:'same',platform:'LeetCode',title:'P'},{canonicalId:'same',platform:'Other',title:'P'}]);
 assert.equal(r.length,1); assert.equal(r[0].sourcePlatforms.length,2);
});
test('TC4 unchanged snapshot makes no progress claim', () => {
 const r=C.compareProgress([{canonicalId:'a'},{canonicalId:'b'}],['a','b']); assert.equal(r.delta,0); assert.equal(r.claim,false);
});
test('canonical ID helper keeps stable IDs', () => assert.equal(C.key({canonicalId:'Shared:1'}),'Shared:1'));
test('all four official scenarios pass', () => assert.deepEqual(C.officialTests().map(x=>x.passed),[true,true,true,true]));
