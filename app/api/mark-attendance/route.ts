// app/api/mark-attendance/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs"; // ensure server-side

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const fetchName = url.searchParams.get("fetchName") === "true";

    // Read header
    const staffSecretHeader =
      req.headers.get("x-staff-secret") || req.headers.get("authorization");

    // Debug log: see what the backend receives
    console.log("Received x-staff-secret header:", staffSecretHeader);

    // Read server-side secret
    const staffSecret = process.env.STAFF_PASSWORD;
    if (!staffSecret) {
      return new NextResponse(
        JSON.stringify({ error: "Server not configured (no staff secret)" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate header
    if (!staffSecretHeader) {
      return new NextResponse(
        JSON.stringify({ error: "Missing staff authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const headerVal = staffSecretHeader.startsWith("Bearer ")
      ? staffSecretHeader.split(" ")[1]
      : staffSecretHeader;

    console.log("Comparing headerVal:", headerVal, "with server secret");

    if (headerVal !== staffSecret) {
      console.log("Unauthorized access attempt!");
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

    // If only fetching name
    if (fetchName) {
      const { data, error } = await supabase
        .from("registrations")
        .select("name")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        return new NextResponse(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!data) {
        return new NextResponse(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new NextResponse(JSON.stringify({ name: data.name }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Otherwise, mark attendance
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
