import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { resolveServerSessionUserId } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

/**
 * Generates an iCalendar (.ics) string for export
 */
function generateIcs(event: any): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const formatUtc = (iso: string) => {
    const d = new Date(iso);
    return (
      d.getUTCFullYear() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) +
      "T" +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      pad(d.getUTCSeconds()) +
      "Z"
    );
  };

  const dtStart = formatUtc(event.start_time);
  const dtEnd = event.end_time
    ? formatUtc(event.end_time)
    : formatUtc(new Date(new Date(event.start_time).getTime() + 60 * 60 * 1000).toISOString());
  const now = formatUtc(new Date().toISOString());

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EdWorld Co//EdMail Student Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@edworld.co.in`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${(event.title || "Academic Event").replace(/,/g, "\\,").replace(/;/g, "\\;")}`,
    `DESCRIPTION:${(event.description || "").replace(/\n/g, "\\n")}`,
    event.location_or_link ? `LOCATION:${event.location_or_link}` : "",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

/**
 * GET: List academic events or download .ics
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await resolveServerSessionUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("id");
    const exportIcs = searchParams.get("export") === "ics";

    if (eventId && exportIcs) {
      const { data: event } = await supabase
        .from("student_events")
        .select("*")
        .eq("id", eventId)
        .eq("user_id", userId)
        .single();

      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      const icsData = generateIcs(event);
      return new NextResponse(icsData, {
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": `attachment; filename="${event.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.ics"`,
        },
      });
    }

    // List all upcoming & past events
    const { data: events, error } = await supabase
      .from("student_events")
      .select("*")
      .eq("user_id", userId)
      .order("start_time", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      events: events || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load events" }, { status: 500 });
  }
}

/**
 * POST: Create student event (manual or saved from email invitation)
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await resolveServerSessionUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      eventType = "general",
      startTime,
      endTime,
      timezone = "Asia/Kolkata",
      locationOrLink,
      description,
      reminderMinutes = 30,
      source = "manual",
      sourceMessageId,
    } = body;

    if (!title || !startTime) {
      return NextResponse.json({ error: "Title and start time are required." }, { status: 400 });
    }

    // Check for duplicate record if sourceMessageId is provided
    if (sourceMessageId) {
      const { data: existingEvents } = await supabase
        .from("student_events")
        .select("id")
        .eq("user_id", userId)
        .eq("source_message_id", sourceMessageId)
        .eq("title", title.trim())
        .limit(1);

      if (existingEvents && existingEvents.length > 0) {
        return NextResponse.json({
          success: true,
          event: existingEvents[0],
          notice: "Event already added to calendar from this email.",
        });
      }
    }

    const { data: mailbox } = await supabase
      .from("edmail_mailboxes")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: event, error } = await supabase
      .from("student_events")
      .insert({
        user_id: userId,
        mailbox_id: mailbox?.id || null,
        title: title.trim(),
        event_type: eventType,
        start_time: new Date(startTime).toISOString(),
        end_time: endTime ? new Date(endTime).toISOString() : null,
        timezone,
        location_or_link: locationOrLink || null,
        description: description || null,
        reminder_minutes: Number(reminderMinutes) || 30,
        source: source === "email_invitation" ? "email_invitation" : "manual",
        source_message_id: sourceMessageId || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      event,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save event" }, { status: 500 });
  }
}

/**
 * DELETE: Remove event
 */
export async function DELETE(req: NextRequest) {
  try {
    const userId = await resolveServerSessionUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("id");

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("student_events")
      .delete()
      .eq("id", eventId)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: eventId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete event" }, { status: 500 });
  }
}
