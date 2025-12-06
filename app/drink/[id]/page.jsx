"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DrinkPage() {
  const { id } = useParams();
  const router = useRouter();

  const [drink, setDrink] = useState(null);
  const [user, setUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  // --------------------------------------------------------------------
  // Load user + drink data
  // --------------------------------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        // Load user
        const u = await fetch("/api/auth/me", { credentials: "include" });
        const uj = await u.json();
        setUser(uj.user || null);

        // Load drink
        const r = await fetch(`/api/drinks/${id}`);
        const j = await r.json();

        if (r.ok && j?.drink) {
          setDrink(j.drink);

          // Only load comments if drink.id exists
          if (j.drink.id) {
            loadComments(j.drink.id);
          } else {
            console.warn("Drink missing id:", j.drink);
          }
        } else {
          console.warn("Drink not found:", j);
          setDrink(null);
        }
      } catch (e) {
        console.error("LOAD ERROR:", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  // --------------------------------------------------------------------
  // Load comments
  // --------------------------------------------------------------------
  async function loadComments(drinkId) {
    if (!drinkId) return; // Prevents undefined errors

    try {
      const res = await fetch(`/api/comments?drinkId=${drinkId}`);
      const j = await res.json();
      if (res.ok) setComments(j.comments || []);
    } catch (e) {
      console.error("COMMENTS ERROR:", e);
    }
  }

  // --------------------------------------------------------------------
  // Likes / Dislikes
  // --------------------------------------------------------------------
  async function sendLike(value) {
    if (!user) return alert("Login to like/dislike drinks.");

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ drinkId: id, value }),
      });

      if (!res.ok) throw new Error();
      alert("Thanks for your feedback!");
    } catch (e) {
      console.error(e);
      alert("Like/dislike failed.");
    }
  }

  // --------------------------------------------------------------------
  // Log drink
  // --------------------------------------------------------------------
  async function logDrank() {
    if (!user) return alert("Login to track drinks.");

    try {
      const res = await fetch("/api/drinklog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ drinkId: id }),
      });

      const j = await res.json();

      if (!res.ok) throw new Error(j.error);
      alert("Logged!");
    } catch (e) {
      console.error(e);
      alert("Could not log drink.");
    }
  }

  // --------------------------------------------------------------------
  // Post comment
  // --------------------------------------------------------------------
  async function postComment(text) {
    if (!user) return alert("Login to comment.");
    if (!text.trim()) return;

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ drinkId: id, text }),
      });

      if (res.ok) {
        loadComments(id);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // --------------------------------------------------------------------
  // Narrator
  // --------------------------------------------------------------------
  function buildNarratorScript(d) {
    const ingredients = (d.ingredients || []).join(", ");
    const steps = (d.steps || []).join(". ");
    return `${d.name}. ${d.description}. Ingredients: ${ingredients}. Steps: ${steps}.`;
  }

  function playNarrator() {
    if (!drink) return;

    const u = new SpeechSynthesisUtterance(buildNarratorScript(drink));
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }

  // --------------------------------------------------------------------
  // UI rendering
  // --------------------------------------------------------------------
  if (loading) return <div className="card">Loading...</div>;
  if (!drink) return <div className="card">Drink not found.</div>;

  return (
    <div className="card" style={{ maxWidth: 900, margin: "0 auto" }}>
      <button className="btn-ghost" onClick={() => router.push("/")}>
        ← Back
      </button>

      <h1 style={{ marginTop: 16 }}>{drink.name}</h1>
      <div className="meta">{drink.description}</div>

      <h3 style={{ marginTop: 20 }}>Ingredients</h3>
      <ul>
        {drink.ingredients.map((it, idx) => (
          <li key={idx} className="small">{it}</li>
        ))}
      </ul>

      <h3 style={{ marginTop: 20 }}>Steps</h3>
      <ol>
        {drink.steps.map((s, idx) => (
          <li key={idx} className="small">{s}</li>
        ))}
      </ol>

      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <button className="btn" onClick={() => sendLike(1)}>Like</button>
        <button className="btn-ghost" onClick={() => sendLike(-1)}>Dislike</button>
        <button className="btn-ghost" onClick={playNarrator}>Narrator →</button>
      </div>

      <div style={{ marginTop: 24 }}>
        <h3>Comments</h3>

        {comments.length === 0 && (
          <div className="small">No comments yet.</div>
        )}

        {comments.map((c) => (
          <div key={c.id} className="comment">
            <div className="comment-author">{c.user?.email || "User"}</div>
            <div className="small">{c.text}</div>
          </div>
        ))}

        {user && (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input
              className="input"
              placeholder="Write a comment..."
              onKeyDown={(e) => {
                if (e.key === "Enter") postComment(e.target.value);
              }}
            />
            <button
              className="btn"
              onClick={() => {
                const inp = document.querySelector("input.input");
                if (inp?.value) postComment(inp.value);
                inp.value = "";
              }}
            >
              Post
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
