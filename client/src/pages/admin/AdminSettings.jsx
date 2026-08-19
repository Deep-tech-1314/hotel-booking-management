import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FiSave, FiSettings, FiCreditCard, FiPercent, FiMail, FiAlertTriangle, FiSend } from 'react-icons/fi';

const AdminSettings = () => {
  const [originalSettings, setOriginalSettings] = useState(null);
  const [settings, setSettings] = useState({
    commissionRate: 15,
    maintenanceMode: false,
    stripeEnabled: true,
    razorpayEnabled: true,
    contactEmail: 'support@bookmystay.com',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data?.data) {
          const fetched = {
            commissionRate: res.data.data.commissionRate ?? 15,
            maintenanceMode: res.data.data.maintenanceMode ?? false,
            stripeEnabled: res.data.data.stripeEnabled ?? true,
            razorpayEnabled: res.data.data.razorpayEnabled ?? true,
            contactEmail: res.data.data.contactEmail ?? 'support@bookmystay.com',
          };
          setSettings(fetched);
          setOriginalSettings(fetched);
        }
      } catch (error) {
        console.error('Failed to fetch settings', error);
        toast.error('Failed to load platform settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/settings', settings);
      if (data.success) {
        toast.success('Platform settings updated successfully');
        setOriginalSettings(settings);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      const { data } = await api.post('/admin/test-email');
      if (data.success) {
        toast.success(data.message || 'Test email sent successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send test email');
    } finally {
      setTestingEmail(false);
    }
  };

  const handleChange = (name, value) => {
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const isChanged = originalSettings 
    ? JSON.stringify(settings) !== JSON.stringify(originalSettings)
    : false;

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="admin-skeleton" style={{ height: '300px' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="admin-flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="admin-page-heading">Platform Settings</h1>
          <p style={{ color: 'var(--admin-text-secondary)', margin: 0, fontSize: '14px' }}>
            Configure global platform variables, financial commissions, payment integration switches, and support services.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Commission settings */}
        <div className="admin-card">
          <h2 className="admin-section-heading" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiPercent size={18} color="var(--admin-primary)" /> Financial Configurations
          </h2>
          <div className="admin-form-group">
            <div className="admin-flex-between">
              <label className="admin-form-label">Base Commission Rate</label>
              <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--admin-primary)' }}>
                {settings.commissionRate}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              className="admin-slider"
              value={settings.commissionRate}
              onChange={(e) => handleChange('commissionRate', parseInt(e.target.value))}
            />
            <div className="admin-form-hint">
              The percentage fee automatically deducted from booking transactions and withheld for platform revenue.
            </div>
          </div>
        </div>

        {/* Payment gateways toggles */}
        <div className="admin-card">
          <h2 className="admin-section-heading" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiCreditCard size={18} color="var(--admin-primary)" /> Payment Gateways
          </h2>
          
          <div className="admin-toggle-row">
            <div>
              <div className="admin-toggle-label">Stripe Integration</div>
              <div className="admin-toggle-desc">Allow customers to book using international cards, Apple Pay, Google Pay.</div>
            </div>
            <label className="admin-toggle">
              <input
                type="checkbox"
                checked={settings.stripeEnabled}
                onChange={(e) => handleChange('stripeEnabled', e.target.checked)}
              />
              <span className="admin-toggle-track"></span>
            </label>
          </div>

          <div className="admin-toggle-row" style={{ borderBottom: 'none' }}>
            <div>
              <div className="admin-toggle-label">Razorpay Integration</div>
              <div className="admin-toggle-desc">Allow customers to book using Indian local payments (UPI, Netbanking, Cards).</div>
            </div>
            <label className="admin-toggle">
              <input
                type="checkbox"
                checked={settings.razorpayEnabled}
                onChange={(e) => handleChange('razorpayEnabled', e.target.checked)}
              />
              <span className="admin-toggle-track"></span>
            </label>
          </div>
        </div>

        {/* Contact/Support Settings */}
        <div className="admin-card">
          <h2 className="admin-section-heading" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiMail size={18} color="var(--admin-primary)" /> Customer Service &amp; Contacts
          </h2>
          <div className="admin-form-group">
            <label className="admin-form-label">Support Email Address</label>
            <input
              type="email"
              className="admin-form-input"
              value={settings.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              placeholder="e.g. support@bookmystay.com"
              required
            />
            <div className="admin-form-hint">
              This address will be shown to users for enquiries and system transaction receipts.
            </div>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--admin-border)' }}>
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              disabled={testingEmail}
              onClick={handleTestEmail}
            >
              <FiSend size={14} style={{ marginRight: '4px' }} />
              {testingEmail ? 'Sending Test...' : 'Send Test Mail to Yourself'}
            </button>
          </div>
        </div>

        {/* Danger zone / maintenance mode */}
        <div className="admin-card" style={{ borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.02)' }}>
          <h2 className="admin-section-heading" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
            <FiAlertTriangle size={18} /> Danger Zone
          </h2>
          <div className="admin-toggle-row" style={{ borderBottom: 'none' }}>
            <div>
              <div className="admin-toggle-label" style={{ color: '#dc2626' }}>Maintenance Mode</div>
              <div className="admin-toggle-desc">Temporarily freeze all user checkouts and bookings during system upgrades.</div>
            </div>
            <label className="admin-toggle">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
              />
              <span className="admin-toggle-track" style={{ background: settings.maintenanceMode ? '#dc2626' : undefined }}></span>
            </label>
          </div>
        </div>

        {/* Form submission controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '40px' }}>
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            disabled={saving || !isChanged}
            style={{ padding: '12px 24px' }}
          >
            <FiSave size={16} style={{ marginRight: '6px' }} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default AdminSettings;
