# Design — Đọc Truyện

Shared visual language for the public reading experience, account pages, and
admin tools. The public site should feel like a welcoming place to choose a
book and settle in to read, while admin pages stay practical.

## Product intent

Help readers discover a story by title, author, or genre; see its cover and
status at a glance; then move from the shelf into a chapter without friction.
The first screen should feel like a reading destination, not a newspaper index
or a management dashboard.

## Genre

Warm, bookshop-inspired editorial.

## Macrostructure families

- Discovery: **Marquee Hero + Reading Shelf**. A compact masthead and search,
  a welcoming book-led hero, genre controls, then an image-forward grid of
  story covers and useful reading details.
- App and admin pages: **Workbench**. Task-specific heading, concise filters,
  real counts from the API, and a table or form.
- Content pages: **Long Document**. Story details lead into a clear chapter
  list; reader pages give chapter text a comfortable measure and calm controls.
- Account pages: one focused form in the shared visual system.
- There are no marketing pages in the current application.

## Theme: Reading Room (custom)

Warm paper, deep teal ink, and a restrained burnt-orange accent. Covers can
carry stronger colors, but UI accents stay limited to selected controls,
links, focus, and primary actions.

```css
--color-paper:      oklch(97% 0.012 85);
--color-paper-2:    oklch(94% 0.016 80);
--color-paper-3:    oklch(89% 0.020 80);
--color-rule:       oklch(84% 0.020 82);
--color-rule-2:     oklch(47% 0.035 185);
--color-muted:      oklch(46% 0.035 190);
--color-ink-2:      oklch(24% 0.040 190);
--color-ink:        oklch(20% 0.045 190);
--color-accent:     oklch(42% 0.100 190);
--color-highlight:  oklch(66% 0.115 48);
--color-focus:      oklch(42% 0.100 190);
```

## Typography

- Headings and story covers: Newsreader, upright, weight 500–600.
- Interface and reading controls: Hanken Grotesk, weights 400–700.
- Long-form chapter text: Newsreader, weight 400–500, comfortable line height.
- Avoid monospaced metadata; it makes a reading interface feel like an index.

## Spacing, shape, and motion

- Use named `--space-*` and `--text-*` tokens from `Frontend/Web/styles/tokens.css`.
- Reading cards have a light border and modest radius; controls are comfortable
  to tap. Use a restrained shadow only on the book-led hero illustration.
- Keep sections open and easy to scan. Avoid double rules, numbered labels, and
  dense metadata treatments on reader-facing pages.
- Transitions use `--ease-out` and `--dur-short`; respect reduced motion.

## Microinteractions and state

- Keep loading, empty, error, and success messages inline in existing live
  regions.
- Search submits by keyboard and updates as the reader types. Genre filters and
  chapter controls stay usable by keyboard and touch.

## CTA voice

- Primary actions use a deep teal fill with short verbs: “Tìm truyện”,
  “Đọc truyện”, “Lưu”, and “Thêm truyện”.
- Secondary actions use a light outline or a quiet text link.

## Per-page allowances

- Discovery may use designed typographic covers derived from the story title
  and its saved cover theme. Do not invent reviews, rankings, or metrics.
- Story details keep a prominent cover beside author, status, description, and
  chapter list.
- The reader uses a warm paper page, a narrow prose measure, and accessible
  reading controls. The dark reading theme remains available.
- Admin pages may use compact tables and forms, with the same palette and type.

## What every page shares

- The Đọc Truyện wordmark, warm paper, deep teal, and restrained orange.
- Hanken Grotesk for controls and Newsreader for reading content.
- Clear focus, hover, loading, disabled, error, and success states.

## Exports

`Frontend/Web/styles/tokens.css` is the source of truth for the shared colors,
fonts, spacing, type scale, rules, and motion.
