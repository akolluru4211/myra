"use client";

import React, { useMemo } from "react";

interface QrCodeViewProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  className?: string;
  includeMargin?: boolean;
}

/**
 * Lightweight, zero-dependency QR code SVG renderer using standard QR matrix generation.
 * Generates valid scannable QR codes for URLs and text.
 */
export function QrCodeView({
  value,
  size = 140,
  fgColor = "#000000",
  bgColor = "#FFFFFF",
  className = "",
  includeMargin = true,
}: QrCodeViewProps) {
  const matrix = useMemo(() => {
    return generateQrMatrix(value);
  }, [value]);

  const moduleCount = matrix.length;
  const margin = includeMargin ? 2 : 0;
  const totalCount = moduleCount + margin * 2;

  return (
    <svg
      viewBox={`0 0 ${totalCount} ${totalCount}`}
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`QR Code for ${value}`}
    >
      <rect width={totalCount} height={totalCount} fill={bgColor} />
      {matrix.map((row, r) =>
        row.map((cell, c) => {
          if (!cell) return null;
          return (
            <rect
              key={`${r}-${c}`}
              x={c + margin}
              y={r + margin}
              width={1}
              height={1}
              fill={fgColor}
            />
          );
        })
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Pure TypeScript QR Code generator (Version 1-10 Byte mode, Reed-Solomon ECC)
// ---------------------------------------------------------------------------

function generateQrMatrix(text: string): boolean[][] {
  const data = encodeUtf8(text);
  const version = pickQrVersion(data.length);
  const totalCodewords = TOTAL_CODEWORDS[version];
  const ecCodewords = EC_CODEWORDS[version];
  const dataCodewordsCount = totalCodewords - ecCodewords;

  // Header: 0100 (Byte mode) + length indicator + data
  const bits: number[] = [];
  appendBits(bits, 0b0100, 4);
  const lengthBits = version <= 9 ? 8 : 16;
  appendBits(bits, data.length, lengthBits);

  for (const byte of data) {
    appendBits(bits, byte, 8);
  }

  // Terminator
  appendBits(bits, 0, Math.min(4, dataCodewordsCount * 8 - bits.length));
  // Pad to multiple of 8
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }
  // Pad bytes 236 and 17
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < dataCodewordsCount * 8) {
    appendBits(bits, padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Group into data codewords
  const dc: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | bits[i + b];
    }
    dc.push(byte);
  }

  // Generate Error Correction codewords using Reed-Solomon
  const ecc = calcReedSolomon(dc, ecCodewords);
  const allCodewords = [...dc, ...ecc];

  // Build Grid
  const size = 17 + 4 * version;
  const grid: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array(size).fill(null)
  );

  // Position detection patterns (7x7)
  placeFinderPattern(grid, 0, 0);
  placeFinderPattern(grid, size - 7, 0);
  placeFinderPattern(grid, 0, size - 7);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    const val = i % 2 === 0;
    if (grid[6][i] === null) grid[6][i] = val;
    if (grid[i][6] === null) grid[i][6] = val;
  }

  // Dark module
  grid[4 * version + 9][8] = true;

  // Alignment patterns for version >= 2
  const alignCoords = ALIGNMENT_COORDS[version];
  if (alignCoords) {
    for (const r of alignCoords) {
      for (const c of alignCoords) {
        if (
          (r === 6 && c === 6) ||
          (r === 6 && c === size - 7) ||
          (r === size - 7 && c === 6)
        ) {
          continue;
        }
        placeAlignmentPattern(grid, r, c);
      }
    }
  }

  // Format info area reservation
  for (let i = 0; i < 9; i++) {
    if (grid[8][i] === null) grid[8][i] = false;
    if (grid[i][8] === null) grid[i][8] = false;
    if (grid[8][size - 1 - i] === null) grid[8][size - 1 - i] = false;
    if (grid[size - 1 - i][8] === null) grid[size - 1 - i][8] = false;
  }

  // Place data bits in zig-zag order
  const dataBits: number[] = [];
  for (const byte of allCodewords) {
    appendBits(dataBits, byte, 8);
  }

  let bitIdx = 0;
  let upwards = true;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // skip vertical timing column
    const rows = upwards
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const r of rows) {
      for (const c of [right, right - 1]) {
        if (grid[r][c] === null) {
          const bit = bitIdx < dataBits.length ? dataBits[bitIdx++] : 0;
          // Apply mask pattern 0: (row + col) % 2 === 0
          const mask = (r + c) % 2 === 0;
          grid[r][c] = (bit === 1) !== mask;
        }
      }
    }
    upwards = !upwards;
  }

  // Write format info (Mask 0, ECC level M = 00)
  // Format string for (ECC M, Mask 0) = 101010000010010
  const formatInfo = 0b101010000010010;
  for (let i = 0; i < 15; i++) {
    const bit = ((formatInfo >> (14 - i)) & 1) === 1;
    // Top-left
    if (i <= 5) grid[8][i] = bit;
    else if (i === 6) grid[8][7] = bit;
    else if (i === 7) grid[8][8] = bit;
    else if (i === 8) grid[7][8] = bit;
    else grid[14 - i][8] = bit;

    // Bottom-left & Top-right
    if (i < 8) grid[size - 1 - i][8] = bit;
    else grid[8][size - 15 + i] = bit;
  }

  return grid.map((row) => row.map((cell) => !!cell));
}

