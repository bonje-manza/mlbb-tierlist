# ADR 0002: Composite Power Score & Tier Assignment Formula

## Status
Accepted

## Context
Raw win rate in MLBB is notoriously vulnerable to low-sample skew. Niche, highly specialized, or one-trick heroes with tiny pick rates (e.g. Lolita at 0.08% pick rate sitting at 55.9% win rate) would dominate top tiers if ranked strictly by win rate, while high-priority meta bans (e.g. Gloo at 48.8% ban rate) would be undervalued.

Conversely, sorting purely by pick rate rewards popularity rather than effectiveness. In ranked draft pick, a hero's true competitive strength is a function of:
1. Winning matches when played (**Win Rate**).
2. Viability across team compositions (**Pick Rate / Appearance Rate**).
3. The opposing team's fear of the pick (**Ban Rate**).

Because raw metrics operate on wildly divergent numeric domains ($WR \in [0.40, 0.60]$, $PR \in [0.001, 0.050]$, $BR \in [0.0001, 0.85]$), a linear weighting without normalization leads to one metric overwhelming the others.

## Decision
1. **Min-Max Normalization (0–100 Scale)**:
   For every hero $i$ in the active pool of $N$ heroes for a given rank and time window:
   $$\text{WR\_norm}_i = \frac{\text{WR}_i - \text{WR}_{\min}}{\text{WR}_{\max} - \text{WR}_{\min}} \times 100$$
   $$\text{PR\_norm}_i = \frac{\text{PR}_i - \text{PR}_{\min}}{\text{PR}_{\max} - \text{PR}_{\min}} \times 100$$
   $$\text{BR\_norm}_i = \frac{\text{BR}_i - \text{BR}_{\min}}{\text{BR}_{\max} - \text{BR}_{\min}} \times 100$$

2. **Composite Power Score Weighting**:
   $$\text{PowerScore}_i = (\text{WR\_norm}_i \times 0.50) + (\text{PR\_norm}_i \times 0.25) + (\text{BR\_norm}_i \times 0.25)$$
   * **Win Rate (50%)**: Primary measure of gameplay effectiveness.
   * **Pick Rate (25%)**: Validates statistical sample volume and meta acceptance.
   * **Ban Rate (25%)**: Captures meta threat level and draft priority in ranked mode.

3. **Fixed Score Thresholds for Tier Buckets**:
   Heroes are placed into discrete tiers based on their final `PowerScore` $\in [0, 100]$:
   * **S+ Tier (God Tier / Must Pick or Ban)**: $\text{PowerScore} \ge 85$
   * **S Tier (Top Meta / High Priority)**: $75 \le \text{PowerScore} < 85$
   * **A Tier (Strong & Reliable)**: $60 \le \text{PowerScore} < 75$
   * **B Tier (Balanced / Situational)**: $45 \le \text{PowerScore} < 60$
   * **C Tier (Underperforming)**: $30 \le \text{PowerScore} < 45$
   * **D Tier (Weak / Avoid in Ranked)**: $\text{PowerScore} < 30$

4. **Niche Pick Dampening**:
   Any hero with a raw Pick Rate below $0.5\%$ ($\text{PR} < 0.005$) is restricted from entering S+ Tier to prevent low-sample cheese picks from appearing as top-priority meta recommendations.

## Consequences
### Positive
* **Transparent & Explainable**: Players and developers can inspect the exact normalized values and weights.
* **Balanced Tier Sizes**: Dynamic balance shifts in a patch naturally expand or contract the S+ and S tiers based on genuine meta dominance.
* **Cheese-Resistant**: Prevents 50-game sample one-tricks from displacing 5,000-game staple meta heroes.

### Negative
* **Outlier Sensitivity**: An extreme ban rate spike on a newly released or reworked hero (e.g. 85% ban rate) will compress the normalized range of other heroes' ban rates. Min-Max recalculation handles this gracefully by anchoring to the current batch boundaries.
