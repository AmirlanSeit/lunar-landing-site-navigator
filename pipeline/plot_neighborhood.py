#!/usr/bin/env python3
"""Render a compact light-percentage heatmap from neighborhood JSON."""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA = ROOT / "web" / "public" / "data" / "neighborhood"
DEFAULT_OUTPUT = ROOT / "docs" / "images"
SITE_NAMES = {
    "artemis_haworth": "Haworth",
    "artemis_nobile_rim_1": "Nobile Rim 1",
    "artemis_nobile_rim_2": "Nobile Rim 2",
    "viper_mons_mouton_target": "Mons Mouton - VIPER target",
    "im_1_odysseus": "IM-1 Odysseus",
    "im_2_athena": "IM-2 Athena",
}
ATTRIBUTION = "Computed from LRO LOLA + JPL Horizons; code written with SI assistance"


def font(size: int = 14) -> ImageFont.ImageFont:
    for path in (
        Path("C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/Arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ):
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def heat_color(value: float) -> tuple[int, int, int]:
    """Blue -> cyan -> yellow -> red map for values on a fixed 0-100 scale."""
    stops = [(0, (33, 52, 112)), (0.33, (37, 151, 164)), (0.66, (245, 207, 74)), (1, (190, 48, 46))]
    x = max(0.0, min(1.0, value / 100.0))
    for i in range(len(stops) - 1):
        p0, c0 = stops[i]
        p1, c1 = stops[i + 1]
        if x <= p1:
            t = (x - p0) / (p1 - p0)
            return tuple(round(a + (b - a) * t) for a, b in zip(c0, c1))
    return stops[-1][1]


def inverse_local_xy(center: dict, point: dict) -> tuple[float, float]:
    lat0 = math.radians(center["lat"])
    lat = math.radians(point["lat"])
    dlon = math.radians(point["lon"] - center["lon"])
    sin_lat0, cos_lat0 = math.sin(lat0), math.cos(lat0)
    sin_lat, cos_lat = math.sin(lat), math.cos(lat)
    y = math.sin(dlon) * cos_lat
    x = cos_lat0 * sin_lat - sin_lat0 * cos_lat * math.cos(dlon)
    bearing = math.atan2(y, x)
    hav = math.sin((lat - lat0) / 2.0) ** 2 + cos_lat0 * cos_lat * math.sin(dlon / 2.0) ** 2
    distance = 2.0 * 1_737_400.0 * math.asin(math.sqrt(max(0.0, min(1.0, hav))))
    return distance * math.sin(bearing), distance * math.cos(bearing)


def render(data: dict, output: Path) -> None:
    width, height = 900, 770
    image = Image.new("RGB", (width, height), (247, 249, 252))
    draw = ImageDraw.Draw(image)
    title_font = font(22)
    label_font = font(13)
    small_font = font(10)
    name = SITE_NAMES.get(data["site_id"], data["site_id"].replace("_", " "))
    draw.text((30, 20), f"{name}: local sunlight", fill=(25, 36, 54), font=title_font)
    draw.text(
        (30, 53),
        f"{data['radius_km']:.0f} km radius  |  {data['spacing_m']} m grid  |  19,008 hourly samples",
        fill=(72, 84, 102),
        font=label_font,
    )

    map_left, map_top, map_size = 82, 94, 650
    center_x = map_left + map_size / 2
    center_y = map_top + map_size / 2
    radius_m = data["radius_km"] * 1000
    scale = (map_size * 0.46) / radius_m
    cell_half = max(2, round(data["spacing_m"] * scale * 0.53))
    for point in data["points"]:
        east, north = inverse_local_xy(data["center"], point)
        x = round(center_x + east * scale)
        y = round(center_y - north * scale)
        color = heat_color(float(point["light_pct"]))
        draw.rectangle((x - cell_half, y - cell_half, x + cell_half, y + cell_half), fill=color)

    radius_px = round(radius_m * scale)
    draw.ellipse(
        (center_x - radius_px, center_y - radius_px, center_x + radius_px, center_y + radius_px),
        outline=(44, 55, 72),
        width=2,
    )
    draw.line((center_x - 9, center_y, center_x + 9, center_y), fill=(20, 27, 39), width=2)
    draw.line((center_x, center_y - 9, center_x, center_y + 9), fill=(20, 27, 39), width=2)
    draw.ellipse((center_x - 6, center_y - 6, center_x + 6, center_y + 6), fill="white", outline=(20, 27, 39), width=2)

    best_east, best_north = inverse_local_xy(data["center"], data["best"])
    best_x = center_x + best_east * scale
    best_y = center_y - best_north * scale
    outer = []
    inner = []
    for i in range(10):
        angle = -math.pi / 2 + i * math.pi / 5
        radius = 14 if i % 2 == 0 else 6
        outer.append((best_x + radius * math.cos(angle), best_y + radius * math.sin(angle)))
    draw.polygon(outer, fill=(190, 35, 45), outline="white")

    draw.text((30, 755), ATTRIBUTION, fill=(75, 83, 96), font=small_font)
    draw.text((760, 116), "Mean sunlight", fill=(38, 48, 66), font=label_font)
    draw.text((760, 136), "(%)", fill=(38, 48, 66), font=label_font)
    bar_x, bar_y, bar_w, bar_h = 778, 172, 28, 450
    for y in range(bar_h):
        value = 100.0 * (1.0 - y / max(1, bar_h - 1))
        draw.line((bar_x, bar_y + y, bar_x + bar_w, bar_y + y), fill=heat_color(value))
    draw.rectangle((bar_x, bar_y, bar_x + bar_w, bar_y + bar_h), outline=(44, 55, 72), width=1)
    for value in (100, 75, 50, 25, 0):
        y = bar_y + round((100 - value) * (bar_h - 1) / 100)
        draw.line((bar_x + bar_w + 2, y, bar_x + bar_w + 7, y), fill=(44, 55, 72), width=1)
        draw.text((bar_x + bar_w + 11, y - 6), str(value), fill=(44, 55, 72), font=label_font)

    draw.ellipse((760, 660, 773, 673), fill="white", outline=(20, 27, 39), width=2)
    draw.text((780, 658), "Center", fill=(38, 48, 66), font=label_font)
    legend_star = []
    for i in range(10):
        angle = -math.pi / 2 + i * math.pi / 5
        radius = 6 if i % 2 == 0 else 2.5
        legend_star.append((766 + radius * math.cos(angle), 690 + radius * math.sin(angle)))
    draw.polygon(legend_star, fill=(190, 35, 45), outline="white")
    draw.text((780, 682), "Best point", fill=(38, 48, 66), font=label_font)
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, format="PNG", optimize=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site-id", required=True, choices=sorted(SITE_NAMES))
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    args.output = args.output_dir / f"neighborhood-{args.site_id}.png"
    return args


def main() -> int:
    args = parse_args()
    data = json.loads((args.data_dir / f"{args.site_id}.json").read_text(encoding="utf-8"))
    render(data, args.output)
    print(f"Wrote {args.output} ({args.output.stat().st_size:,} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
