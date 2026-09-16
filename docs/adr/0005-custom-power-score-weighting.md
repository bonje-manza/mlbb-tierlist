# ADR 0005: Client-Side Custom Power Score Weighting & Presets

## Status
Accepted

## Context
ADR 0002 established a fixed linear weighting formula for the Composite Power Score:
$$\text{PowerScore}_i = (\text{WR\_norm}_i \times 0.50) + (\text{PR\_norm}_i \times 0.25) + (\text{BR\_norm}_i \times 0.25)$$
along with a strict Niche Pick Dampening rule ($PR < 0.5\% \implies \text{tier} \le \text{B}$).

While this fixed formula provides an objective, balanced meta representation, competitive players have diverse tactical objectives during ranked drafts:
1. **Comfort & Solo Queue Players**: Care primarily about raw Win Rate ($\text{WR}$) to evaluate which heroes reliably win matches regardless of popularity.
2. **Draft Captains & Tournament Players**: Focus heavily on Ban Rate ($\text{BR}$) and contested pick priority to identify urgent first-rotation bans and meta bans.
3. **Casual / Fast-Meta Climbers**: Prioritize high Pick Rate ($\text{PR}$) to focus on familiar, meta-accepted heroes with reliable synergy in public lobbies.

Allowing users to customize the metric weights enables personalized meta analysis while preserving client isolation and zero-downtime static delivery.

## Decision

1. **Relative Slider Mechanics & Dynamic Normalization**:
   Sliders allow independent input for Win Rate ($W_{\text{WR}}$), Pick Rate ($W_{\text{PR}}$), and Ban Rate ($W_{\text{BR}}$) on a $0 - 100$ scale:
   $$\text{WeightSum} = W_{\text{WR}} + W_{\text{PR}} + W_{\text{BR}}$$
   - If $\text{WeightSum} > 0$:
     $$w_{\text{wr}} = \frac{W_{\text{WR}}}{\text{WeightSum}}, \quad w_{\text{pr}} = \frac{W_{\text{PR}}}{\text{WeightSum}}, \quad w_{\text{br}} = \frac{W_{\text{BR}}}{\text{WeightSum}}$$
   - If $\text{WeightSum} == 0$ (degenerate edge case): fallback to default $w_{\text{wr}} = 0.50, w_{\text{pr}} = 0.25, w_{\text{br}} = 0.25$.
   - The UI displays both the slider value and the real-time calculated percentage allocation (e.g. `50%`, `25%`, `25%`).

2. **Client-Side In-Memory Recalculation**:
   - The static JSON datasets retain original raw metrics ($\text{winRate}$, $\text{pickRate}$, $\text{banRate}$) for each hero.
   - For any active dataset, pool min/max boundaries ($\text{WR}_{\min/\max}, \text{PR}_{\min/\max}, \text{BR}_{\min/\max}$) are derived, and Min-Max normalization is performed:
     $$\text{WR\_norm}_i = \frac{\text{WR}_i - \text{WR}_{\min}}{\text{WR}_{\max} - \text{WR}_{\min}} \times 100$$
     $$\text{PR\_norm}_i = \frac{\text{PR}_i - \text{PR}_{\min}}{\text{PR}_{\max} - \text{PR}_{\min}} \times 100$$
     $$\text{BR\_norm}_i = \frac{\text{BR}_i - \text{BR}_{\min}}{\text{BR}_{\max} - \text{BR}_{\min}} \times 100$$
   - Recalculated Power Score:
     $$\text{PowerScore}_i = \text{round}\left((\text{WR\_norm}_i \times w_{\text{wr}}) + (\text{PR\_norm}_i \times w_{\text{pr}}) + (\text{BR\_norm}_i \times w_{\text{br}}), 1\right)$$
   - Tiers are reassigned based on fixed thresholds:
     - $S+ \ge 85.0$
     - $75.0 \le S < 85.0$
     - $60.0 \le A < 75.0$
     - $45.0 \le B < 60.0$
     - $30.0 \le C < 45.0$
     - $D < 30.0$
   - Heroes within each tier band and overall grid are sorted by recalculated $\text{PowerScore}$ descending, breaking ties with $\text{winRate}$.

3. **User-Controlled Niche Pick Dampening**:
   - Niche pick dampening ($PR < 0.005 \implies \text{tier} \le \text{B}$) is enabled by default.
   - A toggle switch in the tuning drawer allows users to disable dampening, giving them full control to inspect raw unconstrained power rankings where low-pick-rate heroes can enter S+ Tier.

4. **Curated Presets**:
   1-tap quick preset chips in the drawer:
   - **Default Meta (Balanced)**: $50\% \text{ WR} / 25\% \text{ PR} / 25\% \text{ BR}$ (Dampening ON)
   - **Pure Win Rate (Solo Carry)**: $100\% \text{ WR} / 0\% \text{ PR} / 0\% \text{ BR}$ (Dampening OFF)
   - **Ban & Threat Priority (Tournament / High Rank)**: $30\% \text{ WR} / 20\% \text{ PR} / 50\% \text{ BR}$ (Dampening ON)
   - **High Popularity (Public Meta)**: $40\% \text{ WR} / 50\% \text{ PR} / 10\% \text{ BR}$ (Dampening ON)

5. **UI Surface & Mobile Drawer**:
   - Trigger button styled consistently with DraftControls: a "Weights" / "Tune Score" button next to "Ban Priority".
   - When non-default weights or non-default dampening are active:
     - The trigger button displays an active accent border and glow with an indicator badge.
     - A dismissible "Custom Weights Active" chip appears in the filter bar with a 1-tap `✕` to reset to default.
   - The drawer (`WeightTuningDrawer`) slides up smoothly from the bottom with backdrop blur, preset chips, 3 interactive sliders, dampening toggle switch, "Reset to Default" button, and "Apply / Done" button.

6. **Dual Persistence & URL Sharing**:
   - **LocalStorage**: `mlbb_power_score_weights` persists `{ wr: number, pr: number, br: number, dampenNiche: boolean }` across browser reloads and rank/window toggles.
   - **URL Query Parameters**: Synced as `?wr=...&pr=...&br=...&dampen=1|0` allowing players to copy and share exact customized tier lists via link.
   - If default weights are active, URL params are omitted to keep URLs clean.

## Consequences

### Positive
- **Complete Strategic Agency**: Users can tailor the tier list to their specific playstyle, role, or draft stage.
- **Zero Friction on Mobile**: Relative sliders prevent awkward touch conflicts; presets enable 1-tap switching during rapid draft countdowns.
- **Shareable Meta Builds**: URL parameters allow players and content creators to share custom formula tier lists with a single link.
- **Ultra-Fast Performance**: In-memory calculation of 133 heroes completes in $<1.5\text{ms}$.

### Negative / Mitigations
- **Potential Confusion**: Users might forget custom weights are on. Mitigated by explicit active badges and a 1-tap reset pill in the main view.
- **Degenerate Slider Inputs**: Zeroed sliders automatically fallback to standard 50/25/25 default.
