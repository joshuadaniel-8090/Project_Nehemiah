// app/api/verify-staff-password/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Expected:
 *  - POST request with JSON body: { password: "..." }
 *  - Staff password is stored securely in .env as STAFF_PASSWORD
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const inputPassword = body.password;

    if (!inputPassword) {
      return NextResponse.json(
        { success: false, error: "Password not provided" },
        { status: 400 }
      );
    }

    const staffSecret = process.env.STAFF_PASSWORD;
    if (!staffSecret) {
      return NextResponse.json(
        { success: false, error: "Server not configured (no staff password)" },
        { status: 500 }
      );
    }

    if (inputPassword !== staffSecret) {
      return NextResponse.json(
        { success: false, error: "Incorrect password" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Password correct" },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
