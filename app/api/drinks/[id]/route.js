import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req, ctx) {
  try {
    const { id } = await ctx.params;

    const drink = await prisma.drink.findUnique({
      where: { id },
    });

    if (!drink) {
      return NextResponse.json({ error: "Drink not found" }, { status: 404 });
    }

    return NextResponse.json(drink);
  } catch (err) {
    console.error("DRINK FETCH ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
