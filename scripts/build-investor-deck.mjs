import pptxgen from "/private/tmp/mori-deck-runtime/node_modules/pptxgenjs/dist/pptxgen.cjs.js";
import fs from "node:fs";

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Mori";
pptx.subject = "Pre-seed investor presentation";
pptx.title = "Mori — Memory, dignity, connection";
pptx.company = "Mori";
pptx.lang = "en-US";
pptx.theme = {
  headFontFace: "Aptos Display",
  bodyFontFace: "Aptos",
  lang: "en-US",
};
pptx.defineSlideMaster({
  title: "MORI",
  background: { color: "F5F0E7" },
  objects: [
    { line: { x: 0.45, y: 7.13, w: 12.43, h: 0, line: { color: "C9C2B6", width: 0.6 } } },
    { text: { text: "MORI  ·  CONFIDENTIAL", options: { x: 0.48, y: 7.17, w: 3.1, h: 0.16, fontFace: "Aptos", fontSize: 7.5, color: "736D64", margin: 0, breakLine: false } } },
  ],
  slideNumber: { x: 12.42, y: 7.15, w: 0.38, h: 0.18, color: "736D64", fontFace: "Aptos", fontSize: 7.5, align: "right", margin: 0 },
});

const C = { bg:"F5F0E7", ink:"332E28", muted:"746D63", sage:"819783", sage2:"B8C4B5", pale:"EAE4D9", white:"FFFFFF", rust:"B96A4A", blue:"527A86", line:"C9C2B6", dark:"283B30", gold:"D3A65B" };
const shape = pptx.ShapeType;
const imgDir = "/Users/arty/Mori/public/images";
const out = "/Users/arty/Mori/docs/investor/Mori_PreSeed_Investor_Deck.pptx";
fs.mkdirSync("/Users/arty/Mori/docs/investor", { recursive: true });

function slide() { return pptx.addSlide("MORI"); }
function txt(s, text, x,y,w,h, o={}) { s.addText(text,{x,y,w,h,fontFace:o.fontFace||"Aptos",fontSize:o.fontSize||18,color:o.color||C.ink,bold:o.bold||false,margin:o.margin??0,breakLine:false,fit:"shrink",valign:o.valign||"mid",align:o.align||"left",bullet:o.bullet,paraSpaceAfterPt:o.paraSpaceAfterPt||0,isTextBox:true,...o}); }
function title(s,kicker,headline,sub="") { txt(s,kicker.toUpperCase(),0.55,0.34,3.6,0.25,{fontSize:10,bold:true,color:C.sage,charSpacing:1.8}); txt(s,headline,0.55,0.72,12.0,0.72,{fontSize:29,bold:true,color:C.ink}); if(sub) txt(s,sub,0.57,1.48,11.8,0.38,{fontSize:13.5,color:C.muted}); }
function rect(s,x,y,w,h,fill=C.white,line=C.line,r=0.08){ s.addShape(r?shape.roundRect:shape.rect,{x,y,w,h,rectRadius:r,fill:{color:fill},line:{color:line,width:0.7}}); }
function pill(s,text,x,y,w,fill=C.sage,color=C.white){ s.addShape(shape.roundRect,{x,y,w,h:0.35,rectRadius:0.16,fill:{color:fill},line:{color:fill}}); txt(s,text,x+0.08,y+0.02,w-0.16,0.29,{fontSize:10.5,bold:true,color,align:"center"}); }
function metric(s,value,label,x,y,w,accent=C.sage){ txt(s,value,x,y,w,0.62,{fontSize:34,bold:true,color:accent}); txt(s,label,x,y+0.65,w,0.56,{fontSize:12.5,color:C.muted,valign:"top"}); }
function notes(s, urls=[], extra="") { s.addNotes(`[Sources]\n${urls.map(u=>`- ${u}`).join("\n")}\n[/Sources]${extra?`\n\n${extra}`:""}`); }
function addCrop(s,path,x,y,w,h){ s.addImage({path,x,y,w,h,sizing:"crop"}); }
function line(s,x1,y1,x2,y2,color=C.line,width=1,dash="solid"){ s.addShape(shape.line,{x:x1,y:y1,w:x2-x1,h:y2-y1,line:{color,width,dashType:dash,beginArrowType:"none",endArrowType:"none"}}); }

