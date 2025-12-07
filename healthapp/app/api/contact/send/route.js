import { NextResponse } from 'next/server';
import { sendContactEmail } from '@/lib/nodemailer';

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json( { error: "All fields are required" }, { status: 400 } );
    }

    const result = await sendContactEmail(name, email, subject, message);

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send email: " + result.error }, { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Message sent successfully!",
      }, { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Server error: " + error.message },
      { status: 500 }
    );
  }
}