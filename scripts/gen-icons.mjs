// Generates Bol Chaal PWA icons with zero dependencies.
// A green speech bubble with three dots (the conversation/typing mark).
// Run: node scripts/gen-icons.mjs
import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const S = 4; // supersampling factor for anti-aliasing

const GRAD_TOP = [34, 197, 94]; // #22c55e
const GRAD_BOTTOM = [21, 128, 61]; // #15803d
const WHITE = [255, 255, 255];
const DOT = [21, 128, 61]; // #15803d

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a, b, t) => a + (b - a) * t;

function insideRoundedRect(px, py, x, y, w, h, r) {
  const cx = clamp(px, x + r, x + w - r);
  const cy = clamp(py, y + r, y + h - r);
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

function makeIcon(size, { fullBleed, safe }) {
  const R = size * S;
  const buf = new Uint8Array(R * R * 4); // RGBA, transparent

  const set = (x, y, color, a = 255) => {
    if (x < 0 || y < 0 || x >= R || y >= R) return;
    const i = (y * R + x) * 4;
    const sa = a / 255;
    const da = buf[i + 3] / 255;
    const oa = sa + da * (1 - sa);
    if (oa === 0) return;
    buf[i] = Math.round((color[0] * sa + buf[i] * da * (1 - sa)) / oa);
    buf[i + 1] = Math.round((color[1] * sa + buf[i + 1] * da * (1 - sa)) / oa);
    buf[i + 2] = Math.round((color[2] * sa + buf[i + 2] * da * (1 - sa)) / oa);
    buf[i + 3] = Math.round(oa * 255);
  };

  // Background (rounded for "any" icons, full square for maskable/apple).
  const corner = fullBleed ? 0 : R * 0.22;
  for (let y = 0; y < R; y++) {
    const t = y / (R - 1);
    const col = [
      Math.round(lerp(GRAD_TOP[0], GRAD_BOTTOM[0], t)),
      Math.round(lerp(GRAD_TOP[1], GRAD_BOTTOM[1], t)),
      Math.round(lerp(GRAD_TOP[2], GRAD_BOTTOM[2], t)),
    ];
    for (let x = 0; x < R; x++) {
      if (fullBleed || insideRoundedRect(x, y, 0, 0, R, R, corner)) {
        set(x, y, col, 255);
      }
    }
  }

  // Speech bubble.
  const bw = R * 0.62 * safe;
  const bh = R * 0.44 * safe;
  const bx = (R - bw) / 2;
  const by = R * (fullBleed ? 0.24 : 0.2);
  const br = bh * 0.34;
  for (let y = Math.floor(by); y <= Math.ceil(by + bh); y++) {
    for (let x = Math.floor(bx); x <= Math.ceil(bx + bw); x++) {
      if (insideRoundedRect(x, y, bx, by, bw, bh, br)) set(x, y, WHITE, 255);
    }
  }

  // Tail (downward triangle near the bottom-left of the bubble).
  const t0 = [bx + bw * 0.2, by + bh - 1];
  const t1 = [bx + bw * 0.44, by + bh - 1];
  const t2 = [bx + bw * 0.24, by + bh + bh * 0.28];
  const minX = Math.floor(Math.min(t0[0], t1[0], t2[0]));
  const maxX = Math.ceil(Math.max(t0[0], t1[0], t2[0]));
  const minY = Math.floor(Math.min(t0[1], t1[1], t2[1]));
  const maxY = Math.ceil(Math.max(t0[1], t1[1], t2[1]));
  const sign = (a, b, c) =>
    (a[0] - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (a[1] - c[1]);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const p = [x, y];
      const d1 = sign(p, t0, t1);
      const d2 = sign(p, t1, t2);
      const d3 = sign(p, t2, t0);
      const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
      const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
      if (!(hasNeg && hasPos)) set(x, y, WHITE, 255);
    }
  }

  // Three dots inside the bubble.
  const dotR = R * 0.045 * safe;
  const cy = by + bh * 0.46;
  const gap = bw * 0.2;
  const cxMid = bx + bw / 2;
  for (const cx of [cxMid - gap, cxMid, cxMid + gap]) {
    for (let y = Math.floor(cy - dotR); y <= Math.ceil(cy + dotR); y++) {
      for (let x = Math.floor(cx - dotR); x <= Math.ceil(cx + dotR); x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= dotR * dotR) set(x, y, DOT, 255);
      }
    }
  }

  // Downsample SxS -> 1 with alpha-weighted averaging.
  const out = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let aSum = 0,
        rSum = 0,
        gSum = 0,
        bSum = 0;
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const i = ((y * S + sy) * R + (x * S + sx)) * 4;
          const a = buf[i + 3];
          aSum += a;
          rSum += buf[i] * a;
          gSum += buf[i + 1] * a;
          bSum += buf[i + 2] * a;
        }
      }
      const o = (y * size + x) * 4;
      out[o + 3] = Math.round(aSum / (S * S));
      if (aSum > 0) {
        out[o] = Math.round(rSum / aSum);
        out[o + 1] = Math.round(gSum / aSum);
        out[o + 2] = Math.round(bSum / aSum);
      }
    }
  }
  return out;
}

function encodePNG(width, height, rgba) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(
      zlib.crc32(Buffer.concat([typeBuf, data])) >>> 0,
      0,
    );
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  };

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // 10..12 default to 0 (compression / filter / interlace)

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    Buffer.from(rgba.buffer, y * stride, stride).copy(
      raw,
      y * (stride + 1) + 1,
    );
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function write(file, size, opts) {
  const rgba = makeIcon(size, opts);
  const png = encodePNG(size, size, rgba);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, png);
  console.log(`  ${path.relative(ROOT, file)} (${png.length} bytes)`);
}

console.log("Generating Bol Chaal icons…");
write(path.join(ROOT, "public/icons/icon-192.png"), 192, { fullBleed: false, safe: 1 });
write(path.join(ROOT, "public/icons/icon-512.png"), 512, { fullBleed: false, safe: 1 });
write(path.join(ROOT, "public/icons/maskable-512.png"), 512, { fullBleed: true, safe: 0.78 });
write(path.join(ROOT, "app/icon.png"), 96, { fullBleed: false, safe: 1 });
write(path.join(ROOT, "app/apple-icon.png"), 180, { fullBleed: true, safe: 0.9 });
console.log("Done.");
