export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'Admin' | 'Developer' | 'Reviewer' | 'Viewer';
  avatar_url?: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  path: string;
  name: string;
  language: string;
  module?: string;
  owner_id?: string;
  owner_name?: string;
  owner_role?: string;
  is_directory: boolean;
  content?: string;
  canEdit?: boolean;
  editRestrictionReason?: string;
}

export interface DependencyEdgeView {
  id: string;
  source: string;
  target: string;
  sourcePath: string;
  targetPath: string;
  relationshipType: string;
  distance: number;
  metadata?: any;
}

export interface DependencyGraphData {
  nodes: Array<{
    id: string;
    path: string;
    name: string;
    module?: string;
    ownerId?: string;
    ownerName?: string;
    ownerRole?: string;
  }>;
  edges: DependencyEdgeView[];
}

export interface MLPrediction {
  targetFile: string;
  targetFileId?: string;
  impactProbability: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  isAffected: boolean;
  explanationFactors: string[];
}

export interface TestResultItem {
  testName: string;
  filePath: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  durationMs: number;
  errorMessage?: string;
  stackTrace?: string;
}

export interface TestExecutionResult {
  testRunId: string;
  status: 'passed' | 'failed';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  durationMs: number;
  results: Array<{
    testName: string;
    fileId?: string;
    filePath: string;
    status: 'passed' | 'failed';
    durationMs: number;
    errorMessage?: string;
    stackTrace?: string;
  }>;
}

export interface TestRun {
  id: string;
  project_id: string;
  triggered_by_name?: string;
  status: 'passed' | 'failed';
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  duration_ms: number;
  created_at: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  doc_type: string;
  content: string;
  version: number;
}

export interface DocumentLink {
  id: string;
  document_id: string;
  doc_title: string;
  target_file_id: string;
  file_path: string;
  file_name: string;
  target_symbol?: string;
  link_type: string;
}

export interface AccessRequestItem {
  id: string;
  file_id: string;
  file_name: string;
  file_path: string;
  requester_id: string;
  requester_name: string;
  requester_role: string;
  owner_id: string;
  owner_name: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  user_name: string;
  user_role: string;
  action: string;
  status: string;
  details: any;
  created_at: string;
}
