import { promises as fs } from "fs";
import path from "path";

const commentsPath = path.join(process.cwd(), "app/data/comments.json");

export async function POST(req) {
  const { drinkName, username, comment } = await req.json();

  let comments = JSON.parse(await fs.readFile(commentsPath, "utf8"));

  if (!comments[drinkName]) comments[drinkName] = [];

  comments[drinkName].push({
    username,
    comment,
    timestamp: new Date().toISOString()
  });

  await fs.writeFile(commentsPath, JSON.stringify(comments, null, 2));

  return new Response(JSON.stringify({ success: true }));
}

export async function GET(req) {
  const drinkName = req.nextUrl.searchParams.get("drink");
  let comments = JSON.parse(await fs.readFile(commentsPath, "utf8"));

  return new Response(JSON.stringify(comments[drinkName] || []));
}
