import { promises as fs } from "fs";
import path from "path";

const usersPath = path.join(process.cwd(), "app/data/users.json");
const leaderboardPath = path.join(process.cwd(), "app/data/leaderboard.json");

export async function POST(req) {
  const { username, drinkName, action } = await req.json();

  let users = JSON.parse(await fs.readFile(usersPath, "utf8"));
  let leaderboard = JSON.parse(await fs.readFile(leaderboardPath, "utf8"));

  if (!users[username]) {
    return new Response(JSON.stringify({ error: "User does not exist" }), { status: 400 });
  }

  const user = users[username];

  if (action === "like") {
    if (!user.likes.includes(drinkName)) user.likes.push(drinkName);
    user.dislikes = user.dislikes.filter(d => d !== drinkName);

    leaderboard.likes[drinkName] = (leaderboard.likes[drinkName] || 0) + 1;
  }

  if (action === "dislike") {
    if (!user.dislikes.includes(drinkName)) user.dislikes.push(drinkName);
    user.likes = user.likes.filter(d => d !== drinkName);

    leaderboard.dislikes[drinkName] = (leaderboard.dislikes[drinkName] || 0) + 1;
  }

  await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
  await fs.writeFile(leaderboardPath, JSON.stringify(leaderboard, null, 2));

  return new Response(JSON.stringify({ success: true }));
}
