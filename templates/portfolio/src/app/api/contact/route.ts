import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Parse the incoming request JSON body
    const { name, org, email, service, message } = await request.json();

    // Configure the SMTP transporter
    const transporter = nodemailer.createTransport({
      // service:""
      host: process.env.ORG_MAIL_SERVICE, // SMTP server host
      port: 587, // SMTP port
      secure: false, // Use SSL
      auth: {
        user: process.env.ORG_MAIL_USER, // SMTP username
        pass: process.env.ORG_MAIL_PASS, // SMTP password
      },
    });

    // Email options
    const mailOptions = {
      from: `"Client Email" <${process.env.ORG_MAIL_USER}>`, // Sender's name and email
      to: "client@gmail.com", // Recipient's email
      subject: `New Contact Form Submission: ${service}`, // Email subject
      text: `You have received a new contact form submission:
Name: ${name}
Organization: ${org}
Email: ${email}
Service Requested: ${service}
Message: ${message}`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Return a success response
    return NextResponse.json(
      { message: "Email sent successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    // Return a failure response
    return NextResponse.json(
      { message: "Failed to send email." },
      { status: 500 }
    );
  }
}
