import React from 'react';
import { FiInbox } from 'react-icons/fi';

/**
 * EmptyState – shown when a list/section has no data.
 * Theme-neutral (works in both the public theme and .grand-theme).
 */
const EmptyState = ({ icon, title = 'Nothing here yet', message = '', action = null }) => (
  <div
    className="empty-state"
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '48px 24px',
      color: 'var(--grand-text-muted, var(--text-muted, #94a3b8))',
    }}
  >
    <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.6 }}>
      {icon || <FiInbox />}
    </div>
    <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px', color: 'var(--grand-text, var(--text-primary, inherit))' }}>
      {title}
    </div>
    {message && <div style={{ fontSize: '14px', maxWidth: '360px' }}>{message}</div>}
    {action && <div style={{ marginTop: '16px' }}>{action}</div>}
  </div>
);

export default EmptyState;
