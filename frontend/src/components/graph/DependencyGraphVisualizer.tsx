import React, { useState } from 'react';
import { DependencyGraphData, MLPrediction } from '../../types';
import { Icons } from '../common/Icons';

interface DependencyGraphVisualizerProps {
  graphData: DependencyGraphData;
  activeFilePath?: string;
  predictions: MLPrediction[];
  onSelectNodeFile?: (filePath: string) => void;
}

export const DependencyGraphVisualizer: React.FC<DependencyGraphVisualizerProps> = ({
  graphData,
  activeFilePath,
  predictions,
  onSelectNodeFile
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Filters
  const [showImports, setShowImports] = useState(true);
  const [showTests, setShowTests] = useState(true);
  const [showImpactOnly, setShowImpactOnly] = useState(false);
  const [showOwnership, setShowOwnership] = useState(true);

  const width = 840;
  const height = 300;

  const nodePositions = new Map<string, { x: number; y: number }>();
  const nodes = graphData.nodes || [];
  const edges = graphData.edges || [];

  // Arrange nodes cleanly across 3 vertical tiers
  nodes.forEach((node, index) => {
    let col = 1;
    if (node.path.startsWith('frontend/')) col = 0;
    else if (node.path.startsWith('backend/')) col = 1;
    else if (node.path.startsWith('tests/')) col = 2;

    const x = 100 + col * 270;
    const sameColNodes = nodes.filter((n) => {
      if (col === 0) return n.path.startsWith('frontend/');
      if (col === 1) return n.path.startsWith('backend/');
      return n.path.startsWith('tests/');
    });
    const colIndex = sameColNodes.findIndex((n) => n.id === node.id);
    const y = 45 + colIndex * 90;

    nodePositions.set(node.id, { x, y });
  });

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedNodeEdges = selectedNode
    ? edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
    : [];

  const selectedNodePrediction = selectedNode
    ? predictions.find((p) => p.targetFile === selectedNode.path)
    : null;

  // Filtered edges
  const filteredEdges = edges.filter((e) => {
    if (!showImports && e.relationshipType === 'IMPORT') return false;
    if (!showTests && e.relationshipType === 'TEST_REFERENCE') return false;
    return true;
  });

  const handleZoomIn = () => setZoom((z) => Math.min(2.0, Number((z + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div style={{ display: 'flex', height: '100%', gap: '14px', fontSize: '12px' }}>
      {/* Graph Canvas Container */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: '#090d16',
        borderRadius: '6px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Controls Toolbar */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          right: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          pointerEvents: 'none'
        }}>
          {/* Filter Toggles */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            pointerEvents: 'auto'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={showImports}
                onChange={(e) => setShowImports(e.target.checked)}
                style={{ accentColor: 'var(--accent-blue)' }}
              />
              Imports
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={showTests}
                onChange={(e) => setShowTests(e.target.checked)}
                style={{ accentColor: '#a855f7' }}
              />
              Tests
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={showOwnership}
                onChange={(e) => setShowOwnership(e.target.checked)}
                style={{ accentColor: 'var(--color-low)' }}
              />
              Owners
            </label>
          </div>

          {/* Zoom / Fit Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            padding: '4px 8px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            pointerEvents: 'auto'
          }}>
            <button className="btn btn-sm" onClick={handleZoomOut} title="Zoom Out" style={{ padding: '2px 8px' }}>
              -
            </button>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', minWidth: '40px', textAlign: 'center', color: 'var(--text-main)' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button className="btn btn-sm" onClick={handleZoomIn} title="Zoom In" style={{ padding: '2px 8px' }}>
              +
            </button>
            <button className="btn btn-sm" onClick={handleResetZoom} title="Reset to Fit" style={{ padding: '2px 8px', fontSize: '11px' }}>
              Fit
            </button>
          </div>
        </div>

        {/* SVG Diagram Canvas */}
        <div style={{ flex: 1, width: '100%', height: '100%', overflow: 'hidden' }}>
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${width} ${height}`}
            style={{
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease'
            }}
          >
            <defs>
              <marker
                id="arrowhead-default"
                markerWidth="8"
                markerHeight="6"
                refX="14"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#475569" />
              </marker>
              <marker
                id="arrowhead-highlight"
                markerWidth="8"
                markerHeight="6"
                refX="14"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#6366f1" />
              </marker>
              <marker
                id="arrowhead-test"
                markerWidth="8"
                markerHeight="6"
                refX="14"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#a855f7" />
              </marker>
            </defs>

            {/* Directed Relationship Edges */}
            {filteredEdges.map((edge) => {
              const srcPos = nodePositions.get(edge.source);
              const tgtPos = nodePositions.get(edge.target);
              if (!srcPos || !tgtPos) return null;

              const isHighlighted =
                selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);

              const isTestRel = edge.relationshipType === 'TEST_REFERENCE';
              const strokeColor = isHighlighted
                ? '#6366f1'
                : isTestRel
                ? '#a855f7'
                : '#334155';

              const markerId = isHighlighted
                ? 'url(#arrowhead-highlight)'
                : isTestRel
                ? 'url(#arrowhead-test)'
                : 'url(#arrowhead-default)';

              return (
                <g key={edge.id}>
                  <line
                    x1={srcPos.x + 75}
                    y1={srcPos.y + 24}
                    x2={tgtPos.x + 75}
                    y2={tgtPos.y + 24}
                    stroke={strokeColor}
                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                    strokeDasharray={isTestRel ? '4,4' : 'none'}
                    markerEnd={markerId}
                  />
                  <text
                    x={(srcPos.x + tgtPos.x) / 2 + 75}
                    y={(srcPos.y + tgtPos.y) / 2 + 18}
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                  >
                    {edge.relationshipType}
                  </text>
                </g>
              );
            })}

            {/* AST Nodes */}
            {nodes.map((node) => {
              const pos = nodePositions.get(node.id) || { x: 50, y: 50 };
              const isSelected = node.id === selectedNodeId;
              const isModifiedSource = activeFilePath && node.path === activeFilePath;

              // Check if ML predicted impact on this node
              const pred = predictions.find((p) => p.targetFile === node.path);
              let borderColor = '#334155';
              let nodeBg = '#0f172a';
              let badgeColor = null;

              if (isModifiedSource) {
                borderColor = 'var(--accent-blue)';
                nodeBg = 'rgba(99, 102, 241, 0.15)';
              } else if (pred) {
                if (pred.riskLevel === 'HIGH') {
                  borderColor = 'var(--color-high)';
                  nodeBg = 'rgba(239, 68, 68, 0.12)';
                  badgeColor = 'var(--color-high)';
                } else if (pred.riskLevel === 'MEDIUM') {
                  borderColor = 'var(--color-med)';
                  nodeBg = 'rgba(245, 158, 11, 0.12)';
                  badgeColor = 'var(--color-med)';
                } else {
                  borderColor = 'var(--color-low)';
                  nodeBg = 'rgba(34, 197, 94, 0.12)';
                  badgeColor = 'var(--color-low)';
                }
              }

              if (isSelected) {
                borderColor = '#38bdf8';
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => {
                    setSelectedNodeId(node.id);
                    if (onSelectNodeFile) onSelectNodeFile(node.path);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    width="150"
                    height="48"
                    rx="6"
                    fill={nodeBg}
                    stroke={borderColor}
                    strokeWidth={isSelected || isModifiedSource || pred ? 2 : 1}
                  />
                  <text
                    x="10"
                    y="20"
                    fill="#f8fafc"
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="JetBrains Mono"
                  >
                    {node.name}
                  </text>
                  {showOwnership && (
                    <text x="10" y="36" fill="#94a3b8" fontSize="10">
                      {node.ownerName ? node.ownerName.split(' ')[0] : 'Unassigned'}
                    </text>
                  )}
                  {badgeColor && (
                    <circle cx="136" cy="16" r="5" fill={badgeColor} />
                  )}
                  {isModifiedSource && (
                    <text x="136" y="36" fill="var(--accent-blue)" fontSize="10" textAnchor="end" fontFamily="JetBrains Mono">
                      [EDIT]
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Elevated Node Inspector Card */}
      <div style={{
        width: '280px',
        backgroundColor: 'var(--bg-surface)',
        padding: '14px',
        borderRadius: '6px',
        border: '1px solid var(--border-color)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Node Inspector
          </div>
          {selectedNode && (
            <button
              className="btn btn-sm"
              onClick={() => setSelectedNodeId(null)}
              style={{ padding: '1px 6px', fontSize: '10px' }}
            >
              Clear
            </button>
          )}
        </div>

        {selectedNode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Artifact Info */}
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>
                Artifact Path
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', wordBreak: 'break-all' }}>
                {selectedNode.path}
              </div>
            </div>

            {/* Ownership */}
            <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#090d16', padding: '8px 10px', borderRadius: '4px' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Assigned Owner</div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '11px' }}>
                  {selectedNode.ownerName || 'Unassigned'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Role</div>
                <div style={{ color: 'var(--accent-blue)', fontSize: '11px', fontWeight: 600 }}>
                  {selectedNode.ownerRole || 'Developer'}
                </div>
              </div>
            </div>

            {/* ML Prediction Risk Badge */}
            {selectedNodePrediction && (
              <div style={{
                padding: '8px 10px',
                borderRadius: '4px',
                backgroundColor: selectedNodePrediction.riskLevel === 'HIGH'
                  ? 'var(--color-high-bg)'
                  : selectedNodePrediction.riskLevel === 'MEDIUM'
                  ? 'var(--color-med-bg)'
                  : 'var(--color-low-bg)',
                border: `1px solid ${selectedNodePrediction.riskLevel === 'HIGH' ? 'var(--color-high)' : 'var(--color-med)'}44`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>ML Impact Risk</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '11px' }}>
                    {selectedNodePrediction.riskLevel} ({Math.round(selectedNodePrediction.impactProbability * 100)}%)
                  </span>
                </div>
              </div>
            )}

            {/* Edges Breakdown */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                AST Invocations & References ({selectedNodeEdges.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '140px', overflowY: 'auto' }}>
                {selectedNodeEdges.map((e) => (
                  <div
                    key={e.id}
                    style={{
                      fontSize: '11px',
                      padding: '5px 8px',
                      backgroundColor: '#090d16',
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{e.relationshipType}</span>
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      {e.source === selectedNode.id ? `↳ depends on ${e.targetPath}` : `↰ called by ${e.sourcePath}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Open in Editor Action */}
            {onSelectNodeFile && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onSelectNodeFile(selectedNode.path)}
                style={{ marginTop: '4px', justifyContent: 'center' }}
              >
                <Icons.File size={13} color="#fff" />
                <span>Open in Monaco Editor</span>
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px 10px',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            <Icons.Network size={24} color="var(--text-muted)" />
            <p style={{ marginTop: '8px', fontSize: '11px', lineHeight: 1.5 }}>
              Select any node in the AST dependency graph to inspect structural relationships and ownership.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
