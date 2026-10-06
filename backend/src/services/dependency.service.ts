import path from 'path';
import { db } from '../config/database';
// Import compiled dependency engine
import {
  DependencyGraph,
  parseSourceFileAST,
  DependencyEdge,
  CandidateImpactFile
} from '../../../dependency-engine/dist/index';

class ProjectDependencyService {
  private projectGraphs: Map<string, DependencyGraph> = new Map();

  private getGraph(projectId: string): DependencyGraph {
    if (!this.projectGraphs.has(projectId)) {
      this.projectGraphs.set(projectId, new DependencyGraph());
    }
    return this.projectGraphs.get(projectId)!;
  }

  /**
   * Initializes or loads the dependency graph for a project from database records.
   */
  public async loadProjectGraph(projectId: string): Promise<DependencyGraph> {
    const graph = this.getGraph(projectId);
    graph.clear();

    // Load all project files
    const fileRes = await db.query(
      'SELECT id, path, content FROM files WHERE project_id = ? AND is_directory = 0',
      [projectId]
    );

    for (const f of fileRes.rows) {
      graph.registerFile(f.path);
    }

    for (const f of fileRes.rows) {
      if (f.content) {
        const analysis = parseSourceFileAST(f.path, f.content);
        graph.updateFileDependencies(analysis);
      }
    }

    return graph;
  }

  /**
   * Incrementally analyzes a single updated file and syncs edges to the database.
   */
  public async analyzeAndSyncFile(
    projectId: string,
    fileId: string,
    filePath: string,
    content: string
  ): Promise<{ edges: DependencyEdge[]; candidates: CandidateImpactFile[] }> {
    const graph = this.getGraph(projectId);
    graph.registerFile(filePath);

    // 1. Run TypeScript AST parser
    const analysis = parseSourceFileAST(filePath, content);

    // 2. Update in-memory graph
    const newEdges = graph.updateFileDependencies(analysis);

    // 3. Sync edges to persistent database
    // Remove previous edges where source is this file
    await db.query(
      'DELETE FROM dependency_edges WHERE project_id = ? AND source_file_id = ?',
      [projectId, fileId]
    );

    // Query file ID lookup map
    const allFiles = await db.query('SELECT id, path FROM files WHERE project_id = ?', [projectId]);
    const pathToId = new Map<string, string>();
    for (const f of allFiles.rows) {
      pathToId.set(graph.normalizePath(f.path), f.id);
    }

    for (const edge of newEdges) {
      const targetId = pathToId.get(edge.targetFile);
      if (targetId) {
        const edgeId = `edge_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const metaStr = JSON.stringify(edge.metadata);
        await db.query(
          `INSERT INTO dependency_edges (id, project_id, source_file_id, target_file_id, relationship_type, dependency_distance, metadata)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [edgeId, projectId, fileId, targetId, edge.relationshipType, edge.dependencyDistance, metaStr]
        );
      }
    }

    // 4. Get candidate impacted files (downstream reverse dependency traversal)
    const candidates = graph.getCandidateImpactFiles(filePath);

    return { edges: newEdges, candidates };
  }

  /**
   * Retrieves candidate impacted files from in-memory or database graph.
   */
  public async getCandidateFiles(projectId: string, filePath: string): Promise<CandidateImpactFile[]> {
    const graph = this.getGraph(projectId);
    if (graph.getAllFiles().length === 0) {
      await this.loadProjectGraph(projectId);
    }
    return graph.getCandidateImpactFiles(filePath);
  }

  /**
   * Returns complete graph data for visualizer UI.
   */
  public async getVisualizerGraph(projectId: string): Promise<any> {
    const filesRes = await db.query(
      `SELECT f.id, f.path, f.name, f.module, fo.owner_id, p.full_name as owner_name, p.role as owner_role
       FROM files f
       LEFT JOIN file_ownership fo ON f.id = fo.file_id AND fo.status = 'active'
       LEFT JOIN profiles p ON fo.owner_id = p.id
       WHERE f.project_id = ? AND f.is_directory = 0`,
      [projectId]
    );

    const edgesRes = await db.query(
      `SELECT de.id, de.source_file_id, de.target_file_id, de.relationship_type, de.dependency_distance, de.metadata,
              sf.path as source_path, tf.path as target_path
       FROM dependency_edges de
       JOIN files sf ON de.source_file_id = sf.id
       JOIN files tf ON de.target_file_id = tf.id
       WHERE de.project_id = ?`,
      [projectId]
    );

    return {
      nodes: filesRes.rows.map((f: any) => ({
        id: f.id,
        path: f.path,
        name: f.name,
        module: f.module,
        ownerId: f.owner_id,
        ownerName: f.owner_name || 'Unassigned',
        ownerRole: f.owner_role || 'Developer'
      })),
      edges: edgesRes.rows.map((e: any) => ({
        id: e.id,
        source: e.source_file_id,
        target: e.target_file_id,
        sourcePath: e.source_path,
        targetPath: e.target_path,
        relationshipType: e.relationship_type,
        distance: e.dependency_distance,
        metadata: typeof e.metadata === 'string' ? JSON.parse(e.metadata || '{}') : e.metadata
      }))
    };
  }
}

export const dependencyService = new ProjectDependencyService();
