"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { CHECKLIST, verifyMath, verifyForensics, calcScore } from "@/lib/checklist";

/* ===== API helpers ===== */
function getToken() { return typeof window !== "undefined" ? localStorage.getItem("vectra_token") : null; }
function setToken(t) { localStorage.setItem("vectra_token", t); }
function clearToken() { localStorage.removeItem("vectra_token"); localStorage.removeItem("vectra_user"); }
function getStoredUser() { try { return JSON.parse(localStorage.getItem("vectra_user")); } catch { return null; } }
function setStoredUser(u) { localStorage.setItem("vectra_user", JSON.stringify(u)); }

async function api(path, opts = {}) {
  const token = getToken();
  const res = await fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}), ...(opts.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка сервера");
  return data;
}

/* ===== DARK THEME ===== */
const T = {
  bg:   "#0c1222",
  bg2:  "#111b2e",
  card: "#152038",
  cardH:"#1a2845",
  bd:   "#1e3050",
  bdL:  "#192a42",
  glow: "0 0 24px rgba(59,130,246,0.08)",
  glowEr: "0 0 24px rgba(239,68,68,0.12)",
  glowFr: "0 0 24px rgba(167,139,250,0.12)",
  navy: "#f1f5f9",
  acc:  "#3b82f6",
  accH: "#2563eb",
  accBg:"rgba(59,130,246,0.1)",
  gold: "#f59e0b",
  tx:   "#e2e8f0",
  tx2:  "#94a3b8",
  tx3:  "#475569",
  ok:   "#22c55e", okBg:"rgba(34,197,94,0.1)",  okBd:"rgba(34,197,94,0.25)",
  wn:   "#f59e0b", wnBg:"rgba(245,158,11,0.1)", wnBd:"rgba(245,158,11,0.25)",
  er:   "#ef4444", erBg:"rgba(239,68,68,0.1)",   erBd:"rgba(239,68,68,0.25)",
  fr:   "#a78bfa", frBg:"rgba(167,139,250,0.08)",frBd:"rgba(167,139,250,0.25)",
  inp:  "#0f1829",
  inpBd:"#1e3050",
};

/* ===== ICONS (SVG) ===== */
const Ic = {
  shield: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity=".1"/></svg>,
  up: <svg width="40" height="40" fill="none" viewBox="0 0 48 48"><path d="M24 32V16m0 0l-7 7m7-7l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M8 32v4a4 4 0 004 4h24a4 4 0 004-4v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  ok: <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"/></svg>,
  wn: <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/></svg>,
  er: <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2"/><path d="M15 9l-6 6M9 9l6 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/></svg>,
  forensic: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M11 8v6m0 0h3m-3 0H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M16.5 16.5L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  bk: <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M19 12H5m0 0l7 7m-7-7l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  pl: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>,
  cl: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  out: <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  doc: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5"/><path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5"/></svg>,
  bar: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  sr: <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  users: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m8-10a4 4 0 100-8 4 4 0 000 8zm13 10v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  file: <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#475569" strokeWidth="1.5"/><path d="M14 2v6h6" stroke="#475569" strokeWidth="1.5"/></svg>,
  eye: <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>,
};

/* ===== UI COMPONENTS ===== */
function Ring({ s, sz = 120 }) {
  const r = sz / 2 - 6, ci = 2 * Math.PI * r, of = ci * (1 - s / 100);
  const co = s >= 80 ? T.ok : s >= 50 ? T.wn : T.er;
  const bg = s >= 80 ? T.okBg : s >= 50 ? T.wnBg : T.erBg;
  return (<div style={{ position:"relative", width:sz, height:sz, flexShrink:0 }}><svg width={sz} height={sz} style={{ transform:"rotate(-90deg)" }}><circle cx={sz/2} cy={sz/2} r={r} fill="transparent" stroke={T.bd} strokeWidth="4"/><circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={co} strokeWidth="4.5" strokeDasharray={ci} strokeDashoffset={of} strokeLinecap="round" style={{ transition:"stroke-dashoffset 1s ease", filter:`drop-shadow(0 0 6px ${co}40)` }}/></svg><div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}><span style={{ fontSize:sz*.27, fontWeight:700, color:co, fontFamily:"'JetBrains Mono'" }}>{s}%</span></div></div>);
}

function Btn({ children, onClick, v="p", icon, disabled:dis, style:st={} }) {
  const base = { display:"inline-flex", alignItems:"center", gap:7, padding:"10px 18px", borderRadius:10, border:"none", cursor:dis?"not-allowed":"pointer", fontWeight:600, fontSize:14, transition:"all .2s", opacity:dis?.4:1 };
  const vs = {
    p:{ ...base, background:`linear-gradient(135deg, ${T.acc}, ${T.accH})`, color:"#fff", boxShadow:`0 2px 12px ${T.acc}30`, ...st },
    g:{ ...base, background:T.card, color:T.tx2, border:"1px solid "+T.bd, ...st },
  };
  return (<button style={vs[v]||vs.p} onClick={dis?null:onClick}
    onMouseEnter={e=>{if(!dis){e.currentTarget.style.opacity=".85";if(v==="g")e.currentTarget.style.borderColor=T.acc}}}
    onMouseLeave={e=>{e.currentTarget.style.opacity=dis?".4":"1";if(v==="g")e.currentTarget.style.borderColor=T.bd}}
  >{icon}{children}</button>);
}

