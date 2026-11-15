#!/usr/bin/env python3
"""Pack the LOLA south-polar DEM into two small grids for on-demand horizons.

The website computes terrain horizons for custom points near the south pole in a
serverless function (web/api/terrain.ts). Shipping the full 7624 x 7624 DEM is too
heavy, so this script writes:

* fine.i16.gz   - the 120 m DEM cropped to a square around the pole that covers every
                  point south of SUPPORTED_LAT_DEG plus a 5 km margin;
* coarse.i16.gz - the whole DEM averaged over 4 x 4 pixel blocks (480 m), used for
                  ray samples that fall outside the fine square.

Both hold little-endian int16 PDS codes (height above 1737.4 km in 0.5 m units),
stored as differences along each row (the first column holds the raw value).
grid.json records the layout. The script then rebuilds the horizon masks of the
catalogue sites that lie inside the supported zone with the same sampling scheme the
function uses, and prints the difference against the full-resolution masks.
"""

from __future__ import annotations

import gzip
import json
import math
from pathlib import Path

import numpy as np

try:
    from .horizon_mask import DEFAULT_DEM, DEM_PRODUCT, DEM_SIZE, LUNAR_RADIUS_M, PIXEL_M, load_dem
    from .neighborhood import EPHEM_DIR, HORIZON_DIR, SITES_PATH, metrics_for_one_mask, ray_distances_m
except ImportError:
    from horizon_mask import DEFAULT_DEM, DEM_PRODUCT, DEM_SIZE, LUNAR_RADIUS_M, PIXEL_M, load_dem
    from neighborhood import EPHEM_DIR, HORIZON_DIR, SITES_PATH, metrics_for_one_mask, ray_distances_m

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "web" / "terrain"
SUPPORTED_LAT_DEG = -83.5
FINE_MARGIN_M = 5_000.0
COARSE_FACTOR = 4


def polar_radius_m(lat_deg: float) -> float:
    return 2.0 * LUNAR_RADIUS_M * math.tan((math.pi / 2.0 + math.radians(lat_deg)) / 2.0)


def fine_half_size_px() -> int:
    return int(math.ceil((polar_radius_m(SUPPORTED_LAT_DEG) + FINE_MARGIN_M) / PIXEL_M))


def build_grids(codes: np.ndarray) -> tuple[np.ndarray, int, np.ndarray]:
    half = fine_half_size_px()
    origin = DEM_SIZE // 2 - half
    fine = codes[origin : origin + 2 * half, origin : origin + 2 * half]
    n = DEM_SIZE // COARSE_FACTOR
    coarse = codes[: n * COARSE_FACTOR, : n * COARSE_FACTOR].astype(np.float64)
    coarse = coarse.reshape(n, COARSE_FACTOR, n, COARSE_FACTOR).mean(axis=(1, 3))
    return fine.astype(np.int16), origin, np.round(coarse).astype(np.int16)


def bilinear(grid: np.ndarray, row: np.ndarray, col: np.ndarray) -> np.ndarray:
    size = grid.shape[0]
    row = np.clip(row, 0.0, size - 1.0)
    col = np.clip(col, 0.0, size - 1.0)
    r0 = np.floor(row).astype(np.int64)
    c0 = np.floor(col).astype(np.int64)
    r1 = np.minimum(r0 + 1, size - 1)
    c1 = np.minimum(c0 + 1, size - 1)
    fr, fc = row - r0, col - c0
    g = grid.astype(np.float64)
    return (
        g[r0, c0] * (1 - fr) * (1 - fc) + g[r0, c1] * (1 - fr) * fc + g[r1, c0] * fr * (1 - fc) + g[r1, c1] * fr * fc
    )


def height_m(fine: np.ndarray, origin: int, coarse: np.ndarray, lat_rad: np.ndarray, lon_rad: np.ndarray) -> np.ndarray:
    """Mirror of sampleHeight() in web/src/lib/terrain.ts."""
    rho = 2.0 * LUNAR_RADIUS_M * np.tan((math.pi / 2.0 + lat_rad) / 2.0)
    center = (DEM_SIZE - 1) / 2.0
    col = center + rho * np.sin(lon_rad) / PIXEL_M
    row = center - rho * np.cos(lon_rad) / PIXEL_M
    fr, fc = row - origin, col - origin
    last = fine.shape[0] - 1
    inside = (fr >= 0) & (fr <= last) & (fc >= 0) & (fc <= last)
    offset = (COARSE_FACTOR - 1) / 2.0
    out = bilinear(coarse, (row - offset) / COARSE_FACTOR, (col - offset) / COARSE_FACTOR)
    out[inside] = bilinear(fine, fr[inside], fc[inside])
    return out * 0.5


