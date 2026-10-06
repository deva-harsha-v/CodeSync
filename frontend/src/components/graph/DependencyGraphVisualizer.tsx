import React, { useState } from 'react';
import { DependencyGraphData, MLPrediction } from '../../types';

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

  // Position nodes in a 2D layout
  const width = 800;
  const height = 240;

  const nodePositions = new Map<string, { x: number; y: number }>();
  const nodes = graphData.nodes || [];
  const edges = graphData.edges || [];

  // Arrange nodes cleanly across columns
  nodes.forEach((node, index) => {
    let col = 1;
    let row = index;
    if (node.path.startsWith('backend/')) col = 1;
    else if (node.path.startsWith('frontend/')) col = 0;
    else if (node.path.startsWith('tests/')) col = 2;

    const x = 120 + col * 260;
    const countInCol = nodes.filter((n) => {
      if (col === 0) return n.path.startsWith('frontend/');
      if (col === 1) return n.path.startsWith('backend/');
      return n.path.startsWith('tests/');
    }).length;

    const colIndex = nodes.filter((n, i) => i < index && (
      (col === 0 && n.path.startsWith('frontend/')) ||
      (col === 1 && n.path.startsWith('backend/')) ||
      (col === 2 && n.path.startsWith('tests/'))
    )).length;

    const y = 50 + colIndex * 85;
    nodePositions.set(node.id, { x, y });
  });

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedNodeEdges = selectedNode ? edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id) : [];

  return (
    <div style={{ display: 'flex', height: '100%', gap: '16px' }}>
      {/* Interactive SVG Diagram */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0d1117', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
        <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '6px', zIndex: 10 }}>
          <button className="btn btn-sm" onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}>＋</button>
          <button className="btn btn-sm" onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}>－</button>
          <button className="btn btn-sm" onClick={() => setZoom(1)}>Reset</button>
        </div>

        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', transition: 'transform 0.1s' }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="14"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#58a6ff" />
            </marker>
            <marker
              id="arrowhead-highlight"
              markerWidth="8"
              markerHeight="6"
              refX="14"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#f85149" />
            </marker>
          </defs>

          {/* Render Directed Edges */}
          {edges.map((edge) => {
            const srcPos = nodePositions.get(edge.source);
            const tgtPos = nodePositions.get(edge.target);
            if (!srcPos || !tgtPos) return null;

            const isHighlighted = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);
            const strokeColor = isHighlighted ? '#f85149' : '#30363d';

            return (
              <g key={edge.id}>
                <line
                  x1={srcPos.x + 70}
                  y1={srcPos.y + 20}
                  x2={tgtPos.x + 70}
                  y2={tgtPos.y + 20}
                  stroke={strokeColor}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                  strokeDasharray={edge.relationshipType === 'TEST_REFERENCE' ? '4,4' : 'none'}
                  markerEnd={isHighlighted ? 'url(#arrowhead-highlight)' : 'url(#arrowhead)'}
                />
                <text
                  x={(srcPos.x + tgtPos.x) / 2 + 70}
                  y={(srcPos.y + tgtPos.y) / 2 + 14}
                  fill="#8b949e"
                  fontSize="9"
                  fontFamily="JetBrains Mono"
                  textAnchor="middle"
                >
                  {edge.relationshipType}
                </text>
              </g>
            );
          })}

          {/* Render Nodes */}
          {nodes.map((node) => {
            const pos = nodePositions.get(node.id) || { x: 50, y: 50 };
            const isSelected = node.id === selectedNodeId;
            const isModifiedSource = activeFilePath && node.path === activeFilePath;

            // Check if ML predicted impact on this node
            const pred = predictions.find((p) => p.targetFile === node.path);
            let badgeColor = null;
            if (pred) {
              if (pred.riskLevel === 'HIGH') badgeColor = '#f85149';
              else if (pred.riskLevel === 'MEDIUM') badgeColor = '#d29922';
              else badgeColor = '#3fb950';
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
                  width="140"
                  height="44"
                  rx="6"
                  fill={isSelected ? '#30363d' : '#161b22'}
                  stroke={isModifiedSource ? '#58a6ff' : badgeColor || '#30363d'}
                  strokeWidth={isModifiedSource || badgeColor ? 2 : 1}
                />
                <text x="8" y="18" fill="#f0f6fc" fontSize="11" fontWeight="600" fontFamily="JetBrains Mono">
                  {node.name}
                </text>
                <text x="8" y="34" fill="#8b949e" fontSize="10">
                  {node.ownerName ? node.ownerName.split(' ')[0] : 'No Owner'}
                </text>
                {badgeColor && (
                  <circle cx="128" cy="14" r="5" fill={badgeColor} />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Node Inspector Sidebar */}
      <div style={{ width: '260px', background: 'var(--bg-surface)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', overflowY: 'auto' }}>
        <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
          Node Inspector
        </h4>

        {selectedNode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div>
              <strong>Artifact:</strong> <code style={{ fontFamily: 'var(--font-mono)' }}>{selectedNode.path}</code>
            </div>
            <div>
              <strong>Owner:</strong> {selectedNode.ownerName || 'Unassigned'} ({selectedNode.ownerRole || 'Developer'})
            </div>
            <div>
              <strong>Connected Edges:</strong> {selectedNodeEdges.length}
            </div>

            <div style={{ marginTop: '8px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Dependencies & Callers:</div>
              {selectedNodeEdges.map((e) => (
                <div key={e.id} style={{ fontSize: '11px', padding: '4px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--accent-blue)' }}>{e.relationshipType}</span>:{' '}
                  {e.source === selectedNode.id ? `depends on ${e.targetPath}` : `invoked by ${e.sourcePath}`}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
            Click any node in the graph to inspect structural relationships and ownership.
          </div>
        )}
      </div>
    </div>
  );
};
