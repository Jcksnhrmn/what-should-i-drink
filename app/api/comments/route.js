import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const drinkId = searchParams.get("drinkId");

    if (!drinkId) {
      return NextResponse.json({ error: "Missing drinkId" }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { drinkId },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { name: true } }, // include usernames
      },
    });

    return NextResponse.json({ comments }, { status: 200 });
  } catch (err) {
    console.error("COMMENT GET ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { drinkId, text } = await req.json();

    if (!drinkId || !text) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // TEMPORARY: assign all comments to userId = 1
    const comment = await prisma.comment.create({
      data: {
        drinkId,
        text,
        userId: 1,
      },
      include: {
        user: { select: { name: true } },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (err) {
    console.error("COMMENT POST ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
