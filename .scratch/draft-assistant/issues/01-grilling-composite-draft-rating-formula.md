# 01: Grilling Composite Draft Rating Formula

Type: grilling
Status: resolved

## Question
What is objectively the best mathematical formula for an in-draft multi-hero counter and recommendation engine, grounded in real esports evidence and metrics?

## Context
During live drafting, naive linear averaging fails to capture fatal hard counters (the Kryptonite effect), early laning phase interaction disparity, and team composition defects (damage monoculture, missing retribution).
The grilling interview explored options for lane inference, composition penalty integration, and rank dataset baselines.

## Answer
The grilling interview aligned on the following core decisions:
1. **Inferred Primary Lane**: The engine automatically assigns the primary lane as the first listed lane (`lanes[0]`) in hero metadata. Same-lane matchups receive a $1.4\times$ interaction weight; roam/jungle vectors receive $1.2\times$.
2. **Kryptonite Non-Linear Penalty**: Severe hard counters ($> 3.5\text{ pp}$ negative shift) apply an exponential penalty ($\kappa = 1.5, p = 1.2$) ensuring fatal counters rapidly drop candidate picks down the recommendation stack.
3. **Composition Penalties in CDR**: Team structural flaws (monoculture damage, missing jungler, duplicate marksmen) directly deduct from the numeric CDR score and display diagnostic badges.
4. **Competitive Baseline**: Defaults to the Mythic rank tier telemetry.

Formalized in [ADR 0007](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/docs/adr/0007-esports-composite-draft-rating-and-draft-engine.md) and [CONTEXT.md](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/CONTEXT.md).
