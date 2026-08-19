import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchOwnerReports } from '../../redux/slices/ownerSlice';
import { FiDollarSign, FiTrendingUp, FiFileText, FiPercent, FiDownload } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { downloadCSV, printReport } from '../../utils/exporters';
import { DashboardSkeleton } from '../../components/common/Skeleton';

const fmtINR = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

const GrandReports = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading: authLoading } = useSelector((state) => state.auth);
  const { reports: data, loading, error } = useSelector((s) => s.owner);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    dispatch(fetchOwnerReports());
  }, [dispatch, authLoading, isAuthenticated]);

  if (loading && !data?.stats) return <DashboardSkeleton cards={4} />;
  if (error && !data?.stats) return <div style={{ color: 'var(--grand-text-muted)' }}>Error loading reports: {error}</div>;
  if (!data || !data.stats) return <DashboardSkeleton cards={4} />;

  const handleExportCSV = () => {
    const rows = [];
    // Summary metrics block.
    rows.push(['Metric', 'Value', 'Trend']);
    rows.push(['Monthly Revenue', fmtINR(data.stats.monthlyRev), data.stats.monthlyTrend]);
    rows.push(['Annual Revenue', fmtINR(data.stats.annualRev), '']);
    rows.push(['Avg Daily Rate', fmtINR(data.stats.adr), '']);
    rows.push(['RevPAR', fmtINR(data.stats.revPar), '']);
    rows.push(['Avg Occupancy', data.stats.occupancy + '%', '']);
    rows.push([]); // blank separator row
    // Monthly revenue series.
    rows.push(['Month', 'Current Year']);
    (data.chartData || []).forEach((d) => rows.push([d.month, d.revenue]));

    downloadCSV('revenue-report.csv', rows[0], rows.slice(1));
    toast.success('CSV exported');
  };

  const handleExportPDF = () => {
    const stat = (label, value, trend) =>
      `<div class="stat"><div class="label">${label}</div><div class="value">${value}</div><div class="muted">${trend || ''}</div></div>`;

    const rowsHtml = (data.chartData || [])
      .map(
        (d) =>
          `<tr><td>${d.month}</td><td class="num">${fmtINR(d.revenue)}</td></tr>`
      )
      .join('');

    const body = `
      <h1>Revenue &amp; Reports</h1>
      <div class="muted">Generated ${new Date().toLocaleString()}</div>
      <div class="stat-grid">
        ${stat('Monthly Revenue', fmtINR(data.stats.monthlyRev), data.stats.monthlyTrend + '%')}
        ${stat('Annual Revenue', fmtINR(data.stats.annualRev), '')}
        ${stat('Avg Daily Rate', fmtINR(data.stats.adr), '')}
        ${stat('RevPAR', fmtINR(data.stats.revPar), '')}
        ${stat('Avg Occupancy', data.stats.occupancy + '%', '')}
      </div>
      <h2 style="font-size:16px;margin-top:24px;">Monthly Revenue</h2>
      <table>
        <thead><tr><th>Month</th><th class="num">Revenue</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div class="foot">BookMyStay — confidential revenue report</div>
    `;

    const ok = printReport('BookMyStay — Revenue Report', body);
    if (!ok) toast.error('Allow pop-ups to export the PDF report');
  };

  const totalPieRevenue = (data.pieData || []).reduce((acc, curr) => acc + curr.value, 0);
  
  // Format the pie total for display inside pie
  let displayPieTotal = '';
  if (totalPieRevenue >= 10000000) {
    displayPieTotal = `₹${(totalPieRevenue / 10000000).toFixed(1)} Cr`;
  } else if (totalPieRevenue >= 100000) {
    displayPieTotal = `₹${(totalPieRevenue / 100000).toFixed(1)} L`;
  } else {
    displayPieTotal = fmtINR(totalPieRevenue);
  }

  return (
    <div>
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="grand-h1" style={{ marginBottom: '4px' }}>Revenue & Reports</h1>
          <p className="grand-subtext">Comprehensive financial analytics and property performance</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button onClick={handleExportCSV} className="grand-btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', border: '1px solid var(--grand-border)', cursor: 'pointer' }}>
            <FiFileText /> CSV
          </button>
          <button onClick={handleExportPDF} className="grand-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
            <FiDownload /> PDF Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grand-grid grand-grid-5" style={{ marginBottom: '32px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="grand-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ color: 'var(--grand-gold)' }}><FiDollarSign size={20} /></div>
            <span className={`grand-pill ${data.stats.monthlyTrend >= 0 ? 'grand-pill-success' : 'grand-pill-danger'}`}>
              {data.stats.monthlyTrend > 0 ? '+' : ''}{data.stats.monthlyTrend}%
            </span>
          </div>
          <div className="grand-label" style={{ marginBottom: '8px' }}>Monthly Revenue</div>
          <div className="grand-stat-value">{fmtINR(data.stats.monthlyRev)}</div>
        </div>
        
        <div className="grand-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ color: 'var(--grand-gold)' }}><FiTrendingUp size={20} /></div>
            <span className="grand-pill grand-pill-success">YTD</span>
          </div>
          <div className="grand-label" style={{ marginBottom: '8px' }}>Annual Revenue</div>
          <div className="grand-stat-value">{fmtINR(data.stats.annualRev)}</div>
        </div>

        <div className="grand-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ color: 'var(--grand-gold)' }}><FiTrendingUp size={20} /></div>
          </div>
          <div className="grand-label" style={{ marginBottom: '8px' }}>Avg Daily Rate</div>
          <div className="grand-stat-value">{fmtINR(data.stats.adr)}</div>
        </div>

        <div className="grand-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ color: 'var(--grand-gold)' }}><FiFileText size={20} /></div>
          </div>
          <div className="grand-label" style={{ marginBottom: '8px' }}>RevPAR</div>
          <div className="grand-stat-value">{fmtINR(data.stats.revPar)}</div>
        </div>

        <div className="grand-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ color: 'var(--grand-gold)' }}><FiPercent size={20} /></div>
          </div>
          <div className="grand-label" style={{ marginBottom: '8px' }}>Avg Occupancy</div>
          <div className="grand-stat-value">{data.stats.occupancy}%</div>
        </div>
      </div>

      {/* Charts Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.2fr', gap: '32px' }}>
        {/* Bar Chart */}
        <div className="grand-card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div>
              <h2 className="grand-h2" style={{ marginBottom: '4px' }}>Revenue Overview</h2>
              <p className="grand-subtext">Monthly revenue</p>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--grand-gold)', borderRadius: '2px' }}></div>
                <span style={{ color: 'var(--grand-text)' }}>Revenue</span>
              </div>
            </div>
          </div>
          
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--grand-text-muted)', fontSize: 12 }} dy={10} />
                <YAxis hide={true} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'var(--grand-bg)', border: '1px solid var(--grand-border)', borderRadius: '8px', color: 'var(--grand-text)' }} formatter={(value) => fmtINR(value)} />
                <Bar dataKey="revenue" fill="var(--grand-gold)" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="grand-card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '4px' }}>Revenue Breakdown</h2>
          <div style={{ fontSize: '13px', color: 'var(--grand-text-muted)', marginBottom: '32px' }}>By Hotel (Total)</div>
          
          {data.pieData && data.pieData.length > 0 ? (
            <>
              <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.pieData} innerRadius={60} outerRadius={100} paddingAngle={0} dataKey="value" stroke="none">
                      {data.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--grand-bg)', border: '1px solid var(--grand-border)', borderRadius: '8px' }} formatter={(value) => fmtINR(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
                  <div style={{ color: 'var(--grand-text-muted)', fontSize: '12px' }}>Total</div>
                  <div style={{ color: 'var(--grand-gold)', fontSize: '18px', fontWeight: 600 }}>{displayPieTotal}</div>
                </div>
              </div>
              
              <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.pieData.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '10px', height: '10px', backgroundColor: item.fill, borderRadius: '2px', flexShrink: 0 }}></div>
                      <span style={{ fontSize: '13px', color: 'var(--grand-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>{item.name}</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{fmtINR(item.value)}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--grand-text-muted)' }}>
              No revenue data
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GrandReports;
