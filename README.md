# Downstream Margin — public demo

A static, no-login build of the **Downstream Margin** app (Oil, Gas & Energy use case 32 in
[`mfg-use-cases`](https://github.com/sfc-gh-dfreriks/mfg-use-cases)), deployed to GitHub Pages:

**https://sfc-gh-dfreriks.github.io/mfg-downstream-margin-public/**

The app follows a barrel from crude purchase to rack sale across four terminals (T100 Midland, T200 Corpus Christi,
T300 Houston, T400 Cushing): nominations and receipts, QCI net@15C inventory and gains/losses, exchange balances with
counterparties, rack pricing against benchmark, and the trading position with mark-to-market. It reads two SAP
instances, each as SAP ECC, S/4HANA, BW/4HANA or SAP BDC, together with a commodity trading & risk system
(Endur / Allegro / RightAngle style) and market prices (Platts / Argus / NYMEX style). The data flows through dbt staging
adapters, a canonical silver layer and gold marts on Snowflake, then to a semantic view, a Cortex Agent and this React
app. All data is synthetic.

**Pages:** Ask Cortex · Executive Dashboard · Margin Waterfall · Inventory & Gains/Losses · Rack Pricing · Exchanges ·
Trading Position · Source Coverage · Data Sources · Field Mapping · SAP Metadata · Sources & Lineage (dbt) · Pipeline in 3D

## Known data caveats

- **Net margin is negative (about -$782M against $268M revenue).** Crude cost is charged on all receipts, not on the
  barrels sold at the rack. Use the margin waterfall to compare terminals and cost lines, not as an absolute P&L.
- **T300 Houston rack discount** is visible in quarter-end months but noisy: some other months dip as far.
- **Materials are stored as SAP codes** 100 Crude Oil, 200 Gasoline, 300 Diesel, 400 Jet A.
- **IS-Oil tables are simulated** (representative names for nominations, QCI measurement and exchanges).
- Exchanges and the trading position carry no terminal, so the terminal filter does not change those pages.
- Field Mapping shows "metadata layer not built" in this snapshot: the dbt metadata models were not run when it was taken.

## How the public build works

- **Snapshot:** built with `VITE_STATIC=1`, the client reads pre-baked JSON in `public/data/` instead of a live `/api`.
  There is no Snowflake connection and no credentials are required. Source selection in the snapshot: SAP A = ECC,
  SAP B = S/4HANA, CTRM and market prices on.
- **Filters:** every terminal subset with all materials is baked, and so are all terminals or one terminal with each
  single material (35 views per page). Other combinations fall back to the nearest baked view.
- **Ask Cortex:** answers are pre-generated for each page's default analysis and every suggested question. Free-text
  questions need the full deployment.
- **Data Sources:** browse each source type and preview its native tables. Apply (which runs dbt in Snowflake) is disabled.

## Full deployment

For live queries, source switching and free-text Ask Cortex, deploy from the source repo:
```bash
git clone https://github.com/sfc-gh-dfreriks/mfg-use-cases
cd mfg-use-cases/use_cases/32_downstream_margin
npm run dev  # from app/
```
See [use_cases/32_downstream_margin/README.md](https://github.com/sfc-gh-dfreriks/mfg-use-cases/blob/main/use_cases/32_downstream_margin/README.md) for full setup instructions.