// 1 — cover
{
 const s=slide();
 s.background={color:C.bg};
 addCrop(s,`${imgDir}/P1.png`,8.15,0,5.18,7.13);
 s.addShape(shape.rect,{x:7.5,y:0,w:1.8,h:7.13,fill:{color:C.bg,transparency:3},line:{color:C.bg,transparency:100}});
 txt(s,"Mori",0.65,0.55,3.3,0.6,{fontSize:33,bold:true,color:C.sage});
 txt(s,"Memory, dignity,\nand connection.",0.65,1.72,7.4,1.8,{fontSize:42,bold:true,color:C.ink,valign:"top",breakLine:true});
 txt(s,"A permission-aware AI companion that helps older adults revisit meaningful memories while giving families a safer way to preserve and share their story.",0.68,3.88,6.3,1.15,{fontSize:18,color:C.muted,valign:"top",breakLine:true});
 pill(s,"PRE-SEED · PILOT STAGE",0.68,5.42,2.55,C.dark);
 txt(s,"Founder: Arty [last name]   ·   [email]",0.68,6.18,5.6,0.35,{fontSize:12,color:C.muted});
 notes(s,["file:///Users/arty/Mori/public/images/P1.png","file:///Users/arty/Mori/docs/MORI_PRODUCT_ROADMAP.md"],"Replace the founder surname and contact details before sending.");
}

// 2 — problem
{
 const s=slide(); title(s,"The problem","Memory loss affects a whole family.","Families carry the context, but the tools around them rarely do.");
 const cards=[
  ["01","Personal history is fragmented","Photos, names and stories live across phones, albums and relatives—outside the moment they are needed."],
  ["02","Conversation gets harder","Generic prompts can create pressure to remember, while caregivers must constantly improvise what feels safe and familiar."],
  ["03","Care carries a hidden cost","Nearly 13M Americans provide unpaid dementia care; 59% report high or very high emotional stress."],
 ];
 cards.forEach((c,i)=>{const x=0.58+i*4.2; rect(s,x,2.15,3.75,3.56,i===1?"E4EBE2":C.white,C.line); txt(s,c[0],x+0.25,2.43,0.55,0.38,{fontSize:13,bold:true,color:C.sage}); txt(s,c[1],x+0.25,3.0,3.15,0.72,{fontSize:21,bold:true,valign:"top"}); txt(s,c[2],x+0.25,4.02,3.15,1.18,{fontSize:13.2,color:C.muted,valign:"top",breakLine:true});});
 txt(s,"The unmet need: personal context that is usable in the moment—without turning memory into a test.",0.72,6.15,11.9,0.55,{fontSize:20,bold:true,color:C.dark,align:"center"});
 notes(s,["https://www.alz.org/alzheimers-dementia/facts-figures","https://www.who.int/news-room/fact-sheets/detail/dementia"]);
}

