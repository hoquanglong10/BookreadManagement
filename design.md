# Design — Đọc Truyện

A shared design system for the React web app. The public catalog uses the
WebNovel.vn home-page structure: compact header, featured-story carousel,
reader shortcuts, tabbed book shelf, and lower update sections. Project routes,
branding, and database-backed story data remain connected.

## Product intent

Let readers find a story by title, author, or genre, pick a featured or recent
book from the cover shelf, and continue into a comfortable reading view.

## Reference and tone

- Genre: online fiction catalog
- Tone: familiar, information-dense, reader-focused
- Reference: [WebNovel.vn](https://webnovel.vn/), reviewed 2026-10-20.
- Match the white header, blue search and controls, featured-story carousel,
  reading-history/login shortcuts, three ranking tabs, and horizontal cover
  shelf. Keep the local brand and database content; do not fabricate ratings.

## Macrostructure families

- Discovery: **Story Carousel + Reader Shortcuts + Book Shelf + Updates**.
  Header search and genre menu, featured stories, reading-history/login buttons,
  hot/recommended/new tabs, then new releases, chapter updates, and categories.
- Admin: **Workbench**. Responsive header and collapsible side navigation;
  task heading, real API counts, filters, compact table/forms.
- Story details: **Book + Contents**. Cover and story facts first, then an
  ordered chapter list.
- Reader: **Long Document**. Quiet reading controls above a narrow prose
  column, with previous/next chapter links.
- Account: one focused login or registration form.

## Theme: Webnovel Reading Catalog

The catalog uses a white background, blue controls, and a blue/orange wordmark.
Use compact sans-serif typography, fine gray dividers, and portrait book covers.
If a story has no cover URL, draw a small themed illustration from the story
record; use the supplied cover URL when one is available.

```css
--color-paper:       #ffffff;
--color-surface:     #ffffff;
--color-surface-2:   #f7f8fa;
--color-rule:        #e3e6ea;
--color-muted:       #737b85;
--color-ink:         #252a30;
--color-header:      #ffffff;
--color-accent:      #3b8bd2;
--color-accent-dark: #2878bf;
--color-focus:       #1d6aa9;
```

## Typography

- Interface: Arial/Segoe UI system sans-serif, weights 400–700.
- Reader prose: Georgia, with adjustable text size.
- Metadata uses compact proportional text, not monospaced labels.

## Spacing, shape, and motion

- `Frontend/WebApp/src/tokens.css` is the source of truth for design tokens.
- Use compact spacing and small corner radii.
- Keep cards white with fine borders. Reserve subtle shadows for menus and
  overlays.
- Interaction uses short color/opacity changes, immediate focus rings, and a
  reduced-motion fallback. No auto-rotating content.
- Verify responsive layouts at 320, 375, 414, and 768 CSS pixels.

## Interaction and accessibility

- Search submits on Enter and through the button; preserve the query in the
  URL and provide loading, error, and empty states.
- Every form and control has a visible label, focus state, and disabled state.
- Admin routes require a valid JWT and Admin role. A 401 clears the token and
  returns the reader to login.
- Reader settings for text size and dark mode are stored locally.

## CTA voice

- Primary actions use the blue fill with short verbs: “Đọc truyện”, “Đăng
  nhập”, “Lưu”, “Thêm truyện”.
- Secondary actions use an outline or direct text link.

## Per-page allowances

- Discovery cards and lists use live API results. Ranking order follows the
  selected API sort and does not invent ratings or view counts.
- Details pages use the story's real metadata and available chapters.
- The reader offers adjustable text size and a dark reading surface.
- Admin tables may become stacked records on narrow screens.

## What every page shares

- The Đọc Truyện wordmark, white/gray panels, blue links, and compact sans-serif
  navigation.
- A consistent navigation shell, action style, focus treatment, and spacing.
- Real status messages for loading, empty results, API errors, and form errors.

## Web application

`Frontend/WebApp` is the project's web application. Backend serves its built
files from `Frontend/WebApp/dist` when that build exists.

## Exports

### CSS tokens

The canonical tokens live in [Frontend/WebApp/src/tokens.css](Frontend/WebApp/src/tokens.css).

### Tailwind v4 migration reference

```css
@theme {
  --color-paper: #f4f5f7;
  --color-surface: #ffffff;
  --color-ink: #252a30;
  --color-accent: #3b8bd2;
  --font-display: Arial, "Segoe UI", sans-serif;
  --font-body: Arial, "Segoe UI", sans-serif;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### DTCG tokens

```json
{
  "color": {
    "paper": { "$value": "#f4f5f7", "$type": "color" },
    "surface": { "$value": "#ffffff", "$type": "color" },
    "ink": { "$value": "#252a30", "$type": "color" },
    "accent": { "$value": "#3b8bd2", "$type": "color" }
  },
  "font": {
    "display": { "$value": "Arial", "$type": "fontFamily" },
    "body": { "$value": "Arial", "$type": "fontFamily" }
  },
  "space": {
    "md": { "$value": "1rem", "$type": "dimension" },
    "lg": { "$value": "1.5rem", "$type": "dimension" }
  }
}
```

### shadcn/ui variable mapping

```css
:root {
  --background: #f4f5f7;
  --foreground: #252a30;
  --primary: #2878bf;
  --primary-foreground: #ffffff;
  --muted: #f7f8fa;
  --muted-foreground: #737b85;
  --border: #e3e6ea;
  --input: #cbd1d8;
  --ring: #1d6aa9;
  --radius: 0.25rem;
}
```
