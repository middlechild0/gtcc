import { createLoggerWithContext } from "@visyx/logger";
import { Resend } from "resend";

const logger = createLoggerWithContext("email");

export const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailProps {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export const sendEmail = async ({
  to,
  subject,
  html,
  from = process.env.CONTACT_EMAIL_FROM,
}: SendEmailProps) => {
  if (!process.env.RESEND_API_KEY) {
    logger.warn("RESEND_API_KEY is not set. Skipping email sending.");
    return;
  }

  if (!from) {
    logger.warn("Email 'from' address is not set. Skipping email sending.");
    return;
  }

  try {
    const data = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    logger.info("Email sent successfully", { data });
    return data;
  } catch (error) {
    logger.error("Failed to send email", { error });
    throw error;
  }
};
