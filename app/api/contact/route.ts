import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, nationality, service, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("contact_enquiries").insert([
      {
        name,
        email,
        nationality: nationality || null,
        service: service || null,
        message,
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error.message);
      return NextResponse.json(
        { error: "Failed to save enquiry. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
