# SmartCart AI — Architecture Documentation

```mermaid
graph TD
    Client[React + TypeScript + Tailwind CSS Frontend]
    Express[Node.js + Express REST API Gateway]
    FastAPI[Python FastAPI AI Microservice]
    NeonOLTP[(Neon PostgreSQL - OLTP Schema)]
    NeonDW[(Neon PostgreSQL - Warehouse Schema)]
    Gemini[Google Gemini 1.5 Flash API]
    ModelRF[RandomForest Risk Model]
    ModelSHAP[SHAP Explainability Engine]
    ModelApriori[Apriori Mining Engine]
    ModelKMeans[K-Means Clustering Engine]

    Client -->|REST CRUD| Express
    Express -->|SQL Queries| NeonOLTP
    Express -->|Proxy AI Calls| FastAPI
    FastAPI -->|LLM Prompts| Gemini
    FastAPI -->|Inference| ModelRF
    FastAPI -->|Waterfall Importances| ModelSHAP
    FastAPI -->|Association Rules| ModelApriori
    FastAPI -->|Heatmap Clustering| ModelKMeans
    Express -->|OLAP Rollups| NeonDW
```

## System Architecture Summary

SmartCart AI is built as a microservice architecture:
1. **Frontend**: React + Vite + TypeScript + Tailwind CSS running on port 5173.
2. **Backend API Gateway**: Node.js + Express running on port 3001 connecting to Cloud PostgreSQL.
3. **AI Microservice**: Python + FastAPI running on port 8000 hosting all machine learning algorithms and LLM calls.
4. **Cloud Database**: Neon PostgreSQL hosting `oltp` schema for live transactions and `warehouse` star schema for historical mining.
