import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();

    console.log("📥 Incoming drink:", body); // << ADDED LOGGING

    const { name, description, ingredients, steps } = body;

    if (!name) {
      console.error("❌ Missing name in body:", body);
      return NextResponse.json({ error: "Missing drink name" }, { status: 400 });
    }

    const drink = await prisma.drink.create({
      data: {
        name,
        description: description || null,
        ingredients: ingredients || [],
        steps: steps || [],
      },
    });

    return NextResponse.json({ drink }, { status: 200 });

  } catch (err) {
    console.error("🔥🔥 PRISMA ERROR START 🔥🔥");
    console.error(err);
    console.error("🔥🔥 PRISMA ERROR END 🔥🔥");

    return NextResponse.json(
      { message: "Database error", error: err.message },
      { status: 500 }
    );
  }
}