def horizon(fine: np.ndarray, origin: int, coarse: np.ndarray, lat_deg: float, lon_deg: float) -> list[float]:
    lat, lon = math.radians(lat_deg), math.radians(lon_deg)
    observer = float(height_m(fine, origin, coarse, np.array([lat]), np.array([lon]))[0]) + 2.0
    d = ray_distances_m()
    ang = d / LUNAR_RADIUS_M
    az = np.deg2rad(np.arange(360.0))[:, None]
    sin_lat2 = math.sin(lat) * np.cos(ang) + math.cos(lat) * np.sin(ang) * np.cos(az)
    lat2 = np.arcsin(np.clip(sin_lat2, -1, 1))
    lon2 = lon + np.arctan2(np.sin(az) * np.sin(ang) * math.cos(lat), np.cos(ang) - math.sin(lat) * sin_lat2)
    h = height_m(fine, origin, coarse, lat2, lon2)
    angles = np.degrees(np.arctan2(h - observer - d**2 / (2 * LUNAR_RADIUS_M), d))
    return np.max(angles, axis=1).tolist()


def main() -> int:
    dem = load_dem(DEFAULT_DEM)  # metres
    codes = np.round(dem * 2.0).astype(np.int32)
    fine, origin, coarse = build_grids(codes)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, grid in (("fine", fine), ("coarse", coarse)):
        # Row-wise differences compress about 40% better than raw heights.
        deltas = np.diff(grid.astype(np.int32), axis=1, prepend=0).astype("<i2")
        data = gzip.compress(deltas.tobytes(), compresslevel=9, mtime=0)
        (OUTPUT / f"{name}.i16.gz").write_bytes(data)
        print(f"{name}: {grid.shape[0]} x {grid.shape[1]}, {len(data) / 1e6:.1f} MB gzip")
    layout = {
        "dem": DEM_PRODUCT,
        "dem_size": DEM_SIZE,
        "pixel_m": PIXEL_M,
        "lunar_radius_m": LUNAR_RADIUS_M,
        "units": "int16 little-endian, height above 1737.4 km in 0.5 m units",
        "encoding": "row deltas: value[r][c] = sum of stored[r][0..c]",
        "fine": {"file": "fine.i16.gz", "size": int(fine.shape[0]), "origin_px": origin},
        "coarse": {"file": "coarse.i16.gz", "size": int(coarse.shape[0]), "factor": COARSE_FACTOR},
        "supported_lat_deg": SUPPORTED_LAT_DEG,
    }
    (OUTPUT / "grid.json").write_text(json.dumps(layout, indent=2) + "\n", encoding="utf-8")

    sites = json.loads(SITES_PATH.read_text(encoding="utf-8"))
    for site in sites:
        if float(site["lat"]) > SUPPORTED_LAT_DEG:
            continue
        ref = json.loads((HORIZON_DIR / f"{site['id']}.json").read_text(encoding="utf-8"))["mask_el_deg"]
        mask = horizon(fine, origin, coarse, float(site["lat"]), float(site["lon"]))
        diff = np.asarray(mask) - np.asarray(ref)
        ephem = json.loads((EPHEM_DIR / f"{site['id']}.json").read_text(encoding="utf-8"))
        a = metrics_for_one_mask(ref, ephem, float(site["lat"]), float(site["lon"]))
        b = metrics_for_one_mask(mask, ephem, float(site["lat"]), float(site["lon"]))
        print(
            f"{site['id']}: mask diff mean {diff.mean():+.3f} max |{np.abs(diff).max():.3f}| deg; "
            f"two-year light {a[0]:.1f} -> {b[0]:.1f}%, Earth {a[1]:.1f} -> {b[1]:.1f}%"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
