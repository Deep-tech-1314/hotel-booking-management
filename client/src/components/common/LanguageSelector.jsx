import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { FiGlobe, FiChevronDown, FiCheck, FiSearch, FiX } from 'react-icons/fi';

const LanguageSelector = ({ variant = 'default' }) => {
  const { currentLanguage, changeLanguage, languages, currentLangObj } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRegion, setActiveRegion] = useState('All');

  // Filter languages by search query and region
  const filteredLanguages = useMemo(() => {
    return languages.filter((lang) => {
      const matchesSearch =
        lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRegion = activeRegion === 'All' || lang.region === activeRegion;
      return matchesSearch && matchesRegion;
    });
  }, [languages, searchQuery, activeRegion]);

  const isGrand = variant === 'grand';

  // Handle escape key and body scroll lock
  useEffect(() => {
    if (!modalOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [modalOpen]);

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        className="language-trigger-btn"
        onClick={() => setModalOpen(true)}
        aria-label="Select Language"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: isGrand ? '7px 16px' : '6px 14px',
          background: isGrand ? 'rgba(255, 255, 255, 0.05)' : 'var(--bg-card, #ffffff)',
          color: isGrand ? 'var(--grand-text, #ffffff)' : 'var(--text-primary, #1e293b)',
          border: `1px solid ${isGrand ? 'rgba(197, 168, 128, 0.3)' : 'var(--border, #cbd5e1)'}`,
          borderRadius: '24px',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <FiGlobe size={15} color={isGrand ? 'var(--grand-gold, #c5a880)' : 'var(--primary, #6366f1)'} />
        <span style={{ fontSize: '16px', lineHeight: 1 }}>{currentLangObj?.flag || '🌐'}</span>
        <span style={{ fontWeight: 600 }}>{currentLangObj?.nativeName || currentLangObj?.name}</span>
        <FiChevronDown size={14} style={{ opacity: 0.7 }} />
      </button>

      {/* Responsive Theme-Adaptive Modal */}
      {modalOpen && (
        <div
          className="lang-modal-overlay"
          onClick={() => setModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 16px 24px 16px', // Top padding ensures it never collides with header
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div
            className="lang-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '720px',
              maxHeight: 'calc(100vh - 100px)', // Guaranteed to fit inside screen
              backgroundColor: isGrand ? '#111827' : 'var(--bg-card, #ffffff)',
              color: isGrand ? '#ffffff' : 'var(--text-primary, #0f172a)',
              border: `1px solid ${isGrand ? 'rgba(197, 168, 128, 0.3)' : 'var(--border, #cbd5e1)'}`,
              borderRadius: '24px',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              margin: 'auto',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px 16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: `1px solid ${isGrand ? 'rgba(255, 255, 255, 0.1)' : 'var(--border-light, #f1f5f9)'}`,
                background: isGrand ? 'rgba(255, 255, 255, 0.03)' : 'var(--bg-secondary, #f8fafc)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: isGrand ? 'rgba(197, 168, 128, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isGrand ? '#c5a880' : '#6366f1',
                  }}
                >
                  <FiGlobe size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                    Select Language / भाषा चुनें
                  </h3>
                  <p style={{ fontSize: '12.5px', opacity: 0.7, margin: '2px 0 0 0' }}>
                    Choose your language for dynamic real-time translation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  opacity: 0.7,
                  cursor: 'pointer',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'opacity 0.15s ease',
                }}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Search Input Bar */}
            <div style={{ padding: '16px 24px 12px 24px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: isGrand ? '#1f2937' : 'var(--bg-input, #f1f5f9)',
                  border: `1px solid ${isGrand ? 'rgba(255, 255, 255, 0.15)' : 'var(--border, #cbd5e1)'}`,
                  borderRadius: '14px',
                  padding: '10px 16px',
                }}
              >
                <FiSearch size={16} style={{ opacity: 0.6 }} />
                <input
                  type="text"
                  placeholder="Search 35+ languages by name, native script..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: 'inherit',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.6, padding: 0 }}
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Region Filter Tabs */}
            <div style={{ padding: '0 24px 12px 24px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
              {['All', 'Popular', 'Europe', 'Asia & Pacific', 'Middle East & Americas'].map((reg) => {
                const isActive = activeRegion === reg;
                return (
                  <button
                    key={reg}
                    type="button"
                    onClick={() => setActiveRegion(reg)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      border: `1px solid ${isActive ? (isGrand ? '#c5a880' : '#6366f1') : (isGrand ? 'rgba(255, 255, 255, 0.15)' : 'var(--border, #cbd5e1)')}`,
                      backgroundColor: isActive ? (isGrand ? '#c5a880' : '#6366f1') : 'transparent',
                      color: isActive ? '#ffffff' : 'inherit',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {reg}
                  </button>
                );
              })}
            </div>

            {/* Languages Grid - Fully Scrollable */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                padding: '4px 24px 24px 24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                gap: '10px',
                maxHeight: '440px',
              }}
            >
              {filteredLanguages.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '40px 0', textAlign: 'center', opacity: 0.7, fontSize: '14px' }}>
                  No languages found matching "{searchQuery}"
                </div>
              ) : (
                filteredLanguages.map((lang) => {
                  const isSelected = lang.code === currentLanguage;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        changeLanguage(lang.code);
                        setModalOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '14px',
                        border: `1.5px solid ${isSelected ? (isGrand ? '#c5a880' : '#6366f1') : (isGrand ? 'rgba(255, 255, 255, 0.1)' : 'var(--border-light, #f1f5f9)')}`,
                        backgroundColor: isSelected
                          ? (isGrand ? 'rgba(197, 168, 128, 0.15)' : 'rgba(99, 102, 241, 0.08)')
                          : (isGrand ? 'rgba(255, 255, 255, 0.03)' : 'var(--bg-input, #f8fafc)'),
                        color: 'inherit',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                        <span style={{ fontSize: '22px', lineHeight: 1, flexShrink: 0 }}>{lang.flag}</span>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontWeight: 700, fontSize: '13.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {lang.nativeName}
                          </div>
                          <div style={{ fontSize: '11px', opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {lang.name}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: isGrand ? '#c5a880' : '#6366f1',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginLeft: '6px',
                          }}
                        >
                          <FiCheck size={12} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LanguageSelector;
