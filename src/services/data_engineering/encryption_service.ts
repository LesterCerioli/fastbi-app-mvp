import * as crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export class EncryptionService {
  private key: Buffer;

  constructor() {
    const masterKey = process.env.MASTER_ENCRYPTION_KEY;
    if (masterKey) {
      this.key = Buffer.from(masterKey, "base64");
      if (this.key.length !== KEY_LENGTH) {
        throw new Error("MASTER_ENCRYPTION_KEY must be 32 bytes when decoded");
      }
    } else {
      this.key = crypto.randomBytes(KEY_LENGTH);
      console.warn(
        `[WARN] No MASTER_ENCRYPTION_KEY set, generated random key: ${this.key.toString("base64")}`
      );
    }
  }

  encrypt(plainText: string): string {
    if (!plainText) return "";
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    const combined = Buffer.concat([iv, tag, encrypted]);
    return combined.toString("base64");
  }

  decrypt(encryptedText: string): string {
    if (!encryptedText) return "";
    const data = Buffer.from(encryptedText, "base64");
    const iv = data.subarray(0, IV_LENGTH);
    const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const ciphertext = data.subarray(IV_LENGTH + TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(ciphertext) + decipher.final("utf8");
  }
}
