import React, { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import { FiDollarSign, FiPercent, FiTrendingUp, FiCreditCard, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

const fmtMoney = (v) => `₹${(v || 0).toLocaleString('en-IN')}`;

const AdminPayments = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [gateway, setGateway] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Actions
  const [processingOwnerId, setProcessingOwnerId] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        status: status || undefined,
        gateway: gateway || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };
      const { data: resData } = await api.get('/admin/payments', { params });
      if (resData.success) {
        setData(resData);
        setTotalPages(resData.pages || 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch payments data');
    } finally {
      setLoading(false);
    }
  }, [page, status, gateway, dateFrom, dateTo]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleProcessPayout = async (ownerId = null) => {
    if (ownerId) {
      setProcessingOwnerId(ownerId);
    }
    try {
      const { data: res } = await api.put('/admin/payouts/process', { ownerId: ownerId || undefined });
      if (res.success) {
        toast.success(res.message || 'Payout processed successfully');
        fetchPayments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process payout');
    } finally {
      setProcessingOwnerId(null);
    }
  };

  return (
    <div>
      <div className="admin-flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="admin-page-heading">Payments &amp; Disbursements</h1>
          <p style={{ color: 'var(--admin-text-secondary)', margin: 0, fontSize: '14px' }}>
            Monitor financial transactions, commission earnings, and disburse owner payouts.
          </p>
        </div>
      </div>

      {/* Summary KPI Strip */}
      {data && (
        <div className="admin-grid-4" style={{ marginBottom: '24px' }}>
          <div className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>Gross Volume</div>
              <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>{fmtMoney(data.summary?.totalCollected)}</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '10px' }}>
              <FiDollarSign size={20} />
            </div>
          </div>
          <div className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>Platform Share (Commission)</div>
              <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>{fmtMoney(data.summary?.totalCommission)}</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(79, 70, 229, 0.1)', color: 'var(--admin-primary)', borderRadius: '10px' }}>
              <FiPercent size={20} />
            </div>
          </div>
          <div className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>Disbursed Payouts</div>
              <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>{fmtMoney(data.summary?.totalPaidToOwners)}</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', borderRadius: '10px' }}>
              <FiTrendingUp size={20} />
            </div>
          </div>
          <div className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>Pending Disbursements</div>
              <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>{fmtMoney(data.summary?.pendingPayouts)}</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '10px' }}>
              <FiCreditCard size={20} />
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Transactions & Owner Payouts */}
      <div className="admin-grid-2">
        {/* Transactions list */}
        <div className="admin-card">
          <div className="admin-flex-between" style={{ marginBottom: '16px' }}>
            <h3 className="admin-card-title" style={{ margin: 0 }}>Transaction Log</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select className="admin-select" style={{ padding: '6px 10px', fontSize: '12px', minWidth: '100px' }} value={gateway} onChange={(e) => { setGateway(e.target.value); setPage(1); }}>
                <option value="">Gateways</option>
                <option value="stripe">Stripe</option>
                <option value="razorpay">Razorpay</option>
                <option value="manual">Manual</option>
              </select>
              <select className="admin-select" style={{ padding: '6px 10px', fontSize: '12px', minWidth: '100px' }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                <option value="">Status</option>
                <option value="completed">Completed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="admin-skeleton" style={{ height: '300px' }} />
          ) : !data || data.transactions?.length === 0 ? (
            <div className="admin-empty">
              <div className="admin-empty-icon">💸</div>
              <div className="admin-empty-title">No Transactions Recorded</div>
            </div>
          ) : (
            <>
              <div className="admin-table-wrap">
                <table className="admin-table" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Hotel</th>
                      <th>Gross</th>
                      <th>Commission</th>
                      <th>Gateway</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.transactions.map((tx) => (
                      <tr key={tx._id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{tx.hotel?.name || 'Hotel N/A'}</div>
                          <div style={{ fontSize: '10px', color: 'var(--admin-text-muted)', fontFamily: 'monospace' }}>#{tx._id.slice(-8).toUpperCase()}</div>
                        </td>
                        <td>{fmtMoney(tx.grossAmount)}</td>
                        <td>{fmtMoney(tx.commissionAmount)}</td>
                        <td style={{ textTransform: 'capitalize' }}>{tx.gateway}</td>
                        <td>
                          <span className={`admin-badge admin-badge-${tx.status}`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="admin-pagination" style={{ marginTop: '12px' }}>
                  <button className="admin-page-btn" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                    Prev
                  </button>
                  <span style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', alignSelf: 'center' }}>
                    {page} of {totalPages}
                  </span>
                  <button className="admin-page-btn" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Owner balances / payouts */}
        <div className="admin-card">
          <div className="admin-flex-between" style={{ marginBottom: '16px' }}>
            <h3 className="admin-card-title" style={{ margin: 0 }}>Owner Balances</h3>
            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => handleProcessPayout(null)}>
              Process All Payouts
            </button>
          </div>

          {!data || data.ownerPayouts?.length === 0 ? (
            <div className="admin-empty">
              <div className="admin-empty-icon">👥</div>
              <div className="admin-empty-title">No Owners Found</div>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Owner</th>
                    <th>Earned</th>
                    <th>Paid</th>
                    <th>Pending Balance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ownerPayouts.map((op) => (
                    <tr key={op._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{op.ownerName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--admin-text-secondary)' }}>{op.ownerEmail}</div>
                      </td>
                      <td>{fmtMoney(op.totalEarned)}</td>
                      <td>{fmtMoney(op.totalPaidOut)}</td>
                      <td style={{ color: op.pendingBalance > 0 ? '#d97706' : 'inherit', fontWeight: op.pendingBalance > 0 ? 600 : 'normal' }}>
                        {fmtMoney(op.pendingBalance)}
                      </td>
                      <td>
                        <button
                          className="admin-btn admin-btn-success admin-btn-sm"
                          disabled={op.pendingBalance <= 0 || processingOwnerId === op._id}
                          onClick={() => handleProcessPayout(op._id)}
                          title="Disburse Payout"
                        >
                          <FiCheck size={14} style={{ marginRight: '4px' }} /> Disburse
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;
