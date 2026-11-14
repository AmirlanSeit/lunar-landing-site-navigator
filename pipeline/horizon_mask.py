#!/usr/bin/env python3
"""Build one-degree terrain horizon masks from the LOLA south-polar DEM."""

from __future__ import annotations

import argparse
import json
import math
import sys
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SITES_PATH = ROOT / "web" / "public" / "data" / "sites.json"
DEFAULT_DEM = ROOT / "pipeline" / "dem" / "ldem_75s_120m.jp2"
DEFAULT_OUTPUT = ROOT / "web" / "public" / "data" / "horizon"

DEM_URL = (
    "https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/"
    "lrolol_1xxx/data/lola_gdr/polar/jp2/ldem_75s_120m.jp2"
)
DEM_PRODUCT = "LOLA GDR LDEM_75S_120M (PDS LRO-L-LOLA-4-GDR-V1.0)"
DEM_BYTES = 33_948_010
DEM_SIZE = 7_624
PIXEL_M = 120.0
LUNAR_RADIUS_M = 1_737_400.0
OBSERVER_HEIGHT_M = 2.0
START_RANGE_M = 200.0
MAX_RANGE_M = 150_000.0
AZIMUTH_COUNT = 360


def ensure_dem(path: Path) -> None:
    """Download the small PDS JP2 product when it is not already present."""
    if path.exists() and path.stat().st_size == DEM_BYTES:
        return

    path.parent.mkdir(parents=True, exist_ok=True)
    partial_path = path.with_suffix(path.suffix + ".part")
    request = urllib.request.Request(
        DEM_URL, headers={"User-Agent": "lunar-landing-site-navigator/1.0"}
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            with partial_path.open("wb") as output:
                while chunk := response.read(1024 * 1024):
                    output.write(chunk)
        if partial_path.stat().st_size != DEM_BYTES:
            raise RuntimeError(
                f"Unexpected DEM size: {partial_path.stat().st_size:,} bytes; "
                f"expected {DEM_BYTES:,} bytes from {DEM_URL}"
            )
        partial_path.replace(path)
    except Exception:
        partial_path.unlink(missing_ok=True)
        raise


def load_dem(path: Path) -> np.ndarray:
    """Decode the PDS JP2 codes to signed LOLA heights above the mean radius."""
    try:
        with Image.open(path) as image:
            image.load()
            dem_codes = np.asarray(image).astype(np.float32)
    except Exception as exc:
        raise RuntimeError(
            f"Cannot read {path}. Install Pillow with JPEG 2000 support "
            "(OpenJPEG) and numpy."
        ) from exc

    if dem_codes.shape != (DEM_SIZE, DEM_SIZE):
        raise RuntimeError(
            f"Unexpected DEM dimensions {dem_codes.shape}; "
            f"expected {(DEM_SIZE, DEM_SIZE)} for LDEM_75S_120M."
        )

    # PDS labels the decompressed image as signed 16-bit with a 0.5 m scale.
    # JPEG 2000 exposes those signed samples shifted into the unsigned range.
    dem_codes -= np.float32(32768.0)
    dem_codes *= np.float32(0.5)
    return dem_codes


def stereographic_pixel(lat_rad: np.ndarray, lon_rad: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Map south-polar stereographic coordinates to (row, column) pixel centers."""
    rho_m = 2.0 * LUNAR_RADIUS_M * np.tan((math.pi / 2.0 + lat_rad) / 2.0)
    x_m = rho_m * np.sin(lon_rad)
    y_m = rho_m * np.cos(lon_rad)
    center = (DEM_SIZE - 1) / 2.0
    column = center + x_m / PIXEL_M
    row = center - y_m / PIXEL_M
    return row, column


def sample_bilinear(dem: np.ndarray, row: np.ndarray, column: np.ndarray) -> np.ndarray:
    """Bilinearly sample elevation, clamping only to the outer pixel centers."""
    row = np.clip(row, 0.0, DEM_SIZE - 1.0)
    column = np.clip(column, 0.0, DEM_SIZE - 1.0)
    row0 = np.floor(row).astype(np.int32)
    col0 = np.floor(column).astype(np.int32)
    row1 = np.minimum(row0 + 1, DEM_SIZE - 1)
    col1 = np.minimum(col0 + 1, DEM_SIZE - 1)
    fr = row - row0
    fc = column - col0

    return (
        dem[row0, col0] * (1.0 - fr) * (1.0 - fc)
        + dem[row0, col1] * (1.0 - fr) * fc
        + dem[row1, col0] * fr * (1.0 - fc)
        + dem[row1, col1] * fr * fc
    )


def destination_points(
    latitude_rad: float,
    longitude_rad: float,
    azimuth_rad: np.ndarray,
    angular_distance_rad: np.ndarray,
) -> tuple[np.ndarray, np.ndarray]:
    """Return geodesic endpoints for clockwise-from-local-north bearings."""
    sin_lat = math.sin(latitude_rad)
    cos_lat = math.cos(latitude_rad)
    sin_distance = np.sin(angular_distance_rad)[None, :]
    cos_distance = np.cos(angular_distance_rad)[None, :]

    sin_lat2 = (
        sin_lat * cos_distance
        + cos_lat * sin_distance * np.cos(azimuth_rad)
    )
    lat2 = np.arcsin(np.clip(sin_lat2, -1.0, 1.0))
    lon2 = longitude_rad + np.arctan2(
        np.sin(azimuth_rad) * sin_distance * cos_lat,
        cos_distance - sin_lat * sin_lat2,
    )
    return lat2, lon2


def horizon_for_site(site: dict, dem: np.ndarray) -> tuple[list[float], float]:
    """Compute 360 horizon elevations and the bilinear terrain height at site."""
    latitude_rad = math.radians(float(site["lat"]))
    longitude_rad = math.radians(float(site["lon"]))
    site_row, site_column = stereographic_pixel(
        np.asarray(latitude_rad), np.asarray(longitude_rad)
    )
    site_elevation_m = float(sample_bilinear(dem, site_row, site_column))
    observer_elevation_m = site_elevation_m + OBSERVER_HEIGHT_M

    distances_m = np.concatenate(
        (np.arange(START_RANGE_M, MAX_RANGE_M, PIXEL_M), [MAX_RANGE_M])
    )
    azimuths_rad = np.deg2rad(np.arange(AZIMUTH_COUNT, dtype=np.float64))[:, None]
    lat2, lon2 = destination_points(
        latitude_rad,
        longitude_rad,
        azimuths_rad,
        distances_m / LUNAR_RADIUS_M,
    )
    rows, columns = stereographic_pixel(lat2, lon2)
    target_elevation_m = sample_bilinear(dem, rows, columns)

    curvature_drop_m = distances_m**2 / (2.0 * LUNAR_RADIUS_M)
    angles_deg = np.degrees(
        np.arctan2(
            target_elevation_m
            - observer_elevation_m
            - curvature_drop_m[None, :],
            distances_m[None, :],
        )
    )
    mask = np.max(angles_deg, axis=1)
    return [round(float(value), 2) for value in mask], site_elevation_m


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sites", type=Path, default=SITES_PATH, help="sites.json path")
    parser.add_argument("--dem", type=Path, default=DEFAULT_DEM, help="LOLA JP2 path")
    parser.add_argument(
        "--output-dir", type=Path, default=DEFAULT_OUTPUT, help="horizon JSON output directory"
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        ensure_dem(args.dem)
        dem = load_dem(args.dem)
        sites = json.loads(args.sites.read_text(encoding="utf-8"))
        polar_sites = [site for site in sites if float(site["lat"]) < -75.0]
        args.output_dir.mkdir(parents=True, exist_ok=True)

        for site in polar_sites:
            mask, site_elevation_m = horizon_for_site(site, dem)
            result = {
                "site_id": site["id"],
                "az_step_deg": 1,
                "mask_el_deg": mask,
                "dem": DEM_PRODUCT,
                "max_range_km": 150,
            }
            output_path = args.output_dir / f"{site['id']}.json"
            output_path.write_text(
                json.dumps(result, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
            print(
                f"{site['id']}: terrain {site_elevation_m:.1f} m, "
                f"mask {min(mask):.2f}..{max(mask):.2f} deg -> {output_path}"
            )
    except (OSError, ValueError, KeyError, RuntimeError) as exc:
        print(f"horizon_mask: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
