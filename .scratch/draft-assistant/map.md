# Map: Multi-Hero Live Draft Assistant (CDR Engine)

## Notes
- Feature effort to bring esports-grade 5v5 draft pick recommendations into the web application.
- Utilizes existing pre-compiled static JSON telemetry (Mythic rank baseline with `counters` and `synergies` arrays).
- Complies with ADR 0001 (Zero runtime API calls, 100% in-browser computation).

## Decisions so far
- **CDR Formula**: $\mathbf{CDR} = \text{clamp}(\mathbf{PowerScore} + \mathbf{CounterAdvantage} + \mathbf{SynergyBonus} - \mathbf{CompPenalty}, 0, 100)$.
- **Kryptonite Penalty**: Asymmetric non-linear penalty for hard counters ($\theta = 3.5\text{ pp}, \kappa = 1.5, p = 1.2$).
- **Inferred Primary Lane**: First lane in hero's catalog array used for $1.4\times$ direct lane multiplier.
- **Composition Hygiene**: Penalties directly affect numeric CDR score and display diagnostic badges.
- **Baseline**: Defaults to Mythic rank dataset.
- Formalized in [ADR 0007](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/docs/adr/0007-esports-composite-draft-rating-and-draft-engine.md).
- Implemented pure math core in [draftEngine.ts](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/src/utils/draftEngine.ts) ([Ticket 02](issues/02-draft-scoring-engine-and-math-core.md)).
- Implemented composition diagnostics and lane inference in [draftHygiene.ts](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/src/utils/draftHygiene.ts) ([Ticket 03](issues/03-composition-hygiene-and-lane-inference.md)).
- Built interactive mobile UI in [DraftView.tsx](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/src/components/DraftView.tsx) ([Ticket 04](issues/04-multi-hero-draft-picker-and-live-recommendation-ui.md)).
- Integrated Draft Assistant navigation, session state, and URL synchronization in [TierListDashboard.tsx](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/src/components/TierListDashboard.tsx) ([Ticket 05](issues/05-draft-session-state-and-url-sync.md)).

## Fog
- None. All issues resolved and verified.

## Issues
- [x] [01: Grilling Composite Draft Rating Formula](issues/01-grilling-composite-draft-rating-formula.md)
- [x] [02: Draft Scoring Engine & Math Core](issues/02-draft-scoring-engine-and-math-core.md)
- [x] [03: Composition Hygiene & Lane Inference Utilities](issues/03-composition-hygiene-and-lane-inference.md)
- [x] [04: Multi-Hero Draft Picker & Live Recommendation UI](issues/04-multi-hero-draft-picker-and-live-recommendation-ui.md)
- [x] [05: Header Integration, Draft Session State & URL Sync](issues/05-draft-session-state-and-url-sync.md)
