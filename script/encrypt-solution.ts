// Web Crypto API — works in Node 18+ and all modern browsers
import { ed25519 } from "@noble/curves/ed25519.js";
import { bytesToHex } from "./helpers";

const enc = new TextEncoder();

// TextEncoder.encode() always returns ArrayBuffer-backed memory — cast is safe.
function toBuffer(str: string): Uint8Array<ArrayBuffer> {
  return enc.encode(str) as Uint8Array<ArrayBuffer>;
}

async function deriveAesKey(
  secret: string,
  puzzleId: string
): Promise<{ key: CryptoKey; keyHex: string }> {
  const base = await crypto.subtle.importKey(
    "raw",
    toBuffer(secret),
    "HKDF",
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: toBuffer(puzzleId),
      info: toBuffer("puzzle-solution"),
    },
    base,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const raw = await crypto.subtle.exportKey("raw", key);
  return { key, keyHex: bytesToHex(new Uint8Array(raw)) };
}

async function deriveSigningKey(secret: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", toBuffer(secret));
  return new Uint8Array(digest);
}

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

// Decodes a base58-encoded Solana address to its raw 32 bytes.
function decodeBase58Pubkey(str: string): Uint8Array {
  const result = new Uint8Array(32);
  for (const char of str) {
    let carry = BASE58_ALPHABET.indexOf(char);
    if (carry < 0) throw new Error(`Invalid base58 character: ${char}`);
    for (let i = 31; i >= 0; i--) {
      carry += 58 * result[i];
      result[i] = carry & 0xff;
      carry >>= 8;
    }
  }
  return result;
}

// message = puzzleId_utf8 | ':' | playerPubkey_raw_32_bytes
// Raw bytes avoid BPF base58 encoding on the Rust side (~1M CUs via Pubkey::fmt).
function buildSigningMessage(
  puzzleId: string,
  playerPubkey: string
): Uint8Array<ArrayBuffer> {
  const idBytes = toBuffer(puzzleId);
  const pubkeyBytes = playerPubkey
    ? decodeBase58Pubkey(playerPubkey)
    : new Uint8Array(32);
  const msg = new Uint8Array(
    idBytes.length + 1 + 32
  ) as Uint8Array<ArrayBuffer>;
  msg.set(idBytes, 0);
  msg[idBytes.length] = 58; // ':'
  msg.set(pubkeyBytes, idBytes.length + 1);
  return msg;
}

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
    toBuffer(movesJson)
  );

  return {
    iv: bytesToHex(iv),
    data: bytesToHex(new Uint8Array(ciphertext)),
    keyHex,
  };
}

export async function signSolution(
  puzzleId: string,
  playerPubkey: string
): Promise<string | null> {
  const secret = process.env.PUZZLE_SECRET;
  if (!secret) return null;

  const privateKey = await deriveSigningKey(secret);
  const message = buildSigningMessage(puzzleId, playerPubkey);
  const signature = ed25519.sign(message, privateKey);
  return bytesToHex(signature);
}

// Prints the Ed25519 public key derived from PUZZLE_SECRET.
// Copy the output into PUZZLE_PUBLIC_KEY in constants.rs.
export async function generatePublicKey(): Promise<void> {
  const secret = process.env.PUZZLE_SECRET;
  if (!secret) return;

  const privateKey = await deriveSigningKey(secret);
  const publicKey = ed25519.getPublicKey(privateKey);
  console.log(bytesToHex(publicKey));
}
