// For now, we'll just log the emails to the console
// In production, you would integrate with an email service like SendGrid, AWS SES, etc.

type EmailOptions = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<void> {
  // In development, log the email
  if (process.env.NODE_ENV === 'development') {
    console.log('==== Email ====');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Text:', text);
    console.log('HTML:', html);
    console.log('==============');
    return;
  }

  // TODO: Implement email sending with your preferred email service
  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({ to, from: 'your@email.com', subject, text, html });
}

export function generateVerificationEmail(to: string, token: string, organizationName: string): EmailOptions {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}`;

  return {
    to,
    subject: `Verify your email for ${organizationName}`,
    text: `
      Welcome to ${organizationName}!
      
      Please verify your email address by clicking the link below:
      
      ${verificationUrl}
      
      If you didn't request this email, you can safely ignore it.
    `,
    html: `
      <h1>Welcome to ${organizationName}!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <p>
        <a href="${verificationUrl}" style="
          display: inline-block;
          background-color: #4F46E5;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 16px 0;
        ">
          Verify Email Address
        </a>
      </p>
      <p>If you didn't request this email, you can safely ignore it.</p>
    `
  };
}

export function generateInviteEmail(
  to: string,
  organizationName: string,
  inviterName: string,
  token: string
): EmailOptions {
  const inviteUrl = `${process.env.NEXTAUTH_URL}/auth/join?token=${token}`;

  return {
    to,
    subject: `You've been invited to join ${organizationName}`,
    text: `
      ${inviterName} has invited you to join ${organizationName} on ShadowAI Shield.
      
      Click the link below to accept the invitation:
      
      ${inviteUrl}
      
      If you didn't expect this invitation, you can safely ignore this email.
    `,
    html: `
      <h1>You've been invited!</h1>
      <p>${inviterName} has invited you to join ${organizationName} on ShadowAI Shield.</p>
      <p>Click the button below to accept the invitation:</p>
      <p>
        <a href="${inviteUrl}" style="
          display: inline-block;
          background-color: #4F46E5;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 16px 0;
        ">
          Accept Invitation
        </a>
      </p>
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
    `
  };
} 