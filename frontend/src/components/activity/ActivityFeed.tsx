import React, { useState } from 'react';
import { Icons } from '../common/Icons';

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
    if (filter === 'FILES') return a.action.includes('FILE') || a.action.includes('SAVE');
    if (filter === 'TESTS') return a.action.includes('TEST');
    if (filter === 'ACCESS') return a.action.includes('ACCESS');
    if (filter === 'COMMITS') return a.action.includes('COMMIT');
    return true;
  });

  return (
    <div className="sidebar-content" style={{ padding: '10px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
          Live Activity Feed
        </div>
        <button className="btn btn-sm" onClick={onRefresh} style={{ padding: '2px 6px', fontSize: '10px' }} title="Refresh Feed">
          <Icons.Activity size={12} color="var(--text-muted)" />
        </button>
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', flexWrap: 'wrap' }}>
        {['ALL', 'FILES', 'TESTS', 'ACCESS', 'COMMITS'].map((f) => (
          <button
            key={f}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : ''}`}
            onClick={() => setFilter(f)}
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              backgroundColor: filter === f ? 'var(--accent-blue)' : 'var(--bg-surface)'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '11px', padding: '16px 0', textAlign: 'center' }}>
          No activities match current filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map((item) => {
            const time = new Date(item.created_at).toLocaleTimeString();
            let actionColor = 'var(--text-main)';
            if (item.action.includes('FILE') || item.action.includes('SAVE')) actionColor = 'var(--accent-blue)';
            else if (item.action.includes('TEST')) actionColor = item.action.includes('FAIL') ? 'var(--color-high)' : 'var(--color-low)';
            else if (item.action.includes('ACCESS')) actionColor = 'var(--color-med)';
            else if (item.action.includes('COMMIT')) actionColor = '#a855f7';

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  fontSize: '11px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: actionColor, fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                    {item.action}
                  </strong>
                  <span style={{ color: 'var(--text-dim)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>{time}</span>
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  by <strong style={{ color: 'var(--text-main)' }}>{item.user_name}</strong> ({item.user_role})
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
