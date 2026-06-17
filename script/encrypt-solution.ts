// Web Crypto API — works in Node 18+ and all modern browsers

const enc = new TextEncoder();
const dec = new TextDecoder();

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const buf = new ArrayBuffer(hex.length / 2);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Derives a per-puzzle AES-GCM-256 key from PUZZLE_SECRET + puzzleId via HKDF.
async function deriveAesKey(
  secret: string,
  puzzleId: string
): Promise<{ key: CryptoKey; keyHex: string }> {
  const base = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(enc.encode(secret)),
    "HKDF",
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(enc.encode(puzzleId)),
      info: new Uint8Array(enc.encode("puzzle-solution")),
    },
    base,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const raw = await crypto.subtle.exportKey("raw", key);
  return { key, keyHex: bytesToHex(new Uint8Array(raw)) };
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

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new Uint8Array(enc.encode(secret)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// Server-only: encrypts moves JSON and returns the ciphertext + per-puzzle derived key.
// AES-GCM output embeds the auth tag — no separate tag field needed.
export async function encryptSolution(
  movesJson: string,
  puzzleId: string
): Promise<{ iv: string; data: string; keyHex: string } | null> {
  const secret = process.env.PUZZLE_SECRET;
  if (!secret) return null;

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const { key, keyHex } = await deriveAesKey(secret, puzzleId);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new Uint8Array(enc.encode(movesJson))
  );

  return {
    iv: bytesToHex(iv),
    data: bytesToHex(new Uint8Array(ciphertext)),
    keyHex,
  };
}

// Client-side: decrypts using the keyHex sent by the server.
// No PUZZLE_SECRET needed — safe to call in the browser.
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

// Server-only: HMAC-SHA256 over "puzzleId:movesJson".
// The client stores this token and sends it back on submission for verification.
export async function signSolution(
  movesJson: string,
  puzzleId: string
): Promise<string | null> {
  const secret = process.env.PUZZLE_SECRET;
  if (!secret) return null;

  const hmacKey = await getHmacKey(secret);
  const sig = await crypto.subtle.sign(
    "HMAC",
    hmacKey,
    new Uint8Array(enc.encode(`${puzzleId}:${movesJson}`))
  );
  return bytesToHex(new Uint8Array(sig));
}

// Server-only: re-derives HMAC and performs a constant-time comparison.
export async function verifySolution(
  movesJson: string,
  puzzleId: string,
  signature: string
): Promise<boolean> {
  const secret = process.env.PUZZLE_SECRET;
  if (!secret) return false;

  const hmacKey = await getHmacKey(secret);
  return crypto.subtle.verify(
    "HMAC",
    hmacKey,
    hexToBytes(signature),
    new Uint8Array(enc.encode(`${puzzleId}:${movesJson}`))
  );
}
