import { address, type IInstruction } from "@solana/kit";

const ED25519_PROGRAM_ADDRESS = address(
  "Ed25519SigVerify111111111111111111111111111"
);

// Builds the native Ed25519 pre-verification instruction.
// Must be the instruction immediately before submit_puzzle in the transaction.
// The Solana runtime verifies the signature in native code — near-zero CU cost.
export function buildEd25519Instruction(
  signature: Uint8Array,  // 64 bytes
  pubkey: Uint8Array,     // 32 bytes
  message: Uint8Array
): IInstruction {
  // Data layout (all offsets relative to start of instruction data):
  // [0]       num_signatures = 1
  // [1]       padding = 0
  // [2..4]    signature_offset   = 16 (right after 2-byte header + 14-byte sig metadata)
  // [4..6]    signature_ix_index = 0xFFFF (current instruction)
  // [6..8]    pubkey_offset      = 80 (16 + 64)
  // [8..10]   pubkey_ix_index    = 0xFFFF
  // [10..12]  message_offset     = 112 (80 + 32)
  // [12..14]  message_size
  // [14..16]  message_ix_index   = 0xFFFF
  // [16..80]  signature (64 bytes)
  // [80..112] pubkey (32 bytes)
  // [112..]   message
  const data = new Uint8Array(112 + message.length);
  const view = new DataView(data.buffer);

  data[0] = 1;
  data[1] = 0;
  view.setUint16(2, 16, true);
  view.setUint16(4, 0xffff, true);
  view.setUint16(6, 80, true);
  view.setUint16(8, 0xffff, true);
  view.setUint16(10, 112, true);
  view.setUint16(12, message.length, true);
  view.setUint16(14, 0xffff, true);

  data.set(signature, 16);
  data.set(pubkey, 80);
  data.set(message, 112);

  return { programAddress: ED25519_PROGRAM_ADDRESS, accounts: [], data };
}
