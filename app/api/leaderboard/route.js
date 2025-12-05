import { promises as fs } from "fs";
import path from "path";

const leaderboardPath = path.join(process.cwd(), "app/data/leaderboard.json");
const usersPath = path.join(process.cwd(), "app/data/users.json");

export async function GET() {
  const leaderboard = JSON.parse(await fs.readFile(leaderboardPath, "utf8"));
  const users = JSON.parse(await fs.readFile(usersPath, "utf8"));

  const drinkers = Object.entries(users)
    .map(([username, data]) => ({
      username,
      drinksMade: data.drinksMade,
      streak: data.streak
    }))
    .sort((a, b) => b.drinksMade - a.drinksMade);

  return new Response(JSON.stringify({
    likes: leaderboard.likes,
    dislikes: leaderboard.dislikes,
    topDrinkers: drinkers
  }));
}
