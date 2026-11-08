import assert from "node:assert/strict";
import { test } from "node:test";

import {
  clearRecoveryRequest,
  consumeRecoveryNotice,
  readRecoveryRequest,
  RECOVERY_NOTICE_STORAGE_KEY,
  RECOVERY_REQUEST_STORAGE_KEY,
  writeRecoveryNotice,
  writeRecoveryRequest,
} from "../../app/lib/recovery/storage.ts";
import type { RecoveryRequest } from "../../app/lib/recovery/request-value.ts";

class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>();

  failGet = false;
  failSet = false;
  failRemove = false;

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    if (this.failGet) {
      throw new Error("get failed");
    }

    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    if (this.failRemove) {
      throw new Error("remove failed");
    }

    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    if (this.failSet) {
      throw new Error("quota exceeded");
    }

    this.data.set(key, value);
  }
}

const REQUEST: RecoveryRequest = {
  email: "ana@example.com",
  requestedAt: 1_700_000_000_000,
};

test("guarda y lee la solicitud activa con solo correo e instante", () => {
  const storage = new MemoryStorage();

  writeRecoveryRequest(REQUEST, storage);

  assert.deepEqual(readRecoveryRequest(storage), REQUEST);

  const raw = storage.getItem(RECOVERY_REQUEST_STORAGE_KEY);
  assert.ok(raw);

  const parsed = JSON.parse(raw) as Record<string, unknown>;
  assert.deepEqual(Object.keys(parsed).sort(), ["email", "requestedAt"]);
  assert.equal(raw.includes("password"), false);
  assert.equal(raw.includes("code"), false);
});

test("una nueva solicitud reemplaza a la anterior", () => {
  const storage = new MemoryStorage();
  const next: RecoveryRequest = {
    email: "otra@example.com",
    requestedAt: 1_700_000_100_000,
  };

  writeRecoveryRequest(REQUEST, storage);
  writeRecoveryRequest(next, storage);

  assert.deepEqual(readRecoveryRequest(storage), next);
});

test("borra la solicitud activa", () => {
  const storage = new MemoryStorage();

  writeRecoveryRequest(REQUEST, storage);
  clearRecoveryRequest(storage);

  assert.equal(readRecoveryRequest(storage), null);
});

test("un valor inválido se trata como ausencia", () => {
  const storage = new MemoryStorage();

  storage.setItem(RECOVERY_REQUEST_STORAGE_KEY, "{no-json");

  assert.equal(readRecoveryRequest(storage), null);
});

test("un fallo de lectura se traduce en ausencia", () => {
  const storage = new MemoryStorage();

  writeRecoveryRequest(REQUEST, storage);
  storage.failGet = true;

  assert.equal(readRecoveryRequest(storage), null);
});

test("un fallo de escritura no lanza y deja la solicitud ausente", () => {
  const storage = new MemoryStorage();

  storage.failSet = true;

  assert.doesNotThrow(() => writeRecoveryRequest(REQUEST, storage));
  assert.equal(readRecoveryRequest(storage), null);
});

test("sin almacenamiento todas las operaciones son seguras", () => {
  assert.equal(readRecoveryRequest(null), null);
  assert.doesNotThrow(() => writeRecoveryRequest(REQUEST, null));
  assert.doesNotThrow(() => clearRecoveryRequest(null));
  assert.doesNotThrow(() => writeRecoveryNotice(null));
  assert.equal(consumeRecoveryNotice(null), false);
});

test("el aviso se consume una sola vez", () => {
  const storage = new MemoryStorage();

  writeRecoveryNotice(storage);

  assert.equal(storage.getItem(RECOVERY_NOTICE_STORAGE_KEY), "1");
  assert.equal(consumeRecoveryNotice(storage), true);
  assert.equal(consumeRecoveryNotice(storage), false);
  assert.equal(storage.getItem(RECOVERY_NOTICE_STORAGE_KEY), null);
});

test("un fallo de lectura del aviso devuelve falso", () => {
  const storage = new MemoryStorage();

  writeRecoveryNotice(storage);
  storage.failGet = true;

  assert.equal(consumeRecoveryNotice(storage), false);
});
