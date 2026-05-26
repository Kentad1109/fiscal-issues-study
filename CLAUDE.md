# Fiscal Issues Study Site — CLAUDE.md

## Project Overview
A bilingual (English/Japanese) interactive study website for the Waseda University course
"Fiscal Issues on Social Security" taught by Prof. Kook Joongho (Yokohama City University).

## Directory Structure
```
fiscal-issues-study/
├── index.html          # Landing page: course overview + navigation
├── unit1.html          # Unit 1: Economic & Fiscal Features in Japan
├── unit2.html          # Unit 2: Main Functions of Governments
├── unit3.html          # Unit 3: Pareto Optimality & Market Efficiency
├── unit4.html          # Unit 4: Social Welfare & Equity
├── unit5.html          # Unit 5: Public Goods
├── styles.css          # Shared styles (dark academic theme)
├── app.js              # Shared JS: language toggle, quiz engine, animations
├── CLAUDE.md           # This file
└── assets/             # (optional) images, icons
```

## Source Materials Location
`/Users/kenta/Documents/Waseda2026/Fiscal Issues/`

File naming convention:
- `{NN}` = unit number prefix (e.g. 10 = Unit 1, 20 = Unit 2 …)
- `.pptx` files = main lecture slides (primary content)
- `.PDF` files = supplementary reading materials

## How to Add a New Unit

When a new lecture unit is uploaded (e.g. `60SomeTopic.pptx` + `61SubMaterial.PDF`):

1. **Extract PPTX content:**
   ```python
   python3 << 'EOF'
   import zipfile, xml.etree.ElementTree as ET, re, os
   NS = '{http://schemas.openxmlformats.org/drawingml/2006/main}'
   path = "/Users/kenta/Documents/Waseda2026/Fiscal Issues/60SomeTopic.pptx"
   with zipfile.ZipFile(path) as z:
       for sf in sorted(n for n in z.namelist() if re.match(r'ppt/slides/slide\d+\.xml', n)):
           root = ET.fromstring(z.read(sf))
           texts = [e.text for e in root.iter(f'{NS}t') if e.text and e.text.strip()]
           print(f"Slide {re.search(r'slide(\d+)', sf).group(1)}: {' '.join(texts)}")
   EOF
   ```

2. **Read PDF supplements** with the Read tool (requires poppler):
   `brew install poppler` if needed.

3. **Create `unitN.html`** following the same template as existing units:
   - Copy structure from nearest existing unit HTML
   - Include: concept cards, diagrams (SVG/Chart.js), quiz section, key terms
   - Add bilingual content following the `i18n` object pattern in `app.js`

4. **Link new unit** in `index.html`: add a card in the `#units-grid` section.

5. **Update nav** in all existing unit HTML files: add the new unit to the `<nav>` links.

## Content Design Principles
- **English primary**, Japanese available via toggle (EN/JP button top-right)
- Every unit has: Overview → Key Concepts → Diagrams → Summary → Quiz
- Quizzes: 5–8 multiple-choice questions per unit, with explanations on reveal
- Diagrams: built with inline SVG or Chart.js (no external image dependencies)
- All mathematical notation: use MathJax (loaded from CDN) — already included in `<head>`

## Deployment
- GitHub repo: push to `main` branch
- Vercel: connected to GitHub, auto-deploy on push
- All pages are static HTML — no build step needed

## Current Units (as of 2026-05)
| Unit | File prefix | Topic |
|------|-------------|-------|
| Intro | 01 | Course Overview |
| 1 | 10a / 10b–13 | Economic & Fiscal Features in Japan |
| 2 | 20–22 | Main Functions of Governments |
| 3 | 30–33 | Pareto Optimality & Efficiency |
| 4 | 40–42 | Social Welfare Functions & Equity |
| 5 | 50–53 | Public Goods |
