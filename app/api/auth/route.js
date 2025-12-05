import { promises as fs } from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "app/data/users.json");

export async function POST(req) {
  const { action, username, password } = await req.json();

  let users = JSON.parse(await fs.readFile(dataPath, "utf8"));

  if (action === "signup") {
    if (users[username]) {
      return new Response(JSON.stringify({ error: "User already exists" }), { status: 400 });
    }

    users[username] = {
      password,
      likes: [],
      dislikes: [],
      drinksMade: 0,
      streak: 0
    };

    await fs.writeFile(dataPath, JSON.stringify(users, null, 2));
    return new Response(JSON.stringify({ success: true }));
  }

  if (action === "login") {
    if (!users[username] || users[username].password !== password) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
    }

    return new Response(JSON.stringify({ success: true }));
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
}
