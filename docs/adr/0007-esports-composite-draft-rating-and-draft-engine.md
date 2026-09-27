# ADR 0007: Esports Composite Draft Rating (CDR) & In-Draft Engine

## Status
Accepted

## Context
ADR 0002 established the static Composite Power Score for general tier list rankings, and ADR 0006 introduced head-to-head empirical counter picks for single target heroes.

However, during active ranked draft phases (Epic through Mythical Glory), competitive players face a 5-hero enemy team picking sequentially under a strict 30-second countdown timer. A player cannot manually cross-reference 3 to 5 separate enemy counter lists in their head while also considering ally synergies and team composition balance.

### Why Naive Formulas Fail in Competitive Esports
Amateur draft engines typically use a simple linear average of counter deltas:
$$\text{Score}_{\text{naive}}(H) = \frac{1}{|E|} \sum_{e \in E} \Delta \text{WR}(H, e) + \text{BaseScore}(H)$$

Empirical esports evidence (MPL, M-World Championship, competitive MOBA modeling) demonstrates that this naive approach fails due to three fundamental factors:
1. **The Kryptonite Effect (Fatal Hard-Counter Bottleneck)**: If an enemy locks a hard counter (e.g., Phoveus into Wanwan, Khufra into Fanny, Diggie into Atlas), a single severe negative matchup (e.g. $-7.5\text{ pp}$) is mathematically fatal. In a linear average over 5 enemies, $-7.5\text{ pp}$ gets diluted to $-1.5\text{ pp}$, misleading the player into picking an unplayable hero. Hard counters must be penalized non-linearly.
2. **Lane Interaction Asymmetry**: In the critical first 8 minutes (first turret shield, early gold velocity), a direct lane matchup (e.g. Gold Laner vs Gold Laner) carries significantly higher snowball leverage than a cross-map opponent.
3. **Composition Hygiene Penalties**: No individual matchup advantage compensates for fatal team composition flaws, such as having no Retribution/Jungler for neutral objectives, or building a 100% physical damage team that allows enemies to counter-itemize with Antique Cuirass and Dominance Ice.

## Decision

We establish the **Composite Draft Rating (CDR)** formula, an in-memory client-side draft scoring engine tailored for live 5v5 drafting.

### 1. Mathematical Formulation

For any candidate hero $H$, given selected Enemy team set $E = \{e_1, \dots, e_m\}$ ($|E| \le 5$) and selected Allied team set $A = \{a_1, \dots, a_k\}$ ($|A| \le 4$):

$$\mathbf{CDR}(H \mid E, A) = \text{clamp}\Big( \mathbf{PowerScore}(H) + \mathbf{CounterAdvantage}(H, E) + \mathbf{SynergyBonus}(H, A) - \mathbf{CompPenalty}(H, A), 0, 100 \Big)$$

#### A. Baseline Meta Power Score ($\mathbf{PowerScore}$)
Derived from ADR 0002 / ADR 0005 using normalized Win Rate, Pick Rate, and Ban Rate with Niche Pick Dampening. The draft engine defaults to the **Mythic** rank tier as the canonical competitive baseline.

#### B. Asymmetric Counter Advantage ($\mathbf{CounterAdvantage}$)
$$\mathbf{CounterAdvantage}(H, E) = \sum_{e \in E} \omega_{\text{lane}}(H, e) \cdot \Delta \text{WR}_{\text{counter}}(H, e) - \mathbf{KryptonitePenalty}(H, E)$$

Where:
* **$\Delta \text{WR}_{\text{counter}}(H, e)$**: The empirical win rate delta sourced from Moonton GMS `match_type: 1` head-to-head records. If no explicit counter record exists, $\Delta \text{WR} = 0.0$.
* **Lane Interaction Weight ($\omega_{\text{lane}}$)**:
  * $\omega_{\text{lane}} = 1.4\times$ if $H$ and $e$ share the same inferred primary lane (e.g. Gold vs Gold, EXP vs EXP).
  * $\omega_{\text{lane}} = 1.2\times$ if either $H$ or $e$ has an inferred Roam or Jungle lane (high gank interaction).
  * $\omega_{\text{lane}} = 1.0\times$ for cross-lane matchups.
