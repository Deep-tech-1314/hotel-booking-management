import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiBell, FiCheck, FiCalendar, FiMessageSquare,
  FiCreditCard, FiArrowRight, FiCheckCircle, FiTrash2
} from 'react-icons/fi';
import {
  fetchUnreadCount,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  addNotification,
} from '../../redux/slices/notificationSlice';

const timeAgo = (date) => {
  if (!date) return 'just now';
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const getNotifIcon = (type) => {
  if (type?.includes('booking')) {
    return (
      <div className="notif-icon-box" style={{ backgroundColor: 'rgba(217, 170, 50, 0.15)', color: '#d9aa32' }}>
        <FiCalendar size={18} />
      </div>
    );
  }
  if (type === 'system' || type?.includes('message')) {
    return (
      <div className="notif-icon-box" style={{ backgroundColor: 'rgba(197, 168, 128, 0.15)', color: '#c5a880' }}>
        <FiMessageSquare size={18} />
      </div>
    );
  }
  if (type?.includes('payment') || type?.includes('payout')) {
    return (
      <div className="notif-icon-box" style={{ backgroundColor: 'rgba(4, 120, 87, 0.15)', color: '#047857' }}>
        <FiCreditCard size={18} />
      </div>
    );
  }
  return (
    <div className="notif-icon-box" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
      <FiBell size={18} />
    </div>
  );
};

const NotificationBell = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items = [], unread = 0, loading } = useSelector((s) => s.notifications || {});
  const { isAuthenticated } = useSelector((s) => s.auth || {});
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    dispatch(fetchUnreadCount());
    
    // Fast polling interval (every 5 seconds) to ensure real-time notification updates
    const id = setInterval(() => dispatch(fetchUnreadCount()), 5000);
    
    // SSE Stream via Vite proxy
    const sse = new EventSource('/api/v1/notifications/stream', { withCredentials: true });
    
    sse.addEventListener('notification', (e) => {
      try {
        const notif = JSON.parse(e.data);
        dispatch(addNotification(notif));
        dispatch(fetchUnreadCount());
      } catch (err) { /* ignore */ }
    });

    return () => {
      clearInterval(id);
      sse.close();
    };
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) dispatch(fetchNotifications({ limit: 10 }));
  };

  const { user } = useSelector((s) => s.auth || {});

  const getRoleMessageLink = () => {
    if (user?.role === 'admin') return '/admin/messages';
    if (user?.role === 'owner') return '/grand/messages';
    return '/me/messages';
  };

  const handleClick = (n) => {
    if (!n.isRead) dispatch(markNotificationRead(n._id));
    setOpen(false);

    const targetLink = n.link || getRoleMessageLink();
    if (targetLink) {
      navigate(targetLink);
    }
  };

  const handleDelete = (e, notifId) => {
    e.stopPropagation();
    dispatch(deleteNotification(notifId));
  };

  const viewAllLink = user?.role === 'admin' ? '/admin/messages' : user?.role === 'owner' ? '/grand/messages' : '/me/notifications';


  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger Bell Icon */}
      <button
        type="button"
        onClick={toggle}
        className="notif-bell-trigger"
        aria-label="Notifications"
        title="Notifications"
      >
        <FiBell size={20} />
        {unread > 0 && (
          <span className="notif-badge-pill">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Feed Dropdown */}
      {open && (
        <div className="notif-dropdown-menu">
          {/* Header */}
          <div className="notif-dropdown-header">
            <div className="flex items-center gap-2">
              <strong style={{ color: 'var(--text-primary, #1a2130)', fontSize: '15px', fontFamily: 'var(--font-heading, serif)' }}>
                Notifications
              </strong>
              {unread > 0 && (
                <span className="bg-red-500/10 text-red-500 text-xs px-2 py-0.5 rounded-full font-bold">
                  {unread} new
                </span>
              )}
            </div>

            {unread > 0 && (
              <button
                type="button"
                onClick={() => dispatch(markAllNotificationsRead())}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--primary, #c5a880)', fontSize: '12px',
                  fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px',
                }}
              >
                <FiCheckCircle size={14} /> Mark all read
              </button>
            )}
          </div>

          {/* List Content */}
          <div style={{ overflowY: 'auto', flex: 1, maxHeight: '380px' }}>
            {loading && items.length === 0 ? (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-secondary, #94a3b8)', fontSize: '13px' }}>
                Loading updates...
              </div>
            ) : items.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary, #94a3b8)', fontSize: '13px' }}>
                <FiBell size={32} className="mx-auto mb-2 opacity-40 text-secondary" />
                <p className="font-semibold mb-1">All caught up!</p>
                <p className="text-xs">No new alerts or notifications at this time.</p>
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleClick(n)}
                  className={`notif-item-row ${!n.isRead ? 'unread' : ''}`}
                  style={{ position: 'relative' }}
                >
                  {getNotifIcon(n.type)}
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '25px' }}>
                    <div className="flex justify-between items-start gap-2 mb-0.5">
                      <span className={`text-xs ${!n.isRead ? 'font-bold text-primary' : 'font-semibold text-secondary'} truncate`} style={{ color: 'var(--text-primary)' }}>
                        {n.title}
                      </span>
                      <span className="text-xs text-secondary whitespace-nowrap opacity-75" style={{ fontSize: '11px' }}>
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-secondary leading-snug line-clamp-2" style={{ fontSize: '12px', margin: 0 }}>
                      {n.message}
                    </p>

                    {n.link && (
                      <span className="text-xs text-primary font-bold mt-1 inline-flex items-center gap-1 hover:underline" style={{ fontSize: '11px', color: 'var(--primary, #c5a880)' }}>
                        View details <FiArrowRight size={10} />
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, n._id)}
                    title="Delete"
                    style={{
                      position: 'absolute', top: '12px', right: '8px',
                      background: 'transparent', border: 'none', color: '#ef4444',
                      cursor: 'pointer', opacity: 0.5, padding: '4px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Dropdown Footer */}
          <div className="notif-dropdown-footer">
            <Link to={viewAllLink} onClick={() => setOpen(false)}>
              {user?.role === 'admin' || user?.role === 'owner' ? 'View All Messages →' : 'View All Notifications →'}
            </Link>
          </div>

        </div>
      )}
    </div>
  );
};

export default NotificationBell;
