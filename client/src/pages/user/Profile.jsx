import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { changePassword, updateProfile } from '../../redux/slices/authSlice';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  
  const [passData, setPassData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    dispatch(updateProfile(formData))
      .unwrap()
      .then(() => toast.success('Profile updated successfully'))
      .catch((err) => toast.error(err || 'Failed to update profile'));
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    dispatch(changePassword({
      currentPassword: passData.oldPassword,
      newPassword: passData.newPassword,
    }))
      .unwrap()
      .then(() => {
        toast.success('Password updated successfully');
        setPassData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      })
      .catch((err) => toast.error(err || 'Failed to update password'));
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      <div className="grid" style={{ gridTemplateColumns: '1fr 2fr', gap: 'var(--space-8)' }}>
        {/* Sidebar/Avatar */}
        <div className="card p-6 text-center h-fit">
          <div className="relative inline-block mb-4">
            <img 
              src={user?.avatar?.url || `https://ui-avatars.com/api/?name=${user?.name}&background=3b82f6&color=fff&size=150`}
              alt={user?.name}
              style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--border)' }}
            />
          </div>
          <h2 className="text-xl font-bold">{user?.name}</h2>
          <p className="text-secondary">{user?.email}</p>
          <div className={`badge badge-${user?.role === 'admin' ? 'danger' : user?.role === 'owner' ? 'success' : 'primary'} mt-2`}>
            {user?.role}
          </div>
        </div>

        {/* Forms */}
        <div className="flex flex-col gap-6">
          <div className="card p-6">
            <h3 className="text-xl font-bold mb-4">Personal Information</h3>
            <form onSubmit={handleProfileUpdate}>
              <div className="grid grid-2 gap-4">
                <Input 
                  label="Full Name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                />
                <Input 
                  label="Email Address" 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  required 
                />
                <Input 
                  label="Phone Number" 
                  type="tel"
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                  placeholder="9876543210"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  required
                />
              </div>
              <Button type="submit" loading={loading} className="mt-4">
                Save Changes
              </Button>
            </form>
          </div>

          <div className="card p-6">
            <h3 className="text-xl font-bold mb-4">Change Password</h3>
            <form onSubmit={handlePasswordUpdate}>
              <div className="grid grid-2 gap-4">
                <Input 
                  label="Current Password" 
                  type="password" 
                  value={passData.oldPassword} 
                  onChange={(e) => setPassData({...passData, oldPassword: e.target.value})} 
                  required 
                />
                <div></div>
                <Input 
                  label="New Password" 
                  type="password" 
                  value={passData.newPassword} 
                  onChange={(e) => setPassData({...passData, newPassword: e.target.value})} 
                  required 
                  minLength="6"
                />
                <Input 
                  label="Confirm New Password" 
                  type="password" 
                  value={passData.confirmPassword} 
                  onChange={(e) => setPassData({...passData, confirmPassword: e.target.value})} 
                  required 
                />
              </div>
              <Button type="submit" variant="secondary" className="mt-4">
                Update Password
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
