import assert from "node:assert/strict";
import { test } from "node:test";

import {
  INSTITUTION_FULL_NAME,
  INSTITUTION_LOGO_PATH,
  INSTITUTION_SHORT_NAME,
  getDrawerWidth,
  getInstitutionAccessibleName,
  getInstitutionLabel,
  getLogoHeight,
  getNavigationWidth,
  isWideViewport,
} from "../../app/lib/sidebar/presentation.ts";

test("la identidad institucional usa el nombre oficial y su abreviatura", () => {
  assert.equal(
    INSTITUTION_FULL_NAME,
    "E.E.T. N° 3100 — República de la India",
  );
  assert.equal(INSTITUTION_SHORT_NAME, "E.E.T. N° 3100");
  assert.equal(INSTITUTION_LOGO_PATH, "/logo.png");
  assert.equal(getInstitutionAccessibleName(), INSTITUTION_FULL_NAME);
});

test("el nombre completo aparece solo en escritorio ancho expandido", () => {
  assert.equal(getInstitutionLabel("expanded", true), INSTITUTION_FULL_NAME);
  assert.equal(getInstitutionLabel("expanded", false), INSTITUTION_SHORT_NAME);
  assert.equal(getInstitutionLabel("drawer", true), INSTITUTION_SHORT_NAME);
  assert.equal(getInstitutionLabel("drawer", false), INSTITUTION_SHORT_NAME);
  assert.equal(getInstitutionLabel("collapsed", true), "");
  assert.equal(getInstitutionLabel("collapsed", false), "");
});

test("el logotipo mide 32 px solo en escritorio ancho expandido", () => {
  assert.equal(getLogoHeight("expanded", true), 32);
  assert.equal(getLogoHeight("expanded", false), 24);
  assert.equal(getLogoHeight("collapsed", true), 24);
  assert.equal(getLogoHeight("drawer", true), 24);
});

test("los anchos base respetan la spec", () => {
  assert.equal(getNavigationWidth("expanded"), 280);
  assert.equal(getNavigationWidth("collapsed"), 72);
  assert.equal(getNavigationWidth("drawer"), 320);
});

test("el drawer usa el menor entre 320 px y el 85 % del viewport", () => {
  assert.equal(getDrawerWidth(320), 272);
  assert.equal(getDrawerWidth(375), 318);
  assert.equal(getDrawerWidth(768), 320);
  assert.equal(getDrawerWidth(1920), 320);
});

test("un viewport inválido no rompe el ancho del drawer", () => {
  assert.equal(getDrawerWidth(0), 320);
  assert.equal(getDrawerWidth(-10), 320);
  assert.equal(getDrawerWidth(Number.NaN), 320);
});

test("el corte de nombre completo es 1280 px", () => {
  assert.equal(isWideViewport(1279), false);
  assert.equal(isWideViewport(1280), true);
  assert.equal(isWideViewport(1920), true);
});