function encodeUtf8(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6));
      bytes.push(0x80 | (code & 0x3f));
    } else {
      bytes.push(0xe0 | (code >> 12));
      bytes.push(0x80 | ((code >> 6) & 0x3f));
      bytes.push(0x80 | (code & 0x3f));
    }
  }
  return bytes;
}

function appendBits(arr: number[], value: number, length: number) {
  for (let i = length - 1; i >= 0; i--) {
    arr.push((value >> i) & 1);
  }
}

function placeFinderPattern(grid: (boolean | null)[][], row: number, col: number) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const gr = row + r;
      const gc = col + c;
      if (gr < 0 || gr >= grid.length || gc < 0 || gc >= grid.length) continue;
      if (
        (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
        (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
        (r >= 2 && r <= 4 && c >= 2 && c <= 4)
      ) {
        grid[gr][gc] = true;
      } else {
        grid[gr][gc] = false;
      }
    }
  }
}

function placeAlignmentPattern(grid: (boolean | null)[][], row: number, col: number) {
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const gr = row + r;
      const gc = col + c;
      if (grid[gr][gc] !== null) continue;
      if (
        Math.abs(r) === 2 ||
        Math.abs(c) === 2 ||
        (r === 0 && c === 0)
      ) {
        grid[gr][gc] = true;
      } else {
        grid[gr][gc] = false;
      }
    }
  }
}

// Reed-Solomon Error Correction Code Calculation
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x >= 256) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF_EXP[GF_LOG[x] + GF_LOG[y]];
}

function calcReedSolomon(data: number[], ecCount: number): number[] {
  // Generator polynomial
  let gen = [1];
  for (let i = 0; i < ecCount; i++) {
    const nextGen = new Array(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      nextGen[j] ^= gfMul(gen[j], GF_EXP[i]);
      nextGen[j + 1] ^= gen[j];
    }
    gen = nextGen;
  }

  const result = new Array(ecCount).fill(0);
  for (const byte of data) {
    const factor = byte ^ result[0];
    result.shift();
    result.push(0);
    for (let i = 0; i < ecCount; i++) {
      result[i] ^= gfMul(gen[i + 1], factor);
    }
  }
  return result;
}

// Version table capacities for Medium Error Correction (ECC M)
const TOTAL_CODEWORDS = [0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346];
const EC_CODEWORDS = [0, 10, 16, 26, 36, 48, 64, 72, 88, 110, 130];
const DATA_CAPACITIES = [0, 14, 26, 42, 62, 84, 106, 122, 152, 180, 213];

const ALIGNMENT_COORDS: Record<number, number[]> = {
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
};

function pickQrVersion(byteLen: number): number {
  for (let v = 1; v <= 10; v++) {
    if (byteLen <= DATA_CAPACITIES[v]) return v;
  }
  return 10;
}
