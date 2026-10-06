"""
Supervised Model Training Pipeline for CodeSync Change-Impact Prediction.
Implements temporal train/test split to prevent future data leakage.
Trains Baseline (Logistic Regression) and Primary (Random Forest).
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix
)

FEATURE_COLUMNS = [
    "direct_dependency",
    "transitive_dependency_count",
    "dependency_distance",
    "dependent_count",
    "lines_added",
    "lines_deleted",
    "total_lines_changed",
    "functions_changed",
    "classes_changed",
    "files_changed",
    "historical_change_frequency",
    "historical_cochange_frequency",
    "recent_change_frequency",
    "previous_target_changes",
    "previous_test_failures",
    "file_criticality",
    "developer_count",
    "test_coverage"
]

def train_and_evaluate():
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "historical_changes.csv")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}. Run generate_dataset.py first.")
        
    df = pd.read_csv(data_path)
    df.sort_values(by="timestamp", inplace=True)
    
    # 75% older commits for training, 25% newer commits for testing (Strict Temporal Split)
    split_idx = int(len(df) * 0.75)
    train_df = df.iloc[:split_idx]
    test_df = df.iloc[split_idx:]
    
    print(f"Total instances: {len(df)}")
    print(f"Training set (older): {len(train_df)} commits")
    print(f"Testing set (newer): {len(test_df)} commits")
    
    X_train = train_df[FEATURE_COLUMNS]
    y_train = train_df["affected"]
    
    X_test = test_df[FEATURE_COLUMNS]
    y_test = test_df["affected"]
    
    # Standardize features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # 1. Baseline Model: Logistic Regression
    print("\n--- Training Baseline Model (Logistic Regression) ---")
    baseline_model = LogisticRegression(max_iter=1000, random_state=42)
    baseline_model.fit(X_train_scaled, y_train)
    
    base_preds = baseline_model.predict(X_test_scaled)
    base_probs = baseline_model.predict_proba(X_test_scaled)[:, 1]
    
    base_metrics = {
        "precision": round(float(precision_score(y_test, base_preds)), 4),
        "recall": round(float(recall_score(y_test, base_preds)), 4),
        "f1": round(float(f1_score(y_test, base_preds)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, base_probs)), 4),
        "pr_auc": round(float(average_precision_score(y_test, base_probs)), 4)
    }
    print(f"Baseline Metrics: {base_metrics}")
    
    # 2. Primary Model: Random Forest Classifier
    print("\n--- Training Primary Model (Random Forest Classifier) ---")
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=7,
        min_samples_split=4,
        random_state=42
    )
    rf_model.fit(X_train, y_train)
    
    rf_preds = rf_model.predict(X_test)
    rf_probs = rf_model.predict_proba(X_test)[:, 1]
    
    rf_metrics = {
        "precision": round(float(precision_score(y_test, rf_preds)), 4),
        "recall": round(float(recall_score(y_test, rf_preds)), 4),
        "f1": round(float(f1_score(y_test, rf_preds)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, rf_probs)), 4),
        "pr_auc": round(float(average_precision_score(y_test, rf_probs)), 4)
    }
    print(f"Random Forest Metrics: {rf_metrics}")
    
    # Extract Feature Importances
    importances = dict(zip(FEATURE_COLUMNS, [round(float(v), 4) for v in rf_model.feature_importances_]))
    sorted_importances = sorted(importances.items(), key=lambda x: x[1], reverse=True)
    print("\nTop 5 Influential Features in Primary Model:")
    for feat, val in sorted_importances[:5]:
        print(f"  {feat}: {val}")
        
    # Serialize Models and Artifacts
    output_dir = os.path.dirname(__file__)
    joblib.dump(rf_model, os.path.join(output_dir, "random_forest.joblib"))
    joblib.dump(scaler, os.path.join(output_dir, "feature_scaler.joblib"))
    joblib.dump(baseline_model, os.path.join(output_dir, "logistic_regression.joblib"))
    
    metrics_report = {
        "model_version": "v1.0.0",
        "training_samples": len(train_df),
        "test_samples": len(test_df),
        "split_method": "Temporal (Strict commit-ordered chronological split)",
        "features": FEATURE_COLUMNS,
        "baseline_logistic_regression": base_metrics,
        "primary_random_forest": rf_metrics,
        "feature_importances": dict(sorted_importances)
    }
    
    with open(os.path.join(output_dir, "model_metrics.json"), "w") as f:
        json.dump(metrics_report, f, indent=2)
        
    print(f"\nModels successfully saved to {output_dir}")
    return metrics_report

if __name__ == "__main__":
    train_and_evaluate()