// 3 — solution flow
{
 const s=slide(); title(s,"The product","One shared Life Map. One calmer conversation.","Mori turns family-approved memories into a gentle, participant-led session.");
 const items=[
  ["1","Family prepares","Upload photos and stories, identify people and set who may use each memory."],
  ["2","Mori begins softly","Small talk, breathing space and visible controls establish pace before any memory appears."],
  ["3","Permission comes first","Mori asks before showing a memory and follows corrections, refusals and topic changes."],
  ["4","The story compounds","Approved context, summaries and feedback strengthen the Life Map over time."],
 ];
 line(s,1.35,3.15,11.95,3.15,C.sage2,3);
 items.forEach((it,i)=>{const x=0.55+i*3.17; s.addShape(shape.ellipse,{x:x+0.35,y:2.75,w:0.8,h:0.8,fill:{color:i===3?C.dark:C.sage},line:{color:C.bg,width:3}}); txt(s,it[0],x+0.35,2.87,0.8,0.35,{fontSize:17,bold:true,color:C.white,align:"center"}); txt(s,it[1],x,3.82,2.78,0.5,{fontSize:17.5,bold:true,align:"center"}); txt(s,it[2],x,4.43,2.78,1.2,{fontSize:12.2,color:C.muted,align:"center",valign:"top",breakLine:true});});
 pill(s,"VOICE + TYPED",0.58,6.25,1.7,C.blue); pill(s,"FAMILY PERMISSIONS",2.45,6.25,2.05,C.sage); pill(s,"CALM FALLBACKS",4.7,6.25,1.85,C.rust); pill(s,"PRIVATE MEDIA",6.75,6.25,1.7,C.dark);
 notes(s,["file:///Users/arty/Mori/docs/CONNECTED_LIFE_IMPLEMENTATION.md","file:///Users/arty/Mori/docs/MORI_PRODUCT_ROADMAP.md"]);
}

// 4 — why now
{
 const s=slide(); title(s,"Why now","A growing care challenge meets usable, private AI.","Three forces are converging around a deeply human need.");
 metric(s,"57M","people lived with dementia worldwide in 2021",0.68,2.1,3.35,C.rust);
 metric(s,"~10M","new cases occur each year",4.54,2.1,3.0,C.sage);
 metric(s,"$446B","value of U.S. unpaid dementia care in 2025",8.4,2.1,3.7,C.blue);
 line(s,0.7,3.72,12.45,3.72,C.line,0.8);
 const blocks=[
  ["DEMOGRAPHICS","By 2030, one in five Americans is projected to be retirement age."],
  ["CARE CAPACITY","Family caregivers provide 19.6B hours of unpaid help each year."],
  ["TECHNOLOGY","Small language models now run locally, allowing personal context to stay on dedicated hardware."],
 ];
 blocks.forEach((b,i)=>{const x=0.7+i*4.12; txt(s,b[0],x,4.2,3.4,0.28,{fontSize:10,bold:true,color:C.sage,charSpacing:1.3}); txt(s,b[1],x,4.65,3.5,1.0,{fontSize:17,bold:true,valign:"top",breakLine:true});});
 txt(s,"Mori is positioned where longevity, caregiver support and privacy-preserving AI overlap.",0.7,6.2,11.7,0.55,{fontSize:20,bold:true,color:C.dark,align:"center"});
 notes(s,["https://www.who.int/news-room/fact-sheets/detail/dementia","https://www.alz.org/getmedia/ef8f48f9-ad36-48ea-87f9-b74034635c1e/alzheimers-facts-and-figures.pdf","https://cdn.www.census.gov/library/publications/2020/demo/p25-1144.html"]);
}

// 5 — product visual
{
 const s=slide(); title(s,"The experience","Designed for pace, agency and familiarity.");
 rect(s,0.58,1.7,7.28,4.88,"EEE8DE","D1C9BC",0.12);
 addCrop(s,`${imgDir}/mori-companion.png`,0.75,1.88,6.94,3.28);
 txt(s,"“Would you like to see a memory together?”",1.05,5.38,6.35,0.55,{fontSize:21,bold:true,align:"center"});
 const right=[
  ["Starts with connection","Mori makes small talk before introducing memory content."],
  ["Asks before showing","Participants stay in control of memory changes, pauses and ending."],
  ["Handles uncertainty","Mori does not guess who is in a photo or assert unverified facts."],
  ["Keeps a human exit","Clear escalation and caregiver controls remain available."],
 ];
 right.forEach((r,i)=>{const y=1.78+i*1.18; s.addShape(shape.ellipse,{x:8.32,y:y+0.02,w:0.34,h:0.34,fill:{color:i<2?C.sage:C.dark},line:{color:i<2?C.sage:C.dark}}); txt(s,"✓",8.32,y+0.01,0.34,0.34,{fontSize:12,bold:true,color:C.white,align:"center"}); txt(s,r[0],8.85,y,3.65,0.33,{fontSize:16,bold:true}); txt(s,r[1],8.85,y+0.38,3.55,0.55,{fontSize:11.6,color:C.muted,valign:"top",breakLine:true});});
 notes(s,["file:///Users/arty/Mori/public/images/mori-companion.png","file:///Users/arty/Mori/docs/MORI_PRODUCT_ROADMAP.md"]);
}

