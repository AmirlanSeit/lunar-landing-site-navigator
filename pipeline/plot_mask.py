#!/usr/bin/env python3
"""Render horizon mask JSON files as polar PNG plots (north at top, east right)."""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "web" / "public" / "data" / "horizon"
DEFAULT_OUTPUT = ROOT / "pipeline" / "plots"
SIZE = 900
CENTER = SIZE // 2
PLOT_RADIUS = 330


def render_mask(path: Path, output_dir: Path) -> Path:
    data = json.loads(path.read_text(encoding="utf-8"))
    mask = data["mask_el_deg"]
    if len(mask) != 360:
        raise ValueError(f"{path} has {len(mask)} mask values; expected 360")

    upper = max(15.0, math.ceil(max(max(0.0, float(value)) for value in mask) / 5) * 5)
    image = Image.new("RGB", (SIZE, SIZE), "#fbfcfe")
    draw = ImageDraw.Draw(image)

    # Draw elevation rings first; the outer ring is labeled with its elevation.
    for elevation in range(5, int(upper) + 1, 5):
        radius = PLOT_RADIUS * elevation / upper
        bounds = (
            CENTER - radius,
            CENTER - radius,
            CENTER + radius,
            CENTER + radius,
        )
        draw.ellipse(bounds, outline="#d8dee8", width=2)
        draw.text((CENTER + 7, CENTER - radius - 18), f"{elevation}°", fill="#667085")

    # Bearing zero is geographic north; bearings increase clockwise.
    points = []
    for azimuth, elevation in enumerate(mask):
        radius = PLOT_RADIUS * max(0.0, float(elevation)) / upper
        angle = math.radians(azimuth - 90)
        points.append((CENTER + radius * math.cos(angle), CENTER + radius * math.sin(angle)))
    draw.polygon(points, fill="#a8d8ee", outline="#15769d", width=3)

    for label, angle_deg in (("N", -90), ("E", 0), ("S", 90), ("W", 180)):
        angle = math.radians(angle_deg)
        x = CENTER + (PLOT_RADIUS + 36) * math.cos(angle)
        y = CENTER + (PLOT_RADIUS + 36) * math.sin(angle)
        draw.text((x - 7, y - 9), label, fill="#344054")

    title = data["site_id"]
    draw.text((28, 24), title, fill="#101828")
    draw.text(
        (28, 50),
        f"Horizon elevation (deg) | max {max(float(value) for value in mask):.2f}°",
        fill="#475467",
    )
    # Negative horizon values fall below the plot center and are represented by zero radius.
    draw.text(
        (28, SIZE - 35),
        "Center = 0°; negative values are clipped to center for display.",
        fill="#667085",
    )

    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{data['site_id']}.png"
    image.save(output_path)
    return output_path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input-dir", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    files = sorted(args.input_dir.glob("*.json"))
    if not files:
        parser.error(f"no horizon JSON files in {args.input_dir}")
    for path in files:
        print(render_mask(path, args.output_dir))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
