# Ladle refractory wear dashboard

Prototype dashboard that visualizes ladle temperatures, heat fluxes, and
refractory erosion per brick layer, plus a next-heat safety check.

## Live dashboard

Open `index.html` in a browser, or enable GitHub Pages (Settings > Pages >
Deploy from a branch > `main` / root) and visit
`https://<your-user>.github.io/refractory/`. No installation needed.

## Streamlit version

```
pip install -r requirements.txt
streamlit run app.py
```

## Data

The current version uses **synthetic data**. Output names (`TsteelV`, `TslagV`,
`TmeasV`, `qslagV`, `qsteelV`, `qwallV`, `qbottomV`, `yerode`) follow the
SINTEF/refractorywear model, but the numbers are not real.

To use the real model, replace the body of `simulate_heat()` in `app.py` with a
call to that model and return a dict with the same keys.

## Credits

Variable naming follows [SINTEF/refractorywear](https://github.com/SINTEF/refractorywear)
(MIT license). If you copy any of its code into this repo, keep its license notice.
