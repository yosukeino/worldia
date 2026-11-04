import math
from PIL import Image, ImageDraw

def render_worldia_icon(size=512):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    scale = size / 512.0

    # 1. Background Rounded Rectangle with subtle gradient
    # We will draw radial/linear shaded rounded rect
    corner_radius = int(112 * scale)
    base_box = [0, 0, size, size]
    
    # Create mask for rounded rect
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle(base_box, radius=corner_radius, fill=255)

    # Create gradient background
    bg = Image.new("RGBA", (size, size))
    bg_draw = ImageDraw.Draw(bg)
    for y in range(size):
        ratio = y / size
        # #0a1224 (10, 18, 36) -> #0e2246 (14, 34, 70) -> #070c18 (7, 12, 24)
        if ratio < 0.6:
            r = int(10 + (14 - 10) * (ratio / 0.6))
            g = int(18 + (34 - 18) * (ratio / 0.6))
            b = int(36 + (70 - 36) * (ratio / 0.6))
        else:
            sub = (ratio - 0.6) / 0.4
            r = int(14 + (7 - 14) * sub)
            g = int(34 + (12 - 34) * sub)
            b = int(70 + (24 - 70) * sub)
        bg_draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
    
    img.paste(bg, (0, 0), mask)

    # 2. Border
    border_margin = int(16 * scale)
    border_radius = int(96 * scale)
    border_width = max(1, int(6 * scale))
    draw.rounded_rectangle(
        [border_margin, border_margin, size - border_margin, size - border_margin],
        radius=border_radius,
        outline=(56, 189, 248, 90),
        width=border_width
    )

    # 3. Globe Meridians (World) behind temple
    center_x = size / 2.0
    globe_cy = 230 * scale
    globe_r = 135 * scale

    # Outer circle of globe
    globe_box = [center_x - globe_r, globe_cy - globe_r, center_x + globe_r, globe_cy + globe_r]
    draw.ellipse(globe_box, outline=(56, 189, 248, 120), width=max(1, int(6 * scale)))

    # Latitudes (equator-like ellipse)
    lat_ry = 48 * scale
    draw.ellipse([center_x - globe_r, globe_cy - lat_ry, center_x + globe_r, globe_cy + lat_ry],
                 outline=(56, 189, 248, 90), width=max(1, int(4 * scale)))

    # Meridians (vertical ellipse)
    mer_rx = 52 * scale
    draw.ellipse([center_x - mer_rx, globe_cy - globe_r, center_x + mer_rx, globe_cy + globe_r],
                 outline=(56, 189, 248, 90), width=max(1, int(4 * scale)))

    # 4. Open Book at the base (Pedia)
    # Left page & Right page
    book_y1 = 345 * scale
    book_y2 = 385 * scale
    book_left = 80 * scale
    book_right = size - 80 * scale
    
    # Bottom glow
    draw.polygon([
        (center_x, 360 * scale),
        (book_left, 365 * scale),
        (book_left, 395 * scale),
        (center_x, 405 * scale),
        (book_right, 395 * scale),
        (book_right, 365 * scale)
    ], fill=(3, 105, 161, 140))

    # Main Book White Wings
    draw.polygon([
        (center_x, 345 * scale),
        (center_x - 70 * scale, 330 * scale),
        (book_left, 342 * scale),
        (book_left, 375 * scale),
        (center_x - 70 * scale, 368 * scale),
        (center_x, 392 * scale)
    ], fill=(240, 249, 255, 255))

    draw.polygon([
        (center_x, 345 * scale),
        (center_x + 70 * scale, 330 * scale),
        (book_right, 342 * scale),
        (book_right, 375 * scale),
        (center_x + 70 * scale, 368 * scale),
        (center_x, 392 * scale)
    ], fill=(224, 242, 254, 255))

    # Book spine line
    draw.line([(center_x, 345 * scale), (center_x, 392 * scale)],
              fill=(2, 132, 199, 255), width=max(1, int(4 * scale)))

    # 5. Temple (History / Civ)
    gold_top = (254, 240, 138, 255) # light yellow gold
    gold_mid = (251, 191, 36, 255)  # amber gold
    gold_shadow = (217, 119, 6, 255) # deep bronze gold

    # Pediment (Triangle roof)
    roof_peak = (center_x, 92 * scale)
    roof_left = (124 * scale, 172 * scale)
    roof_right = (size - 124 * scale, 172 * scale)
    draw.polygon([roof_peak, roof_left, roof_right], fill=gold_mid)

    # Inner pediment shadow
    inner_peak = (center_x, 120 * scale)
    inner_left = (160 * scale, 165 * scale)
    inner_right = (size - 160 * scale, 165 * scale)
    draw.polygon([inner_peak, inner_left, inner_right], fill=(120, 53, 15, 200))
    # Medallion in center
    draw.ellipse([center_x - 10 * scale, 145 * scale - 10 * scale,
                  center_x + 10 * scale, 145 * scale + 10 * scale], fill=gold_top)

    # Entablature (Beams)
    draw.rounded_rectangle([116 * scale, 172 * scale, size - 116 * scale, 192 * scale],
                          radius=int(4 * scale), fill=gold_mid)
    draw.rounded_rectangle([132 * scale, 190 * scale, size - 132 * scale, 198 * scale],
                          radius=int(2 * scale), fill=gold_shadow)

    # 4 Columns
    col_w = 26 * scale
    col_cap_w = 34 * scale
    col_y1 = 198 * scale
    col_y2 = 312 * scale
    col_xs = [142 * scale, 212 * scale, 274 * scale, 344 * scale]

    for cx in col_xs:
        # column shaft
        draw.rounded_rectangle([cx, col_y1, cx + col_w, col_y2], radius=int(4 * scale), fill=gold_mid)
        # highlight on column
        draw.line([(cx + 4 * scale, col_y1 + 4 * scale), (cx + 4 * scale, col_y2 - 4 * scale)],
                  fill=gold_top, width=max(1, int(3 * scale)))
        # capital (top)
        cap_offset = (col_cap_w - col_w) / 2.0
        draw.rounded_rectangle([cx - cap_offset, col_y1, cx + col_w + cap_offset, col_y1 + 8 * scale],
                              radius=int(2 * scale), fill=gold_top)
        # base (bottom)
        draw.rounded_rectangle([cx - cap_offset, col_y2 - 8 * scale, cx + col_w + cap_offset, col_y2],
                              radius=int(2 * scale), fill=gold_shadow)

    # Stylobate (Base Steps)
    draw.rounded_rectangle([124 * scale, 312 * scale, size - 124 * scale, 326 * scale],
                          radius=int(3 * scale), fill=gold_mid)
    draw.rounded_rectangle([110 * scale, 326 * scale, size - 110 * scale, 342 * scale],
                          radius=int(4 * scale), fill=gold_shadow)

    # 6. Star of Knowledge at peak
    star_cy = 68 * scale
    star_size = 14 * scale
    draw.polygon([
        (center_x, star_cy - star_size),
        (center_x + 3 * scale, star_cy - 3 * scale),
        (center_x + star_size, star_cy),
        (center_x + 3 * scale, star_cy + 3 * scale),
        (center_x, star_cy + star_size),
        (center_x - 3 * scale, star_cy + 3 * scale),
        (center_x - star_size, star_cy),
        (center_x - 3 * scale, star_cy - 3 * scale)
    ], fill=(56, 189, 248, 255))
    draw.ellipse([center_x - 2.5 * scale, star_cy - 2.5 * scale,
                  center_x + 2.5 * scale, star_cy + 2.5 * scale], fill=(255, 255, 255, 255))

    return img

if __name__ == "__main__":
    # Render master at 512x512
    img512 = render_worldia_icon(512)
    img512.save("public/apple-touch-icon.png", "PNG")

    # Generate icons for ICO: 16, 32, 48
    img16 = render_worldia_icon(16)
    img32 = render_worldia_icon(32)
    img48 = render_worldia_icon(48)
    img64 = render_worldia_icon(64)

    # Save multi-size favicon.ico
    img32.save("public/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    img32.save("src/app/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print("Favicon files generated successfully.")
