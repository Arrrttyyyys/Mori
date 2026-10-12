const assert=require('node:assert/strict');
const fs=require('node:fs');const Module=require('node:module');const ts=require('typescript');
let role;let mode='supabase';let exists=true;let closed=true;const calls=[];
const client={from(table){const query={select(){return query},eq(key,value){calls.push({table,key,value});return query},async maybeSingle(){return {error:null,data:table==='session_summaries'?(exists?{id:'summary',session_id:'session',updated_at:'revision'}:null):(closed?{id:'session'}:null)}}};return query}};
const admin={from(table){return {async insert(value){calls.push({table,value});return {error:null}}}}};
const original=Module._load;
Module._load=function(name,parent,main){
 if(name==='@/lib/auth/server-auth')return {requireRequestIdentity:async()=>({mode,userId:'owner',actorId:role?'caregiver':'owner',workspaceRole:role,client}),authErrorResponse:()=>null};
 if(name==='@/lib/supabase/server')return {createAdminServerClient:()=>admin};
 return original.call(this,name,parent,main);
};
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,file);
const {POST}=require('../app/api/therapy/continuity/route.ts');
const request=(body={summaryId:'summary',updatedAt:'revision',decision:'approved'})=>({json:async()=>body});
(async()=>{
 role='viewer';assert.equal((await POST(request())).status,403);
 role='contributor';assert.equal((await POST(request())).status,403);
 role=undefined;mode='demo';assert.equal((await POST(request())).status,403);
 mode='supabase';exists=false;assert.equal((await POST(request())).status,404);
 exists=true;assert.equal((await POST(request({summaryId:'summary',updatedAt:'old',decision:'approved'}))).status,409);
 closed=false;assert.equal((await POST(request())).status,400);
 closed=true;calls.length=0;assert.equal((await POST(request())).status,200);
 assert.ok(calls.some(c=>c.table==='session_summaries'&&c.key==='owner_id'&&c.value==='owner'));
 assert.ok(calls.some(c=>c.table==='caregiver_reviews'&&c.value.patient_id==='owner'&&c.value.resource_id==='summary'));
 assert.ok(calls.some(c=>c.table==='audit_events'));
 role='caregiver';assert.equal((await POST(request())).status,200);
 assert.equal((await POST(request({summaryId:'summary',updatedAt:'revision',decision:'corrected',correction:''}))).status,400);
 console.log('Continuity route checks passed: role restrictions, workspace scoping, revisions, closed sessions and audited reviews.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{Module._load=original});
