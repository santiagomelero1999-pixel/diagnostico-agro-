# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Organizational maturity diagnostic tool for the agricultural sector (Spanish language). Created by Fernando Premayer and Santiago Melero.

## Running the Project

No build process. Open directly in a browser:

```bash
open index.html
# or serve via HTTP (recommended for consistent behavior):
python3 -m http.server 8000
```

## Architecture

This is a **single-file SPA** (`index.html`) with no build toolchain. All HTML, CSS, and JS live in one file. External dependencies load from CDN: Chart.js and Google Fonts (Montserrat).

### Application Flow

```
Home (#home) → Registration (#reg) → Survey (#survey) → Results (#results)
```

Navigation is handled by `navTo(sectionId)`, which shows/hides sections via CSS visibility.

### State Management

All state is in global JS variables (no persistence — data is lost on reload):
- `index` — current question number (0–15)
- `h_vals[16]` — "Situación Actual" (current state) ratings per question
- `p_vals[16]` — "Proyecto Deseado" (desired state) ratings per question

### Survey Structure

16 questions across 4 dimensions (4 questions each), each rated 0–5 on two scales:

| Dimension | Description |
|---|---|
| Enfoque | Data-driven decision making |
| Procesos | Standardization & integration |
| Competencias | Role clarity & team structure |
| Proyección | Strategic planning |

### Results Scoring

Score = sum of `h_vals` (0–80 range). Maturity stages:
- 0–20: **CONFIANZA** (owner dependency)
- 20–40: **ANÁLISIS**
- 40–60: **DELEGACIÓN**
- 60–80: **PERSPECTIVA**

Results render a radar chart (Chart.js) comparing current vs. desired state across the 4 dimensions (max 20 per dimension).

## Design System

CSS variables defined at `:root`:
- `--primary`: `#00502F` (dark green)
- `--accent`: `#8BC34A` (light green)
- Fluid typography via `clamp()`
- Responsive grid with `auto-fit`
