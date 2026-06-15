import { del, get, set } from "idb-keyval";
import { StateStorage } from "zustand/middleware";

export default class ChessStorage implements StateStorage {
  async getItem(name: string): Promise<string | null> {
    return (await get(name)) || null;
  }
  async setItem(name: string, value: string): Promise<void> {
    await set(name, value);
  }
  async removeItem(name: string): Promise<void> {
    await del(name);
  }
}
