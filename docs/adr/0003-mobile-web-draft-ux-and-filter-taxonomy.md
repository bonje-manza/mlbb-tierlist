# ADR 0003: Mobile Web Draft UX & Filter Taxonomy

## Status
Accepted

## Context
Ranked MLBB players on mobile web have less than 30 seconds during a draft pick phase to assess meta priority, identify counter-picks, or choose an optimal hero for their designated lane.

Desktop-oriented complex matrix tables with dozens of filter dropdowns create cognitive overload and fail to fit standard mobile phone viewport constraints (360px–420px widths). The UI must provide instant, thumb-driven glanceability and zero-lag response.

## Decision
1. **Frontend Architecture**:
   * **Stack**: Vite + React + Tailwind CSS.
   * **Delivery**: Client-side static single-page application loading pre-computed JSON datasets.
   * **Asset Strategy**: Hero portraits are loaded directly from Moonton's YoungJoyGame CDN (`https://akmweb.youngjoygame.com/...`) with lazy loading, `image/webp` progressive display, and local SVG fallback placeholders to prevent layout shift.

2. **Core Mobile Controls & Navigation**:
   * **Lane Selector (Thumb Carousel / Tabs)**:
     * `All Lanes`, `Gold Lane`, `EXP Lane`, `Mid Lane`, `Roam`, `Jungle`.
     * **Multi-Lane Inclusion (Flex Picks)**: If a hero canonically supports multiple lanes (e.g. Chou in EXP + Roam; Edith in EXP + Roam; Paquito in EXP + Jungle), they appear under **all** matching lane tabs.
   * **Instant Search Bar**: Debounced search by hero name at the top of the screen.
   * **Rank Presets**: Default locked to **Mythic** (`bigrank: 7`) with a quick toggle for **All Ranks** (`bigrank: 101`).
   * **Time Window Toggle**: Default to **Past 1 Day** (`sourceId: 2756567`) for fastest patch response, with a toggle for **Past 7 Days** (`sourceId: 2756569`) for smoothed trends.

3. **Hero Card & Inspection UX**:
   * **Tier Row Visualization**: Hero cards grouped into sticky or collapsible tier sections labeled `S+`, `S`, `A`, `B`, `C`, `D`.
   * **Card Face**: Compact portrait avatar, Hero Name, Win Rate (%), and Power Score badge.
   * **Bottom Sheet Modal (Tap-to-Inspect)**:
     * Tapping any hero opens a native-feeling mobile bottom sheet.
     * Displays detailed stats: Win Rate, Pick Rate, Ban Rate, assigned Lane tags, and Canonical Role tags.
     * Displays **Top 3 Synergies / Best Teammates** populated from `data.sub_hero` (showing partner hero avatar and `increase_win_rate` delta, e.g. `+6.37%`).

## Consequences
### Positive
* **Rapid Draft Decisions**: Players can find their lane, filter by meta rank, and check team synergy in 2-3 taps.
* **Mobile Viewport Optimized**: Avoids horizontal table scroll; utilizes vertical card grids and bottom sheets native to mobile touch interactions.
* **Low Bandwidth**: Static asset footprint under 50KB gzip for initial page load.

### Negative
* **Multi-lane Duplicate Views**: Flex pick heroes appear under multiple tabs, which is expected by lane-specific players but means total hero counts per tab exceed the 133 unique hero pool.
