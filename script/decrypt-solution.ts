import { hexToBytes } from "./helpers";

const dec = new TextDecoder();

export async function decryptSolution(
  encrypted: { iv: string; data: string },
  keyHex: string
): Promise<string[] | null> {
  try {
    const key = await importAesKey(keyHex);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: hexToBytes(encrypted.iv) },
      key,
      hexToBytes(encrypted.data)
    );
    return JSON.parse(dec.decode(plain)) as string[];
  } catch {
    return null;
  }
}

async function importAesKey(keyHex: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    hexToBytes(keyHex),
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
}