* **Inferred Primary Lane**: The primary lane is canonically assigned as the first lane listed in the hero catalog (`lanes[0]`).
* **Kryptonite Penalty (Non-Linear Fatal Counter Bottleneck)**:
  $$\mathbf{KryptonitePenalty}(H, E) = \kappa \cdot \max_{e \in E} \left( \max(0, -\Delta \text{WR}_{\text{counter}}(H, e) - \theta_{\text{fatal}}) \right)^p$$
  Parameters calibrated from competitive telemetry:
  * $\theta_{\text{fatal}} = 3.5\text{ pp}$ (threshold defining a severe hard counter)
  * $\kappa = 1.5$ (scaling factor)
  * $p = 1.2$ (convex exponent)

#### C. Allied Pairing Synergy ($\mathbf{SynergyBonus}$)
$$\mathbf{SynergyBonus}(H, A) = \alpha \sum_{a \in A} \Delta \text{WR}_{\text{synergy}}(H, a)$$

Where:
* **$\Delta \text{WR}_{\text{synergy}}(H, a)$**: Sourced from Moonton GMS `match_type: 0` (`data.sub_hero.increase_win_rate`) for teammate pairings.
* **$\alpha = 0.75$**: Synergy damping coefficient, reflecting empirical findings that countering enemy compositions provides $\approx 1.33\times$ higher win-rate leverage than drafting internal synergy.

#### D. Composition Hygiene Penalty ($\mathbf{CompPenalty}$)
Evaluated against the projected team composition $A \cup \{H\}$:
* **Damage Type Monoculture**:
  * If $\ge 4$ heroes in $A \cup \{H\}$ deal purely Physical damage: $-8.0\text{ points}$ (High Armor Vulnerability).
  * If $\ge 4$ heroes in $A \cup \{H\}$ deal purely Magic damage: $-8.0\text{ points}$ (Athena / Radiant Vulnerability).
* **Missing Objective Secure (Retribution / Jungler)**:
  * If $|A \cup \{H\}| = 5$ and 0 heroes have the Jungle lane: $-15.0\text{ points}$.
* **Marksman Overcrowding**:
  * If $> 1$ hero in $A \cup \{H\}$ is a Marksman without secondary flex lane: $-10.0\text{ points}$.
* **Frontline Deficit**:
  * If $|A \cup \{H\}| \ge 4$ and count of Tanks/Durable Fighters is $0$: $-6.0\text{ points}$.

### 2. UI & Ergonomics Invariants
1. **Pick Exclusivity**: Any hero locked in $E$ or $A$ is strictly excluded from candidate recommendations.
2. **Lane Role Filtering**: While in draft mode, the user can toggle lane tabs (`All`, `Gold`, `EXP`, `Mid`, `Roam`, `Jungle`) to filter recommendations for their assigned lane.
3. **Real-Time Visual Diagnostics**:
   * The UI displays composition badges (e.g. `⚠️ Full Physical (High Armor Vulnerability)`, `✓ Balanced Damage`, `⚠️ No Retribution`).
   * Each recommended hero card displays:
     - Final **CDR Score** ($0 - 100$).
     - Breakdown chip: Counter shift vs team ($\sum \Delta \text{WR}$) and Synergy bonus ($\sum \text{Syn}$).
     - Fatal Counter Alert if Kryptonite Penalty $> 0$ (e.g. `⚠️ Hard countered by Phoveus (-7.8%)`).
4. **URL & Session Persistence**:
   - Draft state is synchronized to the URL: `?view=draft&enemy=1,14,35&ally=54,88`.
   - Allows instant bookmarking, sharing, or recovering active draft state on mobile browser refresh.

## Consequences

### Positive
* **Esports-Grade Intelligence**: Eliminates naive averaging errors, actively warning players away from catastrophic hard counters.
* **Rapid 30-Second Execution**: Single unified recommendation list instantly answers "Who is the mathematically best pick right now?".
* **Preserves Static Architecture**: Operates 100% in-memory in the client browser using pre-compiled GMS counter and synergy datasets.

### Negative / Mitigations
* **Lane Inference Ambiguity**: In public solo queue, players occasionally play unconventional off-meta lanes (e.g. Mage in Gold Lane).
  * *Mitigation*: The draft engine allows the user to manually override a hero's lane assignment if needed, defaulting smoothly to inferred canonical primary lane.