// 6 — moat
{
 const s=slide(); title(s,"Product moat","Mori is more than a chatbot with a warm voice.","Its defensibility grows from structured, permissioned context and the operating system around it.");
 const layers=[
  ["01","Life Map","A longitudinal graph of people, places, media, relationships and verified context."],
  ["02","Permission engine","Every memory carries access, session-use, verification and withdrawal rules."],
  ["03","Safety controller","Deterministic boundaries surround model generation for high-impact scenarios."],
  ["04","Learning loop","Corrections, refusals, session signals and caregiver review improve future interactions."],
 ];
 layers.forEach((l,i)=>{const y=2.02+i*1.05; const w=7.3-i*0.35; const x=0.72+i*0.18; rect(s,x,y,w,0.82,i%2?"E3EADF":C.white,C.line,0.06); txt(s,l[0],x+0.2,y+0.12,0.45,0.25,{fontSize:10,bold:true,color:C.sage}); txt(s,l[1],x+0.78,y+0.09,1.65,0.3,{fontSize:15.5,bold:true}); txt(s,l[2],x+2.45,y+0.09,w-2.65,0.54,{fontSize:11.2,color:C.muted,valign:"top",breakLine:true});});
 rect(s,8.62,2.03,3.82,4.0,C.dark,C.dark,0.1);
 txt(s,"The compounding asset",8.98,2.4,3.0,0.46,{fontSize:20,bold:true,color:C.white});
 txt(s,"A richer personal context layer—built with consent—makes Mori more relevant to each participant while the safety and permission framework stays consistent across deployments.",8.98,3.22,2.95,1.55,{fontSize:14,color:"E1E8E0",valign:"top",breakLine:true});
 txt(s,"Model-agnostic by design",8.98,5.22,2.9,0.35,{fontSize:13,bold:true,color:"AFC5B2"});
 txt(s,"Local Qwen today; hosted inference can be introduced only when privacy, reliability and cost gates are met.",8.98,5.62,2.95,0.7,{fontSize:11.5,color:"D4DED4",valign:"top",breakLine:true});
 notes(s,["file:///Users/arty/Mori/docs/PATENT_TECHNICAL_DISCLOSURE.md","file:///Users/arty/Mori/docs/MODEL_DEPLOYMENT_ARCHITECTURE.md","file:///Users/arty/Mori/docs/PRIVACY_SECURITY_OPERATIONS.md"]);
}

