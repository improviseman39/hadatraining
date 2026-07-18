"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import { localToUtc } from "@/lib/timezone";

function revalidateBookingPaths() {
  revalidatePath("/admin/bookings");
  revalidatePath("/timetable");
}

function readTzOffsetMinutes(formData: FormData): number {
  const raw = Number(formData.get("tz_offset_minutes"));
  return Number.isFinite(raw) ? raw : 0;
}

export async function createBooking(formData: FormData) {
  const { user: caller } = await requireRole(["admin", "super_admin"]);
  const supabase = createClient();

  const userId = String(formData.get("user_id") ?? "");
  const sessionId = String(formData.get("session_id") ?? "");
  const startLocal = String(formData.get("start_at") ?? "");
  const endLocal = String(formData.get("end_at") ?? "");
  if (!userId || !sessionId || !startLocal || !endLocal) {
    return { error: "User, topic, start, and end are all required." };
  }

  const tzOffsetMinutes = readTzOffsetMinutes(formData);
  const startAt = localToUtc(startLocal, tzOffsetMinutes);
  const endAt = localToUtc(endLocal, tzOffsetMinutes);
  if (endAt <= startAt) {
    return { error: "End time must be after start time." };
  }

  const { error } = await supabase.from("bookings").insert({
    user_id: userId,
    session_id: sessionId,
    start_at: startAt.toISOString(),
    end_at: endAt.toISOString(),
    notes: String(formData.get("notes") ?? "").trim() || null,
    created_by: caller.id,
  });

  if (error) return { error: error.message };

  revalidateBookingPaths();
  redirect("/admin/bookings");
}

export async function updateBooking(id: string, formData: FormData) {
  const { user: caller } = await requireRole(["admin", "super_admin"]);
  const supabase = createClient();

  const sessionId = String(formData.get("session_id") ?? "");
  const startLocal = String(formData.get("start_at") ?? "");
  const endLocal = String(formData.get("end_at") ?? "");
  if (!sessionId || !startLocal || !endLocal) {
    return { error: "Topic, start, and end are all required." };
  }

  const tzOffsetMinutes = readTzOffsetMinutes(formData);
  const startAt = localToUtc(startLocal, tzOffsetMinutes);
  const endAt = localToUtc(endLocal, tzOffsetMinutes);
  if (endAt <= startAt) {
    return { error: "End time must be after start time." };
  }

  const { data: current } = await supabase
    .from("bookings")
    .select("sequence")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("bookings")
    .update({
      session_id: sessionId,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      notes: String(formData.get("notes") ?? "").trim() || null,
      updated_by: caller.id,
      sequence: (current?.sequence ?? 0) + 1,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidateBookingPaths();
  return { success: true };
}

export async function deleteBooking(id: string) {
  await requireRole(["admin", "super_admin"]);
  const supabase = createClient();
  await supabase.from("bookings").delete().eq("id", id);
  revalidateBookingPaths();
}
