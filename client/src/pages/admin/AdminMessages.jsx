import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  FiInbox, FiSend, FiPlus, FiMail, FiSearch, FiCheckCircle,
  FiClock, FiUser, FiHome, FiShield, FiMessageSquare, FiFilter, FiTrash2,
} from 'react-icons/fi';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

const AdminMessages = () => {
  const { user } = useSelector((s) => s.auth);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, INBOX, SENT
  const [messagesData, setMessagesData] = useState({ allMessages: [], inbox: [], outbox: [], unreadCount: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Reply / Compose Modal state
  const [showCompose, setShowCompose] = useState(false);
  const [sending, setSending] = useState(false);
  const [composeForm, setComposeForm] = useState({
    recipientEmail: '',
    subject: '',
    body: '',
  });

  const fetchAdminMessages = async () => {
    setLoading(true);
    try {
      // Fetch all system messages & personal messages
      const [allRes, meRes] = await Promise.all([
        api.get('/messages/all').catch(() => ({ data: { data: { allMessages: [] } } })),
        api.get('/messages/me').catch(() => ({ data: { data: { inbox: [], outbox: [] } } })),
      ]);

      const all = allRes.data?.data?.allMessages || [];
      const inbox = meRes.data?.data?.inbox || [];
      const outbox = meRes.data?.data?.outbox || [];
      const unreadCount = all.filter((m) => !m.isRead).length;

      setMessagesData({
        allMessages: all,
        inbox,
        outbox,
        unreadCount,
      });
    } catch (err) {
      toast.error('Failed to load admin messages');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (msgId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this message?')) return;
    try {
      await api.delete(`/messages/${msgId}`);
      toast.success('Message deleted successfully');
      if (selectedMessage?._id === msgId) {
        setSelectedMessage(null);
      }
      fetchAdminMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete message');
    }
  };


  useEffect(() => {
    fetchAdminMessages();
  }, []);

  const handleOpenMessage = async (msg) => {
    setSelectedMessage(msg);
    if (!msg.isRead) {
      try {
        await api.patch(`/messages/${msg._id}/read`);
        setMessagesData((prev) => ({
          ...prev,
          allMessages: prev.allMessages.map((m) => (m._id === msg._id ? { ...m, isRead: true } : m)),
          inbox: prev.inbox.map((m) => (m._id === msg._id ? { ...m, isRead: true } : m)),
          unreadCount: Math.max(0, prev.unreadCount - 1),
        }));
      } catch (err) { /* ignore */ }
    }
  };

  const handleSendSubmit = async (e) => {
    e.preventDefault();
    if (!composeForm.recipientEmail.trim() || !composeForm.subject.trim() || !composeForm.body.trim()) {
      return toast.error('Please complete all required fields');
    }

    setSending(true);
    try {
      await api.post('/messages', composeForm);
      toast.success('Message sent successfully!');
      setShowCompose(false);
      setComposeForm({ recipientEmail: '', subject: '', body: '' });
      fetchAdminMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Determine current working list
  let currentList = [];
  if (activeTab === 'ALL') currentList = messagesData.allMessages;
  else if (activeTab === 'INBOX') currentList = messagesData.inbox;
  else if (activeTab === 'SENT') currentList = messagesData.outbox;

  // Filter list by search term
  const filteredMessages = currentList.filter((m) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      m.subject?.toLowerCase().includes(term) ||
      m.body?.toLowerCase().includes(term) ||
      m.sender?.name?.toLowerCase().includes(term) ||
      m.sender?.email?.toLowerCase().includes(term) ||
      m.recipient?.name?.toLowerCase().includes(term) ||
      m.recipient?.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="admin-messages-page flex flex-col gap-6">
      {/* Header & Stats */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif">Platform Messages & Support Desk</h1>
          <p className="text-secondary text-sm">View, track, and reply to all communications across guests, owners, and system administrators</p>
        </div>

        <Button
          onClick={() => {
            setComposeForm({ recipientEmail: '', subject: '', body: '' });
            setShowCompose(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus size={18} /> Compose Message
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 border border-border flex items-center gap-4 bg-card">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <FiMessageSquare size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{messagesData.allMessages.length}</div>
            <div className="text-xs text-secondary font-medium">Total Platform Messages</div>
          </div>
        </div>

        <div className="card p-4 border border-border flex items-center gap-4 bg-card">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <FiMail size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{messagesData.unreadCount}</div>
            <div className="text-xs text-secondary font-medium">Unread Messages</div>
          </div>
        </div>

        <div className="card p-4 border border-border flex items-center gap-4 bg-card">
          <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
            <FiSend size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{messagesData.outbox.length}</div>
            <div className="text-xs text-secondary font-medium">Admin Outgoing Sent</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex justify-between items-center flex-wrap gap-4 bg-card p-4 rounded-xl border border-border">
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveTab('ALL'); setSelectedMessage(null); }}
            className={`msg-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
          >
            <FiMessageSquare size={16} /> All Messages ({messagesData.allMessages.length})
          </button>
          <button
            onClick={() => { setActiveTab('INBOX'); setSelectedMessage(null); }}
            className={`msg-tab-btn ${activeTab === 'INBOX' ? 'active' : ''}`}
          >
            <FiInbox size={16} /> Admin Inbox ({messagesData.inbox.length})
          </button>
          <button
            onClick={() => { setActiveTab('SENT'); setSelectedMessage(null); }}
            className={`msg-tab-btn ${activeTab === 'SENT' ? 'active' : ''}`}
          >
            <FiSend size={16} /> Outbox ({messagesData.outbox.length})
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-input border border-border px-3 py-2 rounded-lg w-full md:w-72">
          <FiSearch className="text-secondary" size={16} />
          <input
            type="text"
            placeholder="Search by sender, email, subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none text-xs text-primary outline-none w-full"
          />
        </div>
      </div>

      {/* Main Split-Pane View */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Messages List Column */}
        <div className="md:col-span-5 flex flex-col gap-3">
          {loading ? (
            <div className="page-loader py-12"><div className="loader"></div></div>
          ) : filteredMessages.length === 0 ? (
            <div className="card p-8 text-center border border-border bg-card">
              <FiMail size={36} className="mx-auto mb-3 text-secondary opacity-40" />
              <h4 className="font-bold text-sm mb-1">No messages found</h4>
              <p className="text-xs text-secondary">No records matching your search filter.</p>
            </div>
          ) : (
            filteredMessages.map((m) => {
              const isSelected = selectedMessage?._id === m._id;
              const isUnread = !m.isRead;

              return (
                <div
                  key={m._id}
                  onClick={() => handleOpenMessage(m)}
                  className={`msg-card ${isSelected ? 'selected' : ''} ${isUnread ? 'unread' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-6 h-6 rounded-full bg-primary-light flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        {m.sender?.name ? m.sender.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="text-xs font-bold text-primary truncate">
                        {m.sender?.name || 'Guest/User'} ({m.sender?.role || 'user'})
                      </span>
                    </div>
                    <span className="text-xs text-secondary whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-primary truncate mb-1" style={{ color: 'var(--text-primary)' }}>
                    {m.subject}
                  </h4>
                  <p className="text-xs text-secondary line-clamp-1">{m.body}</p>

                  <div className="mt-2 flex items-center justify-between text-xs text-secondary pt-2 border-t border-border/40">
                    <span>To: <strong>{m.recipient?.name || m.recipient?.email || 'Admin'}</strong></span>
                    {m.hotel && (
                      <span className="flex items-center gap-1 text-grand-gold">
                        <FiHome size={12} /> {m.hotel.name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Reader Pane */}
        <div className="md:col-span-7">
          {selectedMessage ? (
            <div className="msg-detail-box">
              <div className="border-b border-border pb-4">
                <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-grand-gold">
                    Message Details (ID: {selectedMessage._id.slice(-6)})
                  </span>
                  <span className="text-xs text-secondary flex items-center gap-1">
                    <FiClock size={12} /> {new Date(selectedMessage.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>

                <h2 className="text-2xl font-bold font-serif mb-3" style={{ color: 'var(--text-primary)' }}>
                  {selectedMessage.subject}
                </h2>

                <div className="flex flex-wrap gap-4 text-xs text-secondary bg-primary-light p-3 rounded-lg border border-border mb-2">
                  <div className="flex items-center gap-1.5">
                    <FiUser className="text-grand-gold" size={14} />
                    <span><strong>From:</strong> {selectedMessage.sender?.name || 'User'} ({selectedMessage.sender?.email}) [{selectedMessage.sender?.role}]</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FiSend className="text-grand-gold" size={14} />
                    <span><strong>To:</strong> {selectedMessage.recipient?.name || 'Admin Support'} ({selectedMessage.recipient?.email})</span>
                  </div>
                  {selectedMessage.hotel && (
                    <div className="flex items-center gap-1.5">
                      <FiHome className="text-grand-gold" size={14} />
                      <span><strong>Hotel:</strong> {selectedMessage.hotel.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Body */}
              <div className="msg-body-content">
                {selectedMessage.body}
              </div>

              {/* Actions */}
              <div className="pt-2 flex justify-between items-center gap-3 flex-wrap">
                <Button
                  onClick={(e) => handleDeleteMessage(selectedMessage._id, e)}
                  variant="outline"
                  className="flex items-center gap-2 text-red-500 border-red-500/30 hover:bg-red-500/10"
                >
                  <FiTrash2 size={14} /> Delete Message
                </Button>

                <Button
                  onClick={() => {
                    setComposeForm({
                      recipientEmail: selectedMessage.sender?.email || '',
                      subject: selectedMessage.subject.startsWith('Re:') ? selectedMessage.subject : `Re: ${selectedMessage.subject}`,
                      body: '',
                    });
                    setShowCompose(true);
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <FiSend size={14} /> Reply to {selectedMessage.sender?.name || 'Sender'}
                </Button>
              </div>

            </div>
          ) : (
            <div className="card p-12 text-center border border-border bg-card text-secondary">
              <FiMessageSquare size={48} className="mx-auto mb-3 text-secondary opacity-40" />
              <h3 className="font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>No Message Selected</h3>
              <p className="text-sm text-secondary">Click on any message thread from the left list to view full details and send replies.</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose / Reply Modal */}
      <Modal isOpen={showCompose} onClose={() => setShowCompose(false)} title="Compose / Reply Message">
        <form onSubmit={handleSendSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
              Recipient Email *
            </label>
            <input
              type="email"
              placeholder="e.g. guest@example.com or owner@bookmystay.com"
              value={composeForm.recipientEmail}
              onChange={(e) => setComposeForm({ ...composeForm, recipientEmail: e.target.value })}
              required
              className="msg-input-field"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
              Subject *
            </label>
            <input
              type="text"
              placeholder="Enter message subject"
              value={composeForm.subject}
              onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
              required
              className="msg-input-field"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
              Message Content *
            </label>
            <textarea
              rows={5}
              placeholder="Write your response or support message..."
              value={composeForm.body}
              onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
              required
              className="msg-input-field"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
            <Button type="button" variant="outline" onClick={() => setShowCompose(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={sending} className="btn-primary flex items-center gap-2">
              <FiSend size={16} /> Send Message
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminMessages;
