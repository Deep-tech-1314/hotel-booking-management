import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  FiInbox, FiSend, FiPlus, FiMail, FiClock, FiUser,
  FiHome, FiMessageSquare, FiSearch, FiCheckCircle, FiTrash2,
} from 'react-icons/fi';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

const GrandMessages = () => {
  const { user } = useSelector((s) => s.auth);
  const [activeTab, setActiveTab] = useState('INBOX'); // INBOX, SENT
  const [messages, setMessages] = useState({ inbox: [], outbox: [], unreadCount: 0 });
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

  const fetchOwnerMessages = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/messages/me');
      if (data.success) {
        setMessages(data.data || { inbox: [], outbox: [], unreadCount: 0 });
      }
    } catch (err) {
      toast.error('Failed to load owner messages');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (msgId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await api.delete(`/messages/${msgId}`);
      toast.success('Message deleted successfully');
      if (selectedMessage?._id === msgId) {
        setSelectedMessage(null);
      }
      fetchOwnerMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete message');
    }
  };


  useEffect(() => {
    fetchOwnerMessages();
  }, []);

  const handleOpenMessage = async (msg) => {
    setSelectedMessage(msg);
    if (activeTab === 'INBOX' && !msg.isRead) {
      try {
        await api.patch(`/messages/${msg._id}/read`);
        setMessages((prev) => ({
          ...prev,
          inbox: prev.inbox.map((m) => (m._id === msg._id ? { ...m, isRead: true } : m)),
          unreadCount: Math.max(0, prev.unreadCount - 1),
        }));
      } catch (err) { /* ignore */ }
    }
  };

  const handleSendSubmit = async (e) => {
    e.preventDefault();
    if (!composeForm.recipientEmail.trim() || !composeForm.subject.trim() || !composeForm.body.trim()) {
      return toast.error('Please enter recipient email, subject, and message');
    }

    setSending(true);
    try {
      await api.post('/messages', composeForm);
      toast.success('Message sent to guest successfully!');
      setShowCompose(false);
      setComposeForm({ recipientEmail: '', subject: '', body: '' });
      fetchOwnerMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const currentList = (activeTab === 'INBOX' ? messages?.inbox : messages?.outbox) || [];
  const filteredMessages = currentList.filter((m) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      m.subject?.toLowerCase().includes(term) ||
      m.body?.toLowerCase().includes(term) ||
      m.sender?.name?.toLowerCase().includes(term) ||
      m.sender?.email?.toLowerCase().includes(term) ||
      m.recipient?.name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="grand-messages-page flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="grand-h1" style={{ marginBottom: '4px' }}>
            Guest Communications & Inquiries
          </h1>
          <p className="grand-subtext">
            Direct guest inbox, reservation inquiries, and management messages
          </p>
        </div>

        <Button
          onClick={() => {
            setComposeForm({ recipientEmail: '', subject: '', body: '' });
            setShowCompose(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus size={18} /> New Direct Message
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="grand-card p-4 border border-border flex items-center gap-4 bg-card">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <FiInbox size={24} />
          </div>
          <div>
            <div className="grand-stat-value">{messages.inbox.length}</div>
            <div className="grand-label" style={{ marginTop: '4px' }}>Guest Inquiries Inbox</div>
          </div>
        </div>

        <div className="grand-card p-4 border border-border flex items-center gap-4 bg-card">
          <div className="p-3 rounded-xl bg-red-500/10 text-red-500">
            <FiMail size={24} />
          </div>
          <div>
            <div className="grand-stat-value">{messages.unreadCount}</div>
            <div className="grand-label" style={{ marginTop: '4px' }}>Unread Inquiries</div>
          </div>
        </div>

        <div className="grand-card p-4 border border-border flex items-center gap-4 bg-card">
          <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
            <FiSend size={24} />
          </div>
          <div>
            <div className="grand-stat-value">{messages.outbox.length}</div>
            <div className="grand-label" style={{ marginTop: '4px' }}>Sent Responses</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Tabs & Search */}
      <div className="flex justify-between items-center flex-wrap gap-4 p-4 rounded-xl border border-border bg-card">
        <div className="flex gap-3">
          <button
            onClick={() => { setActiveTab('INBOX'); setSelectedMessage(null); }}
            className={`msg-tab-btn ${activeTab === 'INBOX' ? 'active' : ''}`}
          >
            <FiInbox size={16} /> Guest Inbox {messages.unreadCount > 0 && <span className="msg-badge-unread">{messages.unreadCount}</span>}
          </button>
          <button
            onClick={() => { setActiveTab('SENT'); setSelectedMessage(null); }}
            className={`msg-tab-btn ${activeTab === 'SENT' ? 'active' : ''}`}
          >
            <FiSend size={16} /> Sent Messages ({messages.outbox.length})
          </button>
        </div>

        <div className="flex items-center gap-2 bg-input border border-border px-3 py-2 rounded-lg w-full md:w-72">
          <FiSearch className="text-secondary" size={16} />
          <input
            type="text"
            placeholder="Search inquiries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none text-xs text-primary outline-none w-full"
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Messages List Column */}
        <div className="md:col-span-5 flex flex-col gap-3">
          {loading ? (
            <div className="page-loader py-12"><div className="loader"></div></div>
          ) : filteredMessages.length === 0 ? (
            <div className="card p-8 text-center border border-border bg-card">
              <FiMail size={36} className="mx-auto mb-3 text-secondary opacity-50" />
              <h4 className="font-bold text-sm mb-1">No messages found</h4>
              <p className="text-xs text-secondary mb-4">You have no messages matching this filter.</p>
            </div>
          ) : (
            filteredMessages.map((m) => {
              const isSelected = selectedMessage?._id === m._id;
              const isUnread = !m.isRead && activeTab === 'INBOX';
              const otherParty = activeTab === 'INBOX' ? m.sender : m.recipient;

              return (
                <div
                  key={m._id}
                  onClick={() => handleOpenMessage(m)}
                  className={`msg-card ${isSelected ? 'selected' : ''} ${isUnread ? 'unread' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-6 h-6 rounded-full bg-primary-light flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        {otherParty?.name ? otherParty.name.charAt(0).toUpperCase() : 'G'}
                      </div>
                      <span className="text-xs font-bold text-primary truncate">
                        {otherParty?.name || 'Guest User'}
                      </span>
                    </div>
                    <span className="text-xs text-secondary whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold truncate mb-1" style={{ color: 'var(--text-primary)' }}>
                    {m.subject}
                  </h4>
                  <p className="text-xs text-secondary line-clamp-1">{m.body}</p>

                  {m.hotel && (
                    <div className="mt-2 text-xs font-medium text-grand-gold flex items-center gap-1">
                      <FiHome size={12} /> {m.hotel.name}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Message Detail Reader Pane */}
        <div className="md:col-span-7">
          {selectedMessage ? (
            <div className="msg-detail-box">
              <div className="border-b border-border pb-4">
                <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-grand-gold">
                    {activeTab === 'INBOX' ? 'Received Guest Inquiry' : 'Sent Response'}
                  </span>
                  <span className="text-xs text-secondary flex items-center gap-1">
                    <FiClock size={12} /> {new Date(selectedMessage.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>

                <h2 className="text-2xl font-bold font-serif mb-3" style={{ color: 'var(--text-primary)' }}>
                  {selectedMessage.subject}
                </h2>

                <div className="flex flex-wrap gap-4 text-xs text-secondary bg-primary-light p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-1.5">
                    <FiUser className="text-grand-gold" size={14} />
                    <span><strong>From:</strong> {selectedMessage.sender?.name || 'Guest'} ({selectedMessage.sender?.email})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FiSend className="text-grand-gold" size={14} />
                    <span><strong>To:</strong> {selectedMessage.recipient?.name || 'Owner'} ({selectedMessage.recipient?.email})</span>
                  </div>
                  {selectedMessage.hotel && (
                    <div className="flex items-center gap-1.5">
                      <FiHome className="text-grand-gold" size={14} />
                      <span><strong>Property:</strong> {selectedMessage.hotel.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Body */}
              <div className="msg-body-content">
                {selectedMessage.body}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-between items-center gap-3 flex-wrap">
                <Button
                  onClick={(e) => handleDeleteMessage(selectedMessage._id, e)}
                  variant="outline"
                  className="flex items-center gap-2 text-red-500 border-red-500/30 hover:bg-red-500/10"
                >
                  <FiTrash2 size={14} /> Delete Message
                </Button>

                {activeTab === 'INBOX' && (
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
                    <FiSend size={14} /> Reply to {selectedMessage.sender?.name || 'Guest'}
                  </Button>
                )}
              </div>

            </div>
          ) : (
            <div className="card p-12 text-center border border-border bg-card text-secondary">
              <FiMessageSquare size={48} className="mx-auto mb-3 text-secondary opacity-40" />
              <h3 className="font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>No Inquiry Selected</h3>
              <p className="text-sm text-secondary">Select an inquiry from the left list to read details and reply.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reply Modal */}
      <Modal isOpen={showCompose} onClose={() => setShowCompose(false)} title="Reply / Compose Message">
        <form onSubmit={handleSendSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
              Guest Email Address *
            </label>
            <input
              type="email"
              placeholder="e.g. guest@example.com"
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
              placeholder="Message subject"
              value={composeForm.subject}
              onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
              required
              className="msg-input-field"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
              Message Body *
            </label>
            <textarea
              rows={5}
              placeholder="Write your response to the guest..."
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

export default GrandMessages;
