---
name: GarageFlow Core
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3f4850'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#707881'
  outline-variant: '#bfc7d2'
  surface-tint: '#006398'
  primary: '#006194'
  on-primary: '#ffffff'
  primary-container: '#007bb9'
  on-primary-container: '#fdfcff'
  inverse-primary: '#93ccff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#8d4b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#b15f00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  gutter-lg: 1.5rem
  margin: 1.5rem
  margin-mobile: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system establishes an ultra-reliable, high-clarity operational framework engineered specifically for high-throughput automotive workshops, dealership service bays, and fleet telemetry centers. Balancing rugged shop-floor practicality with sophisticated enterprise SaaS analytics, the aesthetic eliminates visual ambiguity while optimizing information density.

Targeting service advisors, master technicians, parts managers, and dealership directors, the visual language conveys mechanical precision, unwavering stability, and immediate situational awareness. 

The aesthetic is firmly rooted in **Corporate / Modern** utilitarian design:
- High-contrast slate perimeter fencing and structural dividers that anchor dense data views.
- Clinical automotive sky-blue active cues paired with high-visibility amber alerts for pending diagnostics and bay bottlenecks.
- Functional card and panel modules optimized for rapid scanning across wall-mounted bay monitors, shop tablets, and desktop workstations.
- Crisp, unyielding layout logic prioritizing legibility under variable lighting conditions.

## Colors

The palette balances deep naval structure with clinical, task-oriented highlights:

- **Primary (`#0284c7`)**: Refined automotive tech blue. Reserved for confirmed states, active telemetry focus, primary workflow actions, and interactive links.
- **Secondary (`#0f172a`)**: Slate navy. Deployed for high-contrast typography, primary navigation framing, critical telemetry badges, and structural anchors.
- **Tertiary (`#d97706`)**: Energetic mechanical amber. Highlights pending repair orders, queue friction, diagnostic warnings, and low-inventory notices.
- **Neutral (`#64748b`)**: Balanced slate gray. Powers secondary typography, tabular headers, inactive tab indicators, and contextual metadata.

### Surface System
- **App Canvas**: `#f8fafc` (Ultra-crisp, glare-resistant pale slate).
- **Card / Surface Container**: `#ffffff` (Pure white for elevated ticket items and data blocks).
- **Muted Inset / Table Zebra**: `#f1f5f9` (Subtle structural separation for diagnostic grids).
- **Borders & Dividers**: `#cbd5e1` (Structural high-contrast boundary line) and `#e2e8f0` (Subtle interior sub-dividers).

### Functional Semantic Roles
- **Success / Completed / Paid**: `#059669` (Text), `#d1fae5` (Background), `#10b981` (Border).
- **Warning / Pending / Low Stock**: `#d97706` (Text), `#fef3c7` (Background), `#f59e0b` (Border).
- **Info / In-Service**: `#0284c7` (Text), `#e0f2fe` (Background), `#38bdf8` (Border).
- **Critical / Blocked / Void**: `#e11d48` (Text), `#ffe4e6` (Background), `#f43f5e` (Border).

## Typography

The typography is unified under **Inter**, ensuring strict geometric neutrality, open counter forms, and flawless tabular number rendering necessary for telemetry gauges, labor rates, and VIN records.

- **Headlines (`headline-xl`, `headline-lg`, `headline-md`, `headline-sm`)**: Semi-bold to bold weight with tight negative letter-spacing for rapid executive summaries, KPI values, and service bay identifiers.
- **Body (`body-lg`, `body-md`, `body-sm`)**: Regular weight configured with proportionate line heights to maximize readability across diagnostic work logs, parts descriptions, and customer histories.
- **Labels & Microcopy (`label-lg`, `label-md`, `label-sm`)**: Medium to semi-bold weights featuring wide positive letter spacing. Optimized for technical status badges, data table column headers, technician tags, and step-by-step repair checklists.

## Layout & Spacing

The layout is constructed on an adaptable 12-column responsive fluid grid built for dense operational dashboards, service timeline scheduling, and multi-bay dispatch boards:

- **Desktop (1200px+)**: 12-column grid with a fixed 260px collapsible service rail, `1.5rem` (`gutter-lg`) column gutters, and `2rem` outer screen canvas margins. Multi-column Kanban boards span up to 6 concurrent service bay tracks.
- **Tablet / Workshop Wallboards (768px - 1199px)**: 8-column layout with `1rem` (`gutter`) gutters and `1.5rem` margins. Sidebars collapse to icon-only rails; tables utilize horizontal pinned-column scroll.
- **Mobile (Below 768px)**: 4-column single-stack flow with `0.75rem` (`gutter-sm`) gutters and `1rem` margins. Action bars become bottom-pinned sticky rails for one-handed shop floor usage.

