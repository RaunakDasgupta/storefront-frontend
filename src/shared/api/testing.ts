// A ready-made mock API for tests: sample data in memory, no waiting.
import { createApi } from "./index.ts";
import { memoryKV } from "./kv.ts";

export const testApi = () => createApi({ env: {}, mockStorage: memoryKV(), mock: { paymentDelayMs: 0, connectDelayMs: 0 } });
