# boyinagowtham.com

A one-page portfolio for Boyina Gowtham. Hand-written HTML, CSS and a small
WebGL shader. No build step, no framework, no CDN, no trackers.

```
portfolio/
├── index.html              all content lives here
├── .nojekyll               stops GitHub Pages running Jekyll
└── assets/
    ├── styles.css          design system: tokens, chrome, column, themes
    ├── app.js              theme, menu, scroll states, cert accordion
    ├── scene.js           the rendered horizon (WebGL fragment shader)
    ├── mark.svg            the "G" monogram
    ├── favicon.svg
    ├── og.jpg              1200×630 share card
    ├── grain-light.png     paper fibre, day
    ├── grain-dark.png      paper fibre, night
    └── fonts/              Departure Mono, Newsreader (self-hosted)
```

## Run it

```bash
python3 -m http.server 8099
# then open http://127.0.0.1:8099
```

Opening `index.html` straight from disk mostly works, but a server is closer to
the real thing and avoids file:// quirks with fonts.

## Editing

Everything a reader sees is in `index.html`, in order:

| Section | Anchor |
|---|---|
| About | `#about` |
| Experience | `#experience` |
| Work | `#work` |
| Open source | `#open-source` |
| Writing | `#writing` |
| Skills | `#skills` |
| Certifications | `#certifications` |
| Contact | `#contact` |

Two things to keep in sync when you add a section: the `.menu-link` for it in the
header, and the two-digit `.num` in its `.eyebrow`.

## How it is put together

**Type.** Departure Mono for anything that is interface — labels, dates, links,
the menu, the footer. Newsreader for anything that is voice — the hero line,
headings, prose, the contact line. Both self-hosted, so the page renders
identically offline and no request goes to a third party.

**The scene.** `scene.js` runs one full-screen fragment shader. It builds a
luminance field — a graded sky, a sea of thin glinting rows, a lamp out on the
water broken into a glitter path — and maps it to a warm day palette or a cold
night palette. The lamp is ink on paper in daylight and the only light source
at night. The horizon sits at 39.43% of the viewport height; JS publishes the
exact pixel offset as `--scene-horizon-from-bottom` and the hero copy is
anchored to it, so the text always clears the water no matter the viewport.

**One sheet.** The paper column is a single continuous surface with feathered
side edges. The header grows a matching paper plate as it arrives, and the grain
is anchored to the viewport so the two never show a seam.

**Degradation.** No WebGL: the canvas is hidden and a CSS ground takes over. No
JavaScript: the menu panel renders open and the theme follows the OS. Reduced
motion: the shader draws one static frame instead of an animation loop.

## Deploying

GitHub Pages, from the repository root:

```bash
git init && git add . && git commit -m "Portfolio"
gh repo create boyinagowtham.github.io --public --source=. --push
```

Then **Settings → Pages → Source: Deploy from a branch → `main` / `root`**.
A repo named `<username>.github.io` serves at `https://<username>.github.io/`.

One thing to fix after you have a URL: `og:image` and `twitter:image` in
`index.html` are relative. Most scrapers want an absolute URL, so change them to
`https://your-domain/assets/og.jpg`. While you are there, add
`<meta property="og:url" content="https://your-domain/">`.

Any static host works — Netlify, Vercel, Cloudflare Pages — because there is
nothing to build. Publish the folder as-is.

## Licences

- **Departure Mono** — Helena Zhang, SIL Open Font License 1.1
  ([rektdeckard/departure-mono](https://github.com/rektdeckard/departure-mono)).
- **Newsreader** — Production Type for Google Fonts, SIL Open Font License 1.1.

The design takes its cues from [earendil.com](https://earendil.com) — the paper
surface, the mono interface against a serif voice, a fixed horizon. The
monogram, the lamp on the water, the layout and the code here are original.
