# Ladle refractory wear dashboard

Prototype dashboard for ladle lining wear, structured after the SINTEF paper
"A pragmatical physics-based model for predicting ladle lifetime" (2024) and its
open-source model, SINTEF/refractorywear (MIT license).

## What it shows

- 3D cutaway of the ladle (the paper's 2D axisymmetric model revolved), colored by erosion per brick row
- Wall cross-section at any brick row: 3 MgO-C wear bricks, backup/insulation, steel shell
- Erosion by brick row (40 rows; slag line near row 34 for a 120 t heat)
- Steel/slag temperature and heat flux over a heat
- Materials and wear-mechanism summary (carbon dissolves into steel, MgO into slag)

## Live dashboard

Open `index.html` in a browser, or enable GitHub Pages (Settings > Pages >
Deploy from a branch > `main` / root) and visit
`https://<your-user>.github.io/refractory/`.

## Data

All numbers are **synthetic**. Output names (`TsteelV`, `TslagV`, `TmeasV`, `q*V`,
`yerode`) follow the SINTEF model. The erosion profile shape is qualitative, after
the paper's figures. Real ladle dimensions are confidential, so the 3D shape is
illustrative.

## Streamlit version

`app.py` (older, simplified 10-layer version): `pip install -r requirements.txt`
then `streamlit run app.py`.

## Credits

[SINTEF/refractorywear](https://github.com/SINTEF/refractorywear), MIT license.
If you copy any of its code into this repo, keep its license notice.