// 7 — evidence
{
 const s=slide(); title(s,"Evidence to date","A working product with measurable engineering readiness.","These results validate the system—not clinical effectiveness.");
 const ms=[
  ["63 / 63","communication checks passed","3 repeated runs × 21 scenarios"],
  ["16 / 16","deterministic safety cases passed","medical, abuse and self-harm language"],
  ["3.75 sec","median model latency","on an 8 GB M1 MacBook Air"],
  ["12 / 12","long-session checks passed","continuity, refusal and topic changes"],
 ];
 ms.forEach((m,i)=>{const x=0.58+(i%2)*6.18,y=1.95+Math.floor(i/2)*1.86; rect(s,x,y,5.75,1.48,i===0?"E1E9DE":C.white,C.line,0.08); txt(s,m[0],x+0.25,y+0.18,1.7,0.48,{fontSize:28,bold:true,color:i===1?C.rust:C.dark}); txt(s,m[1],x+2.02,y+0.18,3.25,0.35,{fontSize:15.5,bold:true}); txt(s,m[2],x+2.02,y+0.63,3.25,0.42,{fontSize:11.3,color:C.muted,valign:"top"});});
 line(s,0.62,5.84,12.5,5.84,C.line,0.8);
 txt(s,"BUILT",0.68,6.08,0.8,0.25,{fontSize:10,bold:true,color:C.sage,charSpacing:1.4});
 txt(s,"Auth · private media · Life Map · family permissions · sessions · summaries · safety · monitoring · demo controls",1.6,5.99,10.4,0.45,{fontSize:13.5,bold:true});
 txt(s,"Next proof: supervised usability, advisor approval, staging recovery and participant outcomes.",1.6,6.42,10.4,0.33,{fontSize:11.5,color:C.muted});
 notes(s,["file:///Users/arty/Mori/docs/MORI_PRODUCT_ROADMAP.md","file:///Users/arty/Mori/docs/LOCAL_MODEL.md","file:///Users/arty/Mori/docs/pilot/TECHNICAL_READINESS.md"]);
}

// 8 — business model
{
 const s=slide(); title(s,"Business model","Start where trust and supervision already exist.","A staged B2B2C model can align adoption, support and evidence generation.");
 const steps=[
  ["1","DESIGN PARTNERS","Memory-care communities, home-care organizations and aging-services programs","Paid pilot / implementation fee"],
  ["2","SITE SUBSCRIPTION","Per-participant software, family workspace and operational support","Recurring SaaS revenue"],
  ["3","NETWORK EXPANSION","Multi-site operators, channel partners and care ecosystems","Enterprise agreements"],
 ];
 steps.forEach((a,i)=>{const x=0.6+i*4.2; rect(s,x,2.03,3.72,3.82,i===1?"E2EAE0":C.white,C.line,0.09); txt(s,a[0],x+0.25,2.27,0.52,0.48,{fontSize:25,bold:true,color:C.sage}); txt(s,a[1],x+0.25,3.05,3.15,0.28,{fontSize:10,bold:true,color:C.muted,charSpacing:1.1}); txt(s,a[2],x+0.25,3.53,3.12,1.05,{fontSize:17.2,bold:true,valign:"top",breakLine:true}); line(s,x+0.25,4.88,x+3.38,4.88,C.line,0.8); txt(s,a[3],x+0.25,5.13,3.12,0.42,{fontSize:12.2,color:C.dark,bold:true});});
 txt(s,"Initial pricing will be tested with design partners; the current objective is willingness-to-pay and retention evidence, not premature scale.",0.72,6.25,11.8,0.5,{fontSize:13.2,color:C.muted,align:"center"});
 notes(s,["file:///Users/arty/Mori/docs/MORI_PRODUCT_ROADMAP.md"],"Business model is a proposed go-to-market thesis and has not yet been validated through revenue.");
}

// 9 — go to market
{
 const s=slide(); title(s,"Go to market","Earn trust in narrow, supervised steps.","Mori’s launch path is designed to create evidence before expansion.");
 const phases=[
  ["NOW","Advisor review","Validate prompts, safeguards, consent and stopping rules."],
  ["0–6 MO","Supervised pilots","Run small cohorts with trained supervisors and structured feedback."],
  ["6–12 MO","Paid design partners","Convert successful pilots into site agreements and reference accounts."],
  ["12–18 MO","Repeatable deployment","Standardize onboarding, device/model operations and multi-site support."],
 ];
 phases.forEach((p,i)=>{const y=1.92+i*1.18; pill(s,p[0],0.68,y,1.28,i===0?C.rust:C.dark); txt(s,p[1],2.25,y-0.01,2.55,0.38,{fontSize:18,bold:true}); txt(s,p[2],4.88,y-0.02,6.95,0.55,{fontSize:13.5,color:C.muted,valign:"top"}); if(i<3) line(s,1.31,y+0.38,1.31,y+1.16,C.sage2,2);});
 rect(s,9.53,5.82,2.62,0.62,"E1E9DE","E1E9DE",0.04); txt(s,"Gate each expansion on safety + evidence",9.73,5.95,2.22,0.31,{fontSize:10.8,bold:true,color:C.dark,align:"center"});
 notes(s,["file:///Users/arty/Mori/docs/pilot/PILOT_PROTOCOL.md","file:///Users/arty/Mori/docs/pilot/PILOT_MEASUREMENT_PLAN.md","file:///Users/arty/Mori/docs/pilot/ADVISOR_REVIEW_PACKET.md"]);
}

