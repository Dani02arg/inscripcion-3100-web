import assert from "node:assert/strict";
import { test } from "node:test";

import { ENROLLED_STUDENTS_COLUMNS } from "../../app/lib/reports/constants.ts";
import { parseEnrolledStudentsXlsxPreview } from "../../app/lib/reports/xlsx-preview.ts";

function crc32(buf: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    crc ^= buf[i] ?? 0;
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(n: number): Uint8Array {
  return Uint8Array.of(n & 0xff, (n >>> 8) & 0xff);
}

function u32(n: number): Uint8Array {
  return Uint8Array.of(
    n & 0xff,
    (n >>> 8) & 0xff,
    (n >>> 16) & 0xff,
    (n >>> 24) & 0xff,
  );
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function str(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

interface ZipFile {
  name: string;
  data: Uint8Array;
}

function buildStoredZip(files: ZipFile[]): Uint8Array {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = str(file.name);
    const data = file.data;
    const crc = crc32(data);

    const localHeader = concat([
      u32(0x04034b50),
      u16(20), // version needed
      u16(0), // flags
      u16(0), // stored
      u16(0),
      u16(0), // time/date
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(nameBytes.length),
      u16(0), // extra
      nameBytes,
    ]);

    localParts.push(localHeader, data);

    const centralHeader = concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBytes,
    ]);
    centralParts.push(centralHeader);

    offset += localHeader.length + data.length;
  }

  const local = concat(localParts);
  const central = concat(centralParts);
  const eocd = concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(central.length),
    u32(local.length),
    u16(0),
  ]);

  return concat([local, central, eocd]);
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function colRef(index: number): string {
  // 0-based -> A, B, ...
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function buildXlsx(rows: string[][]): Uint8Array {
  // rows includes header row as first element.
  const shared: string[] = [];
  const sharedIndex = new Map<string, number>();
  const getIndex = (value: string): number => {
    const existing = sharedIndex.get(value);
    if (existing !== undefined) return existing;
    const idx = shared.length;
    shared.push(value);
    sharedIndex.set(value, idx);
    return idx;
  };

  const sheetRowsXml = rows
    .map((row, rowIdx) => {
      const r = rowIdx + 1;
      const cells = row
        .map((value, colIdx) => {
          const ref = `${colRef(colIdx)}${r}`;
          const idx = getIndex(value);
          return `<c r="${ref}" t="s"><v>${idx}</v></c>`;
        })
        .join("");
      return `<row r="${r}">${cells}</row>`;
    })
    .join("");

  const sheetXml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetData>${sheetRowsXml}</sheetData></worksheet>`;

  const sharedXml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${shared.length}" uniqueCount="${shared.length}">` +
    shared.map((s) => `<si><t>${xmlEscape(s)}</t></si>`).join("") +
    `</sst>`;

  const contentTypes =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
    `<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>` +
    `</Types>`;

  const rels =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`;

  const workbook =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheets><sheet name="Hoja1" sheetId="1" r:id="rId1"/></sheets></workbook>`;

  const workbookRels =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>` +
    `</Relationships>`;

  return buildStoredZip([
    { name: "[Content_Types].xml", data: str(contentTypes) },
    { name: "_rels/.rels", data: str(rels) },
    { name: "xl/workbook.xml", data: str(workbook) },
    { name: "xl/_rels/workbook.xml.rels", data: str(workbookRels) },
    { name: "xl/sharedStrings.xml", data: str(sharedXml) },
    { name: "xl/worksheets/sheet1.xml", data: str(sheetXml) },
  ]);
}

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

test("extrae filas de datos con las 17 columnas en orden desde artefacto XLSX representativo", () => {
  const header = [...ENROLLED_STUDENTS_COLUMNS];
  const row1 = [
    "Ana",
    "Pérez",
    "40111222",
    "20401112220",
    "01/02/2008",
    "Calle 123",
    "2026",
    "3",
    "A",
    "Mañana",
    "Informática",
    "Luis",
    "Pérez",
    "20123456",
    "20201234560",
    "luis@example.com",
    "3874000000",
  ];
  const row2 = [
    "Juan",
    "Gómez",
    "40222333",
    "20402223330",
    "15/06/2007",
    "",
    "2026",
    "4",
    "B",
    "Tarde",
    "Electrónica",
    "María",
    "Gómez",
    "27999888",
    "27279998880",
    "maria@example.com",
    "",
  ];

  const xlsx = buildXlsx([header, row1, row2]);
  const result = parseEnrolledStudentsXlsxPreview({
    base64: toBase64(xlsx),
  });

  if (!result.ok) {
    assert.fail(result.message);
  } else {
    assert.equal(result.preview.totalRows, 2);
    assert.equal(result.preview.rows.length, 2);
    assert.deepEqual([...result.preview.rows[0]!], row1);
    assert.deepEqual([...result.preview.rows[1]!], row2);
    assert.equal(result.preview.rows[0]!.length, 17);
  }
});

test("extrae estado sin filas de datos cuando el XLSX solo contiene encabezados", () => {
  const header = [...ENROLLED_STUDENTS_COLUMNS];
  const xlsx = buildXlsx([header]);

  const result = parseEnrolledStudentsXlsxPreview(toBase64(xlsx));
  if (!result.ok) {
    assert.fail(result.message);
  } else {
    assert.equal(result.preview.totalRows, 0);
    assert.deepEqual(result.preview.rows, []);
  }
});

test("falla de forma controlada ante formato no interpretable", () => {
  const invalid = parseEnrolledStudentsXlsxPreview("bm90LWFuLXhsc3g=");
  if (invalid.ok) {
    assert.fail("se esperaba fallo");
  } else {
    assert.ok(invalid.message.length > 0);
  }

  const empty = parseEnrolledStudentsXlsxPreview("");
  assert.equal(empty.ok, false);
});
