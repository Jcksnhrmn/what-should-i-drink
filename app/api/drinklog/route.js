import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session");

    if (!session) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const decoded = jwt.verify(session.value, process.env.JWT_SECRET);

    const { drinkId } = await req.json();

    const log = await prisma.drinkLog.create({
      data: {
        userId: decoded.userId,
        drinkId,
      },
    });

    return NextResponse.json({ log });

  } catch (err) {
    console.error("DRINKLOG ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
