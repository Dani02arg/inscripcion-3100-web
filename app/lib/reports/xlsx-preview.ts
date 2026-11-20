import { inflateRawSync } from "node:zlib";

import { ENROLLED_STUDENTS_COLUMNS } from "./constants.ts";
import type { ReportArtifact } from "./types.ts";

export interface EnrolledStudentsXlsxPreview {
  readonly rows: readonly (readonly string[])[];
  readonly totalRows: number;
}

export type ParseEnrolledStudentsXlsxResult =
  | { readonly ok: true; readonly preview: EnrolledStudentsXlsxPreview }
  | { readonly ok: false; readonly message: string };

const INVALID_XLSX_MESSAGE = "No se pudo interpretar el archivo del reporte.";

interface ZipEntry {
  readonly name: string;
  readonly compressionMethod: number;
  readonly compressedSize: number;
  readonly uncompressedSize: number;
  readonly localHeaderOffset: number;
}

function toBuffer(input: string | Uint8Array): Buffer {
  if (typeof input === "string") {
    return Buffer.from(input, "base64");
  }
  return Buffer.from(input);
}

function readUInt16LE(buf: Buffer, offset: number): number {
  return buf.readUInt16LE(offset);
}

function readUInt32LE(buf: Buffer, offset: number): number {
  return buf.readUInt32LE(offset);
}

function findEndOfCentralDirectory(buf: Buffer): number {
  // EOCD record is at least 22 bytes; comment may follow.
  for (let i = buf.length - 22; i >= 0; i -= 1) {
    if (readUInt32LE(buf, i) === 0x06054b50) {
      return i;
    }
  }
  return -1;
}

function parseZipEntries(buf: Buffer): Map<string, ZipEntry> {
  const eocdOffset = findEndOfCentralDirectory(buf);
  if (eocdOffset < 0) {
    throw new Error("EOCD not found");
  }

  const centralDirectorySize = readUInt32LE(buf, eocdOffset + 12);
  const centralDirectoryOffset = readUInt32LE(buf, eocdOffset + 16);
  const totalEntries = readUInt16LE(buf, eocdOffset + 10);
  const entries = new Map<string, ZipEntry>();

  let offset = centralDirectoryOffset;
  const end = centralDirectoryOffset + centralDirectorySize;

  for (let i = 0; i < totalEntries && offset + 46 <= end; i += 1) {
    if (readUInt32LE(buf, offset) !== 0x02014b50) {
      throw new Error("Invalid central directory");
    }

    const compressionMethod = readUInt16LE(buf, offset + 10);
    const compressedSize = readUInt32LE(buf, offset + 20);
    const uncompressedSize = readUInt32LE(buf, offset + 24);
    const fileNameLength = readUInt16LE(buf, offset + 28);
    const extraLength = readUInt16LE(buf, offset + 30);
    const commentLength = readUInt16LE(buf, offset + 32);
    const localHeaderOffset = readUInt32LE(buf, offset + 42);
    const nameStart = offset + 46;
    const nameEnd = nameStart + fileNameLength;
    const name = buf.subarray(nameStart, nameEnd).toString("utf8");

    entries.set(name, {
      name,
      compressionMethod,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    });

    offset = nameEnd + extraLength + commentLength;
  }

  return entries;
}

function readZipEntry(buf: Buffer, entry: ZipEntry): Buffer {
  const offset = entry.localHeaderOffset;
  if (readUInt32LE(buf, offset) !== 0x04034b50) {
    throw new Error("Invalid local header");
  }

  const fileNameLength = readUInt16LE(buf, offset + 26);
  const extraLength = readUInt16LE(buf, offset + 28);
  const dataStart = offset + 30 + fileNameLength + extraLength;
  const compressed = buf.subarray(dataStart, dataStart + entry.compressedSize);

  if (entry.compressionMethod === 0) {
    return Buffer.from(compressed);
  }
  if (entry.compressionMethod === 8) {
    return inflateRawSync(compressed);
  }

  throw new Error("Unsupported compression");
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&amp;/g, "&");
}

function parseSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  const siRegex = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  let match: RegExpExecArray | null;

  while ((match = siRegex.exec(xml)) !== null) {
    const content = match[1] ?? "";
    const textRegex = /<t(?:\b[^>]*)?>([\s\S]*?)<\/t>/g;
    let textMatch: RegExpExecArray | null;
    let value = "";
    while ((textMatch = textRegex.exec(content)) !== null) {
      value += decodeXmlEntities(textMatch[1] ?? "");
    }
    strings.push(value);
  }

  return strings;
}

