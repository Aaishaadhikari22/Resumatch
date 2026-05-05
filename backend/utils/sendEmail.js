import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  try {
    let transporter;

    if (
      process.env.MAILTRAP_HOST &&
      process.env.MAILTRAP_PORT &&
      process.env.MAILTRAP_USER &&
      process.env.MAILTRAP_PASS
    ) {
      transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_HOST,
        port: Number(process.env.MAILTRAP_PORT),
        secure: Number(process.env.MAILTRAP_PORT) === 465,
        auth: {
          user: process.env.MAILTRAP_USER,
          pass: process.env.MAILTRAP_PASS,
        },
      });
    } else if (
      process.env.EMAIL_HOST &&
      process.env.EMAIL_PORT &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS
    ) {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: Number(process.env.EMAIL_PORT) === 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } else {
      throw new Error(
        "Mailtrap is not configured. Set MAILTRAP_HOST, MAILTRAP_PORT, MAILTRAP_USER, and MAILTRAP_PASS in your .env file."
      );
    }

    const mailOptions = {
      from: `"ResuMatch Team" <${process.env.EMAIL_USER || process.env.MAILTRAP_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email: ", error);
    throw new Error("Failed to send email: " + error.message);
  }
};

export default sendEmail;
