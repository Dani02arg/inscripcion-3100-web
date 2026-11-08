import assert from "node:assert/strict";
import { test } from "node:test";

import {
  MENU_TRIGGER_GAP,
  MENU_VIEWPORT_MARGIN,
  computeMenuPosition,
} from "../../app/lib/courses/menu-position.ts";

const MENU = { width: 224, height: 240 };
const VIEWPORT = { width: 1024, height: 768 };

test("abre debajo del disparador y alinea a la derecha", () => {
  const position = computeMenuPosition(
    { top: 100, right: 900, bottom: 140, left: 860, width: 40, height: 40 },
    MENU,
    VIEWPORT,
  );

  assert.deepEqual(position, {
    top: 140 + MENU_TRIGGER_GAP,
    left: 900 - MENU.width,
    placement: "bottom",
  });
});

test("abre arriba cuando no hay espacio debajo", () => {
  const position = computeMenuPosition(
    { top: 700, right: 900, bottom: 744, left: 860, width: 40, height: 44 },
    MENU,
    VIEWPORT,
  );

  assert.deepEqual(position, {
    top: 700 - MENU_TRIGGER_GAP - MENU.height,
    left: 900 - MENU.width,
    placement: "top",
  });
});

test("limita el borde izquierdo del viewport", () => {
  const position = computeMenuPosition(
    { top: 100, right: 100, bottom: 140, left: 60, width: 40, height: 40 },
    MENU,
    VIEWPORT,
  );

  assert.equal(position.left, MENU_VIEWPORT_MARGIN);
});

test("limita el borde derecho del viewport", () => {
  const position = computeMenuPosition(
    { top: 100, right: 2000, bottom: 140, left: 1960, width: 40, height: 40 },
    MENU,
    VIEWPORT,
  );

  assert.equal(position.left, VIEWPORT.width - MENU.width - MENU_VIEWPORT_MARGIN);
});

test("mantiene el menú dentro de un viewport más pequeño que el menú", () => {
  const position = computeMenuPosition(
    { top: 100, right: 150, bottom: 140, left: 110, width: 40, height: 40 },
    MENU,
    { width: 200, height: 200 },
  );

  assert.equal(position.left, MENU_VIEWPORT_MARGIN);
  assert.equal(position.top, MENU_VIEWPORT_MARGIN);
});
