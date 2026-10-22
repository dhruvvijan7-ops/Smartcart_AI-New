# SmartCart AI — Executive Intelligence Platform

SmartCart AI is an AI-native, single-store predictive waste-management and executive-intelligence platform for supermarkets.

## 🚀 Quick Start Guide

### 1. Database Setup (Neon Cloud PostgreSQL)
The database has already been setup and seeded on your Neon cloud instance. To re-seed:
```bash
cd backend
node scripts/setup-db.js
```

### 2. Running Services Locally

#### Backend API (Port 3001)
```bash
cd backend
npm install
npm run dev
```

#### Frontend Dashboard (Port 5173)
```bash
cd frontend
npm install
npm run dev
```

#### AI Microservice (Port 8000)
```bash
cd ai-service
python -m pip install -r requirements.txt
python main.py
```

---

## 🎯 Key Features (12 / 12 Implemented)

1. **Daily AI Executive Briefing**: Gemini-driven operational summary.
2. **Root Cause Tracer**: Mined rule diagnostic tool on Insights page.
3. **Trained Risk-Scoring Model**: RandomForest perishable risk score regressor.
4. **Autonomy Trust Dial**: 5-level autonomy slider gating AI actions.
5. **Dynamic Auto-Discount Engine**: Epsilon-greedy bandit markdown algorithm.
6. **Closed-Loop Reorder Engine**: Exponential smoothing demand forecast restock.
7. **Live Decision Audit Trail**: Streamed decision log feed.
8. **Waste-Together Association Mining**: Apriori algorithm co-spoilage patterns.
9. **Store Risk Heatmap**: K-Means clustering store layout map.
10. **OLAP Drill-Down Cube**: Star-schema rollups across category/zone/month.
11. **Explainable Risk Breakdown**: SHAP waterfall feature importances.
12. **Computer Vision Freshness Scanner**: Image classification freshness score.
