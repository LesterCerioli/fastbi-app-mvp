import { jest } from "@jest/globals";

jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn(),
  }),
}));

import nodemailer from "nodemailer";
import { EmailSenderService } from "../src/services/email_sender_service";

describe("EmailSenderService", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV };
    process.env.EMAIL_KEY = "test-key";
    process.env.EMAIL_FROM = "noreply@fastbi.com";
    process.env.SMTP_SERVER = "smtp.fastbi.com";
    process.env.SMTP_PORT = "587";
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe("constructor", () => {
    it("creates transporter with correct config", () => {
      new EmailSenderService();
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: "smtp.fastbi.com",
        port: 587,
        secure: false,
        auth: { user: "noreply@fastbi.com", pass: "test-key" },
      });
    });

    it("throws when EMAIL_KEY is not set", () => {
      delete process.env.EMAIL_KEY;
      expect(() => new EmailSenderService()).toThrow("EMAIL_KEY environment variable not set");
    });
  });

  describe("sendUserCredentials", () => {
    it("sends user credentials email", async () => {
      const service = new EmailSenderService();
      const sendMailMock = (nodemailer.createTransport as jest.Mock).mock.results[0].value.sendMail;
      await service.sendUserCredentials("John", "john@test.com", "pass123", "admin");
      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({ to: "john@test.com", subject: "FastBI - User creation data" })
      );
    });

    it("includes password in email body", async () => {
      const service = new EmailSenderService();
      const sendMailMock = (nodemailer.createTransport as jest.Mock).mock.results[0].value.sendMail;
      await service.sendUserCredentials("John", "john@test.com", "secret123", "user");
      const call = sendMailMock.mock.calls[0][0];
      expect(call.text).toContain("secret123");
    });

    it("sends with correct from address", async () => {
      const service = new EmailSenderService();
      const sendMailMock = (nodemailer.createTransport as jest.Mock).mock.results[0].value.sendMail;
      await service.sendUserCredentials("John", "john@test.com", "pass", "admin");
      expect(sendMailMock.mock.calls[0][0].from).toBe("noreply@fastbi.com");
    });
  });

  describe("sendPasswordReset", () => {
    it("sends password reset email", async () => {
      const service = new EmailSenderService();
      const sendMailMock = (nodemailer.createTransport as jest.Mock).mock.results[0].value.sendMail;
      await service.sendPasswordReset("Jane", "jane@test.com", "newPass456");
      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({ to: "jane@test.com", subject: "FastBI - User password restore" })
      );
    });

    it("includes new password in body", async () => {
      const service = new EmailSenderService();
      const sendMailMock = (nodemailer.createTransport as jest.Mock).mock.results[0].value.sendMail;
      await service.sendPasswordReset("Jane", "jane@test.com", "reset789");
      expect(sendMailMock.mock.calls[0][0].text).toContain("reset789");
    });
  });
});
