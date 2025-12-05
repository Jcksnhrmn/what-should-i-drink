"use client";

import { useEffect, useMemo, useState } from "react";

/*
  - Uses /api/auth (signup/login from Part1)
  - Uses /api/generateDrink to produce candidates
  - Uses /api/user to fetch current user profile
  - Uses /api/actions, /api/comments, /api/leaderboard (from Part1)
  - Suggestion engine: fetches N candidates, infers tags, scores against user likes/dislikes
  - Special narrator: generates script if not present, supports play/stop
*/

function tokenKey() {
  return "wsid_token_v1";
}
function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem(tokenKey()) : null;
}
function setToken(t) {
  if (typeof window === "undefined") return;
  if (!t) localStorage.removeItem(tokenKey());
  else localStorage.setItem(tokenKey(), t);
}
function mkClientId(drink) {
  // deterministic-ish id from name+ingredients
  const s = (drink.name || "") + "|" + ((drink.ingredients || []).join(",") || "");
  try {
    return "d_" + btoa(s).replace(/=/g, "").slice(0, 18);
  } catch {
    return "d_" + Math.random().toString(36).slice(2, 9);
  }
}

/* Quick tag inference from ingredient strings */
function inferTagsFromIngredients(ingredients = []) {
  const out = new Set();
  const text = ingredients.join(" ").toLowerCase();
  const keywords = [
    "vodka", "rum", "gin", "tequila", "whiskey", "whisky", "wine", "beer",
    "cola", "tonic", "soda", "juice", "orange", "lime", "lemon", "mint",
    "straw", "strawberry", "blueberry", "milk", "cream", "pineapple", "cranberry",
    "sweet", "sour", "bitter", "spicy", "ginger", "honey", "simple syrup"
  ];
  keywords.forEach(k => { if (text.includes(k)) out.add(k.replace(/\s+/g, "-")); });
  // if any words say "ice", mark cold
  if (text.includes("ice")) out.add("cold");
  return Array.from(out);
}

/* Score candidate drink for user */
function scoreDrinkForUser(drink, user) {
  if (!user) return 0;
  const tags = (drink.tags || inferTagsFromIngredients(drink.ingredients || []));
  let score = 0;
  tags.forEach(t => {
    if ((user.likes || []).includes(t)) score += 5;
    if ((user.dislikes || []).includes(t)) score -= 6;
  });
  // slight bonus for drinks that have been popular in the leaderboard meta
  if (drink.meta && drink.meta.popularity) score += Math.log(1 + drink.meta.popularity) * 0.7;
  // small random jitter so ties vary
  score += Math.random() * 0.3;
  return score;
}

/* speech helpers */
function speakText(text) {
  if (!("speechSynthesis" in window)) return { ok: false, error: "no speech" };
  window.speechSynthesis.cancel();
  const ut = new SpeechSynthesisUtterance(text);
  ut.rate = 0.95;
  try {
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length) ut.voice = voices.find(v => v.lang.startsWith("en")) || voices[0];
  } catch {}
  window.speechSynthesis.speak(ut);
  return { ok: true };
}
function stopSpeech() {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}

