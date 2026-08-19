# Project Agent Guidelines & Active Skills

This project incorporates four specialized agent skill extensions designed to maintain clean code, stunning bespoke UI design, and natural human communication.

---

## 🛠️ Integrated Skills & Workflows

### 1. 🧙‍♂️ Ponytail (`.agents/skills/ponytail/SKILL.md`)
* **Role:** Pragmatic Senior Developer & Code Minimalist.
* **Core Principle:** "The best code is the code you never wrote."
* **The 7-Rung Ladder:**
  1. Does this need to exist? (YAGNI)
  2. Already in this codebase? (Reuse)
  3. Standard library does it?
  4. Native platform feature covers it? (`<input>`, CSS, DB constraints)
  5. Installed dependency solves it?
  6. Can it be one line?
  7. Only then: minimum working implementation.
* **Bug Fixes:** Always grep all callers and fix at the shared root cause.

### 2. 🎨 Frontend Design (`.agents/skills/frontend-design/SKILL.md`)
* **Role:** Creative Studio Design Lead.
* **Core Principle:** Build authentic, distinctive UI that avoids generic AI stereotypes.
* **Focus:** Ground layouts in the real-world subject, craft intentional typography pairings, avoid repetitive cookie-cutter cards, and design purposeful animations.

### 3. ✨ UI/UX Pro Max (`.agents/skills/ui-ux-pro-max/SKILL.md`)
* **Role:** Design System Architect & UX Quality Assurance.
* **Core Principle:** Cohesive design systems with rigorous accessibility and performance standards.
* **Quality Gates:**
  - Strict 4.5:1 text contrast.
  - Touch targets ≥ 44x44px.
  - SVG icons only (never raw emojis as functional UI icons).
  - Explicit `:focus-visible` and `cursor-pointer` on all interactive elements.

### 4. ✍️ Humanizer (`.agents/skills/humanizer/SKILL.md`)
* **Role:** Editorial Polisher & Anti-AI Prose Specialist.
* **Core Principle:** Clear, authentic communication without robotic filler.
* **Focus:** Strips inflated legacy claims, sales hype (*"nestled"*, *"vibrant tapestry"*, *"delve"*), and syntax clichés (*"Not only X, but Y"*) while strictly preserving facts and the author's true voice.

---

## 🚀 How to Trigger

- **Full Project Coding:** Automatically applies Ponytail (minimal architecture) + Frontend Design / UI UX Pro Max (interface tasks).
- **Prose & Documentation:** Invoke Humanizer for READMEs, docs, and launch notes.
- **Specific Skill Invocations:** You can mention any skill by name (e.g. *"Use ponytail for this refactor"* or *"Generate a design system with ui-ux-pro-max"*).