function Card({ children, style:s={}, className:cn="", hoverable }) {
  const hoverStyle = hoverable ? { cursor:"pointer", transition:"all .2s" } : {};
  return (<div className={cn} style={{ background:T.card, border:"1px solid "+T.bd, borderRadius:14, padding:24, boxShadow:T.glow, ...hoverStyle, ...s }}
    onMouseEnter={hoverable ? e => { e.currentTarget.style.borderColor = T.acc; e.currentTarget.style.background = T.cardH; } : undefined}
    onMouseLeave={hoverable ? e => { e.currentTarget.style.borderColor = T.bd; e.currentTarget.style.background = T.card; } : undefined}
  >{children}</div>);
}

function Badge({ status }) {
  if (status==="ok"||status==="skip") return null;
  const m = { warn:{ bg:T.wnBg, c:T.wn, bd:T.wnBd, t:"Внимание" }, fail:{ bg:T.erBg, c:T.er, bd:T.erBd, t:"Проблема" } };
  const s = m[status]; if(!s) return null;
  return (<span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:600, background:s.bg, color:s.c, border:"1px solid "+s.bd, whiteSpace:"nowrap" }}>{status==="warn"?Ic.wn:Ic.er}{s.t}</span>);
}

function Fold({ title, children, className:cn="", style:st={}, defaultOpen }) {
  const [o, setO] = useState(defaultOpen || false);
  return (<Card className={cn} style={{ ...st, padding:0, overflow:"hidden" }}><button onClick={()=>setO(!o)} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 22px", background:"none", border:"none", cursor:"pointer", fontSize:15, fontWeight:600, color:T.tx, textAlign:"left" }}>{title}<span style={{ fontSize:18, color:T.tx3, transition:"transform .2s", transform:o?"rotate(180deg)":"none" }}>▾</span></button>{o&&<div style={{ padding:"0 22px 18px" }}>{children}</div>}</Card>);
}

function BackBtn({ onClick, label }) {
  return (
    <button onClick={onClick} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:T.tx2, cursor:"pointer", padding:"4px 0", transition:"color .2s" }}
      onMouseEnter={e=>e.currentTarget.style.color=T.acc}
      onMouseLeave={e=>e.currentTarget.style.color=T.tx2}
    >{Ic.bk}{label && <span style={{ fontSize:13 }}>{label}</span>}</button>
  );
}

function InputField({ label, value, onChange, type="text", placeholder, onKeyDown, style:st={} }) {
  return (
    <div style={st}>
      {label && <label style={{ display:"block", fontSize:13, color:T.tx2, marginBottom:5, fontWeight:500 }}>{label}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown}
        style={{ width:"100%", padding:"10px 14px", background:T.inp, border:"1px solid "+T.inpBd, borderRadius:10, color:T.tx, fontSize:14, outline:"none", transition:"border-color .2s" }}
        onFocus={e=>e.target.style.borderColor=T.acc}
        onBlur={e=>e.target.style.borderColor=T.inpBd}
      />
    </div>
  );
}

