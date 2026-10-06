import { ENV } from '../config/env';
import { db } from '../config/database';
import { CandidateImpactFile } from '../../../dependency-engine/dist/index';

export interface MLPredictionResult {
  targetFile: string;
  targetFileId?: string;
  impactProbability: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  isAffected: boolean;
  explanationFactors: string[];
}

export class MLInferenceService {
  /**
   * Calls the Python FastAPI ML Service to score candidate files.
   */
  public static async predictImpact(
    projectId: string,
    changeId: string,
    sourceFile: string,
    sourceFileId: string,
    candidates: CandidateImpactFile[],
    changeMetadata: {
      linesAdded: number;
      linesDeleted: number;
      functionsChanged: string[];
    }
  ): Promise<{ status: 'success' | 'unavailable'; predictions: MLPredictionResult[]; error?: string }> {
    if (candidates.length === 0) {
      return { status: 'success', predictions: [] };
    }

    try {
      const payload = {
        source_file: sourceFile,
        change_metadata: {
          lines_added: changeMetadata.linesAdded,
          lines_deleted: changeMetadata.linesDeleted,
          functions_changed: changeMetadata.functionsChanged,
          classes_changed: [],
          files_changed: 1
        },
        candidates: candidates.map((c) => ({
          target_file: c.targetFile,
          direct_dependency: c.directDependency,
          dependency_distance: c.dependencyDistance,
          relationship_types: c.relationshipTypes,
          symbols_involved: c.symbolsInvolved,
          transitive_path: c.transitivePath
        }))
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`${ENV.ML_SERVICE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`ML Service responded with HTTP ${response.status}`);
      }

      const data = await response.json();

      // Lookup file IDs from database
      const filesRes = await db.query('SELECT id, path FROM files WHERE project_id = ?', [projectId]);
      const pathToId = new Map<string, string>();
      for (const f of filesRes.rows) {
        pathToId.set(f.path.replace(/\\/g, '/'), f.id);
      }

      const predictions: MLPredictionResult[] = [];

      for (const pred of data.predictions) {
        const targetId = pathToId.get(pred.target_file) || '';
        const impact: MLPredictionResult = {
          targetFile: pred.target_file,
          targetFileId: targetId,
          impactProbability: pred.impact_probability,
          riskLevel: pred.risk_level,
          isAffected: pred.is_affected,
          explanationFactors: pred.explanation_factors
        };
        predictions.push(impact);

        // Store impact prediction in database
        if (targetId) {
          const impactId = `imp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await db.query(
            `INSERT INTO change_impacts (id, change_id, source_file_id, target_file_id, impact_probability, risk_level, predicted_by, explanation)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              impactId,
              changeId,
              sourceFileId,
              targetId,
              pred.impact_probability,
              pred.risk_level,
              data.model_name || 'RandomForestClassifier_v1',
              JSON.stringify(pred.explanation_factors)
            ]
          );
        }
      }

      return { status: 'success', predictions };
    } catch (err: any) {
      console.warn(`[MLService] ML inference unavailable (${err.message}). Complying with rule 52.`);
      return {
        status: 'unavailable',
        predictions: [],
        error: 'ML impact prediction unavailable.'
      };
    }
  }
}
