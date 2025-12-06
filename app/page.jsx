"use client";

import { useEffect, useMemo, useState } from "react";

/*
   POST /api/generateDrink         -> returns { drink }
   POST /api/auth                  -> { action: 'signup'|'login' } (Part1 server)
   POST /api/actions               -> { action: 'like'|'dislike'|'drank', drinkId, drinkMeta, token }
   POST /api/comments              -> { drinkId, text, token }
   GET  /api/comments              -> returns { comments: [...] }
   GET  /api/leaderboard           -> returns leaderboard data
   POST /api/user                  -> returns user profile by token
*/

function tokenKey(){ return "wsid_token_v1"; }
function getToken(){ if (typeof window === "undefined") return null; return localStorage.getItem(tokenKey()); }
function setToken(t){ if (typeof window === "undefined") return; if (!t) localStorage.removeItem(tokenKey()); else localStorage.setItem(tokenKey(), t); }

function mkId(d){
  try { return "d_" + btoa((d.name||"")+"|"+(d.ingredients||[]).join(",")).replace(/=/g,'').slice(0,16); }
  catch { return "d_"+Math.random().toString(36).slice(2,9); }
}

export default function HomePage(){
  const [user, setUser] = useState(null);
  const [usernameIn, setUsernameIn] = useState("");
  const [passwordIn, setPasswordIn] = useState("");
  const [view, setView] = useState("home"); // home | result | suggestions | leaderboard
  const [drink, setDrink] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [comments, setComments] = useState([]);
  const [leaderboard, setLeaderboard] = useState({ drinkStats: {}, streaks: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [narratorPlaying, setNarratorPlaying] = useState(false);

  useEffect(()=>{
    const t = getToken();
    if (t){
      // fetch user profile
      fetch("/api/user", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ token: t })})
        .then(r=>r.json()).then(j=>{
          if (j?.ok) setUser({ username: j.user.username, token: t, ...j.user });
          else { setToken(null); }
        }).catch(()=>setToken(null));
    }
    loadComments();
    loadLeaderboard();
  },[]);

  async function loadComments(){ try { const r = await fetch("/api/comments"); const j = await r.json(); setComments(j.comments || []); } catch(e){ console.warn(e); } }
  async function loadLeaderboard(){ try { const r = await fetch("/api/leaderboard"); const j = await r.json(); setLeaderboard(j || {}); } catch(e){ console.warn(e); } }

  async function register(){
    if (!usernameIn || !passwordIn) return alert("enter credentials");
    try {
      const res = await fetch("/api/auth", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ action: "signup", username: usernameIn, password: passwordIn })});
      const j = await res.json();
      if (!res.ok) return alert(j.error || "register failed");
      alert("registered — please login");
      setUsernameIn(""); setPasswordIn("");
    } catch(e){ alert("register error"); }
  }
  async function login(){
    if (!usernameIn || !passwordIn) return alert("enter credentials");
    try {
      const res = await fetch("/api/auth", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ action: "login", username: usernameIn, password: passwordIn })});
      const j = await res.json();
      if (!res.ok) return alert(j.error || "login failed");
      // create simple demo token
      const token = btoa(usernameIn + "|" + Date.now());
      setToken(token);
      // fetch profile
      const uj = await fetch("/api/user", { method:"POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ token })});
      const ujj = await uj.json();
      if (uj.ok) setUser({ username: usernameIn, token, ...ujj.user });
      else setUser({ username: usernameIn, token });
      setUsernameIn(""); setPasswordIn("");
      alert("logged in (demo)");
    } catch(e){ alert("login error"); }
  }
  function logout(){ setToken(null); setUser(null); }

  async function generateOne(){
    setIsLoading(true);
    try {
      const res = await fetch("/api/generateDrink", { method: "POST" });
      const j = await res.json();
      const d = j.drink; if (!d) throw new Error("no drink");
      d._id = mkId(d);
      d.tags = d.tags || (d.ingredients || []).map(x => x.toLowerCase()).slice(0,4);
      setDrink(d); setView("result");
      if (narratorPlaying) playNarrator(d);
    } catch(e){ console.error(e); alert("generate failed"); }
    finally { setIsLoading(false); }
  }

  async function getSuggestions(tries = 5){
    setCandidates([]); setIsLoading(true);
    try {
      const fetched = [];
      for (let i=0;i<tries;i++){
        const res = await fetch("/api/generateDrink", { method:"POST" });
        const j = await res.json();
        if (j?.drink) {
          const d = j.drink; d._id = mkId(d); d.tags = d.tags || (d.ingredients||[]).map(x=>x.toLowerCase()).slice(0,4);
          fetched.push(d);
        }
      }
      // score by user likes/dislikes
      const scored = fetched.map(d => ({ d, s: scoreForUser(d, user) }));
      scored.sort((a,b)=>b.s - a.s);
      setCandidates(scored.map(x=>x.d));
      setView("suggestions");
    } catch(e){ console.error(e); alert("suggest fail"); }
    finally{ setIsLoading(false); }
  }

  function scoreForUser(d, u){
    if (!u) return Math.random();
    const tags = d.tags || [];
    let score = 0;
    tags.forEach(t => { if ((u.likes||[]).includes(t)) score+=5; if ((u.dislikes||[]).includes(t)) score-=6;});
    score += Math.random()*0.6;
    return score;
  }

  /* Actions: like / dislike / drank */
  async function action(actionName, d){
    if (!user) return alert("login to interact");
    try {
      const res = await fetch("/api/actions", { method:"POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({
        action: actionName, drinkId: d._id, drinkMeta: { name: d.name, ingredients: d.ingredients || [], tags: d.tags || [] }, token: user.token
      })});
      const j = await res.json();
      if (!res.ok) return alert(j.error || "action failed");
      await loadLeaderboard();
      if (actionName === "drank") alert("Recorded as drank.");
    } catch(e){ console.error(e); alert("action exception"); }
  }

  /* Comments: post */
  async function postComment(d, text){
    if (!user) return alert("login to comment");
    if (!text || !d) return;
    try {
      const res = await fetch("/api/comments", { method:"POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ drinkId: d._id, text, token: user.token })});
      const j = await res.json();
      if (!res.ok) return alert(j.error || "comment failed");
      await loadComments();
    } catch(e){ console.error(e); alert("comment error"); }
  }

  /* Narrator */
  function playNarrator(d){
    if (!d) return;
    const script = d.script || `${d.name}. ${d.description || ""}. Ingredients: ${(d.ingredients||[]).slice(0,6).join(", ")}. Steps: ${(d.steps||[]).slice(0,3).join(" — ")}. Cheers.`;
    if (!("speechSynthesis" in window)) return alert("Speech not supported");
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(script);
    u.rate = 0.95; u.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length) u.voice = voices.find(v=>v.lang.startsWith("en"))||voices[0];
    u.onend = ()=> setNarratorPlaying(false);
    setNarratorPlaying(true);
    window.speechSynthesis.speak(u);
  }
  function stopNarrator(){ if ("speechSynthesis" in window) { window.speechSynthesis.cancel(); setNarratorPlaying(false); } }

  const commentsFor = useMemo(()=> (comments||[]).filter(c => drink && c.drinkId === drink._id), [comments, drink]);

  return (
    <div className="grid">
      <aside className="sidebar left-col">
        <div className="card">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div>
              <div style={{ fontFamily:"Cinzel, serif", color:"var(--gold)", fontSize:18 }}>Account</div>
              <div className="small">Register or login (demo)</div>
            </div>
          </div>

          { user ? (
            <div>
              <div style={{ marginBottom:8 }}><strong style={{ color:"var(--gold-2)" }}>{user.username}</strong></div>
              <div className="row" style={{ marginBottom: 10 }}>
                <button className="btn" onClick={()=>{ logout(); }}>Logout</button>
                <button className="btn-ghost" onClick={()=>{ setView("leaderboard"); loadLeaderboard(); }}>Leaderboard</button>
              </div>
            </div>
          ) : (
            <div>
              <input className="input" placeholder="username" value={usernameIn} onChange={e=>setUsernameIn(e.target.value)} />
              <input className="input" placeholder="password" type="password" value={passwordIn} onChange={e=>setPasswordIn(e.target.value)} />
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn" onClick={login}>Login</button>
                <button className="btn-ghost" onClick={register}>Sign up</button>
              </div>
              <div className="small" style={{ marginTop:8 }}>Demo-only auth: stored in server JSON — not secure for production.</div>
            </div>
          )}

          <div className="divider"></div>

          <div style={{ marginTop:10 }}>
            <div className="small">Quick actions</div>
            <div style={{ display:"flex", gap:8, marginTop:8 }}>
              <button className="btn" onClick={()=>generateOne()} disabled={isLoading}>{isLoading ? "Shaking..." : "Surprise me"}</button>
              <button className="btn-ghost" onClick={()=>getSuggestions(6)} disabled={isLoading}>{isLoading ? "Thinking..." : "Get suggestions"}</button>
            </div>

            <div style={{ marginTop:12 }}>
              <label className="small">Narrator</label>
              <div style={{ display:"flex", gap:8, marginTop:8 }}>
                <button className="btn-ghost" onClick={()=>{ if (drink) playNarrator(drink); else alert("Open a drink first"); }}>Play</button>
                <button className="btn-ghost" onClick={stopNarrator}>Stop</button>
              </div>
              <div className="small" style={{ marginTop:8 }}>Tip: Log in to tune suggestions to your likes/dislikes.</div>
            </div>
          </div>
        </div>

        <div style={{ height: 18 }}></div>

        <div className="card">
          <h3>Leaderboard</h3>
          <div className="small" style={{ marginBottom:8 }}>Top drink counts & streaks</div>
          <div style={{ maxHeight:260, overflowY:"auto", paddingTop:8 }}>
            { Object.keys(leaderboard.drinkStats||{}).length === 0 && <div className="small">No stats yet</div> }
            { Object.entries(leaderboard.drinkStats||{}).slice(0,8).map(([id, s]) => (
              <div key={id} style={{ padding:8, borderBottom:"1px solid rgba(255,255,255,0.02)" }}>
                <div style={{ fontWeight:700 }}>{ (s.meta && s.meta.name) || id }</div>
                <div className="meta">Likes: {s.likes||0} • Dislikes: {s.dislikes||0} • Drank: {s.drank||s.drank===0? s.drank: (s.drank||0)}</div>
              </div>
            )) }
          </div>
        </div>

      </aside>

      <section className="main right-col">
        { view === "home" && (
          <div className="card">
            <h2>Welcome</h2>
            <div className="small">Click <strong>Surprise me</strong> to generate a drink or <strong>Get suggestions</strong> to see personalized picks.</div>
            <div style={{ marginTop:16, display:"flex", gap:8 }}>
              <button className="btn" onClick={()=>generateOne()}>Surprise me</button>
              <button className="btn-ghost" onClick={()=>getSuggestions(6)}>Get suggestions</button>
            </div>
          </div>
        )}

        { view === "result" && drink && (
          <div className="card">
            <div style={{ display:"flex", gap:16 }}>
              <div style={{ flex:1 }}>
                <h2>{drink.name}</h2>
                <div className="meta">{drink.description}</div>

                <div style={{ marginTop:12 }}>
                  <img src={drink.imageUrl} alt={drink.name} className="drink-image" />
                </div>

                <div style={{ marginTop:10 }}>
                  <h3>Ingredients</h3>
                  <ul style={{ marginTop:6 }}>
                    { (drink.ingredients||[]).map((it, idx)=> <li key={idx} className="small">{it}</li>) }
                  </ul>
                </div>

                <div style={{ marginTop:10 }}>
                  <h3>Steps</h3>
                  <ol style={{ marginTop:6 }}>
                    { (drink.steps||[]).map((s, idx)=> <li key={idx} className="small">{s}</li>) }
                  </ol>
                </div>

                <div style={{ marginTop:12, display:"flex", gap:8 }}>
                  <button className="btn" onClick={()=>action("like", drink)}>Like</button>
                  <button className="btn-ghost" onClick={()=>action("dislike", drink)}>Dislike</button>
                  <button className="btn" onClick={()=>action("drank", drink)}>I drank this</button>
                  <button className="btn-ghost" onClick={()=>{ generateOne(); }}>Next →</button>
                </div>

                <div className="comments" style={{ marginTop:14 }}>
                  <h3>Comments</h3>
                  <CommentsPanel comments={commentsFor} onPost={(t)=>postComment(drink, t)} currentUser={user} />
                </div>
              </div>

              <aside style={{ width:320 }}>
                <div className="card" style={{ padding:12 }}>
                  <img src={drink.imageUrl} alt={drink.name} style={{ width:"100%", borderRadius:10, marginBottom:8 }} />
                  <div style={{ marginBottom:8 }}>
                    { (drink.tags||[]).map((t,i)=><span key={i} className="pill">{t}</span>) }
                  </div>
                  <div className="small" style={{ marginTop:8 }}>Generated drink ID: <span style={{ color:"var(--gold-2)" }}>{drink._id}</span></div>

                  <div style={{ marginTop:12, display:"flex", gap:8 }}>
                    <button className="btn" onClick={()=>playNarrator(drink)}>Play Narrator</button>
                    <button className="btn-ghost" onClick={stopNarrator}>Stop</button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}

        { view === "suggestions" && (
          <div className="card">
            <h2>Suggested for you</h2>
            <div className="small" style={{ marginBottom:12 }}>Ranked by your likes/dislikes (login to tune the results).</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:12 }}>
              { candidates.length === 0 && <div className="small">No suggestions yet.</div> }
              { candidates.map((c)=>(
                <div key={c._id} className="card">
                  <div style={{ display:"flex", gap:12 }}>
                    <img src={c.imageUrl} alt={c.name} style={{ width:96, height:72, objectFit:"cover", borderRadius:8 }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, color:"var(--gold-2)" }}>{c.name}</div>
                      <div className="small">{(c.tags||[]).slice(0,4).join(", ")}</div>
                      <div style={{ marginTop:8, display:"flex", gap:8 }}>
                        <button className="btn" onClick={()=>{ setDrink(c); setView("result"); if (narratorPlaying) playNarrator(c); }}>Open</button>
                        <button className="btn-ghost" onClick={()=>action("like", c)}>Like</button>
                        <button className="btn-ghost" onClick={()=>action("dislike", c)}>Dislike</button>
                      </div>
                    </div>
                  </div>
                </div>
              )) }
            </div>
          </div>
        )}

        { view === "leaderboard" && (
          <div className="card">
            <h2>Leaderboard</h2>
            <div style={{ display:"flex", gap:12 }}>
              <div style={{ flex:1 }}>
                <h3>Top drinks</h3>
                <div style={{ borderTop:"1px solid rgba(255,255,255,0.02)", marginTop:8 }}>
                  { Object.keys(leaderboard.drinkStats||{}).length === 0 && <div className="small">No stats yet.</div> }
                  { Object.entries(leaderboard.drinkStats||{}).map(([id,s])=>(
                    <div key={id} style={{ padding:10, borderBottom:"1px solid rgba(255,255,255,0.02)" }}>
                      <div style={{ fontWeight:700 }}>{(s.meta && s.meta.name) || id}</div>
                      <div className="meta">Likes: {s.likes||0} • Dislikes: {s.dislikes||0} • Drank: {s.drank||0}</div>
                    </div>
                  )) }
                </div>
              </div>

              <div style={{ width:220 }}>
                <h3>Top streaks</h3>
                <div style={{ borderTop:"1px solid rgba(255,255,255,0.02)", marginTop:8 }}>
                  { (leaderboard.streaks||[]).slice(0,10).map((u,i)=>(
                    <div key={i} style={{ padding:8, borderBottom:"1px solid rgba(255,255,255,0.02)" }}>
                      <div style={{ fontWeight:700 }}>{u.username}</div>
                      <div className="meta">{u.streak} days</div>
                    </div>
                  )) }
                </div>
              </div>
            </div>
          </div>
        )}

      </section>
    </div>
  );
}

