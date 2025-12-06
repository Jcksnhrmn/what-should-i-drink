import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const { drinkId, value } = await req.json(); // value: 1 or -1
    const token = (await cookies()).get("token")?.value;

    if (!token) return Response.json({ error: "Not logged in" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Upsert ensures only 1 like per drink/user
    const like = await prisma.like.upsert({
      where: {
        userId_drinkId: {
          userId,
          drinkId,
        },
      },
      update: { value },
      create: { userId, drinkId, value },
    });

    return Response.json({ success: true, like });
  } catch (err) {
    return Response.json({ error: "Failed to like" }, { status: 500 });
  }
}
