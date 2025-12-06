"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function buildNarratorScript(drink) {
  if (!drink) return "";
  const ingredients = (drink.ingredients || []).slice(0, 6).join(", ");
  const steps = (drink.steps || []).slice(0, 3).join(". ");
  return `${drink.name}. ${drink.description || ""}. Ingredients: ${ingredients}. Steps: ${steps}. Cheers.`;
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [view, setView] = useState("home");
  const [isLoading, setIsLoading] = useState(false);

  const [authMode, setAuthMode] = useState("login");
  const [emailIn, setEmailIn] = useState("");
  const [passwordIn, setPasswordIn] = useState("");
  const [nameIn, setNameIn] = useState("");

  const [drink, setDrink] = useState(null);
  const [comments, setComments] = useState([]);
  const [leaderboard, setLeaderboard] = useState({ mostLiked: [], topUsers: [] });
  const [narratorPlaying, setNarratorPlaying] = useState(false);

  // Load user + leaderboard
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setUser(j.user || null))
      .catch(() => {});
    loadLeaderboard();
  }, []);

  async function loadLeaderboard() {
    try {
      const res = await fetch("/api/leaderboard");
      const j = await res.json();
      if (res.ok) setLeaderboard(j);
    } catch (e) {
      console.warn(e);
    }
  }

  async function loadCommentsForDrink(drinkId) {
    if (!drinkId) return;
    try {
      const res = await fetch(`/api/comments?drinkId=${drinkId}`);
      const j = await res.json();
      if (res.ok) setComments(j.comments || []);
    } catch (e) {
      console.warn(e);
    }
  }

  // AUTH
  async function handleRegister() {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailIn, password: passwordIn, name: nameIn }),
      });
      const j = await res.json();
      if (!res.ok) alert(j.error || "Registration failed");
      else {
        alert("Registered. Now log in.");
        setAuthMode("login");
      }
    } catch {
      alert("Registration error");
    }
  }

  async function handleLogin() {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: emailIn, password: passwordIn }),
      });
      const j = await res.json();
      if (!res.ok) alert(j.error || "Login failed");
      else {
        setUser(j.user || null);
        setView("home");
      }
    } catch {
      alert("Login error");
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setUser(null);
    setView("home");
  }

  // DRINK GENERATION — FIXED
  async function generateDrink() {
    setIsLoading(true);
    try {
      const genRes = await fetch("/api/generateDrink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "Create a unique cocktail." }),
      });

      const genJson = await genRes.json();
      if (!genRes.ok) throw new Error("Failed to generate drink");
      if (!genJson.name && !genJson.drink) throw new Error("Bad generator response");

      const d = genJson;

      // Save to DB
      const saveRes = await fetch("/api/drinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: d.id,
          name: d.name,
          description: d.description,
          ingredients: d.ingredients || [],
          steps: d.steps || [],
        }),
      });

      const saveJson = await saveRes.json();
      if (!saveRes.ok || !saveJson.drink) throw new Error("Failed to save drink");

      const dbDrink = saveJson.drink;

      // >>>>>>>>>>>>>>>>>>>>>>>>>>
      // MAIN FIX — update local UI
      // >>>>>>>>>>>>>>>>>>>>>>>>>>
      setDrink(dbDrink);
      setView("drink");

      // Still navigate for Vercel
      router.push(`/drink/${dbDrink.id}`);

      await loadCommentsForDrink(dbDrink.id);
      await loadLeaderboard();

      if (narratorPlaying) playNarrator(dbDrink);

    } catch (e) {
      console.error(e);
      alert("Could not generate a drink");
    } finally {
      setIsLoading(false);
    }
  }

  // LIKE / DISLIKE
  async function sendLike(value) {
    if (!user) return alert("Login to like/dislike drinks.");
    if (!drink) return;

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ drinkId: drink.id, value }),
      });
      if (!res.ok) {
        const j = await res.json();
        alert(j.error || "Failed to submit like");
      } else {
        loadLeaderboard();
      }
    } catch {
      alert("Error sending like");
    }
  }

  async function logDrank() {
    if (!user) return alert("Login to track drinks.");
    if (!drink) return;

    try {
      const res = await fetch("/api/drinklog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ drinkId: drink.id }),
      });
      if (!res.ok) {
        const j = await res.json();
        alert(j.error || "Failed to log drink");
      } else {
        alert("Logged!");
        loadLeaderboard();
      }
    } catch {
      alert("Error logging drink");
    }
  }

  // COMMENTS
  async function postComment(text) {
    if (!user) return alert("Login to comment.");
    if (!drink) return;

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ drinkId: drink.id, text }),
      });
      const j = await res.json();
      if (!res.ok) {
        alert(j.error || "Failed to post comment");
      } else {
        await loadCommentsForDrink(drink.id);
      }
    } catch {
      alert("Error posting comment");
    }
  }

  // NARRATOR
  function playNarrator(d = drink) {
    if (!d || typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return alert("Speech not supported");

    const script = buildNarratorScript(d);
    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(script);
    u.rate = 0.95;
    u.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length) {
      u.voice = voices.find((v) => v.lang.startsWith("en")) || voices[0];
    }

    u.onend = () => setNarratorPlaying(false);
    setNarratorPlaying(true);
    window.speechSynthesis.speak(u);
  }

  function stopNarrator() {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    setNarratorPlaying(false);
  }

  const displayName = user?.name || user?.email || "Guest";

  return (
    <div className="grid">
      {/* SIDEBAR */}
      <aside className="sidebar left-col">
        <div className="card">
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontFamily: "Cinzel, serif", color: "var(--gold)", fontSize: 18 }}>
              Account
            </div>
            <div className="small">Sign in to save stats & comments</div>
          </div>

          {user ? (
            <>
              <div style={{ marginBottom: 8 }}>
                <span className="small">Welcome back</span>
                <div style={{ fontWeight: 700, color: "var(--gold-2)", fontSize: 16 }}>
                  {displayName}
                </div>
              </div>

              <div className="row" style={{ marginBottom: 10, gap: 8 }}>
                <button className="btn" onClick={handleLogout}>Logout</button>
                <button className="btn-ghost" onClick={() => setView("leaderboard")}>
                  Leaderboard
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Auth */}
              <div style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 12 }}>
                <button
                  className={`pill-btn ${authMode === "login" ? "pill-btn-active" : ""}`}
                  onClick={() => setAuthMode("login")}
                >
                  Login
                </button>
                <button
                  className={`pill-btn ${authMode === "register" ? "pill-btn-active" : ""}`}
                  onClick={() => setAuthMode("register")}
                >
                  Register
                </button>
              </div>

              {authMode === "register" && (
                <input
                  className="input"
                  placeholder="name (optional)"
                  value={nameIn}
                  onChange={(e) => setNameIn(e.target.value)}
                />
              )}

              <input
                className="input"
                placeholder="email"
                value={emailIn}
                onChange={(e) => setEmailIn(e.target.value)}
              />
              <input
                className="input"
                placeholder="password"
                type="password"
                value={passwordIn}
                onChange={(e) => setPasswordIn(e.target.value)}
              />

              <button className="btn" onClick={authMode === "login" ? handleLogin : handleRegister}>
                {authMode === "login" ? "Login" : "Sign up"}
              </button>
            </>
          )}

          <div className="divider" />

          {/* Quick Actions */}
          <div>
            <div className="small">Quick actions</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="btn" onClick={generateDrink} disabled={isLoading}>
                {isLoading ? "Shaking..." : "Surprise me"}
              </button>
              <button className="btn-ghost" onClick={() => setView("leaderboard")} disabled={isLoading}>
                View leaderboard
              </button>
            </div>

            {/* Narrator */}
            <div style={{ marginTop: 12 }}>
              <label className="small">Narrator mode</label>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button className="btn-ghost" onClick={() => drink ? playNarrator(drink) : alert("Generate a drink first.")}>
                  Play
                </button>
                <button className="btn-ghost" onClick={stopNarrator}>
                  Stop
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick leaderboard */}
        <div style={{ height: 18 }} />

        <div className="card">
          <h3>Quick leaderboard</h3>
          <div className="small" style={{ marginBottom: 8 }}>Most liked drinks (top 5)</div>

          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {(leaderboard.mostLiked || []).slice(0, 5).map((d) => (
              <div
                key={d.id}
                style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div style={{ fontWeight: 700 }}>{d.name}</div>
                <div className="meta">
                  Score: {d.score} • Likes: {d.likes} • Dislikes: {d.dislikes}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN PANEL */}
      <section className="main right-col">

        {/* HOME */}
        {view === "home" && (
          <div className="card">
            <h2>What should I drink?</h2>
            <div className="small">
              Hit <strong>Surprise me</strong> to generate a custom drink.
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <button className="btn" onClick={generateDrink}>
                Surprise me
              </button>
              <button className="btn-ghost" onClick={() => setView("leaderboard")}>
                View leaderboard
              </button>
            </div>
          </div>
        )}

        {/* DRINK VIEW */}
        {view === "drink" && drink && (
          <div className="card">
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1 }}>

                <h2>{drink.name}</h2>
                <div className="meta">{drink.description}</div>

                {/* Ingredients */}
                <div style={{ marginTop: 10 }}>
                  <h3>Ingredients</h3>
                  <ul style={{ marginTop: 6 }}>
                    {(drink.ingredients || []).map((it, i) => (
                      <li key={i} className="small">{it}</li>
                    ))}
                  </ul>
                </div>

                {/* Steps */}
                <div style={{ marginTop: 10 }}>
                  <h3>Steps</h3>
                  <ol style={{ marginTop: 6 }}>
                    {(drink.steps || []).map((s, i) => (
                      <li key={i} className="small">{s}</li>
                    ))}
                  </ol>
                </div>

                {/* Actions */}
                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  <button className="btn" onClick={() => sendLike(1)}>Like</button>
                  <button className="btn-ghost" onClick={() => sendLike(-1)}>Dislike</button>
                  <button className="btn-ghost" onClick={generateDrink}>Next →</button>
                </div>

                {/* Comments */}
                <div className="comments" style={{ marginTop: 14 }}>
                  <h3>Comments</h3>
                  <CommentsPanel
                    comments={comments}
                    onPost={postComment}
                    currentUser={user}
                  />
                </div>

              </div>

              {/* RIGHT SIDEBAR CARD */}
              <aside style={{ width: 320 }}>
                <div className="card" style={{ padding: 12 }}>

                  <div className="small" style={{ marginTop: 8 }}>
                    Drink ID: <span style={{ color: "var(--gold-2)" }}>{drink.id}</span>
                  </div>

                  <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                    <button className="btn" onClick={() => playNarrator(drink)}>
                      Play Narrator
                    </button>
                    <button className="btn-ghost" onClick={stopNarrator}>
                      Stop
                    </button>
                  </div>

                </div>
              </aside>

            </div>
          </div>
        )}

        {/* LEADERBOARD */}
        {view === "leaderboard" && (
          <div className="card">
            <h2>Leaderboard</h2>

            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <h3>Most loved drinks</h3>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 8 }}>
                  {(leaderboard.mostLiked || []).map((d) => (
                    <div key={d.id} style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ fontWeight: 700 }}>{d.name}</div>
                      <div className="meta">
                        Score: {d.score} • Likes: {d.likes} • Dislikes: {d.dislikes}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ width: 260 }}>
                <h3>Top drinkers</h3>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 8 }}>
                  {(leaderboard.topUsers || []).map((u, i) => (
                    <div key={u.id ?? i} style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ fontWeight: 700 }}>
                        {u.email || `User #${u.id}`}
                      </div>
                      <div className="meta">
                        Total drinks: {u.totalDrank} • Streak: {u.streak} days
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </section>
    </div>
  );
}

/* COMMENTS PANEL */
function CommentsPanel({ comments = [], onPost, currentUser }) {
  const [text, setText] = useState("");
  const [local, setLocal] = useState(comments || []);

  useEffect(() => {
    setLocal(comments || []);
  }, [comments]);

  async function doPost() {
    if (!text.trim()) return;

    await onPost(text.trim());

    setLocal((prev) => [
      ...prev,
      {
        username:
          currentUser?.name ||
          currentUser?.email ||
          "guest",
        text,
        ts: new Date().toISOString(),
      },
    ]);

    setText("");
  }

  return (
    <div>
      {local.length === 0 && (
        <div className="small">No comments yet — be the first.</div>
      )}

      {local.map((c, i) => (
        <div key={i} className="comment">
          <div className="comment-author">
            {c.username}{" "}
            <span className="small">• {new Date(c.ts).toLocaleString()}</span>
          </div>
          <div style={{ marginTop: 6 }} className="small">
            {c.text}
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input
          className="input"
          placeholder={currentUser ? "Write a comment..." : "Login to comment"}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn" onClick={doPost}>
          Post
        </button>
      </div>
    </div>
  );
}
