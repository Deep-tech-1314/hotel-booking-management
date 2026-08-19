import React from 'react';
import { FiX, FiPrinter, FiCheckCircle, FiShield, FiDownload } from 'react-icons/fi';
import Logo from './Logo';

const InvoiceModal = ({ isOpen, onClose, booking }) => {
  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = `INV-${(booking._id || '1001').toString().slice(-8).toUpperCase()}`;
  const dateStr = new Date(booking.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const checkIn = new Date(booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const checkOut = new Date(booking.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  
  const roomCharges = booking.priceBreakdown?.roomCharges || Math.round(booking.totalPrice * 0.77);
  const taxes = booking.priceBreakdown?.taxes || Math.round(booking.totalPrice * 0.18);
  const serviceFee = booking.priceBreakdown?.serviceFee || Math.round(booking.totalPrice * 0.05);

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)',
      zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #printable-invoice, #printable-invoice * { visibility: visible; }
            #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; color: #000 !important; background: #fff !important; }
            .no-print { display: none !important; }
          }
        `}
      </style>
      
      <div className="grand-card" style={{ width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#fff', color: '#1a1a1a', borderRadius: '16px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        
        {/* Controls */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #eee' }}>
          <div style={{ fontWeight: 700, fontSize: '18px', color: '#1c2135' }}>Tax Invoice & Payment Receipt</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handlePrint}
              style={{ padding: '8px 16px', backgroundColor: '#1c2135', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
            >
              <FiPrinter size={16} /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: '1px solid #ccc', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: '#666' }}
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div id="printable-invoice" style={{ fontFamily: 'sans-serif' }}>
          
          {/* Invoice Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Logo size="md" variant="mark" color="color" />
                <span style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'serif', color: '#1c2135' }}>BookMyStay</span>
              </div>
              <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.4 }}>
                BookMyStay Luxury Hospitality Pvt Ltd<br />
                GSTIN: 07AAACB1012C1Z4 • Reg. ID: BMS-IN-2026<br />
                Support: support@bookmystay.com
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#c5a880', letterSpacing: '1px' }}>INVOICE</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1c2135', marginTop: '4px' }}>{invoiceNumber}</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>Date: {dateStr}</div>
              <div style={{ marginTop: '8px', display: 'inline-block', padding: '4px 12px', backgroundColor: '#e6f4ea', color: '#137333', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                ✓ PAYMENT VERIFIED & PAID
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '24px 0' }} />

          {/* Guest & Hotel Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '10px', border: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#6b7280', fontWeight: 700, marginBottom: '6px' }}>Billed To</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>{booking.user?.name || 'Guest'}</div>
              <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '2px' }}>{booking.user?.email}</div>
              <div style={{ fontSize: '13px', color: '#4b5563' }}>{booking.user?.phone || 'N/A'}</div>
            </div>

            <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '10px', border: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#6b7280', fontWeight: 700, marginBottom: '6px' }}>Property Details</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>{booking.hotel?.name || 'Luxury Resort'}</div>
              <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '2px' }}>{booking.hotel?.address?.city || 'India'}, {booking.hotel?.address?.state || ''}</div>
              <div style={{ fontSize: '13px', color: '#4b5563' }}>Room: {booking.room?.title || booking.room?.roomType}</div>
            </div>
          </div>

          {/* Dates & Guests */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>CHECK-IN</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginTop: '2px' }}>{checkIn}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>CHECK-OUT</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginTop: '2px' }}>{checkOut}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>GUESTS / ROOMS</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginTop: '2px' }}>{(booking.guests?.adults || 1)} Guest(s) • {booking.numberOfRooms || 1} Room</div>
            </div>
          </div>

          {/* Line Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb', textAlign: 'left', fontSize: '12px', color: '#374151' }}>
                <th style={{ padding: '12px 16px' }}>Description</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount (INR)</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '13px', color: '#1f2937' }}>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 16px' }}>
                  <strong>Accommodation Charges</strong><br />
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>{booking.room?.title} ({booking.numberOfRooms || 1} Room)</span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>₹{roomCharges.toLocaleString('en-IN')}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 16px' }}>GST & Hospitality Taxes (18%)</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>₹{taxes.toLocaleString('en-IN')}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 16px' }}>Service & Platform Processing Fee (5%)</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>₹{serviceFee.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#f9fafb', fontSize: '16px', fontWeight: 800 }}>
                <td style={{ padding: '16px', color: '#111827' }}>Total Paid Amount</td>
                <td style={{ padding: '16px', textAlign: 'right', color: '#c5a880' }}>₹{booking.totalPrice?.toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>

          {/* Footer Terms */}
          <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '11px', color: '#6b7280', lineHeight: 1.5 }}>
            <div style={{ fontWeight: 700, color: '#374151', marginBottom: '4px' }}>Terms & Conditions:</div>
            • This is a computer-generated tax invoice and requires no physical signature.<br />
            • Standard check-in time is 2:00 PM and check-out time is 11:00 AM.<br />
            • Government ID is required upon check-in at the property.
          </div>
        </div>

      </div>
    </div>
  );
};

export default InvoiceModal;
