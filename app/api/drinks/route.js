import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const drinks = await prisma.drink.findMany({
      include: {
        likes: true,
        comments: true,
      },
    });

    return Response.json({ drinks }, { status: 200 });
  } catch (err) {
    return Response.json({ error: "Failed to fetch drinks" }, { status: 500 });
  }
}
