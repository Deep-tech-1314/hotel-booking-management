import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import { FiSave, FiSettings, FiBell, FiMail, FiPhone, FiBriefcase, FiUser, FiCreditCard } from 'react-icons/fi';
import api from '../../utils/api';
import { useSelector, useDispatch } from 'react-redux';
import { loadUser } from '../../redux/slices/authSlice';

const OwnerSettings = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    holderName: '',
    accountNumber: '',
    ifscCode: ''
  });

  const [taxSummary, setTaxSummary] = useState({
    panNumber: '',
    gstNumber: ''
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    inAppAlerts: true,
    bookingUpdates: true,
    hotelUpdates: true,
    smsAlerts: false,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
      if (user.bankDetails) {
        setBankDetails({
          bankName: user.bankDetails.bankName || '',
          holderName: user.bankDetails.holderName || '',
          accountNumber: user.bankDetails.accountNumber || '',
          ifscCode: user.bankDetails.ifscCode || ''
        });
      }
      if (user.taxSummary) {
        setTaxSummary({
          panNumber: user.taxSummary.panNumber || '',
          gstNumber: user.taxSummary.gstNumber || ''
        });
      }
      if (user.notificationPreferences) {
        setNotifications({
          emailAlerts: user.notificationPreferences.emailAlerts ?? true,
          inAppAlerts: user.notificationPreferences.inAppAlerts ?? true,
          bookingUpdates: user.notificationPreferences.bookingUpdates ?? true,
          hotelUpdates: user.notificationPreferences.hotelUpdates ?? true,
          smsAlerts: user.notificationPreferences.smsAlerts ?? false,
        });
      }
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setBankDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleTaxChange = (e) => {
    const { name, value } = e.target;
    setTaxSummary(prev => ({ ...prev, [name]: value }));
  };

  const handleNotifyChange = (e) => {
    const { name, checked } = e.target;
    setNotifications(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/me/update', {
        name: profile.name,
        phone: profile.phone,
        email: profile.email,
        bankDetails,
        taxSummary,
        notificationPreferences: notifications,
      });
      toast.success('Settings updated successfully');
      dispatch(loadUser());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container py-8 max-w-4xl animate-fadeInUp">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="grand-h1 mb-2 flex items-center gap-3">
            <FiSettings className="text-primary" /> Owner Settings
          </h1>
          <p className="grand-subtext">Configure your personal profile, bank payout details, tax registration, and notifications.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Personal Profile */}
        <div className="card p-6 bg-primary border-light shadow-sm">
          <h2 className="grand-h2 mb-4 flex items-center gap-2">
            <FiUser className="text-primary" /> Personal Profile
          </h2>
          <div className="grid grid-2 gap-4">
            <div>
              <label className="grand-label mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleProfileChange}
                className="input-field"
                required
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-input)' }}
              />
            </div>
            <div>
              <label className="grand-label mb-2">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={profile.phone}
                onChange={handleProfileChange}
                className="input-field"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-input)' }}
              />
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <label className="grand-label mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleProfileChange}
              className="input-field"
              required
              disabled
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-input)', opacity: 0.6 }}
            />
          </div>
        </div>

        {/* Bank Details */}
        <div className="card p-6 bg-primary border-light shadow-sm">
          <h2 className="grand-h2 mb-4 flex items-center gap-2">
            <FiBriefcase className="text-primary" /> Bank Details
          </h2>
          <div className="grid grid-2 gap-4">
            <div>
              <label className="grand-label mb-2">Account Holder Name</label>
              <input
                type="text"
                name="holderName"
                value={bankDetails.holderName}
                onChange={handleBankChange}
                className="input-field"
                placeholder="e.g. Hotel Owner Pvt Ltd"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-input)' }}
              />
            </div>
            <div>
              <label className="grand-label mb-2">Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={bankDetails.bankName}
                onChange={handleBankChange}
                className="input-field"
                placeholder="e.g. HDFC Bank"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-input)' }}
              />
            </div>
            <div>
              <label className="grand-label mb-2">Account Number</label>
              <input
                type="text"
                name="accountNumber"
                value={bankDetails.accountNumber}
                onChange={handleBankChange}
                className="input-field"
                placeholder="e.g. 50100234567890"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-input)' }}
              />
            </div>
            <div>
              <label className="grand-label mb-2">IFSC Code</label>
              <input
                type="text"
                name="ifscCode"
                value={bankDetails.ifscCode}
                onChange={handleBankChange}
                className="input-field"
                placeholder="e.g. HDFC0000123"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-input)' }}
              />
            </div>
          </div>
        </div>

        {/* Tax Summary Details */}
        <div className="card p-6 bg-primary border-light shadow-sm">
          <h2 className="grand-h2 mb-4 flex items-center gap-2">
            <FiCreditCard className="text-primary" /> Tax Summary
          </h2>
          <div className="grid grid-2 gap-4">
            <div>
              <label className="grand-label mb-2">PAN Number</label>
              <input
                type="text"
                name="panNumber"
                value={taxSummary.panNumber}
                onChange={handleTaxChange}
                className="input-field"
                placeholder="e.g. ABCDE1234F"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-input)' }}
              />
            </div>
            <div>
              <label className="grand-label mb-2">GSTIN</label>
              <input
                type="text"
                name="gstNumber"
                value={taxSummary.gstNumber}
                onChange={handleTaxChange}
                className="input-field"
                placeholder="e.g. 27ABCDE1234F1Z5"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-input)' }}
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card p-6 bg-primary border-light shadow-sm">
          <h2 className="grand-h2 mb-4 flex items-center gap-2">
            <FiBell className="text-primary" /> Booking & System Notifications
          </h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 p-3 border border-light rounded-lg cursor-pointer hover:bg-secondary transition-colors">
              <input
                type="checkbox"
                name="inAppAlerts"
                checked={notifications.inAppAlerts}
                onChange={handleNotifyChange}
                className="accent-primary w-5 h-5"
              />
              <div>
                <div className="font-bold flex items-center gap-2"><FiBell /> In-App Real-time Alerts</div>
                <div className="text-xs text-secondary">Receive real-time sound and badge notifications inside the app header.</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-light rounded-lg cursor-pointer hover:bg-secondary transition-colors">
              <input
                type="checkbox"
                name="emailAlerts"
                checked={notifications.emailAlerts}
                onChange={handleNotifyChange}
                className="accent-primary w-5 h-5"
              />
              <div>
                <div className="font-bold flex items-center gap-2"><FiMail /> Email Alerts</div>
                <div className="text-xs text-secondary">Receive an email notification when guest bookings or cancellations occur.</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-light rounded-lg cursor-pointer hover:bg-secondary transition-colors">
              <input
                type="checkbox"
                name="bookingUpdates"
                checked={notifications.bookingUpdates}
                onChange={handleNotifyChange}
                className="accent-primary w-5 h-5"
              />
              <div>
                <div className="font-bold flex items-center gap-2"><FiBriefcase /> Booking Activity Notifications</div>
                <div className="text-xs text-secondary">Get notified on check-ins, guest room assignments, and checkout events.</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-light rounded-lg cursor-pointer hover:bg-secondary transition-colors">
              <input
                type="checkbox"
                name="hotelUpdates"
                checked={notifications.hotelUpdates}
                onChange={handleNotifyChange}
                className="accent-primary w-5 h-5"
              />
              <div>
                <div className="font-bold flex items-center gap-2"><FiSettings /> Property & System Updates</div>
                <div className="text-xs text-secondary">Receive administrative verification, approval status, and payout alerts.</div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-4 pb-12">
          <Button type="submit" disabled={saving} className="flex items-center gap-2 px-8">
            {saving ? <div className="loader border-2 w-4 h-4"></div> : <FiSave />}
            Save Settings
          </Button>
        </div>

      </form>
    </div>
  );
};

export default OwnerSettings;