/* Helpers used inside page (CommentsPanel & narrator wrappers) */
function CommentsPanel({ comments = [], onPost, currentUser }) {
  const [text, setText] = useState("");
  const [local, setLocal] = useState(comments || []);

  useEffect(()=> setLocal(comments || []), [comments]);

  async function doPost(){
    if (!text.trim()) return;
    await onPost(text.trim());
    setLocal(prev => [...prev, { username: currentUser ? currentUser.username : "guest", text, ts: new Date().toISOString() }]);
    setText("");
  }

  return (
    <div>
      { local.length === 0 && <div className="small">No comments yet — be the first.</div> }
      { local.map((c,i)=>(
        <div key={i} className="comment">
          <div className="comment-author">{c.username} <span className="small">• { new Date(c.ts).toLocaleString() }</span></div>
          <div style={{ marginTop:6 }} className="small">{c.text}</div>
        </div>
      )) }

      <div style={{ display:"flex", gap:8, marginTop:10 }}>
        <input className="input" placeholder={ currentUser ? "Write a comment..." : "Login to comment" } value={text} onChange={(e)=>setText(e.target.value)} />
        <button className="btn" onClick={doPost}>Post</button>
      </div>
    </div>
  );
}

/* small utility wrappers used in page (kept here to avoid extra files) */
async function generateOne(){ /* placeholder to be replaced in page scope */ }
async function getSuggestions(){ /* placeholder */ }
function playNarrator(){ /* placeholder */ }
function stopNarrator(){ /* placeholder */ }