function columnIndexFromCellRef(ref: string): number {
  const letters = ref.match(/^[A-Z]+/i)?.[0] ?? "";
  let index = 0;
  for (const char of letters.toUpperCase()) {
    index = index * 26 + (char.charCodeAt(0) - 64);
  }
  return index - 1;
}

function extractCellValue(
  cellXml: string,
  sharedStrings: readonly string[],
): string {
  const typeMatch = cellXml.match(/\bt="([^"]+)"/);
  const type = typeMatch?.[1] ?? "";

  if (type === "inlineStr") {
    const textRegex = /<t(?:\b[^>]*)?>([\s\S]*?)<\/t>/g;
    let match: RegExpExecArray | null;
    let value = "";
    while ((match = textRegex.exec(cellXml)) !== null) {
      value += decodeXmlEntities(match[1] ?? "");
    }
    return value;
  }

  const valueMatch = cellXml.match(/<v(?:\b[^>]*)?>([\s\S]*?)<\/v>/);
  const rawValue = valueMatch ? decodeXmlEntities(valueMatch[1] ?? "") : "";

  if (type === "s") {
    const idx = Number.parseInt(rawValue, 10);
    if (!Number.isInteger(idx) || idx < 0 || idx >= sharedStrings.length) {
      return "";
    }
    return sharedStrings[idx] ?? "";
  }

  if (type === "b") {
    return rawValue === "1" ? "TRUE" : "FALSE";
  }

  return rawValue;
}

function parseSheetRows(
  xml: string,
  sharedStrings: readonly string[],
): string[][] {
  const rows: string[][] = [];
  const rowRegex = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(xml)) !== null) {
    const rowContent = rowMatch[1] ?? "";
    const rowValues = Array.from({ length: ENROLLED_STUDENTS_COLUMNS.length }, () => "");
    const cellRegex = /<c\b([^>]*)>([\s\S]*?)<\/c>|<c\b([^>]*)\/>/g;
    let cellMatch: RegExpExecArray | null;

    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      const attrs = (cellMatch[1] ?? cellMatch[3] ?? "").trim();
      const body = cellMatch[2] ?? "";
      const refMatch = attrs.match(/\br="([^"]+)"/);
      const ref = refMatch?.[1];
      if (!ref) {
        continue;
      }
      const colIndex = columnIndexFromCellRef(ref);
      if (colIndex < 0 || colIndex >= ENROLLED_STUDENTS_COLUMNS.length) {
        continue;
      }
      const cellXml = `<c ${attrs}>${body}</c>`;
      rowValues[colIndex] = extractCellValue(cellXml, sharedStrings);
    }

    rows.push(rowValues);
  }

  return rows;
}

function findWorksheetEntry(entries: Map<string, ZipEntry>): ZipEntry | null {
  const direct = entries.get("xl/worksheets/sheet1.xml");
  if (direct) return direct;
  for (const [name, entry] of entries.entries()) {
    if (name.startsWith("xl/worksheets/") && name.endsWith(".xml")) {
      return entry;
    }
  }
  return null;
}

export function parseEnrolledStudentsXlsxPreview(
  artifact: Pick<ReportArtifact, "base64"> | string | Uint8Array,
): ParseEnrolledStudentsXlsxResult {
  try {
    const source =
      typeof artifact === "string" || artifact instanceof Uint8Array
        ? artifact
        : artifact.base64;
    const buf = toBuffer(source);
    if (buf.length === 0) {
      return { ok: false, message: INVALID_XLSX_MESSAGE };
    }

    const entries = parseZipEntries(buf);
    const sheetEntry = findWorksheetEntry(entries);
    if (!sheetEntry) {
      return { ok: false, message: INVALID_XLSX_MESSAGE };
    }

    let sharedStrings: string[] = [];
    const sharedEntry = entries.get("xl/sharedStrings.xml");
    if (sharedEntry) {
      const sharedXml = readZipEntry(buf, sharedEntry).toString("utf8");
      sharedStrings = parseSharedStrings(sharedXml);
    }

    const sheetXml = readZipEntry(buf, sheetEntry).toString("utf8");
    const allRows = parseSheetRows(sheetXml, sharedStrings);
    if (allRows.length === 0) {
      return { ok: false, message: INVALID_XLSX_MESSAGE };
    }

    // First row is headers; data rows follow.
    const dataRows = allRows.slice(1);

    return {
      ok: true,
      preview: {
        rows: dataRows,
        totalRows: dataRows.length,
      },
    };
  } catch {
    return { ok: false, message: INVALID_XLSX_MESSAGE };
  }
}
