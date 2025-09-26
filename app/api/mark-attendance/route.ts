export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Missing ID", { status: 400 });
  }

  const { error } = await supabase
    .from("registrations")
    .update({
      attendance_present: true,
      attendance_time: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return new Response("Error updating attendance", { status: 500 });
  }

  return new Response("✅ Attendance marked successfully");
}
