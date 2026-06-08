import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const EmailService = {
  sendDeadlineNotification: async (
    toEmail: string,
    clientName: string,
    obligationTitle: string,
    dueDate: string
  ): Promise<boolean> => {
    const fromAddress = process.env.EMAIL_FROM || 'notifications@eacsolutions.com';
    const subject = `Urgent Compliance Deadline: ${obligationTitle}`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #1F2937;">
        <h2 style="color: #0B192C;">EAC Solutions - Regulatory Warning</h2>
        <p>Dear ${clientName},</p>
        <p>This is an automated notification regarding your upcoming compliance obligation:</p>
        <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <strong>Obligation:</strong> ${obligationTitle}<br/>
          <strong>Due Date:</strong> ${dueDate}
        </div>
        <p>Please log in to your <a href="https://eacsolutions.com/portal">EAC Solutions Portal</a> to upload the missing documents and review the filings.</p>
        <br/>
        <p>Best regards,<br/>EAC Solutions Compliance Desk</p>
      </div>
    `;

    if (resend) {
      console.log(`[Resend] Dispatching email to ${toEmail}`);
      try {
        await resend.emails.send({
          from: fromAddress,
          to: toEmail,
          subject: subject,
          html: html,
        });
        return true;
      } catch (err) {
        console.error('Resend delivery failed:', err);
        return false;
      }
    } else {
      console.log(`[Email Service Mock] (Resend Not Configured) Send email:
        TO: ${toEmail}
        SUBJECT: ${subject}
        BODY: ${obligationTitle} due ${dueDate}`);
      return true;
    }
  }
};
