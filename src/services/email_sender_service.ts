import * as nodemailer from "nodemailer";

interface UserCreationData {
  name: string;
  email: string;
  plainPassword: string;
  role: string;
}

interface PasswordResetData {
  name: string;
  email: string;
  newPassword: string;
}

interface PasswordResetWithLinkData {
  name: string;
  email: string;
  resetLink: string;
}

export class EmailSenderService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  constructor() {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) {
      throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD environment variables must be set");
    }

    this.fromEmail = user;
    this.transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    });
  }

  private renderTemplate(body: string, data: Record<string, string>): string {
    return body.replace(/\{\{(.+?)\}\}/g, (_, key: string) => data[key.trim()] || "");
  }

  async sendUserCredentials(name: string, email: string, plainPassword: string, role: string): Promise<void> {
    const body = [
      `Hello {{name}},`,
      ``,
      `Your FastBI account has been successfully created.`,
      ``,
      `Email: {{email}}`,
      `Temporary password: {{plainPassword}}`,
      `Role: {{role}}`,
      ``,
      `Please change your password after first login.`,
      ``,
      `Best regards,`,
      `FastBI Team`,
    ].join("\n");

    const html = this.renderTemplate(body, { name, email, plainPassword, role });
    await this.sendEmail(email, "FastBI - User creation data", html);
  }

  async sendPasswordReset(name: string, email: string, newPassword: string): Promise<void> {
    const body = [
      `Hello {{name}},`,
      ``,
      `Your password has been reset.`,
      ``,
      `New temporary password: {{newPassword}}`,
      ``,
      `Please log in and change this password immediately.`,
      ``,
      `Best regards,`,
      `FastBI Team`,
    ].join("\n");

    const html = this.renderTemplate(body, { name, email, newPassword });
    await this.sendEmail(email, "FastBI - User password restore", html);
  }

  async sendPasswordResetWithLink(name: string, email: string, resetLink: string): Promise<void> {
    const body = [
      `Hello {{name}},`,
      ``,
      `We received a request to reset your password.`,
      ``,
      `Click the link below to set a new password (expires in 10 minutes):`,
      ``,
      `{{resetLink}}`,
      ``,
      `If you did not request this, please ignore this email.`,
      ``,
      `Best regards,`,
      `FastBI Team`,
    ].join("\n");

    const html = this.renderTemplate(body, { name, resetLink });
    await this.sendEmail(email, "FastBI - Password reset request", html);
  }

  private async sendEmail(toEmail: string, subject: string, body: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.fromEmail,
      to: toEmail,
      subject,
      text: body,
    });
  }
}
