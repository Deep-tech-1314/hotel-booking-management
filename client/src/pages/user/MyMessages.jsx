import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FiInbox, FiSend, FiPlus, FiMail, FiClock, FiUser, FiHome, FiMessageSquare, FiTrash2 } from 'react-icons/fi';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

const MyMessages = () => {
  const { user } = useSelector((s) => s.auth);
  const [activeTab, setActiveTab] = useState('INBOX'); // INBOX, SENT
  const [messages, setMessages] = useState({ inbox: [], outbox: [], unreadCount: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  
  // Compose modal state
  const [showCompose, setShowCompose] = useState(false);
  const [sending, setSending] = useState(false);
  const [composeForm, setComposeForm] = useState({
    recipientEmail: 'owner@bookmystay.com',
    subject: '',
    body: '',
  });

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/messages/me');
      if (data.success) {
        setMessages(data.data || { inbox: [], outbox: [], unreadCount: 0 });
      }
    } catch (err) {
      toast.error('Failed to load messages');
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
      fetchMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete message');
    }
  };


  useEffect(() => {
    fetchMessages();
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
    if (!composeForm.subject.trim() || !composeForm.body.trim()) {
      return toast.error('Please enter subject and message body');
    }

    setSending(true);
    try {
      await api.post('/messages', composeForm);
      toast.success('Message sent to management successfully!');
      setShowCompose(false);
      setComposeForm({ recipientEmail: 'owner@bookmystay.com', subject: '', body: '' });
      fetchMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const list = (activeTab === 'INBOX' ? messages?.inbox : messages?.outbox) || [];

  return (
    <div className="container py-12" style={{ maxWidth: '1000px' }}>
      {/* Header section */}
      <div className="flex justify-between items-end mb-8 flex-wrap gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold font-serif mb-2">Message Center</h1>
          <p className="text-secondary text-sm">Direct communications with hotel owners and guest support</p>
        </div>

        <Button
          onClick={() => {
            setComposeForm({ recipientEmail: 'owner@bookmystay.com', subject: '', body: '' });
            setShowCompose(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus size={18} /> New Message
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => { setActiveTab('INBOX'); setSelectedMessage(null); }}
          className={`msg-tab-btn ${activeTab === 'INBOX' ? 'active' : ''}`}
        >
          <FiInbox size={18} />
          <span>Inbox</span>
          {messages.unreadCount > 0 ? (
            <span className="msg-badge-unread">{messages.unreadCount}</span>
          ) : (
            <span className="msg-badge-count">{messages.inbox.length}</span>
          )}
        </button>

        <button
          onClick={() => { setActiveTab('SENT'); setSelectedMessage(null); }}
          className={`msg-tab-btn ${activeTab === 'SENT' ? 'active' : ''}`}
        >
          <FiSend size={18} />
          <span>Sent Messages</span>
          <span className="msg-badge-count">{messages.outbox.length}</span>
        </button>
      </div>

      {/* Grid Layout: List + Detail Pane */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Messages List Column */}
        <div className="md:col-span-5 flex flex-col gap-3">
          {loading ? (
            <div className="page-loader py-12"><div className="loader"></div></div>
          ) : list.length === 0 ? (
            <div className="card p-8 text-center border border-border">
              <FiMail size={36} className="mx-auto mb-3 text-secondary opacity-50" />
              <h4 className="font-bold text-sm mb-1">No {activeTab.toLowerCase()} messages</h4>
              <p className="text-xs text-secondary mb-4">You have no messages in your {activeTab.toLowerCase()} folder.</p>
              {activeTab === 'INBOX' && (
                <Button
                  onClick={() => setShowCompose(true)}
                  variant="outline"
                  size="sm"
                  className="mx-auto flex items-center gap-2"
                >
                  <FiPlus size={14} /> Send a Message
                </Button>
              )}
            </div>
          ) : (
            list.map((m) => {
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
                        {otherParty?.name ? otherParty.name.charAt(0).toUpperCase() : 'M'}
                      </div>
                      <span className="text-xs font-bold text-primary truncate">
                        {otherParty?.name || 'Hotel Management'}
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

                  {m.hotel && (
                    <div className="mt-2 text-xs text-primary font-medium flex items-center gap-1">
                      <FiHome size={12} /> {m.hotel.name}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Message Thread Reader Pane */}
        <div className="md:col-span-7">
          {selectedMessage ? (
            <div className="msg-detail-box">
              <div className="border-b border-border pb-4">
                <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-grand-gold">
                    {activeTab === 'INBOX' ? 'Inbox Message' : 'Sent Message'}
                  </span>
                  <span className="text-xs text-secondary flex items-center gap-1">
                    <FiClock size={12} /> {new Date(selectedMessage.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
                
                <h2 className="text-2xl font-bold font-serif mb-3" style={{ color: 'var(--text-primary)' }}>
                  {selectedMessage.subject}
                </h2>
                
                <div className="flex flex-wrap gap-4 text-xs text-secondary bg-primary-light p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-1.5">
                    <FiUser className="text-grand-gold" size={14} />
                    <span><strong>From:</strong> {selectedMessage.sender?.name || 'Hotel Management'} ({selectedMessage.sender?.email || 'System'})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FiSend className="text-grand-gold" size={14} />
                    <span><strong>To:</strong> {selectedMessage.recipient?.name || 'User'} ({selectedMessage.recipient?.email})</span>
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

              {/* Reply & Delete Actions */}
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
                        recipientEmail: selectedMessage.sender?.email || 'owner@bookmystay.com',
                        subject: selectedMessage.subject.startsWith('Re:') ? selectedMessage.subject : `Re: ${selectedMessage.subject}`,
                        body: '',
                      });
                      setShowCompose(true);
                    }}
                    className="btn-primary flex items-center gap-2"
                  >
                    <FiSend size={14} /> Reply to Message
                  </Button>
                )}
              </div>

            </div>
          ) : (
            <div className="card p-12 text-center border border-border bg-primary text-secondary">
              <FiMessageSquare size={48} className="mx-auto mb-3 text-secondary opacity-40" />
              <h3 className="font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>No Message Selected</h3>
              <p className="text-sm text-secondary">Select any message from the left list to read its contents and reply.</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose Message Modal */}
      <Modal isOpen={showCompose} onClose={() => setShowCompose(false)} title="Compose Direct Message">
        <form onSubmit={handleSendSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
              Recipient *
            </label>
            <select
              value={composeForm.recipientEmail}
              onChange={(e) => setComposeForm({ ...composeForm, recipientEmail: e.target.value })}
              className="msg-input-field mb-2"
            >
              <option value="owner@bookmystay.com">Hotel Management Support (owner@bookmystay.com)</option>
              <option value="admin@bookmystay.com">BookMyStay Admin Desk (admin@bookmystay.com)</option>
              <option value="custom">Custom Recipient Email...</option>
            </select>
            
            {composeForm.recipientEmail !== 'owner@bookmystay.com' && composeForm.recipientEmail !== 'admin@bookmystay.com' && (
              <input
                type="email"
                placeholder="Enter recipient email address"
                value={composeForm.recipientEmail === 'custom' ? '' : composeForm.recipientEmail}
                onChange={(e) => setComposeForm({ ...composeForm, recipientEmail: e.target.value })}
                required
                className="msg-input-field"
              />
            )}
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
              Subject *
            </label>
            <input
              type="text"
              placeholder="e.g. Inquiry regarding check-in time or booking amenities"
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
              placeholder="Write your detailed message here..."
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

export default MyMessages;