// 10 — competitive landscape
{
 const s=slide(); title(s,"Positioning","Built for the space between memory books and generic AI.","Mori combines personal context, participant agency and care-aware safeguards.");
 const x0=1.2,y0=2.03,w=9.7,h=4.2;
 s.addShape(shape.rect,{x:x0,y:y0,w,h,fill:{color:"FAF8F3",transparency:0},line:{color:C.line,width:0.8}});
 line(s,x0+w/2,y0,x0+w/2,y0+h,C.line,1); line(s,x0,y0+h/2,x0+w,y0+h/2,C.line,1);
 txt(s,"GENERIC CONTEXT",0.7,3.98,1.8,0.3,{fontSize:10,bold:true,color:C.muted,rotate:270,align:"center"});
 txt(s,"PERSONAL CONTEXT",10.75,3.85,1.9,0.3,{fontSize:10,bold:true,color:C.muted,rotate:90,align:"center"});
 txt(s,"LOW CARE OVERSIGHT",4.78,6.38,2.5,0.25,{fontSize:10,bold:true,color:C.muted,align:"center"});
 txt(s,"HIGH CARE OVERSIGHT",4.78,1.66,2.5,0.25,{fontSize:10,bold:true,color:C.muted,align:"center"});
 pill(s,"GENERIC AI COMPANIONS",2.0,4.82,2.45,"B8BCC4",C.ink);
 pill(s,"DIGITAL MEMORY BOOKS",7.4,4.82,2.35,"C7BBA5",C.ink);
 pill(s,"CARE WORKFLOW TOOLS",2.28,2.65,2.25,C.blue);
 s.addShape(shape.ellipse,{x:7.25,y:2.36,w:1.62,h:1.62,fill:{color:C.sage},line:{color:C.white,width:3}}); txt(s,"MORI",7.25,2.82,1.62,0.38,{fontSize:21,bold:true,color:C.white,align:"center"});
 txt(s,"Permissioned memories\n+ safe conversation layer\n+ family collaboration",9.1,2.42,2.7,1.2,{fontSize:12.5,bold:true,color:C.dark,valign:"top",breakLine:true});
 notes(s,["file:///Users/arty/Mori/docs/CONNECTED_LIFE_IMPLEMENTATION.md"],"Competitive map is category-level positioning, not a claim about specific competitors.");
}

