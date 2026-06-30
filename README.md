# 🛡️ Project Sanjeevani

### A Real-Time Risk Intelligence Platform for Digital Welfare Infrastructure

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-Data_Viz-FF6384?style=flat-square)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)

**Author:** Tanmay Chadha
**Email:** chadhatanmay85@gmail.com
**LinkedIn:** [linkedin.com/in/tanmaychadha03](https://www.linkedin.com/in/tanmaychadha03)

---

## 🎯 Overview

Project Sanjeevani is a district-level monitoring and decision-support system designed to detect early-stage failures in India's digital welfare delivery infrastructure — before they escalate into on-ground crises.

As welfare distribution, education enrollment, and identity verification increasingly depend on digital and biometric systems, silent failures at the village or PIN-code level often go undetected for months. A failed biometric authentication is rarely just a technical error — it can mean a household loses access to subsidized food. A stale enrollment record is rarely just bad data hygiene — it can mean a child has effectively disappeared from the formal education system.

Sanjeevani's core premise: **administrative failure has a measurable signature, and that signature can be scored, monitored, and acted on in real time.**

---

## ⚠️ Problem Statement

Government data systems generate enormous volumes of administrative records, but most dashboards built on top of them are retrospective — they report what happened last quarter. There is a structural gap between:

- **Data availability** (records exist, updated regularly)
- **Operational visibility** (someone with authority actually sees the problem)
- **Actionability** (the right person is notified in time to intervene)

Sanjeevani is built specifically to close that gap, converting raw administrative data into prioritized, threshold-driven alerts that map directly to field interventions.

---

## 🏗️ System Architecture

The platform is organized around independent, purpose-built risk modules. Each module isolates a single failure mode rather than attempting to compress multiple unrelated risks into one composite score — a deliberate design choice to preserve interpretability for non-technical decision-makers.

| Module | Function |
|---|---|
| 🍼 **Poshan Panic Monitor** | Quantifies nutritional risk exposure for children aged 0–5 resulting from welfare access failure |
| 🚧 **Bio-Barrier Analysis** | Identifies adult populations blocked from welfare and banking access due to biometric authentication failure |
| 🎓 **Vidya Drift Monitor** | Tracks school-age children (5–17) at risk of disengagement from the digital education pipeline |
| 👻 **Ghost PIN Detection** | Flags PIN codes with zero recorded digital activity for physical audit |
| 📡 **Migration Pattern Radar** | Detects high population churn zones where static enrollment infrastructure is ineffective |
| 🔮 **Demographic Pipeline Health** | Measures attrition across the enrollment-to-active-participation funnel |

Each module computes a normalized severity score (0–1) against documented interpretation bands, allowing field officers to read a single number and immediately understand the urgency of a given zone.

---

## ⚙️ Adaptive Risk Calibration

Static risk thresholds fail under changing conditions. A threshold appropriate for normal operations is often inadequate during a drought, flood, or other regional shock, when early signals need to surface faster and with lower tolerance.

Sanjeevani addresses this with a configurable calibration layer: every module's risk threshold is controlled by an administrator-facing slider rather than hard-coded in application logic. This allows a District Magistrate to lower sensitivity during a known crisis window and capture early warning signals that would otherwise be missed — without any engineering involvement.

---

## 🌍 Operational Design Considerations

The platform was designed around field deployment realities rather than dashboard aesthetics alone:

- **Localization** — Full interface translation between English and Hindi, reflecting that primary system users at the block and Anganwadi level may not operate comfortably in English.
- **Alert Dispatch Configuration** — Configurable automated notifications (WhatsApp, PDF report generation) ensure that a detected anomaly results in an action, not just a visualization.
- **Scenario Simulation** — A stress-testing mode allows administrators to model the downstream impact of a supply shock or service disruption before it occurs, supporting proactive rather than reactive planning.
- **Global Critical Filter** — A single control filters the entire interface down to only critical-severity zones, reflecting how crisis response actually works: administrators do not need to see what is functioning correctly.

---

## 🛠️ Technical Implementation

- **Frontend:** React (functional components, hooks-based state management)
- **Data Visualization:** Recharts — scatter-based risk heatmaps, time-series migration tracking, demographic funnel analysis
- **Styling:** Tailwind CSS, fully responsive layout
- **Data Pipeline:** JSON-driven ingestion layer with a documented transformation script for mapping raw administrative Excel exports into the application's normalized schema

---

## 🧭 Design Philosophy

Two principles guided every modeling decision in this system:

1. **Interpretability over aggregation.** Bio-Barrier and Poshan Panic, while causally linked — adult authentication failure can directly cause child nutritional risk — are deliberately kept as separate, non-merged metrics. Collapsing them into a single composite score would obscure the distinct interventions each requires. The system surfaces their correlation visually, never numerically.

2. **Action over observation.** Every module is designed to answer not just "what is the current state," but "what is the next operational step." Each critical flag is built to map to a concrete field action — an audit, a mobile enrollment camp, an alert dispatch.

---

## ✅ Summary

Project Sanjeevani is built on a single operating question, applied continuously across every monitored PIN code:

*Is anyone falling through the cracks of the system right now, and if so, where should intervention be directed first?*

---

<p align="center"><sub>Built for Digital India's last-mile administrative infrastructure.</sub></p>
