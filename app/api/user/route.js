// app/api/user/route.js
import fs from "fs";
import path from "path";

const USERS = path.join(process.cwd(), "app", "data", "users.json");

function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS, "utf8")) || {};
  } catch {
    return {};
  }
}

function usernameFromToken(token) {
  if (!token) return null;
  try {
    const dec = Buffer.from(token, "base64").toString("utf8");
    return dec.split("|")[0];
  } catch (e) {
    return null;
  }
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const token = body?.token || body?.authToken || "";

  const username = usernameFromToken(token);
  if (!username) return new Response(JSON.stringify({ error: "invalid token" }), { status: 401 });

  const users = readUsers();
  const user = users[username];
  if (!user) return new Response(JSON.stringify({ error: "user not found" }), { status: 404 });

  // Return a sanitized copy (don't leak password)
  const { password, ...rest } = user;
  return new Response(JSON.stringify({ ok: true, user: { username, ...rest } }), { headers: { "Content-Type": "application/json" } });
}
