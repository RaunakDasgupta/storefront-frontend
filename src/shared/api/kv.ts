// Tiny JSON helpers over localStorage / sessionStorage (or any object shaped like them, which is how the tests stay in memory).
export type KV = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function readJson(storage: KV, key: string): unknown {
  try { return JSON.parse(storage.getItem(key) ?? "null"); } catch { return null; }
}

/** `null` removes the key. Private mode can refuse the write: the data then lasts this session only. */
export function writeJson(storage: KV, key: string, value: unknown) {
  try { value === null ? storage.removeItem(key) : storage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
}

/** A storage that lives in memory only, for tests. */
export function memoryKV(): KV {
  const data = new Map<string, string>();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
}
