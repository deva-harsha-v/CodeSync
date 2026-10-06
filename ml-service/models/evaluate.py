"""
Research Evaluation Suite comparing:
1. Baseline: Dependency-Only Analysis (flagging all structurally connected files)
2. Proposed: Dependency-Engine + Supervised ML Model (CodeSync)
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix
)
from train import FEATURE_COLUMNS

def run_comparative_evaluation():
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "historical_changes.csv")
    df = pd.read_csv(data_path)
    df.sort_values(by="timestamp", inplace=True)
    
    split_idx = int(len(df) * 0.75)
    test_df = df.iloc[split_idx:].copy()
    
    y_true = test_df["affected"].values
    X_test = test_df[FEATURE_COLUMNS]
    
    # 1. Baseline: Dependency-Only Analysis
    # Predicts positive whenever there is any dependency (direct or transitive within distance)
    # This represents standard static analysis practice
    dep_only_preds = (test_df["direct_dependency"] == 1) | (test_df["dependency_distance"] <= 2)
    dep_only_preds = dep_only_preds.astype(int).values
    
    tn_b, fp_b, fn_b, tp_b = confusion_matrix(y_true, dep_only_preds).ravel()
    
    dep_metrics = {
        "method": "Baseline (Dependency-Only Static Analysis)",
        "precision": round(float(precision_score(y_true, dep_only_preds)), 4),
        "recall": round(float(recall_score(y_true, dep_only_preds)), 4),
        "f1": round(float(f1_score(y_true, dep_only_preds)), 4),
        "false_positives": int(fp_b),
        "false_negatives": int(fn_b),
        "true_positives": int(tp_b),
        "true_negatives": int(tn_b)
    }
    
    # 2. Proposed: Dependency + Supervised ML
    model_path = os.path.join(os.path.dirname(__file__), "random_forest.joblib")
    rf_model = joblib.load(model_path)
    
    rf_probs = rf_model.predict_proba(X_test)[:, 1]
    rf_preds = rf_model.predict(X_test)
    
    tn_m, fp_m, fn_m, tp_m = confusion_matrix(y_true, rf_preds).ravel()
    
    # Top-K Hit Rate (percentage of true affected items appearing in top-3 highest predicted probabilities per commit)
    test_df["prob"] = rf_probs
    top_k_hits = 0
    total_commits = 0
    for commit_id, group in test_df.groupby("commit_id"):
        top_k = group.sort_values(by="prob", ascending=False).head(3)
        if (top_k["affected"] == 1).any():
            top_k_hits += 1
        total_commits += 1
    top_k_hit_rate = round(float(top_k_hits / max(1, total_commits)), 4)
    
    fp_reduction = round(float((fp_b - fp_m) / max(1, fp_b) * 100), 2)
    
    ml_metrics = {
        "method": "Proposed (CodeSync Dependency-Engine + Random Forest ML)",
        "precision": round(float(precision_score(y_true, rf_preds)), 4),
        "recall": round(float(recall_score(y_true, rf_preds)), 4),
        "f1": round(float(f1_score(y_true, rf_preds)), 4),
        "roc_auc": round(float(roc_auc_score(y_true, rf_probs)), 4),
        "pr_auc": round(float(average_precision_score(y_true, rf_probs)), 4),
        "top_k_hit_rate": top_k_hit_rate,
        "false_positives": int(fp_m),
        "false_negatives": int(fn_m),
        "true_positives": int(tp_m),
        "true_negatives": int(tn_m),
        "false_positive_reduction_percent": fp_reduction
    }
    
    comparison = {
        "evaluation_title": "Comparative Evaluation: Dependency-Only vs CodeSync Dependency+ML",
        "test_dataset_size": len(test_df),
        "temporal_evaluation_range": f"{test_df['timestamp'].min()} to {test_df['timestamp'].max()}",
        "baseline": dep_metrics,
        "proposed": ml_metrics,
        "research_conclusion": (
            f"The proposed Dependency+ML architecture achieved a Precision of {ml_metrics['precision']} "
            f"and F1 of {ml_metrics['f1']}, reducing false-positive alerts by {fp_reduction}% compared to "
            f"dependency-only baseline, while maintaining Top-k hit rate of {top_k_hit_rate}."
        )
    }
    
    out_file = os.path.join(os.path.dirname(__file__), "evaluation_report.json")
    with open(out_file, "w") as f:
        json.dump(comparison, f, indent=2)
        
    print("\n================== COMPARATIVE EVALUATION RESULTS ==================")
    print(f"Baseline (Dependency-Only): Precision = {dep_metrics['precision']}, Recall = {dep_metrics['recall']}, F1 = {dep_metrics['f1']}, FP = {dep_metrics['false_positives']}")
    print(f"Proposed (Dependency+ML):   Precision = {ml_metrics['precision']}, Recall = {ml_metrics['recall']}, F1 = {ml_metrics['f1']}, FP = {ml_metrics['false_positives']}")
    print(f"False Positive Reduction:   {fp_reduction}%")
    print(f"Top-K Hit Rate:             {top_k_hit_rate}")
    print("====================================================================")
    
    return comparison

if __name__ == "__main__":
    run_comparative_evaluation()
