import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiDollarSign, FiCheckCircle, FiActivity, FiBriefcase, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

const GrandPayouts = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/grand/payout');
      setData(res.data);
    } catch (err) {
      toast.error('Failed to fetch payout records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  if (loading) {
    return <div className="page-loader"><div className="loader"></div></div>;
  }

  const {
    stats = { totalPayout: 0, pendingPayout: 0, lastPayoutAmount: 0 },
    history = [],
    bankDetails = { bankName: '', accountNumber: '', ifscCode: '', holderName: '' },
    taxSummary = { panNumber: '', gstNumber: '', TDS: 0 }
  } = data || {};

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="grand-h1" style={{ marginBottom: '6px' }}>Payouts & Earnings</h1>
          <p className="grand-subtext">Track your earnings, payout status, bank details and tax filings.</p>
        </div>
        <button 
          onClick={fetchPayouts}
          className="grand-btn grand-btn-outline" 
        >
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grand-grid grand-grid-3" style={{ marginBottom: '32px' }}>
        <div className="grand-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span className="grand-label">Total Payouts Done</span>
            <div className="grand-stat-icon" style={{ background: 'rgba(197, 168, 128, 0.1)', color: 'var(--grand-gold)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiCheckCircle size={20} />
            </div>
          </div>
          <div className="grand-stat-value">₹{stats.totalPayout.toLocaleString('en-IN')}</div>
          <div style={{ color: '#10b981', fontSize: '12px', marginTop: '8px', fontWeight: 500 }}>✓ Transferred to bank account</div>
        </div>

        <div className="grand-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span className="grand-label">Pending Clearance</span>
            <div className="grand-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiActivity size={20} />
            </div>
          </div>
          <div className="grand-stat-value">₹{stats.pendingPayout.toLocaleString('en-IN')}</div>
          <div className="grand-subtext" style={{ marginTop: '8px' }}>Processing for next cycle</div>
        </div>

        <div className="grand-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span className="grand-label">Last Paid Amount</span>
            <div className="grand-stat-icon" style={{ background: 'rgba(197, 168, 128, 0.1)', color: 'var(--grand-gold)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiDollarSign size={20} />
            </div>
          </div>
          <div className="grand-stat-value">₹{stats.lastPayoutAmount.toLocaleString('en-IN')}</div>
          <div className="grand-subtext" style={{ marginTop: '8px' }}>Paid on last cycle</div>
        </div>
      </div>

      <div className="grand-grid grand-grid-3" style={{ gridTemplateColumns: '2fr 1fr', gap: '32px', marginBottom: '32px' }}>
        {/* Payout History */}
        <div className="grand-card" style={{ padding: '24px' }}>
          <h3 className="grand-h3" style={{ marginBottom: '20px' }}>Payout History</h3>
          {history.length > 0 ? (
            <div className="grand-table-wrapper" style={{ overflowX: 'auto' }}>
              <table className="grand-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Reference</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i}>
                      <td>{new Date(h.payoutDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{h.referenceNumber}</td>
                      <td>
                        <span className={`grand-status grand-status-${h.status === 'completed' ? 'confirmed' : 'pending'}`}>
                          {h.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{h.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grand-subtext" style={{ padding: '40px 0', textAlign: 'center' }}>
              No payout records found.
            </div>
          )}
        </div>

        {/* Bank & Tax Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Bank Details */}
          <div className="grand-card" style={{ padding: '24px' }}>
            <h3 className="grand-h3" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiBriefcase style={{ color: 'var(--grand-gold)' }} /> Bank Account
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span className="grand-label">Account Holder</span>
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--grand-text, #1e293b)' }}>{bankDetails.holderName || 'N/A'}</span>
              </div>
              <div>
                <span className="grand-label">Bank Name</span>
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--grand-text, #1e293b)' }}>{bankDetails.bankName || 'N/A'}</span>
              </div>
              <div>
                <span className="grand-label">Account Number</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '14px', color: 'var(--grand-text, #1e293b)' }}>
                  {bankDetails.accountNumber ? `•••• •••• ${bankDetails.accountNumber.slice(-4)}` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="grand-label">IFSC Code</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '14px', color: 'var(--grand-text, #1e293b)' }}>{bankDetails.ifscCode || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Tax Summary */}
          <div className="grand-card" style={{ padding: '24px' }}>
            <h3 className="grand-h3" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiDollarSign style={{ color: 'var(--grand-gold)' }} /> Tax Summary
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span className="grand-label">PAN Number</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '14px', color: 'var(--grand-text, #1e293b)' }}>{taxSummary.panNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="grand-label">GSTIN</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '14px', color: 'var(--grand-text, #1e293b)' }}>{taxSummary.gstNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="grand-label">TDS Withheld (This FY)</span>
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--grand-text, #1e293b)' }}>₹{taxSummary.TDS?.toLocaleString('en-IN') || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrandPayouts;