/* small helper to call server endpoints */
async function apiPost(url, body) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw j;
  return j;
}

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [usernameIn, setUsernameIn] = useState("");
  const [passwordIn, setPasswordIn] = useState("");
  const [drink, setDrink] = useState(null);
  const [view, setView] = useState("input"); // input | result | suggestions | leaderboard
  const [candidates, setCandidates] = useState([]);
  const [isGen, setIsGen] = useState(false);
  const [specialPlaying, setSpecialPlaying] = useState(false);
  const [comments, setComments] = useState([]);
  const [leaderboard, setLeaderboard] = useState({ drinkStats: {}, streaks: [] });

  useEffect(() => {
    // hydrate token -> get user
    const t = getToken();
    if (t) {
      fetch("/api/user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: t }) })
        .then(r => r.json())
        .then(j => { if (j?.ok) setUser({ username: j.user.username, ...j.user, token: t }); else setToken(null); })
        .catch(() => setToken(null));
    }
    refreshComments();
    refreshLeaderboard();
  }, []);

  async function refreshComments() {
    try {
      const res = await fetch("/api/comments");
      const j = await res.json();
      setComments(j.comments || []);
    } catch (e) { console.warn(e); }
  }
  async function refreshLeaderboard() {
    try {
      const res = await fetch("/api/leaderboard");
      const j = await res.json();
      setLeaderboard(j || {});
    } catch (e) { console.warn(e); }
  }

  async function doRegister() {
    try {
      const j = await apiPost("/api/auth", { action: "signup", username: usernameIn, password: passwordIn });
      alert("registered (demo). Please log in.");
      setUsernameIn(""); setPasswordIn("");
    } catch (e) {
      alert(e?.error || "register failed");
    }
  }
  async function doLogin() {
    try {
      const j = await apiPost("/api/auth", { action: "login", username: usernameIn, password: passwordIn });
      // server's login returned success; we create a simple token here (mirror earlier token scheme)
      const token = btoa(usernameIn + "|" + Date.now());
      setToken(token);
      // fetch profile
      const uj = await apiPost("/api/user", { token });
      setUser({ username: usernameIn, token, ...uj.user });
      setUsernameIn(""); setPasswordIn("");
      alert("logged in (demo)");
    } catch (e) {
      alert(e?.error || "login failed");
    }
  }
  function doLogout() {
    setToken(null);
    setUser(null);
  }

  /* Generate a single drink using existing endpoint */
  async function fetchOneDrink() {
    const res = await fetch("/api/generateDrink", { method: "POST" });
    const j = await res.json().catch(() => ({}));
    const d = j.drink || null;
    if (!d) return null;
    // attach deterministic id and inferred tags
    d._id = mkClientId(d);
    d.tags = d.tags || inferTagsFromIngredients(d.ingredients || []);
    return d;
  }

  /* Suggestion engine on client:
     - fetch N candidate drinks (calls generateDrink N times),
     - attach tags if missing,
     - score for user via likes/dislikes,
     - return sorted top list
  */
  async function getSuggestions({ tries = 5 } = {}) {
    setCandidates([]);
    setIsGen(true);
    const token = user?.token || getToken();
    const fetched = [];
    try {
      for (let i = 0; i < tries; i++) {
        // small delay to give generateDrink some variety if it randomized
        const d = await fetchOneDrink();
        if (d) fetched.push(d);
      }
      // optionally: augment with leaderboard-known drinks to increase variety
      try {
        const lbRes = await fetch("/api/leaderboard");
        const lbJson = await lbRes.json();
        const known = lbJson?.drinkStats ? Object.values(lbJson.drinkStats).slice(0, 3).map(m => ({ ...m.meta, _id: mkClientId(m.meta || {}), tags: m.meta?.tags || inferTagsFromIngredients((m.meta?.ingredients||[])) })) : [];
        known.forEach(k => { if (k && !fetched.find(x => x._id === k._id)) fetched.push(k); });
      } catch (e) { /* ignore leaderboard augment */ }

      // score
      const scored = fetched.map(d => ({ drink: d, score: scoreDrinkForUser(d, user) }));
      scored.sort((a, b) => b.score - a.score);
      setCandidates(scored.map(s => s.drink));
      setView("suggestions");
    } catch (e) {
      console.error(e);
      alert("failed to generate suggestions");
    } finally {
      setIsGen(false);
    }
  }

  /* Play special narration for a drink:
    - prefer drink.script if present
    - else build a short script from name + ingredients + steps
  */
  function playNarratorFor(drinkObj) {
    if (!drinkObj) return;
    const script = drinkObj.script || `${drinkObj.name}. ${drinkObj.description || ""}. Ingredients: ${(drinkObj.ingredients || []).join(", ")}. Steps: ${(drinkObj.steps || []).slice(0,3).join(" — ")}. Cheers.`;
    try {
      speakText(script);
      setSpecialPlaying(true);
      // listen for end — set flag when done (SpeechSynthesis does not always reliably fire end event cross-browser, but we attach)
      const onEnd = () => setSpecialPlaying(false);
      window.speechSynthesis.onend = onEnd;
    } catch (e) {
      console.warn(e);
    }
  }
  function stopNarrator() {
    stopSpeech();
    setSpecialPlaying(false);
  }

  /* convenience wrapper for actions (like/dislike/drank) */
  async function doAction(actionName, drinkObj) {
    if (!user) { alert("login to interact"); return; }
    try {
      const body = { action: actionName, drinkId: drinkObj._id, drinkMeta: { name: drinkObj.name, ingredients: drinkObj.ingredients || [], tags: drinkObj.tags || [], description: drinkObj.description }, token: user.token };
      const res = await apiPost("/api/actions", body);
      // refresh leaderboard
      await refreshLeaderboard();
      return res;
    } catch (e) {
      alert(e?.error || "action failed");
    }
  }

  async function postCommentFor(drinkObj, text) {
    if (!user) { alert("login to comment"); return; }
    try {
      await apiPost("/api/comments", { drinkId: drinkObj._id, text, token: user.token });
      await refreshComments(); // get fresh comments
    } catch (e) {
      alert(e?.error || "comment failed");
    }
  }

  const commentsFor = useMemo(() => (comments || []).filter(c => drink && c.drinkId === drink._id), [comments, drink]);

  return (
    <div style={{ padding: 20, color: "#eee", fontFamily: "Inter, sans-serif" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>What Should I Drink?</h1>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {user ? (
            <>
              <div>Signed in as <strong>{user.username}</strong></div>
              <button onClick={() => { doLogout(); }}>Logout</button>
              <button onClick={() => { refreshLeaderboard(); setView("leaderboard"); }}>Leaderboard</button>
            </>
          ) : (
            <>
              <input placeholder="username" value={usernameIn} onChange={(e) => setUsernameIn(e.target.value)} />
              <input placeholder="password" value={passwordIn} onChange={(e) => setPasswordIn(e.target.value)} type="password" />
              <button onClick={doLogin}>Login</button>
              <button onClick={doRegister}>Register</button>
            </>
          )}
        </div>
      </header>

      <main style={{ display: "flex", gap: 20, marginTop: 18 }}>
        <aside style={{ width: 340 }}>
          <div style={{ border: "1px solid #222", padding: 12, borderRadius: 8 }}>
            <p>Quick actions</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={async () => { setDrink(null); const d = await fetchOneDrink(); if (d) { setDrink(d); setView("result"); } }}>Surprise me</button>
              <button onClick={() => getSuggestions({ tries: 6 })} disabled={isGen}>{isGen ? "Thinking..." : "Get Suggestions"}</button>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" checked={specialPlaying} readOnly /> Narrator playing
              </label>
              <div style={{ marginTop: 8 }}>
                <small style={{ color: "#aaa" }}>Tip: register & login so suggestions tune to your likes/dislikes.</small>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <button onClick={() => { setView("input"); }}>Home</button>
              <button onClick={() => { setView("suggestions"); }}>Suggestions</button>
              <button onClick={() => { setView("leaderboard"); refreshLeaderboard(); }}>Leaderboard</button>
            </div>
          </div>
        </aside>

        <section style={{ flex: 1 }}>
          {view === "leaderboard" ? (
            <div>
              <h2>Leaderboard</h2>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <h3>Drinks</h3>
                  <div style={{ border: "1px solid #222", borderRadius: 8 }}>
                    {Object.keys(leaderboard.drinkStats || {}).length === 0 && <div style={{ padding: 12 }}>No drink stats yet</div>}
                    {Object.entries(leaderboard.drinkStats || {}).map(([id, s]) => (
                      <div key={id} style={{ padding: 10, borderBottom: "1px solid #111" }}>
                        <div style={{ fontWeight: 700 }}>{(s.meta && s.meta.name) || id}</div>
                        <div style={{ color: "#aaa" }}>Likes: {s.likes||0} • Dislikes: {s.dislikes||0} • Drank: {s.drank||s.drank===0? s.drank: (s.drank||0)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ width: 220 }}>
                  <h3>Top streaks</h3>
                  <div style={{ border: "1px solid #222", borderRadius: 8 }}>
                    {(leaderboard.streaks || []).length === 0 && <div style={{ padding: 8 }}>No streaks yet</div>}
                    {(leaderboard.streaks || []).slice(0,10).map((s,i) => (
                      <div key={i} style={{ padding: 8, borderBottom: "1px solid #111" }}>
                        <div style={{ fontWeight: 700 }}>{s.username}</div>
                        <div style={{ color: "#aaa" }}>{s.streak} days</div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          ) : view === "result" ? (
            <div>
              {!drink ? <div>No drink yet — click Surprise me.</div> : (
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <h2>{drink.name}</h2>
                    <div style={{ color: "#ddd" }}>{drink.description}</div>

                    <h4>Ingredients</h4>
                    <ul>{(drink.ingredients || []).map((i, idx) => <li key={idx}>{i}</li>)}</ul>

                    <h4>Steps</h4>
                    <ol>{(drink.steps || []).map((s, idx) => <li key={idx}>{s}</li>)}</ol>

                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button onClick={() => doAction("like", drink)}>Like</button>
                      <button onClick={() => doAction("dislike", drink)}>Dislike</button>
                      <button onClick={() => doAction("drank", drink)}>I drank this</button>
                      <button onClick={() => { const d = fetchOneDrink().then(x => { if (x) { setDrink(x); if (specialPlaying) playNarratorFor(x); } }); }}>Next →</button>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <h4>Comments</h4>
                      <CommentsArea initialComments={commentsFor} onPost={(t) => postCommentFor(drink, t)} currentUser={user} />
                    </div>
                  </div>

                  <aside style={{ width: 320 }}>
                    <img src={drink.imageUrl} alt={drink.name} style={{ width: "100%", borderRadius: 8 }} />
                    <div style={{ marginTop: 8, color: "#aaa" }}>Tags: {(drink.tags || []).join(", ")}</div>

                    <div style={{ marginTop: 12 }}>
                      <button onClick={() => playNarratorFor(drink)} disabled={specialPlaying}>Play Narrator</button>
                      <button onClick={() => stopNarrator()}>Stop</button>
                    </div>
                  </aside>
                </div>
              )}
            </div>
          ) : view === "suggestions" ? (
            <div>
              <h2>Suggestions</h2>

              {candidates.length === 0 ? (
                <div style={{ padding: 12 }}>
                  <div>No suggestions yet. Click <strong>Get Suggestions</strong> to generate recommendations.</div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
                  {candidates.map((c, i) => (
                    <div key={c._id || i} style={{ border: "1px solid #222", padding: 12, borderRadius: 8 }}>
                      <div style={{ display: "flex", gap: 12 }}>
                        <img src={c.imageUrl} alt={c.name} style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 6 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700 }}>{c.name}</div>
                          <div style={{ color: "#aaa", fontSize: 13 }}>{(c.tags || []).join(", ")}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <button onClick={() => { setDrink(c); setView("result"); if (specialPlaying) playNarratorFor(c); }}>Open</button>
                        <button onClick={() => doAction("like", c)}>Like</button>
                        <button onClick={() => doAction("dislike", c)}>Dislike</button>
                        <button onClick={() => doAction("drank", c)}>I drank</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          ) : (
            <div>
              <p>Welcome — try “Surprise me” or get suggestions to find drinks that match your tastes.</p>
            </div>
          )}
        </section>
      </main>

      <footer style={{ marginTop: 20, color: "#777" }}>
        Demo persistence: server JSON files. For production, use DB + proper auth.
      </footer>
    </div>
  );
}

/* CommentsArea component (small) */
function CommentsArea({ initialComments = [], onPost, currentUser }) {
  const [text, setText] = useState("");
  const [localComments, setLocalComments] = useState(initialComments || []);
  useEffect(() => setLocalComments(initialComments || []), [initialComments]);

  async function doPost() {
    if (!text.trim()) return;
    await onPost(text);
    setText("");
    // refresh handled by parent; optimistic append:
    setLocalComments(prev => [...prev, { username: currentUser?.username || "guest", text, ts: new Date().toISOString() }]);
  }

  return (
    <div>
      {localComments.length === 0 && <div style={{ color: "#888" }}>No comments yet.</div>}
      {localComments.map((c, i) => (
        <div key={i} style={{ padding: 8, borderBottom: "1px solid #111" }}>
          <div style={{ fontWeight: 700 }}>{c.username} <span style={{ color: "#666", fontSize: 12 }}>• {new Date(c.ts).toLocaleString()}</span></div>
          <div style={{ marginTop: 4 }}>{c.text}</div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input placeholder={currentUser ? "Write a comment..." : "Login to comment"} value={text} onChange={(e) => setText(e.target.value)} style={{ flex: 1 }} />
        <button onClick={doPost}>Post</button>
      </div>
    </div>
  );
}
