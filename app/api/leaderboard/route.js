import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const topUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        drinkLogs: true,
      },
      orderBy: [
        {
          drinkLogs: {
            _count: "desc"
          }
        }
      ],
      take: 10,
    });

    const mostLiked = await prisma.drink.findMany({
      include: {
        _count: {
          select: { likes: true }
        }
      },
      orderBy: {
        likes: { _count: "desc" }
      },
      take: 10,
    });

    return Response.json({ topUsers, mostLiked });
  } catch (err) {
    return Response.json({ error: "Failed leaderboard" }, { status: 500 });
  }
}
