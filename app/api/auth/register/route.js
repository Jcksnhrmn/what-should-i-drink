import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return Response.json({ error: "Email and password required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ error: "User already exists" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name: name || null,
      },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    return Response.json({ ok: true, user }, { status: 201 });
  } catch (err) {
    console.error("register error", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
