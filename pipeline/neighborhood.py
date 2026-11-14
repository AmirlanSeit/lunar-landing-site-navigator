#!/usr/bin/env python3
"""Compare lighting and Earth visibility across a LOLA terrain neighborhood."""

from __future__ import annotations

import argparse
import json
import math
import sys
import time
from pathlib import Path

import numpy as np

try:
    from .horizon_mask import (
        DEFAULT_DEM,
        DEM_PRODUCT,
        LUNAR_RADIUS_M,
        PIXEL_M,
        horizon_for_site,
        load_dem,
        sample_bilinear,
        stereographic_pixel,
    )
except ImportError:  # Direct `python pipeline/neighborhood.py` invocation.
    from horizon_mask import (
        DEFAULT_DEM,
        DEM_PRODUCT,
        LUNAR_RADIUS_M,
        PIXEL_M,
        horizon_for_site,
        load_dem,
        sample_bilinear,
        stereographic_pixel,
    )


ROOT = Path(__file__).resolve().parents[1]
SITES_PATH = ROOT / "web" / "public" / "data" / "sites.json"
EPHEM_DIR = ROOT / "web" / "public" / "data" / "ephem"
HORIZON_DIR = ROOT / "web" / "public" / "data" / "horizon"
DEFAULT_OUTPUT = ROOT / "web" / "public" / "data" / "neighborhood"
SUN_RADIUS_DEG = 0.265
EARTH_RADIUS_DEG = 0.95
BEARINGS_RAD = np.deg2rad(np.arange(360, dtype=np.float64))[None, :, None]


def destination_many(
    latitude_rad: float, longitude_rad: float, bearing_rad: np.ndarray, distance_m: np.ndarray
) -> tuple[np.ndarray, np.ndarray]:
    """One-to-one spherical direct geodesics for candidate grid coordinates."""
    angular = distance_m / LUNAR_RADIUS_M
    sin_lat = math.sin(latitude_rad)
    cos_lat = math.cos(latitude_rad)
    sin_lat2 = sin_lat * np.cos(angular) + cos_lat * np.sin(angular) * np.cos(bearing_rad)
    lat2 = np.arcsin(np.clip(sin_lat2, -1.0, 1.0))
    lon2 = longitude_rad + np.arctan2(
        np.sin(bearing_rad) * np.sin(angular) * cos_lat,
        np.cos(angular) - sin_lat * sin_lat2,
    )
    return lat2, lon2


def candidate_grid(site: dict, radius_m: float, spacing_m: float) -> dict[str, np.ndarray]:
    """Create an east/north square grid, clipped by geodesic distance to radius."""
    count = int(math.floor(radius_m / spacing_m))
    east_axis = np.arange(-count, count + 1, dtype=np.float64) * spacing_m
    north_axis = east_axis.copy()
    east, north = np.meshgrid(east_axis, north_axis)
    east = east.ravel()
    north = north.ravel()
    distance = np.hypot(east, north)
    inside = distance <= radius_m + 1e-7
    east, north, distance = east[inside], north[inside], distance[inside]
    bearing = np.arctan2(east, north)
    lat, lon = destination_many(
        math.radians(float(site["lat"])), math.radians(float(site["lon"])), bearing, distance
    )
    return {
        "east": east,
        "north": north,
        "distance": distance,
        "bearing": bearing,
        "lat": np.rad2deg(lat),
        "lon": np.rad2deg(lon),
    }


