"""Ladle refractory wear dashboard (prototype).

Run:  pip install -r requirements.txt && streamlit run app.py

simulate_heat() generates SYNTHETIC data with the same output names as
SINTEF/refractorywear (TsteelV, TslagV, TmeasV, q*V, yerode).
To use the real model, replace the body of simulate_heat() with a call
to the repo's code (see example.py there) and return the same dict keys.
"""
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st

st.set_page_config(page_title="Ladle Refractory Wear", layout="wide")

N_BRICK = 10          # brick layers, 1 = bottom ... 10 = top
LIMIT = 0.80          # erosion fraction at which a layer is considered critical


def wear_rate(tap_T, gas, steel_t):
    """Erosion fraction added per heat, per brick layer (synthetic)."""
    i = np.arange(1, N_BRICK + 1)
    profile = np.exp(-((i - 6) / 1.8) ** 2) + 0.25          # peak near slag line
    return 0.012 * profile * (gas / 300) ** 0.6 * (tap_T / 1600) ** 8 * (steel_t / 100) ** 0.3


@st.cache_data
def simulate_heat(heat, tap_T, steel_t, gas, power_mw, seed=0):
    """Return dict of time series + erosion. REPLACE with real model call."""
    rng = np.random.default_rng(seed + heat)
    t = np.linspace(0, 70 * 60, 281)                         # s
    m = t / 60
    on = (m > 20) & (m < 40)                                 # heater on
    Tsteel = tap_T - 0.9 * m + np.where(on, 0, 0)
    Tsteel = Tsteel + np.cumsum(on) * power_mw * 0.0125 - 0.3 * np.cumsum(~on & (m > 40)) * 0.05
    Tslag = Tsteel + 15 - 0.1 * m
    Tmeas = Tsteel + rng.normal(0, 1.5, len(t))
    Twall = 900 + 0.2 * (Tsteel - 1500)
    qsteel = 0.9 * (Tsteel - Twall) * (gas / 300) ** 0.4
    qslag = 0.6 * (Tslag - Twall)
    qwall = 0.5 * (qsteel + qslag)
    qbottom = 0.8 * qsteel
    per_heat = wear_rate(tap_T, gas, steel_t)
    yerode = np.clip(heat * per_heat, 0, 1)
    return dict(
        TimeV=t, TsteelV=Tsteel, TslagV=Tslag, TmeasV=Tmeas,
        TInnerW=Twall + 150, TOuterW=Twall - 500,
        qslagV=qslag, qsteelV=qsteel, qwallV=qwall, qbottomV=qbottom,
        yerode=yerode, per_heat=per_heat,
    )


# ---------------- sidebar ----------------
st.sidebar.header("Heat conditions")
heat = st.sidebar.slider("Heats since rebuild (nusos)", 1, 120, 45)
ladle = st.sidebar.number_input("Ladle number (ncuch)", 1, 50, 7)
steel_t = st.sidebar.slider("Liquid steel (ton)", 60, 140, 100)
tap_T = st.sidebar.slider("Tapping T (°C)", 1560, 1660, 1610)
gas = st.sidebar.slider("Gas flow (L/min)", 100, 600, 300)
power = st.sidebar.slider("Heater power (MW)", 0, 15, 8)

r = simulate_heat(heat, tap_T, steel_t, gas, power)
worst = int(np.argmax(r["yerode"])) + 1
worst_val = float(r["yerode"].max())
remaining = (LIMIT - worst_val) / r["per_heat"][worst - 1]

# ---------------- header / KPIs ----------------
st.title("Ladle Refractory Wear Dashboard")
st.caption(f"Ladle {ladle} · heat {heat} · synthetic demo data (plug in the real model in simulate_heat)")
c1, c2, c3, c4 = st.columns(4)
c1.metric("Worst brick layer", f"#{worst}")
c2.metric("Max erosion", f"{worst_val:.0%}", delta=f"limit {LIMIT:.0%}", delta_color="off")
c3.metric("Est. heats left", f"{max(remaining, 0):.0f}")
c4.metric("Final steel T", f"{r['TsteelV'][-1]:.0f} °C")
if worst_val >= LIMIT:
    st.error("Critical wear: do not use this ladle for another heat.")
elif remaining < 5:
    st.warning("Wear approaching limit: plan relining.")
else:
    st.success("Ladle OK for the next heat.")

tab1, tab2, tab3, tab4 = st.tabs(["Temperature", "Heat flux", "Erosion", "Next heat"])
x = r["TimeV"] / 60

with tab1:
    fig = go.Figure()
    for k, n in [("TsteelV", "Steel (model)"), ("TslagV", "Slag (model)"), ("TmeasV", "Steel (measured)")]:
        fig.add_scatter(x=x, y=r[k], name=n, mode="markers" if k == "TmeasV" else "lines",
                        marker=dict(size=3))
    fig.update_layout(xaxis_title="Time (min)", yaxis_title="Temperature (°C)", height=420)
    st.plotly_chart(fig, use_container_width=True)
    rmse = float(np.sqrt(np.mean((r["TsteelV"] - r["TmeasV"]) ** 2)))
    st.caption(f"Model vs measured RMSE: {rmse:.1f} °C")

with tab2:
    fig = go.Figure()
    for k in ["qslagV", "qsteelV", "qwallV", "qbottomV"]:
        fig.add_scatter(x=x, y=r[k], name=k, mode="lines")
    fig.update_layout(xaxis_title="Time (min)", yaxis_title="Heat flux (a.u.)", height=420)
    st.plotly_chart(fig, use_container_width=True)

with tab3:
    layers = [f"#{i}" for i in range(1, N_BRICK + 1)]
    colors = ["#d62728" if v >= LIMIT else "#1f77b4" for v in r["yerode"]]
    fig = go.Figure(go.Bar(x=layers, y=r["yerode"], marker_color=colors))
    fig.add_hline(y=LIMIT, line_dash="dash", annotation_text="limit")
    fig.update_layout(xaxis_title="Brick layer", yaxis_title="yerode (fraction)",
                      yaxis_range=[0, 1], height=380)
    st.plotly_chart(fig, use_container_width=True)
    hs = np.arange(1, 121)
    traj = np.array([simulate_heat(h, tap_T, steel_t, gas, power)["yerode"][worst - 1] for h in hs])
    fig2 = go.Figure(go.Scatter(x=hs, y=traj, mode="lines", name=f"Layer #{worst}"))
    fig2.add_hline(y=LIMIT, line_dash="dash")
    fig2.add_vline(x=heat, line_dash="dot")
    fig2.update_layout(xaxis_title="Heats since rebuild", yaxis_title="Erosion, worst layer", height=320)
    st.plotly_chart(fig2, use_container_width=True)

with tab4:
    st.write("Change the sidebar conditions to test the next heat.")
    inc = r["per_heat"]
    after = np.clip(r["yerode"] + inc, 0, 1)
    df = pd.DataFrame({"Layer": layers, "Now": r["yerode"].round(3),
                       "Added by heat": inc.round(4), "After": after.round(3)})
    st.dataframe(df, use_container_width=True, hide_index=True)
    if after.max() >= LIMIT:
        st.error(f"After this heat layer #{int(after.argmax()) + 1} reaches {after.max():.0%}: unsafe.")
    else:
        st.success(f"After this heat max erosion is {after.max():.0%}: safe.")
