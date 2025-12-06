import { google } from "googleapis";
import base64url from "base64url";

// Create Gmail client
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

// Function to send email using Gmail API
export async function sendOTPEmail(to, otp) {
  try {
    const htmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333; text-align: center;">Email Verification</h2>
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
                    <p style="font-size: 16px; color: #666;">Your verification code is:</p>
                    <h1 style="color: #007bff; text-align: center; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
                    <p style="font-size: 14px; color: #999; text-align: center;">This code will expire in 10 minutes.</p>
                    <p style="font-size: 14px; color: #666; margin-top: 20px;">If you didn't request this code, please ignore this email.</p>
                </div>
                <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
                    This is an automated email. Please do not reply.
                </p>
            </div>
        `;

    // Create MIME message
    const messageParts = [
      `From: MyHealth App <${process.env.EMAIL_USER}>`,
      `To: ${to}`,
      `Subject: Email Verification OTP`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=UTF-8",
      "",
      htmlBody,
    ];

    const rawMessage = messageParts.join("\n");
    const encodedMessage = base64url.encode(rawMessage);

    // Send email via Gmail API HTTPS endpoint
    const response = await gmail.users.messages.send({
      userId: "me",
      resource: {
        raw: encodedMessage,
      },
    });

    return { success: true, id: response.data.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function verifyEmailConfig() {
  try {
    // Try getting a new access token
    const { token } = await oAuth2Client.getAccessToken();

    if (!token) {
      console.error(
        "❌ Gmail API: Unable to get access token. Check credentials."
      );
      return false;
    }

    const profile = await gmail.users.getProfile({ userId: "me" });

    console.log(
      `✅ Gmail API configuration verified successfully for: ${profile.data.emailAddress}`
    );
    return true;
  } catch (error) {
    console.error("❌ Gmail API configuration error:", error.message);
    return false;
  }
}

export async function sendContactEmail(name, email, subject, message) {
  try {
    const htmlBody = `
      <div style="font-family: Arial; padding: 20px;">
        <h2>📩 New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p style="margin-top: 10px;"><strong>Message:</strong></p>
        <p>${message}</p>
      </div>
    `;

    const messageParts = [
      `From: Contact Form <${process.env.EMAIL_USER}>`,
      `To: sgunjal4777@gmail.com`,
      `Reply-To: ${name} <${email}>`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=UTF-8",
      "",
      htmlBody,
    ];

    const rawMessage = base64url.encode(messageParts.join("\n"));

    const response = await gmail.users.messages.send({
      userId: "me",
      resource: { raw: rawMessage },
    });

    return { success: true, id: response.data.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
