import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function key(master: string) {
  if (Buffer.byteLength(master) < 32) throw new Error("Encryption secret must be at least 32 bytes");
  return createHash("sha256").update(master).digest();
}

function decodeSegment(value: string) {
  const decoded = Buffer.from(value, "base64url");
  if (!decoded.length || decoded.toString("base64url") !== value) throw new Error("invalid");
  return decoded;
}

export function sealSecret(value: string, master: string, context: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(master), iv);
  cipher.setAAD(Buffer.from(context));
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function openSecret(value: string, master: string, context: string) {
  try {
    const [version, ivText, tagText, encryptedText, extra] = value.split(".");
    if (version !== "v1" || !ivText || !tagText || !encryptedText || extra) throw new Error("invalid");
    const iv = decodeSegment(ivText);
    const tag = decodeSegment(tagText);
    const encrypted = decodeSegment(encryptedText);
    if (iv.length !== 12 || tag.length !== 16) throw new Error("invalid");
    const decipher = createDecipheriv("aes-256-gcm", key(master), iv);
    decipher.setAAD(Buffer.from(context));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch {
    throw new Error("Encrypted secret could not be opened");
  }
}