// 11 — milestones & use of funds
{
 const s=slide(); title(s,"The next 18 months","Turn engineering readiness into trusted deployment.","Funding is aimed at the evidence, infrastructure and partnerships required for repeatable pilots.");
 const goals=[
  ["01","VALIDATE","Qualified advisor review, internal role-play and supervised participant sessions."],
  ["02","HARDEN","Staging recovery, independent security review, hosted demo controls and operations."],
  ["03","PROVE","3–5 design partners, usage retention and caregiver/participant feasibility evidence."],
  ["04","SCALE","Repeatable site onboarding, model hosting and production monitoring."],
 ];
 goals.forEach((g,i)=>{const x=0.58+(i%2)*6.18,y=1.82+Math.floor(i/2)*1.62; txt(s,g[0],x,y,0.55,0.4,{fontSize:12,bold:true,color:C.sage}); txt(s,g[1],x+0.7,y,1.35,0.32,{fontSize:13,bold:true,color:C.dark}); txt(s,g[2],x+2.05,y-0.02,3.6,0.73,{fontSize:12.2,color:C.muted,valign:"top",breakLine:true}); line(s,x,y+0.92,x+5.6,y+0.92,C.line,0.8);});
 const uses=[["40%","Product + AI"],["25%","Pilots + evidence"],["20%","Security + operations"],["15%","Go to market"]];
 let bx=0.7; uses.forEach((u,i)=>{const widths=[4.72,2.95,2.36,1.77]; s.addShape(shape.rect,{x:bx,y:5.56,w:widths[i],h:0.55,fill:{color:[C.dark,C.sage,C.blue,C.gold][i]},line:{color:C.bg,width:1}}); txt(s,u[0],bx,5.65,widths[i],0.25,{fontSize:11,bold:true,color:C.white,align:"center"}); bx+=widths[i];});
 uses.forEach((u,i)=>{const x=0.72+i*3.0; txt(s,`${u[0]}  ${u[1]}`,x,6.34,2.7,0.25,{fontSize:10.5,bold:true,color:[C.dark,C.sage,C.blue,"9A742E"][i]});});
 notes(s,["file:///Users/arty/Mori/docs/MORI_PRODUCT_ROADMAP.md","file:///Users/arty/Mori/docs/pilot/LAUNCH_CHECKLIST.md"],"Milestones and allocation are proposed planning targets and should be updated to match the final raise size and hiring plan.");
}

// 12 — ask
{
 const s=slide();
 s.background={color:C.dark};
 s.addShape(shape.rect,{x:0,y:0,w:13.33,h:7.5,fill:{color:C.dark},line:{color:C.dark}});
 txt(s,"Mori",0.72,0.56,2.6,0.55,{fontSize:30,bold:true,color:"ADC0AE"});
 txt(s,"Help make memory care\nmore personal—and more human.",0.72,1.58,8.8,1.48,{fontSize:38,bold:true,color:C.white,valign:"top",breakLine:true});
 txt(s,"Raising $[X] pre-seed to complete supervised pilots, harden production operations and secure the first design-partner deployments.",0.75,3.55,7.3,1.0,{fontSize:18,color:"D7E0D8",valign:"top",breakLine:true});
 rect(s,8.9,1.42,3.68,3.88,"E8E0D1","E8E0D1",0.12);
 txt(s,"THE ASK",9.23,1.78,2.9,0.27,{fontSize:10,bold:true,color:C.sage,charSpacing:1.5});
 txt(s,"Capital",9.23,2.43,1.18,0.3,{fontSize:13,bold:true}); txt(s,"$[X]",10.55,2.36,1.35,0.46,{fontSize:24,bold:true,color:C.dark,align:"right"});
 line(s,9.22,3.05,12.05,3.05,C.line,0.8);
 txt(s,"Introductions",9.23,3.32,2.6,0.3,{fontSize:13,bold:true}); txt(s,"Pilot sites · advisors",9.23,3.77,2.7,0.38,{fontSize:12.2,color:C.muted});
 line(s,9.22,4.37,12.05,4.37,C.line,0.8);
 txt(s,"Contact",9.23,4.65,1.1,0.3,{fontSize:13,bold:true}); txt(s,"Arty [last name]\n[email]",10.22,4.52,1.72,0.58,{fontSize:11.5,color:C.muted,align:"right",breakLine:true});
 pill(s,"PILOT-READY PRODUCT",0.75,5.35,2.15,C.sage);
 txt(s,"Supportive technology · not a medical device or replacement for care",0.76,6.22,6.7,0.33,{fontSize:11,color:"BFCABF"});
 notes(s,["file:///Users/arty/Mori/docs/MORI_PRODUCT_ROADMAP.md"],"Replace all bracketed fields before distribution. The raise amount should match a bottoms-up 18-month budget.");
}

await pptx.writeFile({ fileName: out });
console.log(out);
