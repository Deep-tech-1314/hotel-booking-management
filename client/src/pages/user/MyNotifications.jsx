import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../../redux/slices/notificationSlice';
import { FiBell, FiCheck, FiCheckCircle, FiInfo, FiCalendar, FiMessageSquare, FiAlertCircle, FiTrash2 } from 'react-icons/fi';
import Button from '../../components/common/Button';

const MyNotifications = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, loading, total, unread } = useSelector((s) => s.notifications);
  const [tab, setTab] = useState('ALL'); // ALL, UNREAD, BOOKINGS, MESSAGES

  useEffect(() => {
    dispatch(fetchNotifications({ limit: 30 }));
  }, [dispatch]);

  const { user } = useSelector((s) => s.auth || {});

  const getRoleMessageLink = () => {
    if (user?.role === 'admin') return '/admin/messages';
    if (user?.role === 'owner') return '/grand/messages';
    return '/me/messages';
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead());
  };

  const handleClickItem = (n) => {
    if (!n.isRead) dispatch(markNotificationRead(n._id));
    
    let targetLink = n.link;
    if (
      n.type === 'system' ||
      n.title?.toLowerCase().includes('message') ||
      n.link?.includes('messages') ||
      n.link?.includes('guests') ||
      !n.link
    ) {
      targetLink = getRoleMessageLink();
    }

    if (targetLink) navigate(targetLink);
  };

  const handleDeleteItem = (e, id) => {
    e.stopPropagation();
    dispatch(deleteNotification(id));
  };

  const filteredItems = items.filter((n) => {
    if (tab === 'UNREAD') return !n.isRead;
    if (tab === 'BOOKINGS') return n.type?.includes('booking');
    if (tab === 'MESSAGES') return n.type === 'system' || n.title?.toLowerCase().includes('message');
    return true;
  });

  const getIcon = (type) => {
    if (type?.includes('booking')) return <FiCalendar className="text-amber-500" size={20} />;
    if (type === 'system') return <FiMessageSquare className="text-blue-500" size={20} />;
    return <FiBell className="text-grand-gold" size={20} />;
  };

  return (
    <div className="container py-12" style={{ maxWidth: '900px' }}>
      <div className="flex justify-between items-end mb-8 flex-wrap gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold font-serif mb-2">Messages & Notifications</h1>
          <p className="text-secondary text-sm">Stay updated with your bookings, hotel messages, and account alerts</p>
        </div>
        
        {unread > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 border-border hover:border-grand-gold"
          >
            <FiCheckCircle size={16} /> Mark All as Read ({unread})
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['ALL', 'UNREAD', 'BOOKINGS', 'MESSAGES'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider transition-all border ${
              tab === t
                ? 'bg-grand-gold text-white border-grand-gold'
                : 'bg-primary text-secondary border-border hover:border-grand-gold'
            }`}
          >
            {t} {t === 'UNREAD' && unread > 0 ? `(${unread})` : ''}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="flex flex-col gap-4">
        {loading && items.length === 0 ? (
          <div className="page-loader"><div className="loader"></div></div>
        ) : filteredItems.length === 0 ? (
          <div className="card p-12 text-center border border-border shadow-sm">
            <FiBell size={36} className="mx-auto mb-4 text-secondary" />
            <h3 className="text-lg font-bold font-serif mb-1">No notifications found</h3>
            <p className="text-secondary text-sm">You have no alerts matching your current filter.</p>
          </div>
        ) : (
          filteredItems.map((n) => (
            <div
              key={n._id}
              onClick={() => handleClickItem(n)}
              className={`card p-5 border transition-all cursor-pointer flex gap-4 items-start relative ${
                !n.isRead
                  ? 'border-grand-gold/50 bg-grand-gold/5 shadow-sm'
                  : 'border-border bg-primary hover:border-grand-gold/30'
              }`}
            >
              <div className="p-3 rounded-full bg-primary-light border border-border flex-shrink-0">
                {getIcon(n.type)}
              </div>

              <div className="flex-1 pr-8">
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-base ${!n.isRead ? 'font-bold text-white' : 'font-semibold text-primary dark:text-gray-200'}`}>
                    {n.title}
                  </h4>
                  <span className="text-xs text-secondary whitespace-nowrap mr-2">
                    {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-sm text-secondary leading-relaxed mb-2">{n.message}</p>

                {n.link && (
                  <span className="text-xs text-grand-gold font-bold hover:underline inline-flex items-center gap-1">
                    View Details →
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {!n.isRead && (
                  <div className="w-2.5 h-2.5 rounded-full bg-grand-gold"></div>
                )}
                <button
                  type="button"
                  onClick={(e) => handleDeleteItem(e, n._id)}
                  title="Delete notification"
                  className="text-red-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyNotifications;
