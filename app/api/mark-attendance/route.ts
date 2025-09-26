// app/api/mark-attendance/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs"; // make sure this runs on server

/**
 * Expected: request to include header: x-staff-secret: <STAFF_PASSWORD>
 * STAFF_PASSWORD must be set in your environment variables:
 *   STAFF_PASSWORD=someStrongPassword
 *
 * QR can still contain id (e.g. ?id=123) — but the request must include the header.
 */

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const staffSecretHeader =
      req.headers.get("x-staff-secret") || req.headers.get("authorization");

    const staffSecret = process.env.STAFF_PASSWORD;
    if (!staffSecret) {
      return new NextResponse(
        JSON.stringify({ error: "Server not configured (no staff secret)" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // validate header
    if (!staffSecretHeader) {
      return new NextResponse(
        JSON.stringify({ error: "Missing staff authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // if client sent Authorization: Bearer <secret>, accept both forms
    const headerVal = staffSecretHeader.startsWith("Bearer ")
      ? staffSecretHeader.split(" ")[1]
      : staffSecretHeader;

    if (headerVal !== staffSecret) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!id) {
      return new NextResponse(
        JSON.stringify({ error: "Missing id parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // update attendance - use id (assumed numeric id)
    const { error } = await supabase
      .from("registrations")
      .update({
        attendance_present: true,
        attendance_time: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return new NextResponse(
        JSON.stringify({ error: error.message || "DB error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new NextResponse(
      JSON.stringify({ success: true, message: "Attendance marked" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new NextResponse(
      JSON.stringify({ error: err?.message || "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
