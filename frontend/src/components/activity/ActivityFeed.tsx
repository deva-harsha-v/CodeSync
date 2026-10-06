import React, { useState } from 'react';

interface ActivityItem {
  id: string;
  action: string;
  user_name: string;
  user_role: string;
  entity_type?: string;
  details?: any;
  created_at: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  onRefresh: () => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, onRefresh }) => {
  const [filter, setFilter] = useState<string>('ALL');

  const filtered = activities.filter((a) => {
    if (filter === 'ALL') return true;
    if (filter === 'FILES') return a.action.includes('FILE');
    if (filter === 'TESTS') return a.action.includes('TEST');
    if (filter === 'ACCESS') return a.action.includes('ACCESS');
    if (filter === 'COMMITS') return a.action.includes('COMMIT');
    return true;
  });

  return (
    <div className="sidebar-content" style={{ padding: '8px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
          Live Activity Feed
        </div>
        <button className="btn btn-sm" onClick={onRefresh} style={{ padding: '2px 6px', fontSize: '10px' }}>
          ↻
        </button>
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', flexWrap: 'wrap' }}>
        {['ALL', 'FILES', 'TESTS', 'ACCESS', 'COMMITS'].map((f) => (
          <button
            key={f}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : ''}`}
            onClick={() => setFilter(f)}
            style={{ fontSize: '10px', padding: '2px 6px' }}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '11px', padding: '8px 0' }}>
          No activity recorded matching filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map((item) => {
            const time = new Date(item.created_at).toLocaleTimeString();
            let actionColor = 'var(--text-main)';
            if (item.action.includes('FILE')) actionColor = 'var(--accent-blue)';
            else if (item.action.includes('TEST')) actionColor = item.action.includes('FAILED') ? 'var(--color-high)' : 'var(--color-low)';
            else if (item.action.includes('ACCESS')) actionColor = 'var(--color-med)';
            else if (item.action.includes('COMMIT')) actionColor = '#a855f7';

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  padding: '8px',
                  fontSize: '11px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <strong style={{ color: actionColor }}>{item.action}</strong>
                  <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>{time}</span>
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  by <strong>{item.user_name}</strong> ({item.user_role})
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
