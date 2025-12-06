import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// POST - Add comment
export async function POST(req) {
  try {
    const { drinkId, text } = await req.json();
    const token = (await cookies()).get("token")?.value;

    if (!token) return Response.json({ error: "Not logged in" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const comment = await prisma.comment.create({
      data: { userId, drinkId, text },
    });

    return Response.json({ success: true, comment });
  } catch (err) {
    return Response.json({ error: "Failed to post comment" }, { status: 500 });
  }
}

// GET - Get comments for a drink
export async function GET(req) {
  try {
    const drinkId = Number(req.nextUrl.searchParams.get("drinkId"));

    const comments = await prisma.comment.findMany({
      where: { drinkId },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ comments });
  } catch (err) {
    return Response.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}
