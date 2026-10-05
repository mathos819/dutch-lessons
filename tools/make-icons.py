#!/usr/bin/env python3
"""Draw the Mondrian home-screen icon as PNGs (no dependencies)."""
import os, struct, zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAPER, INK = (0xFA, 0xF9, 0xF4), (0x16, 0x15, 0x0F)
RED, BLUE, YELLOW = (0xDE, 0x3B, 0x24), (0x22, 0x47, 0xB5), (0xF5, 0xC5, 0x18)

# Composition on a 100-unit grid: (x0, y0, x1, y1, colour); black rules are drawn between.
BLOCKS = [(0, 0, 62, 62, RED), (62, 0, 100, 30, PAPER), (62, 30, 100, 62, PAPER),
          (0, 62, 30, 100, PAPER), (30, 62, 82, 100, BLUE), (82, 62, 100, 82, PAPER),
          (82, 82, 100, 100, YELLOW)]
RULE = 4  # rule thickness in grid units

def pixel(x, y):
    for x0, y0, x1, y1, c in BLOCKS:
        if x0 <= x < x1 and y0 <= y < y1:
            near = lambda v, edge: edge not in (0, 100) and abs(v - edge) < RULE / 2
            return INK if near(x, x0) or near(x, x1) or near(y, y0) or near(y, y1) else c
    return INK

def png(size, path):
    rows = b"".join(b"\x00" + b"".join(bytes(pixel((i + .5) * 100 / size, (j + .5) * 100 / size))
                                       for i in range(size)) for j in range(size))
    chunk = lambda t, d: struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d))
    data = (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(rows, 9)) + chunk(b"IEND", b""))
    with open(path, "wb") as f:
        f.write(data)

os.makedirs(os.path.join(ROOT, "icons"), exist_ok=True)
for size, name in [(180, "apple-touch-icon.png"), (192, "icon-192.png"), (512, "icon-512.png")]:
    png(size, os.path.join(ROOT, "icons", name))
print("icons written")
