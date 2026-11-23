// @ts-nocheck
// The workspace UI. It renders itself as HTML strings into one element and talks to /api/workspace and /api/apply.
// Everything from the server is escaped with esc() before it reaches the page.
export function boot(root, opts) {
const ac = new AbortController();
const on = (target, type, fn) => target.addEventListener(type, fn, { signal: ac.signal });
const LV = {2:"strong",1:"partial",0:"no evidence"};
const MINW = 25;
const wc = t => (t||"").trim().split(/\s+/).filter(Boolean).length;
// A level of 0 is not one thing: said-never, wrote-too-little and never-asked are all different from no evidence.
const evLabel = e => e.level>0 ? LV[e.level] : e.state==="skipped" ? "says never" : e.state==="thin" ? "too short" : e.state==="notasked" ? "not asked" : LV[0];
const LANES = [["new","Answered"],["meet","To meet"],["passed","Passed the test"],["hired","Hired"]];
const D = { openings:{}, cands:{} };
let dirty = false, loaded = false, pending = 0;
const clone = o => JSON.parse(JSON.stringify(o));
async function api(url, body){
  const res = await fetch(url, !body ? { cache:"no-store" } : body instanceof FormData ? { method:"POST", body } : { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && opts.mode === "workspace") location.href = "/admin/login";
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}
async function refresh(){
  if (pending || ac.signal.aborted) return;
  try {
    if (opts.mode === "apply") { const d = await api("/api/apply/" + opts.openingId); D.openings[d.opening.id] = d.opening; }
    else if (opts.mode === "interview") { S.interview = (await api("/api/interview/" + opts.token)).interview; }
    else { const d = await api("/api/workspace"); if (pending) return; D.openings = Object.fromEntries(d.openings.map(o => [o.id, o])); D.cands = Object.fromEntries(d.cands.map(c => [c.id, c])); S.storeNote = ""; }
  } catch(e){ if (opts.mode === "workspace") S.storeNote = e.message; }
  loaded = true; softRender();
}
// Changes show at once and are then sent to the server; if the server refuses, the page reloads what is really stored.
function save(col, obj){
  D[col][obj.id] = obj; render();
  const patch = col === "cands" ? { status:obj.status, test:obj.test ?? null, iv:obj.iv || {}, d90:obj.d90 ?? null } : { hard:obj.hard, open:obj.open !== false };
  pending++;
  api("/api/workspace/save", { kind: col === "cands" ? "candidate" : "opening", id:obj.id, patch })
    // The server adds things of its own, such as the interview link once you ask to meet.
    .then(r => { if (r && r.doc && r.doc.id) { D[col][r.doc.id] = r.doc; softRender(); } })
    .catch(e => { S.storeNote = "That change was not saved: " + e.message; })
    .finally(() => { pending--; if (S.storeNote) refresh(); });
}
function softRender(){ const a = document.activeElement; if (a && root.contains(a) && /^(INPUT|TEXTAREA)$/.test(a.tagName) && a.type !== "checkbox") { dirty = true; return; } render(); }

/* ---------- helpers ---------- */
const S = { route:"openings", tab:{}, fld:0, kit:"ad", busy:"", err:"", storeNote:"", form:{company:"",raw:"",pay:"",hours:"",zone:""}, cform:{parts:{},skip:[],zone:"",pay:"",avail:"",email:"",consent:false,website:""}, candBusy:false, candErr:"", baseBusy:false, baseErr:"", baseNote:"", applied:null, copied:"", cvFile:null, interview:null, iform:{}, ivBusy:false, ivErr:"", live:null };
const $ = s => root.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm = s => String(s||"").toLowerCase().replace(/[“”"«»'’]/g,"").replace(/\s+/g," ").trim();
const num = i => String(i+1).padStart(2,"0");
const rid = () => Math.random().toString(36).slice(2,9);
const ops = () => Object.values(D.openings).sort((a,b)=>(b.created||0)-(a.created||0));
const candsOf = oid => Object.values(D.cands).filter(c=>c.oid===oid);
const days = t => Math.max(0, Math.round((Date.now()-(t||Date.now()))/864e5));
function score(c, o){ return c.evidence.reduce((s,e)=>s+e.level+(o.hard&&o.hard.aid===e.aid?e.level:0),0); }
function dots(c, o){ return `<span class="dots" title="Evidence per activity">${o.activities.map(a=>{const e=c.evidence.find(x=>x.aid===a.id)||{level:0};return `<i class="d${e.level}${o.hard&&o.hard.aid===a.id?" hd":""}"></i>`}).join("")}</span>`; }
function fillAd(o){ return String(o.ad.body||"").replace(/\[LOCATION\]/g, o.zone||"(location missing)").replace(/\[HOURS\]/g, o.hours||"(hours missing)").replace(/\[PAY\]/g, o.pay||"(pay missing)"); }
function counts(oid){ const cs = candsOf(oid); return { all:cs.length, fresh:cs.filter(c=>c.status==="new").length, meet:cs.filter(c=>c.status==="meet").length, passed:cs.filter(c=>c.status==="passed").length, hired:cs.filter(c=>c.status==="hired").length }; }
function record(oid, fi){ const cs = candsOf(oid).filter(c=>c.fi===fi); const tested = cs.filter(c=>c.test&&c.test.result);
  return { answered:cs.length, tested:tested.length, passed:tested.filter(c=>c.test.result==="pass").length, hired:cs.filter(c=>c.status==="hired").length, stayed:cs.filter(c=>c.d90==="stayed").length }; }
function link(o){ return location.origin + "/apply/" + o.id; }

/* ---------- server calls ---------- */
async function createOpening(){
  S.err = ""; const f = S.form;
  if (f.raw.trim().split(/\s+/).length < 8) { S.err = "Paste the text of the opening first."; return render(); }
  S.busy = "Reading the opening and looking for neighbouring fields. This takes about a minute."; render();
  try { const { opening } = await api("/api/workspace", f); D.openings[opening.id] = opening;
    S.busy = ""; S.form = {company:"",raw:"",pay:"",hours:"",zone:""}; S.tab[opening.id] = "work"; go("o-" + opening.id); }
  catch(e){ S.busy = ""; S.err = e.message; render(); }
}
async function submitAnswer(o){
  S.candErr = ""; const f = S.cform;
  const short = o.activities.filter(a => !f.skip.includes(a.id) && wc(f.parts[a.id]) < MINW);
  if (f.skip.length === o.activities.length) { S.candErr = "Describe at least one of these, otherwise there is nothing to compare."; return render(); }
  if (short.length) { S.candErr = `Write at least ${MINW} words about: ${short.map(a=>a.name).join("; ")}. If you have never done one of them, tick the box under it.`; return render(); }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) { S.candErr = "Add an email address so the employer can reach you if they want to meet."; return render(); }
  if (!S.cvFile) { S.candErr = "Attach your CV as a PDF. It is read once for lines about what you did, and the employer never sees the file."; return render(); }
  if (!f.consent) { S.candErr = "Tick the box so the employer is allowed to read your answer."; return render(); }
  S.candBusy = true; render();
  if (S.cvFile && S.cvFile.size > 4 * 1024 * 1024) { S.candErr = "That PDF is larger than 4 MB. Upload a smaller one or remove it."; S.candBusy = false; return render(); }
  const fd = new FormData(); ["zone","pay","avail","email","website"].forEach(k => fd.append(k, f[k] || ""));
  fd.append("parts", JSON.stringify(f.parts)); fd.append("skip", JSON.stringify(f.skip)); fd.append("consent", "true"); if (S.cvFile) fd.append("cv", S.cvFile);
  try { const { candidate } = await api("/api/apply/" + o.id, fd); D.cands[candidate.id] = candidate; S.cvFile = null;
    S.candBusy = false; S.cform = {parts:{},skip:[],zone:"",pay:"",avail:"",email:"",consent:false,website:""}; S.applied = candidate.id; render(); window.scrollTo({top:0}); }
  catch(e){ S.candBusy = false; S.candErr = e.message; render(); }
}
async function runBase(o){
  S.baseErr = ""; S.baseNote = ""; S.baseBusy = true; render();
  try { const r = await api("/api/workspace/base", {oid:o.id, limit:4});
    (r.cands||[]).forEach(c => { D.cands[c.id] = c; });
    S.baseBusy = false; S.baseNote = r.cands && r.cands.length ? `${r.cands.length} ${r.cands.length===1?"person":"people"} from your base read against this opening.${r.left?` ${r.left} still unread.`:""}` : "Nobody left in your base who has not been read against this opening.";
    render(); }
  catch(e){ S.baseBusy = false; S.baseErr = e.message; render(); }
}
async function submitInterview(){
  S.ivErr = ""; const qs = S.interview.questions;
  if (qs.some(x => (S.iform[x.aid] || "").trim().split(/\s+/).length < 10)) { S.ivErr = "Answer every question with at least a couple of sentences."; return render(); }
  S.ivBusy = true; render();
  try { await api("/api/interview/" + opts.token, { answers:S.iform }); S.ivBusy = false; S.interview.done = true; render(); window.scrollTo({top:0}); }
  catch(e){ S.ivBusy = false; S.ivErr = e.message; render(); }
}
function setCand(id, fn){ const c = clone(D.cands[id]); fn(c); save("cands", c); }

/* ---------- the live interview: the browser transcribes, the employer corrects, then it is read ---------- */
const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
let rec = null, recBase = "";
function currentQ(){ const L = S.live; if (!L) return null; const o = D.openings[L.oid]; return o ? o.questions[L.qi] : null; }
function startLive(){
  const L = S.live; if (!SR || !L) return;
  const q = currentQ(); if (!q) return;
  try { rec = new SR(); } catch(e){ L.err = "This browser would not start the microphone."; return render(); }
  rec.lang = L.lang; rec.continuous = true; rec.interimResults = true;
  recBase = L.answers[q.aid] || "";
  rec.onresult = e => {
    let done = "", open = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) done += t; else open += t;
    }
    if (done) recBase = (recBase ? recBase.trimEnd() + " " : "") + done.trim();
    const box = $("#live-text");
    if (box) { box.value = (recBase + (open ? " " + open : "")).trim(); box.scrollTop = box.scrollHeight; }
    L.answers[q.aid] = recBase.trim();
  };
  rec.onerror = ev => { L.listening = false; L.err = ev.error === "not-allowed" ? "The microphone was blocked. Allow it for this site and start again." : "The microphone stopped: " + ev.error + "."; rec = null; render(); };
  rec.onend = () => { if (S.live && S.live.listening && rec) { try { rec.start(); return; } catch(e){} } rec = null; };
  try { rec.start(); L.listening = true; L.err = ""; } catch(e){ L.err = "The microphone could not start."; }
  render();
}
function stopLive(){ const L = S.live; if (L) L.listening = false; if (rec) { const r = rec; rec = null; try { r.stop(); } catch(e){} } if (L) render(); }
async function readLive(){
  const L = S.live; if (!L) return; stopLive();
  L.busy = true; L.err = ""; render();
  try { const { doc } = await api("/api/workspace/interview", { id:L.id, answers:L.answers }); D.cands[doc.id] = doc; S.live = null; go("c-" + doc.id); }
  catch(e){ L.busy = false; L.err = e.message; render(); }
}

/* ---------- employer views ---------- */
function vOpenings(){ const list = ops(); const todo = [];
  list.forEach(o => { const n = counts(o.id); if (n.fresh) todo.push([o, `${n.fresh} new ${n.fresh===1?"answer":"answers"} to review`]); if (n.meet) todo.push([o, `${n.meet} waiting for the practical test`]);
    candsOf(o.id).filter(c=>c.status==="hired"&&!c.d90).forEach(c=>todo.push([o, `${c.code} was hired. Record the 90-day check when it is due`, c])); });
  return `<div class="hrow"><div class="head"><div class="lab">Workspace</div><h1>Openings</h1></div><button class="wbtn" data-go="new">New opening</button></div>
  ${S.storeNote?`<p class="warn">${esc(S.storeNote)}</p>`:""}
  ${todo.length?`<section class="sheet strongb"><div class="lab">Needs you</div>${todo.map(t=>`<div class="todo"><span><strong>${esc(t[0].title)}</strong> · ${esc(t[1])}</span><button class="wbtn sm ghost" data-go="${t[2]?"c-"+t[2].id:"o-"+t[0].id}" data-tab="cands">Open</button></div>`).join("")}</section>`:""}
  <div class="list">
    <div class="orow" style="cursor:default;border:0;background:none;padding-top:0;padding-bottom:0;box-shadow:none"><span></span>${["Answered","To meet","Passed","Hired"].map(x=>`<span class="lab">${x}</span>`).join("")}<span class="go" style="width:54px"></span></div>
    ${list.map(o=>{const n=counts(o.id);const cell=v=>`<span class="n ${v?"":"z"}">${v}</span>`;return `<button class="orow" data-go="o-${o.id}"><div><strong>${esc(o.title)}</strong><span class="wfacts" style="margin-top:6px"><span>${esc(o.company||"")}</span><span>${o.open===false?"filled":days(o.created)+" days open"}</span>${o.example?`<span class="wtag">example</span>`:""}</span></div>${cell(n.all)}${cell(n.meet)}${cell(n.passed)}${cell(n.hired)}<span class="go lab">Open →</span></button>`}).join("")
      || `<p class="empty">No openings yet. Start with the one that has been open the longest.</p>`}
  </div>`; }

function vNew(){ const f = S.form;
  return `<section class="whero"><div class="lab">New opening</div><h1>The person you need already does this job. <mark>In another field.</mark></h1>
  <p>Paste an opening that is not getting filled. adjacent takes it apart into what the person does every day, shows which other fields already have people doing it, and sets up the link, the test and the interview to check it.</p></section>
  <section class="sheet strongb"><div class="grid2">
    <div class="col">
      <label for="company">Company<input type="text" id="company" data-f="company" value="${esc(f.company)}" placeholder="Mid-sized insurer with offices on Reforma"></label>
      <label for="raw">The opening, as you posted it<textarea id="raw" data-f="raw" placeholder="Paste the ad here, in English or Spanish.">${esc(f.raw)}</textarea></label>
    </div>
    <div class="col">
      <div class="lab">What every candidate asks first</div>
      <label for="pay">Pay<input type="text" id="pay" data-f="pay" value="${esc(f.pay)}" placeholder="MXN 14,000 gross per month"></label>
      <label for="hours">Hours<input type="text" id="hours" data-f="hours" value="${esc(f.hours)}" placeholder="Monday to Friday, 9 to 6"></label>
      <label for="zone">Location<input type="text" id="zone" data-f="zone" value="${esc(f.zone)}" placeholder="Neighbourhood and borough"></label>
      <p class="note">The ad and the candidate page go out with these three facts. Without them, people from another field won't leave the job they have to come to an interview.</p>
      ${S.err?`<p class="warn">${esc(S.err)}</p>`:""}
      ${S.busy?`<p class="busy">${esc(S.busy)}</p>`:`<div class="wrow"><button class="wbtn" data-act="create">Open the search</button><button class="wbtn ghost" data-go="openings">Cancel</button></div>`}
    </div>
  </div></section>`; }

function tWork(o){ const VD = {keep:["s2","keep"],learn:["s1","can be taught"],ask:["s0","your call"]};
  return `<div class="grid2">
    <section class="sheet"><div class="lab" style="margin-bottom:6px">What the person actually does</div><div class="acts">${o.activities.map((a,i)=>`<div class="act ${o.hard&&o.hard.aid===a.id?"hard":""}"><div class="k">${num(i)}</div><div><h3>${esc(a.name)}</h3><p>${esc(a.detail)}</p>${o.hard&&o.hard.aid===a.id?"":`<button class="wlink" data-hard="${a.id}" style="margin-top:4px">This is the hardest one to cover</button>`}</div></div>`).join("")}</div>
    ${o.hard&&o.hard.text?`<p class="warn" style="margin-top:10px">${esc(o.hard.text)}</p>`:""}</section>
    <section class="sheet"><div class="col"><div class="lab">What your ad asked for</div>
      <div class="reqs">${o.requirements.map(r=>`<div class="req"><span class="pill ${VD[r.verdict][0]}">${VD[r.verdict][1]}</span><strong>${esc(r.text)}</strong><p>${esc(r.note)}</p></div>`).join("")||`<p class="note">The ad had no requirements.</p>`}</div>
      <p class="note">adjacent never removes a requirement without telling you. It shows which ones shut out people who can do the work, and you decide.</p>
      <details style="padding:0;border:0"><summary class="note">The ad as you posted it</summary><p class="note">${esc(o.raw)}</p></details></div></section>
  </div>`; }

function recordText(o, fi){ const r = record(o.id, fi);
  if (!r.answered) return "Nobody from this field has answered the link yet. The rating above is an estimate until results come in.";
  return `${r.answered} answered the link, ${r.tested} took the test, ${r.passed} passed, ${r.hired} hired${r.hired?`, ${r.stayed} still in the job at 90 days`:""}.`; }
function tFields(o){ const fi = Math.min(S.fld, o.fields.length-1), f = o.fields[fi];
  return `<p class="note">Each line joins a field to an activity in your opening that its people already do. A solid line is a strong match, a dashed line is partial.</p>
  <section class="map" id="map"><svg id="lines" aria-hidden="true"></svg>
    <div class="lab" style="grid-column:1">Neighbouring fields</div><div class="lab" style="grid-column:3">Activities in your opening</div>
    <div class="side l">${o.fields.map((x,i)=>`<button class="fld" data-fld="${i}" aria-pressed="${i===fi}"><span class="pill s${x.strength}">${x.strength===2?"strong match":x.strength===1?"partial":"weak"}</span><strong>${esc(x.name)}</strong></button>`).join("")}</div>
    <div class="side r">${o.activities.map((a,i)=>`<div class="node ${f.covers[a.id]?"":"dim"}" data-node="${a.id}"><span class="k">${num(i)}</span><span>${esc(a.name)}</span></div>`).join("")}</div>
  </section>
  <section class="sheet strongb"><div class="col"><h3 style="font-size:24px">${esc(f.name)}</h3>
    <div class="detail">
      <div><h3>What they do there that is the same</h3><p>${esc(f.same)}</p></div>
      <div><h3>What you would have to teach</h3><p>${esc(f.teach)}</p></div>
      <div><h3>Where to find them</h3><p>${esc(f.find)}</p></div>
      <div><h3>Results so far</h3><p>${esc(recordText(o, fi))}</p></div>
    </div></div></section>`; }

function tKit(o){ const tabs = [["ad","Ad"],["test","20-minute test"],["interview","Interview guide"]]; let body = "";
  if (S.kit==="ad") body = `<div class="doc" id="copyme"><h3>${esc(o.ad.headline)}</h3><div class="body">${esc(fillAd(o))}\n\nAnswer here, no CV needed: ${esc(link(o))}</div></div>
    <p class="note">Post it wherever you already post. The last line sends people to your candidate page.</p>`;
  if (S.kit==="test") body = `<div class="doc" id="copyme"><h3>${esc(o.test.title)}</h3><p>${esc(o.test.setup)}</p><ol class="steps2">${o.test.steps.map(s=>`<li>${esc(s)}</li>`).join("")}</ol>
    <p><strong>What separates someone who can do it:</strong> ${esc(o.test.good)}</p></div><p class="note">Written for someone who has never worked in your industry. You tick the criteria on each candidate's page while they take it.</p>`;
  if (S.kit==="interview") body = `<div id="copyme">${o.questions.map(q=>{const i=o.activities.findIndex(a=>a.id===q.aid);return `<div class="q"><div class="lab">${i>=0?num(i)+" / "+esc(o.activities[i].name):""}</div><p class="ask">${esc(q.q)}</p><p class="hear"><strong>Listen for:</strong> ${esc(q.listen)}</p></div>`}).join("")}</div>`;
  return `<div><div class="tabs" role="tablist">${tabs.map(t=>`<button role="tab" data-kit="${t[0]}" aria-selected="${S.kit===t[0]}">${t[1]}</button>`).join("")}</div>
  <section class="sheet" style="border-top:0"><div class="col">${body}<div class="wrow"><button class="wbtn ghost sm" data-copy="#copyme">Copy text</button><span class="note">${esc(S.copied)}</span></div></div></section></div>`; }

function tCands(o){ const cs = candsOf(o.id).sort((a,b)=>score(b,o)-score(a,o)); const out = cs.filter(c=>c.status==="failed"||c.status==="declined");
  const pool = Object.values(D.cands).filter(c=>c.oid!==o.id).length;
  const card = c => `<button class="ccard" data-go="c-${c.id}"><span class="wrow" style="justify-content:space-between"><strong>${esc(c.code)}</strong>${dots(c,o)}</span><span class="f">${esc(c.from)}</span><span class="m">${esc(c.zone)} · ${esc(c.salary)}</span><span class="wrow" style="gap:6px">${c.example?`<span class="wtag">example</span>`:""}${c.via==="base"?`<span class="wtag">from your base</span>`:""}</span></button>`;
  return `<div class="linkbox"><span>${esc(link(o))}</span><span class="wrow"><button class="wbtn sm ghost" data-copylink="${o.id}">Copy link</button><a class="wbtn sm" href="/apply/${o.id}" target="_blank" rel="noopener">Open candidate page</a></span></div>
  <section class="sheet strongb"><div class="hrow"><div class="col" style="gap:4px"><div class="lab">Your base</div><p class="note" style="max-width:62ch">Everyone who has ever answered one of your links stays here. adjacent can read them against this opening without asking them anything again: you already met these people, so this is the one list that does not depend on new applicants.${pool?` ${pool} ${pool===1?"person":"people"} from other openings.`:" Nobody from another opening yet."}</p></div>
    ${S.baseBusy?`<p class="busy">Reading your base against this opening.</p>`:`<button class="wbtn sm" data-act="base" ${pool?"":"disabled"}>Read 4 from the base</button>`}</div>
    ${S.baseErr?`<p class="warn">${esc(S.baseErr)}</p>`:""}${S.baseNote?`<p class="note">${esc(S.baseNote)}</p>`:""}</section>
  <p class="note">Each dot is one activity of the opening: filled is strong evidence, half is partial, empty is none. The ringed dot is the hardest activity. Candidates are ordered by evidence, with the hardest activity counting double.</p>
  <div class="board">${LANES.map(l=>{const xs=cs.filter(c=>c.status===l[0]);return `<div class="lane"><h3><span>${l[1]}</span><span>${xs.length}</span></h3>${xs.map(card).join("")||`<div class="empty">${l[0]==="new"?"Nobody waiting for review.":"Nobody here yet."}</div>`}</div>`}).join("")}</div>
  ${out.length?`<div class="col"><div class="lab">Not moving forward (${out.length})</div><div class="chips">${out.map(c=>`<button class="chip" data-go="c-${c.id}">${esc(c.code)} · ${esc(c.from)}</button>`).join("")}</div></div>`:""}`; }

function vOpening(o){ const n = counts(o.id); const t = S.tab[o.id] || (n.all ? "cands" : "work");
  const tabs = [["work","The work"],["fields","Where to look"],["kit","Ad, test, interview"],["cands","Candidates",n.all]];
  return `<div class="head"><button class="wlink" data-go="openings" style="align-self:flex-start">← Openings</button>
    <div class="hrow"><div class="head"><div class="lab">${esc(o.company||"")}${o.example?" · example":""}</div><h1>${esc(o.title)}</h1></div>
      <div class="wrow"><button class="wbtn sm ghost" data-toggle="${o.id}">${o.open===false?"Reopen":"Mark as filled"}</button>${o.example?"":`<button class="wbtn sm ghost" data-del="${o.id}">Delete</button>`}</div></div>
    <div class="wfacts"><span>${esc(o.pay||"pay missing")}</span><span>${esc(o.hours||"hours missing")}</span><span>${esc(o.zone||"location missing")}</span><span>${o.open===false?"filled":days(o.created)+" days open"}</span></div></div>
  <div class="tabs" role="tablist">${tabs.map(x=>`<button role="tab" data-otab="${x[0]}" aria-selected="${t===x[0]}">${x[1]}${x[2]!=null?`<span class="ct">${x[2]}</span>`:""}</button>`).join("")}</div>
  ${({work:tWork,fields:tFields,kit:tKit,cands:tCands})[t](o)}`; }

function evidenceCard(c, o){
  return `<article class="cand"><div class="ch"><div><strong>${esc(c.code)}</strong> <span class="note">comes from ${esc(c.from)}</span>${c.via==="base"?` <span class="wtag">from your base</span>`:""}</div>
    <div class="wfacts"><span>${esc(c.zone)}</span><span>expects ${esc(c.salary)}</span>${c.avail?`<span>${esc(c.avail)}</span>`:""}</div></div>
    ${o.activities.map((a,k)=>{const e=c.evidence.find(x=>x.aid===a.id)||{level:0,quote:"",note:""};return `<div class="ev"><div><span class="pill s${e.level}${e.level===0&&e.state?" open":""}">${evLabel(e)}</span></div><div><div class="an">${num(k)} ${esc(a.name)}</div>${e.quote?`<blockquote><mark>${esc(e.quote)}</mark></blockquote>`:""}<div class="nt">${e.src==="cv"?`<span class="wtag">from their CV</span> `:""}${esc(e.note)}</div>${c.parts&&c.parts[a.id]?`<details><summary>What they answered here</summary><p>${esc(c.parts[a.id])}</p></details>`:""}</div></div>`}).join("")}
    <div class="cf"><strong>Would have to learn:</strong> ${esc(c.gap)}${c.hasCv?`<br>They also uploaded a CV. adjacent read it for lines about what they did; the CV itself is not shown, so name, age and school stay out of the decision.`:""}${c.via==="base"?`<br>This person answered an earlier opening of yours. Nothing above was written with this job in mind, so an empty activity means nobody has asked them yet.`:""}</div>
    ${c.parts?"":`<details><summary>Everything they wrote</summary><p>${esc(c.said)}</p></details>`}</article>`; }

function contact(c){ return c.email ? `<p class="note">Contact: <a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>` : `<p class="note">No contact on file${c.example?" (example person)":""}.</p>`; }
function vCand(c, o){ const st = c.status, test = c.test || {checks:[]}, crit = o.test.criteria || [], done = (test.checks||[]).filter(Boolean).length; const tl = ["Answered the link"];
  if (st!=="new" && st!=="declined") tl.push("You asked to meet");
  if (test.result) tl.push(`Practical test: ${test.result==="pass"?"passed":"did not pass"}${crit.length?` (${done} of ${crit.length} criteria)`:""}`);
  if (st==="hired") tl.push("Hired"); if (c.d90) tl.push("90 days: " + (c.d90==="stayed"?"still in the job":"left"));
  if (st==="declined") tl.push("Not moving forward");
  let act = "";
  if (st==="new") act = `<section><div class="mini">Decision</div><p class="note">You are deciding on evidence only. No name, photo, age or school is collected, and their email appears here once you ask to meet.</p><div class="wrow"><button class="wbtn" data-st="${c.id}:meet">Ask to meet</button><button class="wbtn ghost" data-st="${c.id}:declined">Not moving forward</button></div></section>`;
  if (st==="meet") act = `<section><div class="mini">Practical test · ${esc(o.test.title)}</div><p class="note">Write to them to arrange the test, then tick what you observe while they take it.</p>${contact(c)}
      ${crit.map((x,i)=>`<label class="chk" for="k${i}"><input type="checkbox" id="k${i}" data-chk="${c.id}:${i}" ${test.checks&&test.checks[i]?"checked":""}><span>${esc(x)}</span></label>`).join("")}
      <div class="wrow"><button class="wbtn" data-test="${c.id}:pass">Passed</button><button class="wbtn ghost" data-test="${c.id}:fail">Did not pass</button></div></section>`;
  if (st==="passed") act = `<section><div class="mini">After the interview</div>${contact(c)}<div class="wrow"><button class="wbtn" data-st="${c.id}:hired">Record as hired</button><button class="wbtn ghost" data-st="${c.id}:declined">Not moving forward</button></div></section>`;
  if (st==="hired") act = `<section><div class="mini">90-day check</div>${c.d90?`<p class="note">Recorded. This result now counts in the track record for ${esc(c.fi>=0?o.fields[c.fi].name:"this field")}.</p>`:`<p class="note">Record this 90 days after the start date.</p><div class="wrow"><button class="wbtn" data-d90="${c.id}:stayed">Still in the job</button><button class="wbtn ghost" data-d90="${c.id}:left">Left</button></div>`}</section>`;
  if (st==="failed"||st==="declined") act = `<section><div class="mini">Closed</div><div class="wrow"><button class="wbtn ghost sm" data-st="${c.id}:new">Move back to answered</button></div></section>`;
  const rv = c.interview, ilink = c.itoken ? location.origin + "/interview/" + c.itoken : "";
  const liveBtn = (st==="meet"||st==="passed") ? `<button class="wbtn sm" data-live="${c.id}">${rv ? "Interview again, live" : "Interview them now"}</button>` : "";
  const ivHead = rv ? `<p class="note">${rv.source === "live" ? "You interviewed them and corrected the transcript." : "They answered in writing."} The highlight is what adjacent points at; the rating is yours.</p>${liveBtn}`
    : ilink ? `<p class="note">Interview them live and let the browser transcribe it, or send this link for them to answer in writing.</p>${liveBtn}<p class="note"><div class="linkbox" style="font-size:12.5px"><span>${esc(ilink)}</span><button class="wbtn sm ghost" data-copytext="${esc(ilink)}">Copy</button></div></p>${c.email?`<a class="note" href="mailto:${esc(c.email)}?subject=${encodeURIComponent("Next step: " + o.title)}&body=${encodeURIComponent("Thank you for your answer. We would like to know more. Please answer these questions in writing:\n" + ilink)}">Write the email</a>`:""}<span class="note">${esc(S.copied)}</span>`
    : `<p class="note">The written interview link appears once you ask to meet.</p>`;
  const iv = (st==="meet"||st==="passed"||st==="hired") ? `<section><div class="mini">Interview</div>${ivHead}${o.questions.map(q=>{const k=o.activities.findIndex(a=>a.id===q.aid);const v=(c.iv||{})[q.aid];const r=rv&&rv.review.find(x=>x.aid===q.aid);const ans=rv&&rv.answers[q.aid];
    return `<div class="iq"><span><strong>${num(k)}</strong> ${esc(q.q)}</span>${rv?`<details style="padding:0;border:0" ${r&&r.quote?"":"open"}><summary>${r&&r.quote?`<mark>${esc(r.quote)}</mark>`:"Read the answer"}</summary><p>${esc(ans||"(no answer)")}</p></details><span class="note"><span class="pill s${r?r.level:0}">adjacent reads: ${LV[r?r.level:0]}</span> ${esc(r?r.note:"")}</span><span class="note"><strong>Listen for:</strong> ${esc(q.listen)}</span>`:""}<span class="rate">${[[2,"strong"],[1,"partial"],[0,"weak"]].map(x=>`<button data-iv="${c.id}:${q.aid}:${x[0]}" aria-pressed="${v===x[0]}">${x[1]}</button>`).join("")}</span></div>`}).join("")}</section>` : "";
  return `<div class="head"><button class="wlink" data-go="o-${o.id}" data-tab="cands" style="align-self:flex-start">← ${esc(o.title)}</button></div>
  <div class="cgrid">${evidenceCard(c,o)}
    <aside class="panel"><section><div class="mini">So far</div><div class="tl">${tl.map(x=>`<div>${esc(x)}</div>`).join("")}</div>${c.example?`<span class="wtag" style="align-self:flex-start">example person, fictional</span>`:""}</section>${act}${iv}</aside></div>`; }

function vLive(){ const L = S.live, o = D.openings[L.oid], c = D.cands[L.id];
  if (!o || !c) { S.live = null; return vOpenings(); }
  const q = o.questions[L.qi], k = o.activities.findIndex(a => a.id === q.aid), answered = o.questions.filter(x => (L.answers[x.aid]||"").trim().split(/\s+/).length >= 8).length;
  return `<div class="head"><button class="wlink" data-go="c-${c.id}" style="align-self:flex-start">← ${esc(c.code)}</button>
    <div class="wrow" style="justify-content:space-between;align-items:flex-start"><div class="head"><div class="lab">${esc(o.title)} · question ${L.qi+1} of ${o.questions.length}</div><h1 style="font-size:clamp(21px,2.3vw,27px);max-width:46ch">${esc(q.q)}</h1></div>
    <span class="wtag" style="margin-top:6px">${answered} of ${o.questions.length} answered</span></div>
    <p class="note"><strong>Listen for:</strong> ${esc(q.listen)}</p></div>
  ${L.told ? "" : `<section class="sheet strongb"><div class="col"><div class="mini">Before you start</div>
    <p class="note">Tell the person their answers are being transcribed so they can be checked against the job, that no recording is kept, and that you will read the text yourself. ${SR ? "The transcription happens in your browser; in Chrome the audio goes to Google's speech service to be turned into text." : ""}</p>
    <label class="chk" for="told"><input type="checkbox" id="told" data-told="1"><span>I have told them, and they agreed.</span></label></div></section>`}
  <section class="sheet"><div class="col">
    <div class="wrow" style="justify-content:space-between">
      <span class="mini" style="margin:0">${num(k)} ${esc(o.activities[k] ? o.activities[k].name : "")}</span>
      <span class="wrow">${SR ? `<select data-lang="1" aria-label="Spoken language" style="background:var(--surface);border:1px solid var(--line);padding:7px 10px">${[["es-MX","Spanish (Mexico)"],["en-US","English"]].map(x=>`<option value="${x[0]}" ${L.lang===x[0]?"selected":""}>${x[1]}</option>`).join("")}</select>
        <button class="wbtn ${L.listening?"":"ghost"}" data-mic="1" ${L.told?"":"disabled"}>${L.listening ? "Stop" : ((L.answers[q.aid]||"") ? "Keep recording" : "Start recording")}</button>` : ""}</span>
    </div>
    ${L.listening ? `<p class="busy">Listening. Speak normally; the text appears as they talk.</p>` : ""}
    <label for="live-text">What they said${SR ? ", as transcribed. Correct anything that came out wrong." : ". Type or paste it: this browser has no speech recognition, so use Chrome if you want it transcribed."}
      <textarea id="live-text" data-livebox="1" style="min-height:210px">${esc(L.answers[q.aid] || "")}</textarea></label>
    ${L.err ? `<p class="warn">${esc(L.err)}</p>` : ""}
    <div class="wrow" style="justify-content:space-between">
      <span class="wrow">${L.qi > 0 ? `<button class="wbtn ghost sm" data-qi="${L.qi-1}">Previous</button>` : ""}
        ${L.qi < o.questions.length-1 ? `<button class="wbtn sm" data-qi="${L.qi+1}">Next question</button>` : ""}</span>
      ${L.busy ? `<p class="busy">Reading the answers against the activities.</p>` : `<button class="wbtn" data-act="readlive" ${answered?"":"disabled"}>Read the answers</button>`}
    </div>
    <p class="note">Only the text counts. adjacent points at a literal quote per answer and you set the rating. No audio is stored.</p>
  </div></section>`; }

function vMoves(){ const rows = []; ops().forEach(o => o.fields.forEach((f,i) => { const r = record(o.id,i); if (r.answered) rows.push([f.name, o.title, r]); }));
  const cell = v => `<span class="n ${v?"":"z"}">${v}</span>`;
  return `<div class="head"><div class="lab">Across all openings</div><h1>Track record</h1><p>Every move from one field into a role, counted from what happened and not from what a model thinks. This is the part of adjacent that can't be generated: it only exists because the hiring ran through here.</p></div>
  <section class="sheet" style="padding:0"><div class="mrow hd"><span>From field → into role</span><span>Answered</span><span>Tested</span><span>Passed</span><span>Hired</span><span>At 90 days</span></div>
  ${rows.map(r=>`<div class="mrow"><div><strong>${esc(r[0])}</strong><div class="note">→ ${esc(r[1])}</div></div>${cell(r[2].answered)}${cell(r[2].tested)}${cell(r[2].passed)}${cell(r[2].hired)}${cell(r[2].stayed)}</div>`).join("")||`<div class="mrow"><p class="note">Nothing recorded yet.</p></div>`}</section>
  <p class="note">The example openings start with people who answered and nothing else. Run a candidate through the test and the hire, and the numbers move here and on the opening's field page.</p>`; }

/* ---------- candidate page ---------- */
function vInterview(){ const it = S.interview, bar = `<div class="wbar"><div class="brand" style="padding:0">adjacent</div><a class="note" href="/privacy">Privacy</a></div>`;
  if (!it) return bar + `<div class="head"><h1>This interview link is not valid</h1><p>Check the link you were sent.</p></div>`;
  if (it.done) return bar + `<div class="head"><div class="lab">Sent</div><h1>Your answers are with the employer</h1><p>A person reads every answer and makes the decision. They will write to you at the email you gave.</p></div>`;
  if (!it.open) return bar + `<div class="head"><h1>This interview is closed</h1><p>Thank you for your interest.</p></div>`;
  return bar + `<div class="head"><div class="lab">${esc(it.company)} · ${esc(it.code)}</div><h1>A few questions about ${esc(it.title)}</h1>
    <p>Answer in writing, in your own words, about things that really happened to you in any job. Specific beats polished: what the situation was, what you did, how it ended. There is no time limit.</p></div>
  ${it.questions.map((x,i)=>`<section class="sheet"><div class="col"><div class="lab">${num(i)} · ${esc(x.activity)}</div><label for="iq${i}" style="font-size:17px">${esc(x.q)}<textarea id="iq${i}" data-iq="${esc(x.aid)}">${esc(S.iform[x.aid]||"")}</textarea></label></div></section>`).join("")}
  ${S.ivErr?`<p class="warn">${esc(S.ivErr)}</p>`:""}
  ${S.ivBusy?`<p class="busy">Sending your answers.</p>`:`<div class="wrow"><button class="wbtn" data-act="sendiv">Send my answers</button><span class="note">You can send them once. A person at the company reads them; no decision is made automatically.</span></div>`}`; }
function vApply(o){ const mine = S.applied && D.cands[S.applied] && D.cands[S.applied].oid===o.id ? D.cands[S.applied] : null;
  const bar = `<div class="wbar"><div class="brand" style="padding:0">adjacent</div><a class="note" href="/privacy">Privacy</a></div>`;
  if (o.open === false) return bar + `<div class="head"><h1>This opening has been filled</h1><p>Thank you for your interest.</p></div>`;
  if (mine) return bar + `<div class="head"><div class="lab">Sent</div><h1>This is exactly what the employer sees</h1><p>Your code is ${esc(mine.code)}. They see what you wrote and how it lines up with the job, nothing else: no name, age, photo or school. Your email is shown to them only if they ask to meet you.</p></div>${evidenceCard(mine,o)}
    `;
  const ask = a => (o.questions||[]).filter(q=>q.aid===a.id).map(q=>q.q)[0] || `Tell us about a time you did this at work: ${a.name}. What did you do, how often, and who else was involved?`;
  const box = (a,i) => { const skipped = S.cform.skip.includes(a.id), n = wc(S.cform.parts[a.id]);
    return `<div class="qbox"><div class="wrow" style="justify-content:space-between;align-items:baseline"><div class="an">${num(i)} ${esc(a.name)}</div>${skipped?`<span class="wtag">you have never done this</span>`:`<span class="note">${n} of ${MINW} words${n>=MINW?" ✓":""}</span>`}</div>
      <p class="note">${esc(ask(a))}</p>
      ${skipped?"":`<textarea id="p-${esc(a.id)}" data-p="${esc(a.id)}" placeholder="What you did, how often, and who else was involved.">${esc(S.cform.parts[a.id]||"")}</textarea>`}
      <label class="chk" for="s-${esc(a.id)}"><input type="checkbox" id="s-${esc(a.id)}" data-skip="${esc(a.id)}" ${skipped?"checked":""}><span>I have never done this at work</span></label></div>`; };
  const left = o.activities.filter(a=>!S.cform.skip.includes(a.id) && wc(S.cform.parts[a.id])<MINW).length;
  return bar + `<div class="head"><div class="lab">${esc(o.company||"")}</div><h1>${esc(o.ad.headline||o.title)}</h1>
    <div class="wfacts"><span>${esc(o.pay||"pay not stated")}</span><span>${esc(o.hours||"hours not stated")}</span><span>${esc(o.zone||"location not stated")}</span></div></div>
  <section class="sheet"><div class="lab" style="margin-bottom:6px">What you would do in this job</div><div class="acts">${o.activities.map((a,i)=>`<div class="act"><div class="k">${num(i)}</div><div><h3>${esc(a.name)}</h3><p>${esc(a.detail)}</p></div></div>`).join("")}</div></section>
  <section class="sheet strongb"><div class="col"><h2 style="font-size:26px">One question per thing the job asks for.</h2>
    <p class="note">You don't need experience in this industry, and nobody is ranked by their CV here. Answer each one about a job you have or had: ${MINW} words, enough to tell one example properly, and if you have never done one of them, say so instead of guessing. Only what you write counts, so be specific. About ten minutes.</p>
    <div class="col" style="gap:14px">${o.activities.map(box).join("")}</div>
    <div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px"><label for="czone">Area where you live<input type="text" id="czone" data-c="zone" value="${esc(S.cform.zone)}"></label>
      <label for="cpay">Pay you expect<input type="text" id="cpay" data-c="pay" value="${esc(S.cform.pay)}"></label><label for="cavail">When you could start<input type="text" id="cavail" data-c="avail" value="${esc(S.cform.avail)}"></label>
      <label for="cemail">Email<input type="text" id="cemail" inputmode="email" autocomplete="email" data-c="email" value="${esc(S.cform.email)}"></label></div>
    <div class="col" style="gap:6px"><span style="font-size:14px;font-weight:500">Your CV (PDF, up to 4 MB) — required</span>
      ${S.cvFile?`<span class="wrow"><span class="wtag">${esc(S.cvFile.name)}</span><button class="wlink" data-act="nocv">Remove</button></span>`:`<input type="file" id="ccv" accept="application/pdf,.pdf" data-cv="1">`}
      <span class="note">Your answers above are what decide it. The CV is read once for lines about what you did, the file is not kept, and the employer never sees it: no name, age, photo or school reaches them.</span></div>
    <input type="text" data-c="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px" value="">
    <label class="chk" for="cconsent"><input type="checkbox" id="cconsent" data-cc="1" ${S.cform.consent?"checked":""}><span>I agree that the employer for this opening can read my answers, and see my email if they ask to meet me. Answers are deleted after 12 months.</span></label>
    ${S.candErr?`<p class="warn">${esc(S.candErr)}</p>`:""}
    ${S.candBusy?`<p class="busy">Comparing what you wrote with the activities of the job.</p>`:`<div class="wrow"><button class="wbtn" data-act="answer">Send my answers</button><span class="note">${left?`${left} ${left===1?"answer":"answers"} still too short.`:"Leave your name out. Phone numbers and links are removed automatically."}</span></div>`}
  </div></section>`; }

/* ---------- shell ---------- */
function drawLines(o){ const svg = $("#lines"), map = $("#map"); if(!svg||!map||getComputedStyle(svg).display==="none") return; const R = map.getBoundingClientRect(), sel = Math.min(S.fld,o.fields.length-1); let h = "";
  o.fields.forEach((f,i)=>{ const a = map.querySelector(`[data-fld="${i}"]`).getBoundingClientRect();
    o.activities.forEach(act=>{ const lv = f.covers[act.id]||0; if(!lv) return; const b = map.querySelector(`[data-node="${act.id}"]`).getBoundingClientRect();
      const x1 = a.right-R.left, y1 = a.top+a.height/2-R.top, x2 = b.left-R.left, y2 = b.top+b.height/2-R.top, m = (x1+x2)/2, on = i===sel;
      h += `<path d="M${x1},${y1} C${m},${y1} ${m},${y2} ${x2},${y2}" fill="none" stroke="${on?"var(--ink)":"var(--line)"}" stroke-width="${lv===2?(on?1.75:1.25):1}" ${lv===1?'stroke-dasharray="5 5"':""}/>`;
      if (on) h += `<circle cx="${x2}" cy="${y2}" r="3.5" fill="var(--ink)"/>`; }); });
  svg.innerHTML = h; }
function render(){ dirty = false; const r = S.route; let body, solo = opts.mode === "apply", cur = "openings", o = null;
  if (!loaded) body = `<p class="busy">Loading.</p>`;
  else if (opts.mode === "interview") { body = vInterview(); solo = true; }
  else if (opts.mode === "apply" && !D.openings[opts.openingId]) body = `<div class="wbar"><div class="brand" style="padding:0">adjacent</div></div><div class="head"><h1>This opening does not exist</h1><p>Check the link you were given.</p></div>`;
  else if (r === "new") body = vNew();
  else if (r.startsWith("live-") && S.live) body = vLive();
  else if (r === "moves") { body = vMoves(); cur = "moves"; }
  else if (r.startsWith("apply-") && (o = D.openings[r.slice(6)])) { body = vApply(o); solo = true; }
  else if (r.startsWith("o-") && (o = D.openings[r.slice(2)])) body = vOpening(o);
  else if (r.startsWith("c-") && D.cands[r.slice(2)] && (o = D.openings[D.cands[r.slice(2)].oid])) body = vCand(D.cands[r.slice(2)], o);
  else body = vOpenings();
  const fresh = Object.values(D.cands).filter(c=>c.status==="new").length;
  root.innerHTML = solo ? `<div class="solo">${body}</div>` : `<div class="app"><aside class="rail"><div class="brand">adjacent<i></i></div>
    <nav aria-label="Sections"><button data-go="openings" aria-current="${cur==="openings"}"><span>Openings</span><span class="ct">${fresh?fresh+" new":""}</span></button><button data-go="moves" aria-current="${cur==="moves"}"><span>Track record</span></button></nav>
    <div class="bot"><span>Openings tagged example are fictional.</span><a href="/admin">Operator admin</a></div></aside><main class="wwrap">${body}</main></div>`;
  if (o && r.startsWith("o-") && (S.tab[o.id]==="fields")) requestAnimationFrame(()=>drawLines(o));
}
function go(r){ if (opts.mode !== "workspace") return; S.route = r; S.copied = ""; try{ if(location.hash.slice(1)!==r) location.hash = r; }catch(e){} render(); window.scrollTo({top:0}); }
function copy(txt){ const done = m => { S.copied = m; render(); };
  try { navigator.clipboard.writeText(txt).then(()=>done("Copied."), ()=>done("Could not copy. Select the text and copy it by hand.")); } catch(_){ done("Could not copy. Select the text and copy it by hand."); } }

on(document, "click", e => { const t = e.target.closest("button"); if(!t) return; const d = t.dataset;
  if (d.go) { if (d.tab && d.go.startsWith("o-")) S.tab[d.go.slice(2)] = d.tab; return go(d.go); }
  const oid = S.route.startsWith("o-") ? S.route.slice(2) : null;
  if (d.otab) { S.tab[oid] = d.otab; S.copied = ""; return render(); }
  if (d.kit) { S.kit = d.kit; S.copied = ""; return render(); }
  if (d.fld) { S.fld = +d.fld; return render(); }
  if (d.hard) { const o = clone(D.openings[oid]); o.hard = {aid:d.hard, text:"You marked this as the hardest activity to cover. Candidates are ordered with it counting double."}; return save("openings", o); }
  if (d.toggle) { const o = clone(D.openings[d.toggle]); o.open = o.open === false; return save("openings", o); }
  if (d.del) { candsOf(d.del).forEach(c=>{ delete D.cands[c.id]; }); delete D.openings[d.del]; api("/api/workspace/save", {kind:"delete-opening", id:d.del}).catch(e=>{ S.storeNote = "The opening was not deleted: " + e.message; refresh(); }); return go("openings"); }
  if (d.copy) return copy($(d.copy).innerText);
  if (d.copylink) return copy(link(D.openings[d.copylink]));
  if (d.st) { const [id, st] = d.st.split(":"); return setCand(id, c => { c.status = st; if (st==="new") { delete c.test; delete c.d90; } }); }
  if (d.test) { const [id, r] = d.test.split(":"); return setCand(id, c => { c.test = Object.assign({checks:[]}, c.test, {result:r}); c.status = r==="pass" ? "passed" : "failed"; }); }
  if (d.d90) { const [id, r] = d.d90.split(":"); return setCand(id, c => { c.d90 = r; }); }
  if (d.iv) { const [id, aid, v] = d.iv.split(":"); return setCand(id, c => { c.iv = Object.assign({}, c.iv, {[aid]:+v}); }); }
  if (d.live) { const c = D.cands[d.live]; S.live = { id:c.id, oid:c.oid, qi:0, answers: Object.assign({}, (c.interview||{}).answers), lang:"es-MX", listening:false, told:false, busy:false, err:"" }; return go("live-" + c.id); }
  if (d.qi) { stopLive(); S.live.qi = +d.qi; return render(); }
  if (d.mic) return S.live.listening ? stopLive() : startLive();
  if (d.act==="readlive") return readLive();
  if (d.act==="create") return createOpening();
  if (d.act==="answer") return submitAnswer(D.openings[S.route.slice(6)]);
  if (d.act==="base") { const o = D.openings[S.route.slice(2)]; return o && runBase(o); }
  if (d.act==="sendiv") return submitInterview();
  if (d.act==="nocv") { S.cvFile = null; return render(); }
  if (d.copytext) return copy(d.copytext);
});
on(document, "change", e => { const d = e.target.dataset;
  if (d.told) { S.live.told = e.target.checked; return render(); }
  if (d.lang) { S.live.lang = e.target.value; if (S.live.listening) { stopLive(); startLive(); } return; }
  if (d.cc) { S.cform.consent = e.target.checked; return; }
  if (d.skip) { const k = S.cform.skip.indexOf(d.skip); if (e.target.checked && k<0) S.cform.skip.push(d.skip); if (!e.target.checked && k>=0) S.cform.skip.splice(k,1); S.candErr = ""; return render(); } if (d.cv) { S.cvFile = e.target.files && e.target.files[0] || null; return render(); } if (d.chk) { const [id, i] = d.chk.split(":"); setCand(id, c => { c.test = c.test || {checks:[]}; c.test.checks = c.test.checks || []; c.test.checks[+i] = e.target.checked; for (let k=0;k<c.test.checks.length;k++) c.test.checks[k] = !!c.test.checks[k]; }); } });
on(document, "input", e => { const d = e.target.dataset; if (d.f) S.form[d.f] = e.target.value; if (d.c) S.cform[d.c] = e.target.value; if (d.p) { S.cform.parts[d.p] = e.target.value; dirty = true; } if (d.iq) S.iform[d.iq] = e.target.value;
  if (d.livebox && S.live) { const q = currentQ(); if (q) { S.live.answers[q.aid] = e.target.value; recBase = e.target.value; } } });
on(document, "focusout", () => { if (dirty) setTimeout(()=>{ if (dirty) softRender(); }, 50); });
on(window, "resize", () => { const o = S.route.startsWith("o-") && D.openings[S.route.slice(2)]; if (o && S.tab[o.id]==="fields") drawLines(o); });
on(window, "hashchange", () => { if (opts.mode !== "workspace") return; const h = location.hash.slice(1) || "openings"; if (h !== S.route) { S.route = h; render(); } });

S.route = opts.mode === "apply" ? "apply-" + opts.openingId : opts.mode === "interview" ? "interview" : (location.hash.slice(1) || "openings");
render();
refresh();
if (opts.mode === "workspace") {
  const timer = setInterval(() => { if (document.visibilityState === "visible") refresh(); }, 30000);
  ac.signal.addEventListener("abort", () => clearInterval(timer));
  on(window, "focus", () => refresh());
}
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { const o = S.route.startsWith("o-") && D.openings[S.route.slice(2)]; if (o && S.tab[o.id]==="fields") drawLines(o); });
return () => { stopLive(); ac.abort(); root.innerHTML = ""; };
}
