"use client";

import { usePlayerProfile } from "@/lib/hooks/use-player-profile";

export function ProfileSync() {
  usePlayerProfile();
  return null;
}