def sample_heights_and_slope(
    dem: np.ndarray, lat_deg: np.ndarray, lon_deg: np.ndarray
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Sample DEM and estimate slope from centered 120 m terrain differences."""
    rows, cols = stereographic_pixel(np.deg2rad(lat_deg), np.deg2rad(lon_deg))
    height = sample_bilinear(dem, rows, cols)
    east_gradient = (
        sample_bilinear(dem, rows, cols + 1.0)
        - sample_bilinear(dem, rows, cols - 1.0)
    ) / (2.0 * PIXEL_M)
    north_gradient = (
        sample_bilinear(dem, rows - 1.0, cols)
        - sample_bilinear(dem, rows + 1.0, cols)
    ) / (2.0 * PIXEL_M)
    slope = np.degrees(np.arctan(np.hypot(east_gradient, north_gradient)))
    return height, slope, rows, cols


def ray_distances_m() -> np.ndarray:
    """Use 120 m sampling nearby, then progressively coarser far-field samples."""
    near = np.arange(200.0, 5_000.0 + 1.0, 120.0)
    middle = np.arange(5_000.0 + 240.0, 25_000.0, 240.0)
    far = np.arange(25_000.0 + 480.0, 150_000.0, 480.0)
    distances = np.concatenate((near, middle, far, [150_000.0]))
    if distances[0] != 200.0 or distances[-1] != 150_000.0:
        raise AssertionError("Ray range endpoints are not exact")
    return distances


def horizon_for_candidates(
    dem: np.ndarray,
    lat_rad: np.ndarray,
    lon_rad: np.ndarray,
    observer_height_m: np.ndarray,
    distances_m: np.ndarray,
    chunk_size: int = 6,
) -> np.ndarray:
    """Compute 360 true-local-bearing masks per candidate in bounded numpy batches."""
    n = len(lat_rad)
    masks = np.empty((n, 360), dtype=np.float32)
    angular = distances_m / LUNAR_RADIUS_M
    sin_distance = np.sin(angular)[None, None, :]
    cos_distance = np.cos(angular)[None, None, :]
    sin_bearing = np.sin(BEARINGS_RAD)
    cos_bearing = np.cos(BEARINGS_RAD)
    curvature = distances_m**2 / (2.0 * LUNAR_RADIUS_M)
    for start in range(0, n, chunk_size):
        end = min(start + chunk_size, n)
        lat0 = lat_rad[start:end, None, None]
        lon0 = lon_rad[start:end, None, None]
        sin_lat = np.sin(lat0)
        cos_lat = np.cos(lat0)
        sin_lat2 = sin_lat * cos_distance + cos_lat * sin_distance * cos_bearing
        lat2 = np.arcsin(np.clip(sin_lat2, -1.0, 1.0))
        lon2 = lon0 + np.arctan2(
            sin_bearing * sin_distance * cos_lat,
            cos_distance - sin_lat * sin_lat2,
        )
        rows, cols = stereographic_pixel(lat2, lon2)
        terrain = sample_bilinear(dem, rows, cols)
        angles = np.degrees(
            np.arctan2(
                terrain - observer_height_m[start:end, None, None] - curvature[None, None, :],
                distances_m[None, None, :],
            )
        )
        masks[start:end] = np.max(angles, axis=2).astype(np.float32)
    return masks


def enu_basis(lat_rad: np.ndarray, lon_rad: np.ndarray) -> np.ndarray:
    """Local east, north and up unit vectors (rows) in the Moon-fixed frame, shape (..., 3, 3)."""
    sin_lat, cos_lat = np.sin(lat_rad), np.cos(lat_rad)
    sin_lon, cos_lon = np.sin(lon_rad), np.cos(lon_rad)
    zero = np.zeros_like(sin_lat)
    east = np.stack([-sin_lon, cos_lon, zero], axis=-1)
    north = np.stack([-sin_lat * cos_lon, -sin_lat * sin_lon, cos_lat], axis=-1)
    up = np.stack([cos_lat * cos_lon, cos_lat * sin_lon, sin_lat], axis=-1)
    return np.stack([east, north, up], axis=-2)


def directions_at(
    az_deg: np.ndarray,
    el_deg: np.ndarray,
    center_lat_deg: float,
    center_lon_deg: float,
    lat_deg: np.ndarray,
    lon_deg: np.ndarray,
) -> tuple[np.ndarray, np.ndarray]:
    """Re-express directions observed at the center in each candidate's own local frame.

    The Sun and Earth are effectively at infinity for a 5 km baseline (Earth's parallax is
    below 0.001 degrees), so only the local axes change. Near the pole local north turns by
    about the longitude difference times sin(latitude), roughly 2-3 degrees across 5 km,
    which matters against a 1-degree horizon mask. Returns (azimuth, elevation) in degrees
    with shape (candidates, samples).
    """
    az = np.deg2rad(az_deg)
    el = np.deg2rad(el_deg)
    enu = np.stack([np.cos(el) * np.sin(az), np.cos(el) * np.cos(az), np.sin(el)], axis=-1)
    center = enu_basis(np.deg2rad(center_lat_deg), np.deg2rad(center_lon_deg))
    local = enu_basis(np.deg2rad(lat_deg), np.deg2rad(lon_deg))
    # center ENU -> Moon-fixed (center^T) -> candidate ENU (local)
    v = np.einsum("kij,lj,tl->kti", local, center, enu)
    local_az = np.rad2deg(np.arctan2(v[..., 0], v[..., 1])) % 360.0
    local_el = np.rad2deg(np.arcsin(np.clip(v[..., 2], -1.0, 1.0)))
    return local_az, local_el


def mask_at(masks: np.ndarray, az_deg: np.ndarray) -> np.ndarray:
    """Linearly interpolate each row's 1-degree mask at that row's azimuths."""
    i = np.floor(az_deg).astype(np.int64) % 360
    j = (i + 1) % 360
    f = az_deg - np.floor(az_deg)
    return np.take_along_axis(masks, i, axis=1) * (1.0 - f) + np.take_along_axis(masks, j, axis=1) * f


def metrics_for_masks(
    mask_deg: np.ndarray,
    ephem: dict,
    center_lat_deg: float,
    center_lon_deg: float,
    lat_deg: np.ndarray,
    lon_deg: np.ndarray,
) -> tuple[np.ndarray, ...]:
    """Apply the website's sun-disk, Earth-disc, and consecutive-dark-hour formulas.

    The ephemeris was computed at the center; directions are rotated into each candidate's
    local frame before they are compared with that candidate's mask.
    """
    sun = ephem["sun"]
    earth = ephem["earth"]
    sun_az = np.asarray(sun["az"], dtype=np.float64) % 360.0
    sun_el = np.asarray(sun["el"], dtype=np.float64)
    earth_az = np.asarray(earth["az"], dtype=np.float64) % 360.0
    earth_el = np.asarray(earth["el"], dtype=np.float64)
    if not (len(sun_az) == len(sun_el) == len(earth_az) == len(earth_el)):
        raise ValueError("Ephemeris arrays have different lengths")
    hours_per_step = float(ephem["step_min"]) / 60.0
    steps = len(sun_el)
    indices = np.arange(steps)
    lat_deg = np.asarray(lat_deg, dtype=np.float64)
    lon_deg = np.asarray(lon_deg, dtype=np.float64)

    light_pct = np.empty(len(mask_deg), dtype=np.float64)
    earth_pct = np.empty(len(mask_deg), dtype=np.float64)
    longest_dark_h = np.empty(len(mask_deg), dtype=np.float64)
    for start in range(0, len(mask_deg), 32):
        end = min(start + 32, len(mask_deg))
        masks = mask_deg[start:end].astype(np.float64)
        lat_k, lon_k = lat_deg[start:end], lon_deg[start:end]
        sun_az_k, sun_el_k = directions_at(sun_az, sun_el, center_lat_deg, center_lon_deg, lat_k, lon_k)
        earth_az_k, earth_el_k = directions_at(earth_az, earth_el, center_lat_deg, center_lon_deg, lat_k, lon_k)
        sun_horizon = mask_at(masks, sun_az_k)
        sun_fraction = np.clip(
            (sun_el_k - sun_horizon + SUN_RADIUS_DEG) / (2.0 * SUN_RADIUS_DEG),
            0.0,
            1.0,
        )
        earth_horizon = mask_at(masks, earth_az_k)
        earth_visible = earth_el_k > earth_horizon - EARTH_RADIUS_DEG
        dark = sun_fraction < 0.5
        last_non_dark = np.maximum.accumulate(np.where(~dark, indices[None, :], -1), axis=1)
        run_lengths = indices[None, :] - last_non_dark
        light_pct[start:end] = np.mean(sun_fraction, axis=1) * 100.0
        earth_pct[start:end] = np.mean(earth_visible, axis=1) * 100.0
        longest_dark_h[start:end] = np.max(run_lengths, axis=1) * hours_per_step
    return light_pct, earth_pct, longest_dark_h


def metrics_for_one_mask(mask: list[float], ephem: dict, lat_deg: float, lon_deg: float) -> tuple[float, float, float]:
    """Metrics for a mask at the ephemeris site itself (no rotation)."""
    result = metrics_for_masks(
        np.asarray(mask, dtype=np.float32)[None, :], ephem, lat_deg, lon_deg, np.array([lat_deg]), np.array([lon_deg])
    )
    return tuple(float(values[0]) for values in result)


def select_best(
    points: dict[str, np.ndarray],
    light: np.ndarray,
    earth: np.ndarray,
    slope: np.ndarray,
) -> tuple[int, bool]:
    safe = np.flatnonzero(slope <= 8.0)
    if len(safe) == 0:
        raise RuntimeError("No candidate satisfies slope_deg <= 8; cannot select a best point")
    with_link = safe[earth[safe] >= 50.0]
    no_earth = len(with_link) == 0
    pool = safe if no_earth else with_link
    best_light = np.max(light[pool])
    tied = pool[np.isclose(light[pool], best_light, rtol=0.0, atol=1e-10)]
    best = tied[np.argmin(points["distance"][tied])]
    return int(best), no_earth


def build_site(
    site: dict,
    dem: np.ndarray,
    ephem: dict,
    radius_km: float,
    spacing_m: float,
    output_dir: Path,
) -> dict:
    started = time.perf_counter()
    grid = candidate_grid(site, radius_km * 1000.0, spacing_m)
    lat = grid["lat"]
    lon = grid["lon"]
    heights, slopes, rows, cols = sample_heights_and_slope(dem, lat, lon)
    observers = heights + 2.0
    distances = ray_distances_m()
    masks = horizon_for_candidates(
        dem, np.deg2rad(lat), np.deg2rad(lon), observers, distances
    )

    # Replace the center grid mask with the exact 120 m full-ray implementation used by
    # horizon_mask.py. This also makes the center metric a direct check against the site file.
    center_i = int(np.argmin(grid["distance"]))
    exact_center_mask, center_height = horizon_for_site(site, dem)
    masks[center_i] = np.asarray(exact_center_mask, dtype=np.float32)
    if abs(center_height - heights[center_i]) > 0.01:
        raise RuntimeError(f"Center DEM sampling mismatch at {site['id']}")

    site_lat, site_lon = float(site["lat"]), float(site["lon"])
    light, earth, longest = metrics_for_masks(masks, ephem, site_lat, site_lon, lat, lon)
    site_id = site["id"]
    existing_horizon_path = HORIZON_DIR / f"{site_id}.json"
    existing_mask = json.loads(existing_horizon_path.read_text(encoding="utf-8"))["mask_el_deg"]
    baseline = metrics_for_one_mask(existing_mask, ephem, site_lat, site_lon)
    center = {
        "lat": round(float(lat[center_i]), 5),
        "lon": round(float(lon[center_i]), 5),
        "light_pct": round(float(light[center_i]), 1),
        "earth_pct": round(float(earth[center_i]), 1),
        "longest_dark_h": round(float(longest[center_i]), 1),
        "slope_deg": round(float(slopes[center_i]), 2),
    }
    best_i, no_earth_link = select_best(grid, light, earth, slopes)
    best = {
        "lat": round(float(lat[best_i]), 5),
        "lon": round(float(lon[best_i]), 5),
        "distance_km": round(float(grid["distance"][best_i] / 1000.0), 2),
        "bearing_deg": round(float(np.rad2deg(grid["bearing"][best_i]) % 360.0), 2),
        "light_pct": round(float(light[best_i]), 1),
        "earth_pct": round(float(earth[best_i]), 1),
        "longest_dark_h": round(float(longest[best_i]), 1),
        "slope_deg": round(float(slopes[best_i]), 2),
        "no_earth_link_nearby": no_earth_link,
    }
    output = {
        "site_id": site_id,
        "radius_km": round(radius_km, 2),
        "spacing_m": int(spacing_m) if spacing_m.is_integer() else spacing_m,
        "observer_height_m": 2,
        "dem": DEM_PRODUCT,
        "notes": (
            "Sun and Earth directions come from the center-site JPL Horizons hourly ephemeris "
            "and are rotated into each candidate's local east/north/up frame (near the pole "
            "local north turns by up to about 3 degrees across 5 km); Sun and Earth parallax "
            "across the neighborhood is below 0.001 degrees and is neglected."
        ),
        "center": center,
        "best": best,
        "points": [
            {
                "lat": round(float(lat[i]), 5),
                "lon": round(float(lon[i]), 5),
                "light_pct": round(float(light[i]), 1),
                "earth_pct": round(float(earth[i]), 1),
                "slope_deg": round(float(slopes[i]), 2),
            }
            for i in range(len(lat))
        ],
    }
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / f"{site_id}.json").write_text(
        json.dumps(output, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    elapsed = time.perf_counter() - started
    print(
        f"{site_id}: {len(lat)} points; center {center['light_pct']:.1f}/{center['earth_pct']:.1f}% "
        f"(existing mask {baseline[0]:.2f}/{baseline[1]:.2f}%, deltas "
        f"{light[center_i] - baseline[0]:+.2f}/{earth[center_i] - baseline[1]:+.2f} pp); "
        f"best {best['light_pct']:.1f}/{best['earth_pct']:.1f}% at {best['distance_km']:.2f} km; "
        f"{elapsed:.1f}s"
    )
    return output


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--radius-km", type=float, default=5.0)
    parser.add_argument("--spacing-m", type=float, default=240.0)
    parser.add_argument("--sites", type=Path, default=SITES_PATH)
    parser.add_argument("--dem", type=Path, default=DEFAULT_DEM)
    parser.add_argument("--ephem-dir", type=Path, default=EPHEM_DIR)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--site-id", help="Optional single-site benchmark/rebuild")
    args = parser.parse_args()
    if args.radius_km <= 0 or args.spacing_m <= 0:
        parser.error("--radius-km and --spacing-m must be positive")
    return args


def main() -> int:
    args = parse_args()
    try:
        if not args.dem.exists():
            raise FileNotFoundError(f"LOLA DEM is missing: {args.dem}")
        dem = load_dem(args.dem)
        sites = [site for site in json.loads(args.sites.read_text(encoding="utf-8")) if float(site["lat"]) < -75.0]
        if args.site_id:
            sites = [site for site in sites if site["id"] == args.site_id]
            if not sites:
                raise ValueError(f"No polar site with id {args.site_id!r}")
        elapsed = time.perf_counter()
        for site in sites:
            ephem = json.loads((args.ephem_dir / f"{site['id']}.json").read_text(encoding="utf-8"))
            if ephem.get("site_id") != site["id"]:
                raise ValueError(f"Ephemeris site id mismatch for {site['id']}")
            build_site(site, dem, ephem, args.radius_km, args.spacing_m, args.output_dir)
        print(f"Total elapsed: {time.perf_counter() - elapsed:.1f}s for {len(sites)} site(s)")
    except (OSError, ValueError, KeyError, RuntimeError) as exc:
        print(f"neighborhood: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