/* ===== FORENSIC PANEL ===== */
function ForensicPanel({ forensics, checks }) {
  if (!forensics) return null;
  const forensicChecks = checks?.filter(c => c.id?.startsWith("6.")) || [];
  const failCount = forensicChecks.filter(c => c.status === "fail").length;
  const warnCount = forensicChecks.filter(c => c.status === "warn").length;
  const riskLevel = failCount >= 2 ? "high" : failCount >= 1 || warnCount >= 2 ? "medium" : "low";
  const riskMap = {
    high:   { bg:T.erBg, bd:T.erBd, c:T.er, label:"ВЫСОКИЙ РИСК ПОДДЕЛКИ", glow:T.glowEr },
    medium: { bg:T.wnBg, bd:T.wnBd, c:T.wn, label:"ТРЕБУЕТ ВНИМАНИЯ", glow:T.glow },
    low:    { bg:T.okBg, bd:T.okBd, c:T.ok, label:"ПОДДЕЛКА НЕ ОБНАРУЖЕНА", glow:T.glow },
  };
  const risk = riskMap[riskLevel];

  return (
    <Card className="f2" style={{ marginBottom:14, borderColor:risk.bd, boxShadow:risk.glow }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:T.frBg, display:"flex", alignItems:"center", justifyContent:"center", color:T.fr, border:"1px solid "+T.frBd }}>{Ic.forensic}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, display:"flex", alignItems:"center", gap:8, color:T.tx }}>
            Форензика
            <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:risk.bg, color:risk.c, border:"1px solid "+risk.bd }}>{risk.label}</span>
          </div>
          <div style={{ fontSize:13, color:T.tx3 }}>Анализ подлинности документа</div>
        </div>
      </div>

      {riskLevel === "high" && (
        <div style={{ padding:"12px 16px", borderRadius:10, background:T.erBg, border:"1px solid "+T.erBd, marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
          {Ic.er}
          <div><div style={{ fontWeight:700, color:T.er, fontSize:14 }}>Обнаружены серьёзные признаки подделки</div><div style={{ fontSize:13, color:T.tx2 }}>Рекомендуется запросить оригинал документа у поставщика</div></div>
        </div>
      )}

      {(forensics.creator || forensics.producer || forensics.creationDate) && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:T.tx3, marginBottom:8, letterSpacing:1, textTransform:"uppercase" }}>Метаданные</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:6 }}>
            {[
              ["Создатель", forensics.creator, forensics.suspiciousSoftware],
              ["PDF-движок", forensics.producer, false],
              ["Автор", forensics.author, false],
              ["Создан", forensics.creationDate ? new Date(forensics.creationDate).toLocaleString("ru") : null, false],
              ["Изменён", forensics.modDate ? new Date(forensics.modDate).toLocaleString("ru") : null, forensics.dateMismatch],
              ["Ревизий", forensics.revisionCount > 0 ? String(forensics.revisionCount) : null, forensics.multipleRevisions],
            ].filter(([,v]) => v).map(([label, value, alert], i) => (
              <div key={i} style={{ padding:"7px 10px", borderRadius:8, background:alert ? T.erBg : T.bg2, border:alert ? "1px solid "+T.erBd : "1px solid transparent" }}>
                <div style={{ fontSize:11, color:alert ? T.er : T.tx3 }}>{label}</div>
                <div style={{ fontSize:13, fontWeight:500, color:alert ? T.er : T.tx, wordBreak:"break-word" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {forensics.flags?.length > 0 && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:T.tx3, marginBottom:8, letterSpacing:1, textTransform:"uppercase" }}>Флаги</div>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            {forensics.flags.map((flag, i) => (
              <div key={i} style={{ padding:"8px 12px", borderRadius:8, background:T.erBg, border:"1px solid "+T.erBd, fontSize:13, color:T.er, display:"flex", alignItems:"flex-start", gap:8 }}>
                <span style={{ flexShrink:0, marginTop:1 }}>{Ic.er}</span><span>{flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {forensicChecks.length > 0 && (
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:T.tx3, marginBottom:8, letterSpacing:1, textTransform:"uppercase" }}>Проверки подлинности</div>
          {forensicChecks.map((ch, i) => {
            const def = CHECKLIST.find(c => c.id === ch.id);
            if (!def || ch.status === "skip") return null;
            return (
              <div key={ch.id} style={{ padding:"10px 0", borderBottom:i<forensicChecks.length-1?"1px solid "+T.bdL:"none" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <div style={{ minWidth:18 }}>{ch.status==="ok"?Ic.ok:ch.status==="warn"?Ic.wn:Ic.er}</div>
                  <span style={{ fontSize:13, fontWeight:600, color:T.tx }}><span style={{ color:T.tx3 }}>{ch.id}</span> {def.name}</span>
                  <Badge status={ch.status}/>
                  <span style={{ marginLeft:"auto", fontSize:11, color:T.tx3 }}>{def.w}б</span>
                </div>
                {ch.comment && <div style={{ fontSize:13, color:T.tx2, lineHeight:1.5, marginLeft:26 }}>{ch.comment}</div>}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ===== LOGIN ===== */
function Login({ onLogin }) {
  const [l, sL] = useState(""); const [p, sP] = useState(""); const [e, sE] = useState(""); const [ld, sLd] = useState(false);
  const go = async () => {
    sLd(true); sE("");
    try {
      const res = await api("/api/auth", { method:"POST", body:JSON.stringify({ login:l, password:p }) });
      setToken(res.token); setStoredUser(res.user); onLogin(res.user);
    } catch(err) { sE(err.message); sLd(false); }
  };
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:`radial-gradient(ellipse at top, ${T.bg2}, ${T.bg})` }}>
      <div className="fu" style={{ width:380 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, justifyContent:"center", marginBottom:36 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:`linear-gradient(135deg, ${T.acc}, ${T.accH})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", boxShadow:`0 4px 20px ${T.acc}40` }}>{Ic.shield}</div>
          <div><div style={{ fontSize:22, fontWeight:700, color:T.navy, letterSpacing:.5 }}>ВЕКТРА</div><div style={{ fontSize:11, color:T.tx3, letterSpacing:1.5, textTransform:"uppercase" }}>Проверка документов</div></div>
        </div>
        <Card>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:20, textAlign:"center", color:T.tx }}>Вход в систему</div>
          <InputField label="Логин" value={l} onChange={e=>sL(e.target.value)} placeholder="Логин" onKeyDown={e=>e.key==="Enter"&&go()} style={{ marginBottom:14 }} />
          <InputField label="Пароль" value={p} onChange={e=>sP(e.target.value)} type="password" placeholder="Пароль" onKeyDown={e=>e.key==="Enter"&&go()} style={{ marginBottom:16 }} />
          {e && <div style={{ color:T.er, fontSize:13, marginBottom:12, textAlign:"center", padding:"8px 12px", background:T.erBg, borderRadius:8, border:"1px solid "+T.erBd }}>{e}</div>}
          <Btn onClick={go} disabled={ld||!l||!p} style={{ width:"100%", justifyContent:"center", padding:"12px 24px" }}>{ld ? "Вход..." : "Войти"}</Btn>
        </Card>
      </div>
    </div>
  );
}

/* ===== UPLOAD ===== */
function Upload({ user, onDone, onBack }) {
  const [file, sFile] = useState(null); const [prev, sPrev] = useState(null);
  const [drag, sDrag] = useState(false); const [busy, sBusy] = useState(false);
  const [prog, sProg] = useState(""); const [err, sErr] = useState("");
  const ref = useRef();

  const pick = (f) => {
    if(!f) return; if(f.size>20e6){sErr("Файл > 20 МБ");return;} sFile(f); sErr("");
    if(f.type.startsWith("image/")) { const r=new FileReader(); r.onload=ev=>sPrev(ev.target.result); r.readAsDataURL(f); } else sPrev(null);
  };

  const go = async () => {
    sBusy(true); sErr("");
    try {
      sProg("Загрузка документа...");
      const b = await new Promise((res,rej) => { const r=new FileReader(); r.onload=()=>res(r.result.split(",")[1]); r.onerror=rej; r.readAsDataURL(file); });
      sProg("Форензик-анализ + AI проверка...");
      const result = await api("/api/analyze", { method:"POST", body:JSON.stringify({ base64:b, fileType:file.type }) });
      result.checks = verifyMath(result.extracted, result.checks);
      result.checks = verifyForensics(result.forensics, result.checks);
      const sc = calcScore(result.checks);
      sProg("Сохранение...");
      const saved = await api("/api/checks", { method:"POST", body:JSON.stringify({ ...result, score:sc, fileName:file.name, fileType:file.type }) });
      onDone({ ...result, ...saved, score:sc });
    } catch(e) { sErr(e.message); sBusy(false); }
  };

  return (
    <div className="fu" style={{ maxWidth:580, margin:"0 auto" }}>
      <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:24 }}>
        <BackBtn onClick={onBack}/>
        <h2 style={{ fontSize:19, fontWeight:700, color:T.tx }}>Новая проверка</h2>
      </div>
      {!busy ? (<>
        <Card className="fu" style={{ marginBottom:16 }}>
          <div onDragOver={e=>{e.preventDefault();sDrag(true)}} onDragLeave={()=>sDrag(false)} onDrop={e=>{e.preventDefault();sDrag(false);pick(e.dataTransfer.files[0])}} onClick={()=>ref.current?.click()}
            style={{ border:"2px dashed "+(drag?T.acc:T.bd), borderRadius:12, padding:file?16:44, textAlign:"center", cursor:"pointer", background:drag?T.accBg:T.bg2, transition:"all .2s" }}>
            {file ? (
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                {prev ? <img src={prev} style={{ width:64, height:64, objectFit:"cover", borderRadius:8 }}/> : <div style={{ width:64, height:64, display:"flex", alignItems:"center", justifyContent:"center", background:T.bg, borderRadius:8 }}>{Ic.file}</div>}
                <div style={{ textAlign:"left", flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:14, color:T.tx }}>{file.name}</div>
                  <div style={{ color:T.tx3, fontSize:13 }}>{(file.size/1048576).toFixed(2)} МБ</div>
                  <button onClick={e=>{e.stopPropagation();sFile(null);sPrev(null)}} style={{ marginTop:4, background:"none", border:"none", color:T.er, cursor:"pointer", fontSize:13 }}>Удалить</button>
                </div>
              </div>
            ) : (
              <><div style={{ color:T.tx3, marginBottom:8 }}>{Ic.up}</div><div style={{ fontSize:15, fontWeight:600, color:T.tx }}>Перетащите файл</div><div style={{ color:T.tx3, fontSize:13, marginTop:4 }}>PDF, JPG, PNG — до 20 МБ</div></>
            )}
          </div>
          <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png,.heic,.webp" style={{ display:"none" }} onChange={e=>pick(e.target.files[0])}/>
        </Card>
        {err && <div style={{ color:T.er, fontSize:14, marginBottom:12, padding:"10px 14px", background:T.erBg, borderRadius:10, border:"1px solid "+T.erBd }}>{err}</div>}
        <Btn onClick={go} disabled={!file} icon={Ic.sr} style={{ width:"100%", justifyContent:"center", padding:"13px 24px", fontSize:15 }}>Проверить документ</Btn>
      </>) : (
        <Card className="fu" style={{ textAlign:"center", padding:48 }}>
          <div style={{ width:44, height:44, border:"3px solid "+T.bd, borderTopColor:T.acc, borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 20px", boxShadow:`0 0 16px ${T.acc}30` }}/>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:6, color:T.tx }}>{prog}</div>
          <div style={{ color:T.tx3, fontSize:14 }}>Форензик-анализ + AI — 20–40 сек</div>
          <div style={{ marginTop:20, height:4, background:T.bg, borderRadius:2, overflow:"hidden" }}><div style={{ height:"100%", background:`linear-gradient(90deg, ${T.acc}, ${T.fr})`, borderRadius:2, animation:"prog 35s ease-out forwards" }}/></div>
        </Card>
      )}
    </div>
  );
}

/* ===== RESULT ===== */
function Result({ result:R, onBack, onSave, userRole, backLabel }) {
  const ex = R.extracted, cks = R.checks || [], sc = R.score;
  const [dec, sDec] = useState(R.decision || null); const [saved, sSaved] = useState(!!R.decision);
  const issues = [], allG = {};
  CHECKLIST.forEach(c => { const ch = cks.find(x=>x.id===c.id)||{status:"skip",comment:""}; if(!allG[c.cat])allG[c.cat]=[]; allG[c.cat].push({...c,...ch}); if(ch.status==="warn"||ch.status==="fail") issues.push({...c,...ch}); });
  const st = { ok:0, warn:0, fail:0, skip:0 }; cks.forEach(c => { if(st[c.status]!==undefined) st[c.status]++; });
  const otherIssues = issues.filter(i => !i.id?.startsWith("6."));

  const save = async (d) => {
    sDec(d);
    try { if(R.id) await api("/api/checks", { method:"PATCH", body:JSON.stringify({ id:R.id, decision:d }) }); } catch {}
    sSaved(true); if(onSave) onSave({ ...R, decision:d });
  };

  return (
    <div className="fu" style={{ maxWidth:720, margin:"0 auto" }}>
      <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:24 }}>
        <BackBtn onClick={onBack} label={backLabel}/>
        <h2 style={{ fontSize:19, fontWeight:700, flex:1, color:T.tx }}>Результат проверки</h2>
        <span style={{ fontSize:13, color:T.tx3 }}>{new Date(R.created_at||Date.now()).toLocaleString("ru")}</span>
      </div>

      {/* Score */}
      <Card className="fu" style={{ marginBottom:14, display:"flex", gap:24, alignItems:"center", flexWrap:"wrap" }}>
        <Ring s={sc}/>
        <div style={{ flex:1, minWidth:180 }}>
          <div style={{ fontSize:17, fontWeight:700, marginBottom:8, color:sc>=80?T.ok:sc>=50?T.wn:T.er }}>{sc>=80?"Документ скорее всего подлинный":sc>=50?"Требует проверки":"Высокий риск подделки"}</div>
          <div style={{ display:"flex", gap:12, marginBottom:12, flexWrap:"wrap", fontSize:14 }}>
            <span style={{ color:T.ok, fontWeight:500, display:"flex", alignItems:"center", gap:3 }}>{Ic.ok} {st.ok} ОК</span>
            {st.warn>0&&<span style={{ color:T.wn, fontWeight:500, display:"flex", alignItems:"center", gap:3 }}>{Ic.wn} {st.warn}</span>}
            {st.fail>0&&<span style={{ color:T.er, fontWeight:500, display:"flex", alignItems:"center", gap:3 }}>{Ic.er} {st.fail}</span>}
            {st.skip>0&&<span style={{ color:T.tx3 }}>{st.skip} н/п</span>}
          </div>
          {ex && (<div style={{ fontSize:13, color:T.tx2, lineHeight:1.5 }}>{ex.doc_type} {ex.doc_number&&("№"+ex.doc_number)} {ex.doc_date&&("от "+ex.doc_date)}{ex.supplier_name&&(<><br/><b style={{ color:T.tx }}>{ex.supplier_name}</b></>)}{ex.supplier_inn&&(<span style={{ color:T.tx3 }}> · ИНН {ex.supplier_inn}</span>)}{ex.buyer_name&&(<><br/><span style={{ color:T.tx3 }}>→</span> {ex.buyer_name}</>)}</div>)}
        </div>
      </Card>

      {/* Forensic Panel */}
      <ForensicPanel forensics={R.forensics} checks={cks}/>

      {/* AI forensic notes */}
      {ex?.forensic_notes && (
        <Card className="f1" style={{ marginBottom:14, borderColor:T.frBd, boxShadow:T.glowFr }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            {Ic.eye}<span style={{ fontSize:14, fontWeight:700, color:T.fr }}>Визуальные наблюдения AI</span>
          </div>
          <div style={{ fontSize:13, color:T.tx2, lineHeight:1.6 }}>{ex.forensic_notes}</div>
        </Card>
      )}

      {/* Other issues */}
      {otherIssues.length>0 ? (
        <Card className="f1" style={{ marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:14 }}>{Ic.wn}<span style={{ fontSize:15, fontWeight:700, color:T.tx }}>Замечания ({otherIssues.length})</span></div>
          {otherIssues.map((it,i) => (<div key={it.id} style={{ padding:"12px 0", borderBottom:i<otherIssues.length-1?"1px solid "+T.bdL:"none" }}><div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}><Badge status={it.status}/><span style={{ fontSize:14, fontWeight:600, color:T.tx }}><span style={{ color:T.tx3 }}>{it.id}</span> {it.name}</span><span style={{ marginLeft:"auto", fontSize:12, color:T.tx3 }}>{it.w}б</span></div>{it.comment&&<div style={{ fontSize:13, color:T.tx2, lineHeight:1.5 }}>{it.comment}</div>}</div>))}
        </Card>
      ) : (
        <Card className="f1" style={{ marginBottom:14, display:"flex", alignItems:"center", gap:10, padding:18 }}>{Ic.ok}<div><div style={{ fontWeight:600, color:T.ok }}>Замечаний нет</div><div style={{ fontSize:13, color:T.tx2 }}>Все проверки пройдены</div></div></Card>
      )}

      {/* Extracted data */}
      {ex && <Fold title="Извлечённые данные" className="f2" style={{ marginBottom:14 }}><div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:8 }}>{[["Тип",ex.doc_type],["Номер",ex.doc_number],["Дата",ex.doc_date],["Поставщик",ex.supplier_name],["ИНН",ex.supplier_inn],["КПП",ex.supplier_kpp],["Адрес",ex.supplier_address],["Банк",ex.supplier_bank],["БИК",ex.supplier_bik],["Покупатель",ex.buyer_name],["Итого",ex.total_sum],["НДС",ex.nds_sum],["Прописью",ex.total_words]].filter(([,v])=>v&&v!=="null").map(([k,v],i)=>(<div key={i} style={{ padding:"7px 10px", background:T.bg2, borderRadius:8, border:"1px solid "+T.bdL }}><div style={{ fontSize:11, color:T.tx3 }}>{k}</div><div style={{ fontSize:13, fontWeight:500, wordBreak:"break-word", color:T.tx }}>{String(v)}</div></div>))}</div></Fold>}

      {/* Full checklist (admin only) */}
      {userRole==="admin" && <Fold title={"Полный чеклист ("+cks.length+")"} className="f2" style={{ marginBottom:14 }}>{Object.entries(allG).map(([cat,items])=>(<div key={cat} style={{ marginBottom:14 }}><div style={{ fontSize:11, fontWeight:700, color:cat.includes("Форензика")?T.fr:T.acc, marginBottom:6, letterSpacing:1, textTransform:"uppercase" }}>{cat}</div>{items.map(it=>(<div key={it.id} style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"7px 0", borderBottom:"1px solid "+T.bdL }}><div style={{ minWidth:18, marginTop:1 }}>{it.status==="ok"?Ic.ok:it.status==="warn"?Ic.wn:it.status==="fail"?Ic.er:<span style={{ color:T.tx3, fontSize:11 }}>—</span>}</div><div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:500, color:T.tx }}><span style={{ color:T.tx3 }}>{it.id}</span> {it.name}</div>{it.comment&&<div style={{ fontSize:12, color:T.tx2, marginTop:1 }}>{it.comment}</div>}</div><div style={{ fontSize:11, color:T.tx3 }}>{it.w}б</div></div>))}</div>))}</Fold>}

      {/* Decision */}
      <Card className="f3" style={{ marginBottom:36 }}>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:12, color:T.tx }}>Ваше решение</div>
        {saved ? (<div style={{ display:"flex", alignItems:"center", gap:9, padding:12, borderRadius:10, background:dec==="genuine"?T.okBg:dec==="suspicious"?T.wnBg:T.erBg, border:"1px solid "+(dec==="genuine"?T.okBd:dec==="suspicious"?T.wnBd:T.erBd) }}><span style={{ fontWeight:600, color:dec==="genuine"?T.ok:dec==="suspicious"?T.wn:T.er }}>{"✓ "+(dec==="genuine"?"Подлинный":dec==="suspicious"?"Сомнительный":"Поддельный")}</span></div>) : (
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <Btn onClick={()=>save("genuine")} v="g" style={{ borderColor:T.ok+"60", color:T.ok }}>✓ Подлинный</Btn>
            <Btn onClick={()=>save("suspicious")} v="g" style={{ borderColor:T.wn+"60", color:T.wn }}>⚠ Сомнительный</Btn>
            <Btn onClick={()=>save("fake")} v="g" style={{ borderColor:T.er+"60", color:T.er }}>✕ Поддельный</Btn>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ===== HISTORY ===== */
function History({ checks:all, user:u, onView, onBack }) {
  const [q, sQ] = useState("");
  const vis = all.filter(c => !q || [c.file_name, c.extracted?.supplier_name].filter(Boolean).join(" ").toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="fu" style={{ maxWidth:760, margin:"0 auto" }}>
      <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:20 }}>
        <BackBtn onClick={onBack}/>
        <h2 style={{ fontSize:19, fontWeight:700, flex:1, color:T.tx }}>История проверок</h2>
        <span style={{ color:T.tx3, fontSize:14, fontFamily:"'JetBrains Mono'" }}>{vis.length}</span>
      </div>
      <div style={{ marginBottom:14, position:"relative" }}>
        <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:T.tx3 }}>{Ic.sr}</div>
        <input value={q} onChange={e=>sQ(e.target.value)} placeholder="Поиск по поставщику или файлу..."
          style={{ width:"100%", padding:"10px 14px 10px 38px", background:T.inp, border:"1px solid "+T.inpBd, borderRadius:12, fontSize:14, outline:"none", color:T.tx, transition:"border-color .2s" }}
          onFocus={e=>e.target.style.borderColor=T.acc} onBlur={e=>e.target.style.borderColor=T.inpBd}
        />
      </div>
      {vis.length===0 ? <Card style={{ textAlign:"center", padding:40, color:T.tx3 }}>Пока пусто</Card> :
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>{vis.map((c,i)=>{
          const hasForensicIssue = c.checks?.some(ch => ch.id?.startsWith("6.") && (ch.status === "fail" || ch.status === "warn"));
          return (
            <Card key={c.id||i} hoverable style={{ padding:14, ...(hasForensicIssue ? { borderColor: T.erBd+"80" } : {}) }} onClick={()=>onView(c)}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <Ring s={c.score} sz={44}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:14, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:6, color:T.tx }}>
                    {c.extracted?.supplier_name||c.file_name}
                    {hasForensicIssue && <span style={{ fontSize:10, padding:"2px 7px", borderRadius:6, background:T.erBg, color:T.er, fontWeight:700, border:"1px solid "+T.erBd, flexShrink:0 }}>ПОДДЕЛКА?</span>}
                  </div>
                  <div style={{ fontSize:12, color:T.tx3, marginTop:2 }}>{c.extracted?.doc_type}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontSize:12, color:T.tx3 }}>{new Date(c.created_at).toLocaleDateString("ru")}</div>
                  {c.decision&&(<span style={{ display:"inline-block", marginTop:3, padding:"2px 8px", borderRadius:10, fontSize:11, fontWeight:600, background:c.decision==="genuine"?T.okBg:c.decision==="suspicious"?T.wnBg:T.erBg, color:c.decision==="genuine"?T.ok:c.decision==="suspicious"?T.wn:T.er, border:"1px solid "+(c.decision==="genuine"?T.okBd:c.decision==="suspicious"?T.wnBd:T.erBd) }}>{c.decision==="genuine"?"Подлинный":c.decision==="suspicious"?"Сомн.":"Подделка"}</span>)}
                </div>
              </div>
            </Card>
          );
        })}</div>
      }
    </div>
  );
}

/* ===== ADMIN PANEL ===== */
function Admin({ onBack }) {
  const [users, sUsers] = useState([]); const [ld, sLd] = useState(true);
  const [showAdd, sShowAdd] = useState(false);
  const [form, sForm] = useState({ login:"", password:"", name:"", role:"manager" });
  const [err, sErr] = useState(""); const [msg, sMsg] = useState("");
  const [editId, sEditId] = useState(null); const [editData, sEditData] = useState({});
  const load = useCallback(async () => { try { const d = await api("/api/users"); sUsers(d); } catch {} sLd(false); }, []);
  useEffect(() => { load(); }, [load]);

  const addUser = async () => {
    sErr(""); sMsg("");
    if (!form.login || !form.password || !form.name) { sErr("Заполните все поля"); return; }
    try { await api("/api/users", { method:"POST", body:JSON.stringify(form) }); sMsg("Пользователь создан"); sShowAdd(false); sForm({ login:"", password:"", name:"", role:"manager" }); load(); }
    catch(e) { sErr(e.message); }
  };
  const saveEdit = async (id) => { try { await api("/api/users", { method:"PATCH", body:JSON.stringify({ id, ...editData }) }); sEditId(null); load(); } catch(e) { sErr(e.message); } };
  const toggleActive = async (u) => { try { await api("/api/users", { method:"PATCH", body:JSON.stringify({ id:u.id, active:!u.active }) }); load(); } catch(e) { sErr(e.message); } };
  const roleLabels = { admin:"Администратор", manager:"Менеджер", head:"Руководитель" };
  const roleCo = { admin:T.acc, manager:T.ok, head:T.gold };

  return (
    <div className="fu" style={{ maxWidth:760, margin:"0 auto" }}>
      <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:24 }}>
        <BackBtn onClick={onBack}/>
        <h2 style={{ fontSize:19, fontWeight:700, flex:1, color:T.tx }}>Управление пользователями</h2>
        <Btn onClick={()=>sShowAdd(!showAdd)} icon={Ic.pl} v={showAdd?"g":"p"}>{showAdd ? "Отмена" : "Добавить"}</Btn>
      </div>
      {msg && <div style={{ padding:"10px 14px", background:T.okBg, border:"1px solid "+T.okBd, borderRadius:10, color:T.ok, marginBottom:14, fontSize:14 }}>{msg}</div>}
      {err && <div style={{ padding:"10px 14px", background:T.erBg, border:"1px solid "+T.erBd, borderRadius:10, color:T.er, marginBottom:14, fontSize:14 }}>{err}</div>}
      {showAdd && (
        <Card className="fu" style={{ marginBottom:18 }}>
          <div style={{ fontSize:15, fontWeight:700, marginBottom:14, color:T.tx }}>Новый пользователь</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <InputField label="Логин" value={form.login} onChange={e=>sForm({...form, login:e.target.value})} />
            <InputField label="Пароль" value={form.password} onChange={e=>sForm({...form, password:e.target.value})} />
            <InputField label="ФИО" value={form.name} onChange={e=>sForm({...form, name:e.target.value})} />
            <div><label style={{ display:"block", fontSize:13, color:T.tx2, marginBottom:5, fontWeight:500 }}>Роль</label><select value={form.role} onChange={e=>sForm({...form, role:e.target.value})} style={{ width:"100%", padding:"10px 14px", background:T.inp, border:"1px solid "+T.inpBd, borderRadius:10, color:T.tx, fontSize:14 }}><option value="manager">Менеджер</option><option value="head">Руководитель</option><option value="admin">Администратор</option></select></div>
          </div>
          <div style={{ marginTop:14 }}><Btn onClick={addUser}>Создать пользователя</Btn></div>
        </Card>
      )}
      {ld ? <Card style={{ textAlign:"center", padding:36, color:T.tx3 }}>Загрузка...</Card> : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {users.map(u => (
            <Card key={u.id} style={{ padding:16 }}>
              {editId === u.id ? (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:10, alignItems:"end" }}>
                  <div><label style={{ fontSize:11, color:T.tx3 }}>ФИО</label><input value={editData.name ?? u.name} onChange={e=>sEditData({...editData, name:e.target.value})} style={{ width:"100%", padding:"6px 10px", background:T.inp, border:"1px solid "+T.inpBd, borderRadius:8, fontSize:13, color:T.tx }}/></div>
                  <div><label style={{ fontSize:11, color:T.tx3 }}>Роль</label><select value={editData.role ?? u.role} onChange={e=>sEditData({...editData, role:e.target.value})} style={{ width:"100%", padding:"6px 10px", background:T.inp, border:"1px solid "+T.inpBd, borderRadius:8, fontSize:13, color:T.tx }}><option value="manager">Менеджер</option><option value="head">Руководитель</option><option value="admin">Администратор</option></select></div>
                  <div><label style={{ fontSize:11, color:T.tx3 }}>Новый пароль</label><input value={editData.password || ""} onChange={e=>sEditData({...editData, password:e.target.value})} placeholder="Не менять" style={{ width:"100%", padding:"6px 10px", background:T.inp, border:"1px solid "+T.inpBd, borderRadius:8, fontSize:13, color:T.tx }}/></div>
                  <div style={{ display:"flex", gap:6 }}><Btn onClick={()=>saveEdit(u.id)} style={{ padding:"6px 14px", fontSize:13 }}>✓</Btn><Btn v="g" onClick={()=>sEditId(null)} style={{ padding:"6px 14px", fontSize:13 }}>✕</Btn></div>
                </div>
              ) : (
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:u.active ? (roleCo[u.role]||T.acc)+"20" : T.bg2, display:"flex", alignItems:"center", justifyContent:"center", color:u.active ? roleCo[u.role] : T.tx3, fontSize:14, fontWeight:700 }}>{u.name.charAt(0)}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:14, color:u.active ? T.tx : T.tx3 }}>{u.name} <span style={{ fontSize:12, color:T.tx3, fontWeight:400 }}>@{u.login}</span></div>
                    <div style={{ display:"flex", gap:8, marginTop:2 }}>
                      <span style={{ fontSize:12, color:roleCo[u.role], fontWeight:500 }}>{roleLabels[u.role]}</span>
                      {!u.active && <span style={{ fontSize:12, color:T.er }}>Отключён</span>}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <Btn v="g" onClick={()=>{sEditId(u.id);sEditData({});}} style={{ padding:"6px 12px", fontSize:12 }}>Изменить</Btn>
                    <Btn v="g" onClick={()=>toggleActive(u)} style={{ padding:"6px 12px", fontSize:12, borderColor:u.active?T.erBd:T.okBd, color:u.active?T.er:T.ok }}>{u.active?"Откл.":"Вкл."}</Btn>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== DASHBOARD ===== */
function Dash({ user:u, checks:all, onNew, onHist, onAdmin, onOut }) {
  const avg = all.length ? Math.round(all.reduce((s,c) => s+c.score, 0)/all.length) : 0;
  const bad = all.filter(c => c.score < 50).length;
  const forged = all.filter(c => c.checks?.some(ch => ch.id?.startsWith("6.") && ch.status === "fail")).length;
  const rec = all.slice(0, 5);

  return (
    <div className="fu" style={{ maxWidth:760, margin:"0 auto" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:`linear-gradient(135deg, ${T.acc}, ${T.accH})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", boxShadow:`0 4px 16px ${T.acc}30` }}>{Ic.shield}</div>
          <div><div style={{ fontSize:19, fontWeight:700, color:T.navy, letterSpacing:.5 }}>ВЕКТРА</div><div style={{ fontSize:12, color:T.tx3 }}>{u.name} · {u.role === "admin" ? "Администратор" : u.role === "head" ? "Руководитель" : "Менеджер"}</div></div>
        </div>
        <button onClick={onOut} style={{ display:"flex", alignItems:"center", gap:5, background:"none", border:"1px solid "+T.bd, borderRadius:8, color:T.tx3, cursor:"pointer", fontSize:13, padding:"6px 12px", transition:"all .2s" }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=T.er;e.currentTarget.style.color=T.er}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=T.bd;e.currentTarget.style.color=T.tx3}}
        >{Ic.out} Выход</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:18 }}>
        {[
          { l:"Проверок", v:all.length, icon:Ic.doc, c:T.acc },
          { l:"Ср. рейтинг", v:avg+"%", icon:Ic.bar, c:avg>=70?T.ok:avg>=40?T.wn:T.er },
          { l:"Подозрит.", v:bad, icon:Ic.wn, c:bad?T.wn:T.ok },
          { l:"Подделки", v:forged, icon:Ic.forensic, c:forged?T.er:T.ok },
        ].map((s,i)=>(
          <Card key={i} className={"f"+(i+1)} style={{ padding:16 }}>
            <div style={{ color:s.c, marginBottom:6, opacity:.8 }}>{s.icon}</div>
            <div style={{ fontSize:22, fontWeight:700, color:s.c, fontFamily:"'JetBrains Mono'" }}>{s.v}</div>
            <div style={{ fontSize:12, color:T.tx3, marginTop:2 }}>{s.l}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap" }}>
        <Btn onClick={onNew} icon={Ic.pl} style={{ flex:1, justifyContent:"center", padding:"14px 20px", fontSize:15 }}>Новая проверка</Btn>
        <Btn onClick={onHist} v="g" icon={Ic.cl}>История</Btn>
        {u.role==="admin" && <Btn onClick={onAdmin} v="g" icon={Ic.users}>Пользователи</Btn>}
      </div>

      {rec.length>0 && (
        <Card className="f3">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <span style={{ fontSize:15, fontWeight:700, color:T.tx }}>Последние проверки</span>
            <button onClick={onHist} style={{ background:"none", border:"none", color:T.acc, cursor:"pointer", fontSize:13, fontWeight:500, transition:"opacity .2s" }}
              onMouseEnter={e=>e.currentTarget.style.opacity=".7"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}
            >Все →</button>
          </div>
          {rec.map((c,i)=>{
            const hasF = c.checks?.some(ch => ch.id?.startsWith("6.") && ch.status === "fail");
            return (
              <div key={c.id||i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:i<rec.length-1?"1px solid "+T.bdL:"none" }}>
                <Ring s={c.score} sz={40}/>
                <div style={{ flex:1, minWidth:0, marginLeft:4 }}>
                  <div style={{ fontWeight:600, fontSize:14, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:6, color:T.tx }}>
                    {c.extracted?.supplier_name||c.file_name}
                    {hasF && <span style={{ fontSize:9, padding:"1px 5px", borderRadius:4, background:T.erBg, color:T.er, fontWeight:700, border:"1px solid "+T.erBd }}>!</span>}
                  </div>
                  <div style={{ fontSize:12, color:T.tx3, marginTop:2 }}>{c.extracted?.doc_type}</div>
                </div>
                <div style={{ fontSize:12, color:T.tx3, flexShrink:0 }}>{new Date(c.created_at).toLocaleDateString("ru")}</div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

/* ===== MAIN APP ===== */
export default function App() {
  const [user, sU] = useState(null);
  const [scr, sS] = useState("d");
  const [prevScr, sPrevScr] = useState("d");
  const [all, sAll] = useState([]);
  const [res, sRes] = useState(null);
  const [rdy, sRdy] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    const t = getToken();
    if (u && t) { sU(u); loadChecks(); }
    sRdy(true);
  }, []);

  const loadChecks = async () => {
    try { const d = await api("/api/checks"); sAll(d); } catch { sAll([]); }
  };

  const onLogin = (u) => { sU(u); sS("d"); loadChecks(); };
  const onOut = () => { clearToken(); sU(null); sAll([]); sS("d"); };
  const onDone = (r) => { sRes(r); sPrevScr("d"); sS("r"); loadChecks(); };

  // Navigate to result from history → back goes to history
  const viewFromHistory = (c) => { sRes(c); sPrevScr("h"); sS("r"); };

  if (!rdy) return null;
  if (!user) return <Login onLogin={onLogin}/>;

  return (
    <div style={{ minHeight:"100vh", background:T.bg }}>
      <div style={{ maxWidth:840, margin:"0 auto", padding:"24px 18px" }}>
        {scr==="d" && <Dash user={user} checks={all} onNew={()=>sS("u")} onHist={()=>sS("h")} onAdmin={()=>sS("a")} onOut={onOut}/>}
        {scr==="u" && <Upload user={user} onDone={onDone} onBack={()=>sS("d")}/>}
        {scr==="r" && res && <Result result={res} onBack={()=>sS(prevScr)} onSave={()=>{}} userRole={user.role} backLabel={prevScr==="h"?"К истории":undefined}/>}
        {scr==="h" && <History checks={all} user={user} onView={viewFromHistory} onBack={()=>sS("d")}/>}
        {scr==="a" && user.role==="admin" && <Admin onBack={()=>sS("d")}/>}
      </div>
    </div>
  );
}
