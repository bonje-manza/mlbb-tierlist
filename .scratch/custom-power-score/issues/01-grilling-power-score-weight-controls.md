# 01: Grilling Power Score Weight Controls

Type: grilling
Status: resolved

## Question
How should custom power score weighting behave across mathematics, UI ergonomics, tier invariants, and persistence?

## Context
The user requested adding a feature where the user can modify the power score by changing the weights of winrate, pickrate, and banrate, with default values always available.
Draft ADR 0005 has been staged at `docs/adr/0005-custom-power-score-weighting.md`.

## Answer
The grilling interview completed with the following aligned decisions:
1. **Slider Mechanics**: Relative normalization ($w_i = W_i / \sum W$). Independent 0-100 sliders with live percentage readout, falling back to 50/25/25 if sum is 0.
2. **Niche Pick Dampening**: Toggle switch provided ("Cap niche picks (<0.5% PR) at B Tier"), defaulted to ON, allowing users full control to enable or disable dampening.
3. **UI Surface**: Slide-up bottom sheet drawer (`WeightTuningDrawer`) with 4 quick presets (Default 50/25/25, Pure Win Rate 100/0/0, Ban Priority 30/20/50, High Popularity 40/50/10), interactive sliders, reset button, and an active badge in the control bar.
4. **Dual Persistence**: Saved to `localStorage` (`mlbb_power_score_weights`) and synced to URL query params (`?wr=...&pr=...&br=...&dampen=1|0`).

Formalized in [docs/adr/0005-custom-power-score-weighting.md](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/docs/adr/0005-custom-power-score-weighting.md).
