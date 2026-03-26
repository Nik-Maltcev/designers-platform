# Design System Specification: The Architectural Curator

## 1. Overview & Creative North Star
The "Architectural Curator" is the foundational philosophy of this design system. In the world of high-end interior design procurement, trust isn't built with loud colors; it’s built through precision, structural integrity, and the luxury of space. 

This system moves away from the "cluttered marketplace" aesthetic. Instead, it adopts an **Editorial High-End** approach. We achieve this by breaking the traditional rigid grid with intentional asymmetry—utilizing expansive `16 (5.5rem)` or `20 (7rem)` white space to let hero elements breathe. We reject the "boxed-in" look of standard B2B platforms, opting for **Tonal Layering** and **Glassmorphism** to create a sense of professional depth and sophistication.

## 2. Colors: Tonal Depth & The "No-Line" Rule
The palette is rooted in a deep, authoritative `primary (#003336)` teal. This isn't just a color; it’s an anchor of reliability.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders to section off content. Boundaries must be defined through:
1.  **Background Color Shifts:** A `surface-container-low` section sitting directly on a `surface` background.
2.  **Whitespace:** Using the Spacing Scale (specifically `8` to `12`) to create a natural "void" between content blocks.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of premium materials. 
*   **Base:** `surface (#f8f9fa)`
*   **Secondary Content Areas:** `surface-container-low`
*   **Interactive Cards/Modules:** `surface-container-lowest (#ffffff)`
*   **Nesting:** To highlight a specific element within a container, use a step up or down in the container scale (e.g., a `surface-container-high` search bar inside a `surface-container-low` sidebar).

### Signature Textures
To avoid a "flat" digital feel, apply a subtle linear gradient to primary CTAs: `primary (#003336)` to `primary_container (#004b50)`. This adds a "soul" to the button, making it feel weighted and premium. Use `surface_tint` with a 5% opacity overlay on high-traffic areas to suggest material quality.

## 3. Typography: The Editorial Contrast
We use a dual-sans-serif approach to balance architectural authority with modern utility.

*   **Display & Headlines (Manrope):** Chosen for its geometric precision. Use `display-lg` and `headline-md` to create an editorial feel. Manrope’s open counters convey the "modern" and "clean" requirement of the brief.
*   **Body & Labels (Inter):** The workhorse of high-end B2B. Inter provides maximum legibility for procurement data, SKU numbers, and status badges.
*   **Hierarchy as Identity:** Use high contrast in scale. Pair a `display-md` headline with a `body-sm` caption immediately below it. This "Big-Small" pairing is a hallmark of high-end design, signaling confidence and curation.

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "software-like." We mimic natural ambient light.

*   **The Layering Principle:** Depth is achieved by stacking surface tokens. A `surface-container-lowest` card on a `surface-container-low` background creates a soft, natural lift without a single pixel of shadow.
*   **Ambient Shadows:** Where floating elements are required (e.g., Modals), use a shadow color tinted with `on_surface` at `4-8%` opacity with a blur value of at least `24px`.
*   **The Ghost Border:** If a boundary is strictly required for accessibility, use `outline_variant` at `15%` opacity. Never use a 100% opaque border.
*   **Glassmorphism:** For the filter sidebar or floating headers, use `surface_container_lowest` with an 80% opacity and a `20px` backdrop-blur. This keeps the interface feeling "airy" and integrated with the content beneath.

## 5. Components

### Cards & Portfolios
*   **Rule:** Forbid divider lines.
*   **Structure:** Use `surface-container-lowest` for the card body. Use `padding: 6 (2rem)` to ensure the content doesn't feel cramped. 
*   **Imagery:** Portfolio images should use the `lg (0.5rem)` corner radius.

### Buttons & CTAs
*   **Primary:** `primary` background with the signature gradient. `rounded-md`.
*   **Secondary:** `secondary_container` background with `on_secondary_container` text. No border.
*   **Tertiary:** Text-only using `primary` color, bold weight, with a `2px` underline that only appears on hover.

### Status Badges (Verified, Active)
*   **Verified:** `primary_fixed` background with `on_primary_fixed_variant` text. High contrast, low saturation.
*   **Active:** Use a soft `secondary_fixed` background. 
*   **Shape:** Use `full` (pill-shape) for badges to contrast against the geometric cards.

### Filter Sidebars
*   Use the **Glassmorphism** rule. The sidebar should feel like a pane of frosted glass sliding over the procurement list.
*   Group filters using vertical spacing `spacing-5` instead of lines.

### Input Fields
*   **State:** Default state is a `surface-container-high` fill with no border.
*   **Focus State:** A `2px` "Ghost Border" using `primary` at 40% opacity.

## 6. Do’s and Don’ts

### Do
*   **DO** use asymmetric margins (e.g., more space on the left than the right) to create an editorial layout.
*   **DO** use `display-lg` for key value propositions to command authority.
*   **DO** rely on the `surface` scale to define your "z-index" hierarchy.

### Don't
*   **DON'T** use 1px solid borders. It cheapens the "High-End" feel and makes the B2B platform look like a legacy spreadsheet.
*   **DON'T** use pure black `#000000`. Use `on_surface (#191c1d)` for all "black" text to maintain tonal harmony with the teals.
*   **DON'T** crowd the screen. If a page feels full, increase the spacing to the next tier in the scale (e.g., move from `8` to `12`).