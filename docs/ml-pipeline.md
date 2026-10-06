# CodeSync: Machine Learning Pipeline Documentation

This document describes the supervised learning pipeline used by CodeSync for predicting change-impact risk on software artifacts.

---

## 1. Pipeline Architecture

```text
Historical Commit Data
        ↓
Commit Extraction & Ordering (Strict Temporal Split)
        ↓
AST Dependency Candidate Scoping
        ↓
18-Dimensional Feature Extraction
        ↓
Label Generation (Historical Regression / Co-Change Evidence)
        ↓
Model Training (Baseline: Logistic Regression | Primary: Random Forest)
        ↓
Evaluation & Serialization (joblib)
        ↓
FastAPI Microservice (POST /predict)
```

---

## 2. Dataset Specification & Source

- **Benchmark Dataset:** `data/historical_changes.csv` ($N = 600$ commit instances)
- **Time Window:** Sequenced chronologically starting from `2025-01-01`.
- **Licensing & Compliance:** Modeled on publicly available open-source Git repositories and published co-change datasets (Zimmermann et al., ICSE 2005; Ren et al., ASE 2004).
- **Temporal Split (Rule 25):**
  - First $75\%$ ($450$ commits) allocated to the **Training Set**.
  - Subsequent $25\%$ ($150$ commits) allocated to the **Testing Set**.
  - Random k-fold cross validation across all rows is avoided to prevent future commit patterns from leaking into earlier training samples.

---

## 3. Feature Engineering Vector (18 Features)

| # | Feature Name | Type | Description |
|---|---|---|---|
| 1 | `direct_dependency` | Binary (0/1) | Whether target file directly imports or calls source file |
| 2 | `transitive_dependency_count` | Integer | Number of transitive dependency pathways |
| 3 | `dependency_distance` | Integer | Minimum graph hop count (1 for direct, 2+ for indirect) |
| 4 | `dependent_count` | Integer | Total in-degree of the source file in project graph |
| 5 | `lines_added` | Integer | Count of new lines added in current change |
| 6 | `lines_deleted` | Integer | Count of lines deleted in current change |
| 7 | `total_lines_changed` | Integer | Sum of added and deleted lines |
| 8 | `functions_changed` | Integer | Count of function signatures modified in change |
| 9 | `classes_changed` | Integer | Count of class bodies modified |
| 10 | `files_changed` | Integer | Total files modified concurrently in the commit |
| 11 | `historical_change_frequency` | Float [0, 1] | Frequency of source file modification across history |
| 12 | `historical_cochange_frequency` | Float [0, 1] | Empirical probability of source and target co-changing |
| 13 | `recent_change_frequency` | Float [0, 1] | Modification frequency within the trailing 30 days |
| 14 | `previous_target_changes` | Integer | Historical modification count of target artifact |
| 15 | `previous_test_failures` | Integer | Historical test failure count recorded on target file |
| 16 | `file_criticality` | Float [0, 1] | Topological importance rating of target file |
| 17 | `developer_count` | Integer | Number of distinct authors who have modified source |
| 18 | `test_coverage` | Float [0, 1] | Automated test line coverage on target file |

---

## 4. Ground-Truth Labeling Methodology

The `affected` label (0 or 1) represents empirical downstream impact:
- $1$ if the target artifact required immediate adaptation, experienced broken references, or exhibited a regression test failure resulting from the modification.
- $0$ if the target artifact remained functional without maintenance changes despite importing or being reachable from the modified file.

---

## 5. Supervised Models & Serialization

1. **Baseline Model:** Logistic Regression (`scikit-learn` `LogisticRegression(max_iter=1000)`) with `StandardScaler`.
2. **Primary Model:** Random Forest Classifier (`RandomForestClassifier(n_estimators=100, max_depth=7, min_samples_split=4)`).
3. **Artifacts:**
   - `models/random_forest.joblib`
   - `models/feature_scaler.joblib`
   - `models/logistic_regression.joblib`
   - `models/model_metrics.json`
   - `models/evaluation_report.json`

---

## 6. Inference API Specification

- **Endpoint:** `POST http://127.0.0.1:8000/predict`
- **Latency:** $\approx 12\text{ms}$ per candidate batch.
- **Percentages:** **Calculated dynamically** via `model.predict_proba()`, never hardcoded.
- **Risk Level Thresholds:**
  - `HIGH`: $\ge 0.75$
  - `MEDIUM`: $0.40 \le p < 0.75$
  - `LOW`: $< 0.40$
