import React from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

/**
 * ErrorState – shown when a fetch fails. Optional retry callback.
 */
const ErrorState = ({ message = 'Something went wrong.', onRetry }) => (
  <div
    className="error-state"
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '40px 24px',
      color: 'var(--grand-text-muted, var(--text-muted, #94a3b8))',
    }}
  >
    <div style={{ fontSize: '36px', marginBottom: '12px', color: 'var(--grand-danger, #ef4444)' }}>
      <FiAlertTriangle />
    </div>
    <div style={{ fontSize: '15px', marginBottom: '16px', maxWidth: '360px' }}>{message}</div>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="btn btn-secondary btn-sm"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
      >
        <FiRefreshCw size={14} /> Retry
      </button>
    )}
  </div>
);

export default ErrorState;
