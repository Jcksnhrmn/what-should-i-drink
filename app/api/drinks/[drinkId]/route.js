import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req, context) {
  // FIX: params is a Promise in Turbopack dev mode
  const { drinkId } = await context.params;

  if (!drinkId) {
    return NextResponse.json(
      { error: "Missing drink ID" },
      { status: 400 }
    );
  }

  try {
    const drink = await prisma.drink.findUnique({
      where: { id: drinkId },
    });

    if (!drink) {
      return NextResponse.json({ drink: null }, { status: 404 });
    }

    return NextResponse.json({ drink });
  } catch (err) {
    console.error("DRINK FETCH ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
