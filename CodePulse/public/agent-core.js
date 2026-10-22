'use strict';
const TOPICS = ['Graphs','Dynamic Programming','Trees','Hashing','Arrays','Strings','Greedy','Binary Search','Math / Other'];
const TARGET_MIX = {'Graphs':15,'Dynamic Programming':20,'Trees':10,'Hashing':10,'Arrays':15,'Strings':10,'Greedy':8,'Binary Search':7,'Math / Other':5};
const CATALOG = [
 {id:'lc200',canonicalId:'leetcode:200',title:'Number of Islands',topic:'Graphs',url:'https://leetcode.com/problems/number-of-islands/',minutes:55},
 {id:'lc133',canonicalId:'leetcode:133',title:'Clone Graph',topic:'Graphs',url:'https://leetcode.com/problems/clone-graph/',minutes:45},
 {id:'lc207',canonicalId:'leetcode:207',title:'Course Schedule',topic:'Graphs',url:'https://leetcode.com/problems/course-schedule/',minutes:55},
 {id:'lc102',canonicalId:'leetcode:102',title:'Binary Tree Level Order Traversal',topic:'Trees',url:'https://leetcode.com/problems/binary-tree-level-order-traversal/',minutes:40},
 {id:'lc70',canonicalId:'leetcode:70',title:'Climbing Stairs',topic:'Dynamic Programming',url:'https://leetcode.com/problems/climbing-stairs/',minutes:30},
 {id:'lc198',canonicalId:'leetcode:198',title:'House Robber',topic:'Dynamic Programming',url:'https://leetcode.com/problems/house-robber/',minutes:45},
 {id:'lc1',canonicalId:'leetcode:1',title:'Two Sum',topic:'Hashing',url:'https://leetcode.com/problems/two-sum/',minutes:25},
 {id:'lc238',canonicalId:'leetcode:238',title:'Product of Array Except Self',topic:'Arrays',url:'https://leetcode.com/problems/product-of-array-except-self/',minutes:40},
 {id:'lc3',canonicalId:'leetcode:3',title:'Longest Substring Without Repeating Characters',topic:'Strings',url:'https://leetcode.com/problems/longest-substring-without-repeating-characters/',minutes:45},
 {id:'lc55',canonicalId:'leetcode:55',title:'Jump Game',topic:'Greedy',url:'https://leetcode.com/problems/jump-game/',minutes:35},
 {id:'lc704',canonicalId:'leetcode:704',title:'Binary Search',topic:'Binary Search',url:'https://leetcode.com/problems/binary-search/',minutes:25}
];
function key(p){return String(p.canonicalId || (p.platform && p.problemId ? `${p.platform}:${p.problemId}` : '') || p.id || `title:${String(p.title||'').trim().toLowerCase()}`);}
function deduplicate(problems=[]){const map=new Map(); for(const p of problems){const k=key(p);if(!map.has(k))map.set(k,{...p,canonicalId:k,sourcePlatforms:[p.platform||'Imported']});else{const old=map.get(k);old.sourcePlatforms=[...new Set([...old.sourcePlatforms,p.platform||'Imported'])];if(!old.url&&p.url)old.url=p.url;}}return [...map.values()];}
function counts(problems){const out=Object.fromEntries(TOPICS.map(t=>[t,0]));for(const p of deduplicate(problems))out[TOPICS.includes(p.topic)?p.topic:'Math / Other']++;return out;}
function compareProgress(current,previous){if(!Array.isArray(previous))return {available:false,delta:null,claim:false,label:'Baseline only — no prior snapshot'};const a=new Set(deduplicate(current).map(key));const b=new Set(previous);const delta=[...a].filter(x=>!b.has(x)).length;return {available:true,delta,claim:delta>0,label:delta===0?'No measurable change detected.':`${delta} newly solved problem(s) observed.`};}
function runCoach({profile={},weeklyHours=5,targetCompanies=[],previousIds}={}){
 if(profile.visibility==='private'||profile.status==='private'||profile.readable===false)return {status:'needs_export',message:'This profile is private or unreadable. Request an official export through the source platform. This demo does not read private data, and no progress was guessed.',progress:{claim:false},plan:null,evidence:{profileUrl:profile.profileUrl||'',retrievedAt:profile.retrievedAt||null,sourceState:'private-or-unreadable'}};
 const problems=deduplicate(profile.solvedProblems||[]);const topicCounts=counts(problems);const graphZero=topicCounts.Graphs===0;
 const progress=compareProgress(problems,previousIds||profile.previousSnapshot?.solvedProblemIds);
 const priorities=TOPICS.slice().sort((a,b)=>((graphZero&&a==='Graphs')?-100:0)-((graphZero&&b==='Graphs')?-100:0)+(topicCounts[a]/Math.max(1,TARGET_MIX[a]))-(topicCounts[b]/Math.max(1,TARGET_MIX[b])));
 const hours=Math.max(1,Math.min(40,Number(weeklyHours)||5));const max=Math.max(2,Math.min(8,Math.floor(hours*60/40)));const used=new Set(problems.map(key));const plan=[];
 for(const topic of priorities){for(const p of CATALOG.filter(x=>x.topic===topic&&!used.has(x.canonicalId))){if(plan.length>=max)break;plan.push({...p,reason:graphZero&&topic==='Graphs'?'No solved Graphs problems were observed.':`Topic priority based on current topic mix (${topicCounts[topic]} solved).`});}if(plan.length>=max)break;}
 return {status:'ready',summary:{solvedUnique:problems.length,topicCounts,graphCount:topicCounts.Graphs,graphPriority:graphZero},progress,plan:{items:plan,priorityTopics:priorities.slice(0,4),weeklyHours:hours,companies:targetCompanies},evidence:{profileUrl:profile.profileUrl||'',sourceUrl:profile.sourceUrl||'',retrievedAt:profile.retrievedAt||new Date().toISOString(),sourceMode:profile.mode||'import-or-demo',uniqueSolvedCount:problems.length},action:{state:'pending_approval',approvalRequired:true}};
}
function officialTests(){const ids=['a','b','c'];const run1=runCoach({weeklyHours:4,profile:{visibility:'public',solvedProblems:[{canonicalId:'lc:1',title:'Two Sum',topic:'Hashing'}]}});const run2=runCoach({profile:{visibility:'private'}});const run3=deduplicate([{canonicalId:'shared:200',title:'Number of Islands',platform:'LeetCode'},{canonicalId:'shared:200',title:'Number of Islands',platform:'Other'}]);const run4=compareProgress(ids.map(id=>({canonicalId:id,title:id})),ids);
return [
{id:'TC1',scenario:'Profile shows 0 graph problems',expected:'Graphs prioritised first',actual:run1.plan?.priorityTopics[0]||run1.status,passed:!!run1.plan&&run1.plan.priorityTopics[0]==='Graphs',evidence:{graphSolvedCount:run1.summary?.graphCount,firstProblem:run1.plan?.items[0]?.url}},
{id:'TC2',scenario:'Profile is private',expected:'Asks for an export instead of guessing',actual:run2.message,passed:run2.status==='needs_export'&&!run2.plan,evidence:{status:run2.status,profileUrl:run2.evidence.profileUrl}},
{id:'TC3',scenario:'Same problem solved on two platforms',expected:'Counted once',actual:`${run3.length} unique problem(s)`,passed:run3.length===1&&run3[0].sourcePlatforms.length===2,evidence:{rawCount:2,uniqueCount:run3.length,platforms:run3[0]?.sourcePlatforms}},
{id:'TC4',scenario:'No change this week',expected:'No false progress claim',actual:run4.label,passed:run4.available&&run4.delta===0&&!run4.claim,evidence:{delta:run4.delta,claim:run4.claim}}
];}
const CodePulseCoreAPI={TOPICS,TARGET_MIX,CATALOG,key,deduplicate,counts,compareProgress,runCoach,officialTests};
if(typeof module!=='undefined'&&module.exports)module.exports=CodePulseCoreAPI;
if(typeof window!=='undefined')window.CodePulseCore=CodePulseCoreAPI;
