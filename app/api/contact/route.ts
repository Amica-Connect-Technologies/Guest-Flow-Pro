import { NextRequest, NextResponse } from "next/server";

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

    console.log("Contact enquiry:", { name, email, nationality, service, message });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
