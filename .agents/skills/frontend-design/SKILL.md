---
name: frontend-design
description: >-
  Guidance for distinctive, intentional visual design when building or styling UI.
  Avoids generic AI aesthetics (bland gradients, cookie-cutter cards, meaningless animations)
  and enforces authentic, bold design choices grounded in the subject's domain.
---

# Frontend Design: Anti-Generic UI Aesthetics

Approach this as the design lead at a boutique design studio known for giving every project a distinctive visual identity. Avoid proposals that feel templated, predictable, or AI-generated. Make deliberate, opinionated choices about typography, color palettes, spacing, and layout.

## Avoid Common AI Aesthetics Tropes

Be aware of and avoid the common default AI aesthetic traps:
1. **Warm cream default:** `#F4F1EA` background with a generic high-contrast serif and terracotta accents used indiscriminately.
2. **Generic dark mode:** `#0D0D0D` dark background with a single neon acid-green or purple/pink gradient accent.
3. **Gratuitous numbering:** Slapping `01 / 02 / 03` labels on cards that are not actually an ordered sequence or timeline.
4. **Scattered micro-animations:** Excessive hover zooms, floating badges, and random fade-ins that add clutter and feel artificial.

## Core Design Principles

### 1. Ground Design in the Subject's Domain
- Draw inspiration directly from the subject's authentic tools, vernacular, textures, and real-world artifacts.
- Use realistic, domain-accurate copy and components instead of generic placeholder lorem ipsum or generic cards.

### 2. The Hero is a Thesis
- Open with the most characteristic and compelling artifact of the subject (a live interactive canvas, a focused tool preview, a bold typography statement).
- Avoid defaulting to a generic 3-column stats card with a purple gradient button unless it genuinely fits the product.

### 3. Typography Carries Personality
- Pair display and body fonts with intention (e.g., editorial serif + clean sans, high-density monospace + geometric sans).
- Define a clear, expressive type hierarchy with intentional line-heights, letter-spacing, and font weights.

### 4. Layout Structure is Information
- Every structural element (eyebrows, dividers, grids, sidebar rails) should reflect the nature of the data, not serve as superficial decoration.
- Prefer content-driven layouts (Bento grids, asymmetrical feature blocks, split viewports) over repetitive box grids.

### 5. Intentional Motion
- Orchestrate animations purposefully (page entry sequences, state transitions, spatial continuity).
- Keep animations fast and responsive (150ms–300ms) with proper easing curves.
- Always support and respect `prefers-reduced-motion`.