Component padding adheres strictly to the 4px baseline system (`0.25rem` to `2rem`). Dense data density presets are prioritized for parts inventory lists, while touch-friendly hit areas are enforced for mobile technician inspection logs.

## Elevation & Depth

Visual hierarchy is maintained through high-contrast structural borders paired with restrained, clinical ambient shadows. Depth serves to separate floating operational overlays without introducing visual haze:

- **Base Level (Canvas)**: `#f8fafc` background with no elevation.
- **Level 1 (Work Cards & Metric Panels)**: `#ffffff` surface enclosed by a 1px solid border in `#cbd5e1`, accompanied by an ultra-subtle baseline shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)`.
- **Level 2 (Active Rows & Hover Targets)**: Subtle border transition to `#0284c7` accompanied by a localized lift: `0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Flyout Panels, Dropdowns, Datepickers)**: White surface bordered with `#cbd5e1` elevated via `0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -4px rgba(15, 23, 42, 0.05)`.
- **Level 4 (Modal Dialogs & Emergency Bay Overrides)**: High-prominence shadow: `0 20px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.05)` layered over a 50% opacity slate backing scrim (`rgba(15, 23, 42, 0.5)`).

## Shapes

The design system adopts **Soft** geometry (`roundedness: 1`):

- **Standard Elements (Buttons, Inputs, Badges, Table Rows)**: `0.25rem` (4px) border radius. Gives components a crisp, mechanical boundary aligned with physical shop hardware and industrial tools.
- **Card Containers & Modal Dialogs**: `0.5rem` (8px) border radius via `rounded-lg`. Provides subtle boundary definition while preserving strict rectangular data layout inside data tables.
- **Pills / Status Chips**: Maximum radius `9999px` strictly reserved for high-priority operational state indicators (e.g., "BAY ACTIVE", "AWAITING APPROVAL") to distinguish real-time statuses from actionable button modules.

## Components

### Buttons
- **Primary**: Solid `#0284c7` fill, white text, 1px border of `#0369a1`. Hover transitions to `#0369a1`. Active click state scales subtly (`0.99`). Focus ring: 2px offset with `#38bdf8`.
- **Secondary / Slate**: `#0f172a` fill, white text. Deployed for critical admin operations (e.g., "Generate Invoice", "Complete Work Order").
- **Outline / Neutral**: `#ffffff` fill, `#0f172a` text, 1px `#cbd5e1` border. Hover changes background to `#f1f5f9`.
- **Destructive**: `#ffffff` fill, `#e11d48` text, 1px `#f43f5e` border. Hover changes background to `#ffe4e6`.

### Badges & Status Indicators
- Structured with `0.25rem` radius (or pill-shaped for status tags), 1px solid border matching semantic identity, uppercase `label-sm` font.
- **In-Service / Confirmed**: `#e0f2fe` background, `#0284c7` text, `#7dd3fc` border.
- **Ready / Completed / Paid**: `#d1fae5` background, `#059669` text, `#6ee7b7` border.
- **Pending / Action Required**: `#fef3c7` background, `#d97706` text, `#fcd34d` border.
- **Critical / Urgent / Flagged**: `#ffe4e6` background, `#e11d48` text, `#fda4af` border.

### Input Fields & Selects
- Height standard: 38px (Bootstrap-compatible compact touch standard).
- Background `#ffffff`, text `#0f172a`, border 1px solid `#cbd5e1`, radius `0.25rem`.
- Focus state: Border transitions to `#0284c7` with a 3px glow (`rgba(2, 132, 199, 0.2)`).
- Disabled state: Background `#f1f5f9`, border `#e2e8f0`, text `#94a3b8`.

### Data Cards & Panels
- Constructed with `#ffffff` backgrounds, 1px border `#cbd5e1`, and `0.5rem` radius.
- Card headers feature an internal border separator (`1px solid #e2e8f0`), housing a descriptive title in `headline-sm` alongside action chip groups or dropdown triggers.

### Checkboxes & Radios
- Size: 18px by 18px.
- Unchecked: `#ffffff` background with 1.5px solid `#94a3b8` border. Radius: `0.25rem` for checkboxes, `50%` for radios.
- Checked: `#0284c7` fill, white tick mark or center dot, border `#0284c7`.

### Telemetry / Bay Monitor Strips
- Specialized horizontal banner component anchored inside bay view cards: features a 4px left-edge indicator bar color-coded to repair order state, tabular monospace VIN readouts, and an inline live mechanic avatar chip.
