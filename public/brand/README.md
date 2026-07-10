# Loxa brand assets

These are the production SVG assets for the approved C3 Longtail Sentinel mark.

The silhouette is fixed. Color and packaging may vary only as documented here.

## Inventory

| File | Purpose | ViewBox | Color |
| --- | --- | --- | --- |
| loxa-mark-master.svg | Full-artboard geometry master and audit source | 0 0 200 160 | currentColor |
| loxa-mark.svg | Default tight production asset for inline use | 25 15 162 139 | currentColor |
| loxa-mark-ink.svg | External image on Snow or Glacier | 25 15 162 139 | #101410 |
| loxa-mark-snow.svg | External image on Ink | 25 15 162 139 | #F4F6F0 |

The tight viewBox improves the mark footprint at small sizes. It does not transform or alter the geometry.

## Geometry integrity

The geometry is the approved source of truth:

- Outer path SHA-256: 7f6158647e6cee8fec59bfb9aa3b580739f5033176e1d2e30ef71c9593363af2
- Cutouts path SHA-256: 2f7f1e5e074377f04d93d715b482e63542b26a62b33664d26d35ff0ef2827b5a
- Outer plus one ASCII space plus cutouts SHA-256: 4867a34495cc8d2900a5743be0c2bf3f171d60c56d173637219135853891df90
- Normalized compound token SHA-256: ab7418938ba70d0eb7f2ad0a7a815d3418d2b1320155f1cebb24c0137f86fd92

The compound path uses fill-rule evenodd. This turns the three approved cutouts into true transparent holes while preserving every coordinate.

Every variant MUST contain the same path data. Variants may differ only in viewBox and fill.

Do not add:

- transforms
- strokes
- masks or clip paths
- filters or shadows
- background shapes
- frames, arcs, brackets, or halos
- new or simplified geometry

## Choosing an asset

Use loxa-mark.svg when the SVG is inline and its color is controlled by CSS.

Import the committed file as inline SVG through the chosen build pipeline, then set the CSS color property on its wrapper. The file inherits that color through currentColor. It is not a sprite. Do not reference it with use, and do not copy the path into a component by hand.

Use a fixed file for a normal external image:

    <img src="/brand/loxa-mark-ink.svg" alt="Loxa">

When visible “Loxa” text sits beside the mark, treat the image as decorative:

    <img src="/brand/loxa-mark-ink.svg" alt="">
    <span>Loxa</span>

Do not rely on an SVG title for an external img accessible name. Put the name in alt or on the containing brand link.

## Color

- Ink #101410 on Snow #F4F6F0 is the primary light treatment.
- Snow #F4F6F0 on Ink #101410 is the primary dark treatment.
- Signal Lichen #B7ED62 may color the current-color asset on Ink.
- Mineral #69716C and Glacier #C5DDD4 are supporting palette colors, not default mark colors.

Signal Lichen on Snow is too low contrast for a meaningful mark. Never place the mark over a detailed field without choosing a local Ink or Snow treatment that preserves contrast.

## Lockup

Compose the lockup in HTML:

- 42px by 34px mark
- 12px gap
- visible text “Loxa”
- Instrument Sans 500
- -0.04em letter spacing
- shared foreground color

Do not bake font text into a new SVG. Do not create an outlined wordmark without owner approval.

## Clear space and size

- Minimum clear space: 25% of rendered mark width on all sides
- Preferred minimum: 24 CSS pixels wide
- Conditional micro minimum: 16 CSS pixels on a high-contrast field after 1x review
- Never crop the tail or ears
- Never place the clear space inside a permanent badge

At 16px and 1x, the narrowest cutout is renderer-sensitive. If any cutout closes or merges, use 24px. Never solve a micro-size failure by editing the path.

## Accessibility

- Standalone meaningful mark: accessible name “Loxa” on the wrapper or img alt
- Mark beside visible “Loxa” text: decorative, with empty alt or aria-hidden
- Decorative background use: aria-hidden and unfocusable
- Do not announce both the mark and adjacent word
- Do not use the mark as the only label for an unfamiliar action

## Validation

Before accepting a brand asset change:

1. Validate the SVG as XML.
2. Verify the geometry hashes above.
3. Confirm one outer path and three closed cutouts.
4. Confirm there is no transform, stroke, mask, clip path, filter, or background.
5. Render at 16, 24, and 32 CSS pixels at 1x, 2x, and 3x.
6. Inspect on Snow, Ink, checkerboard, and a non-flat field.
7. Confirm each cutout reveals the actual background.
8. Confirm the silhouette is not clipped.

The repository license does not grant permission to use the Loxa identity to imply endorsement.
