import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const validUser = process.env.ADMIN_USERNAME;
  const validPass = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (username === validUser && password === validPass) {
    return NextResponse.json({ token: sessionSecret });
  }

  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}
