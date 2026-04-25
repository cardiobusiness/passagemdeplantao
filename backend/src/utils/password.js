import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

function buildPasswordHash(password, salt) {
  return createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

function compareHashes(expected, received) {
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function createPasswordHash(password) {
  const salt = randomBytes(12).toString("hex");
  return `${salt}$${buildPasswordHash(String(password ?? ""), salt)}`;
}

export async function verifyPassword(password, storedPassword) {
  const [salt, expectedHash] = String(storedPassword ?? "").split("$");

  if (!salt || !expectedHash) {
    return false;
  }

  const receivedHash = buildPasswordHash(String(password ?? ""), salt);
  return compareHashes(expectedHash, receivedHash);
}
