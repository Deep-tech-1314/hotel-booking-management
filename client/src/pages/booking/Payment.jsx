import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';
import { FiCreditCard, FiLock, FiCheckCircle, FiCalendar, FiUsers } from 'react-icons/fi';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Use location state if available, otherwise mock data for the visual
  const bookingData = location.state || {
    hotelName: "Grand Plaza Resort & Spa",
    location: "Maldives, Indian Ocean",
    checkIn: new Date(Date.now() + 86400000 * 7).toISOString(),
    checkOut: new Date(Date.now() + 86400000 * 12).toISOString(),
    guests: 2,
    rooms: 1,
    amount: 1450,
    taxes: 210,
    total: 1660,
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=800&auto=format&fit=crop"
  };

  const [cardDetails, setCardDetails] = useState({
    name: '',
    number: '',
    expiry: '',
    cvc: ''
  });

  const handlePayment = (e) => {
    e.preventDefault();
    if (!cardDetails.name || !cardDetails.number || !cardDetails.expiry || !cardDetails.cvc) {
      toast.error('Please fill in all payment details');
      return;
    }

    setLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      setLoading(false);
      setPaymentSuccess(true);
      toast.success('Payment successful! Booking confirmed.');
      
      // Redirect to bookings after 3 seconds
      setTimeout(() => {
        navigate('/user/bookings');
      }, 3000);
    }, 2000);
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (paymentSuccess) {
    return (
      <div className="container py-20 flex flex-col items-center justify-center text-center" style={{ minHeight: '80vh' }}>
        <div className="card p-12" style={{ maxWidth: '500px', width: '100%' }}>
          <div className="mx-auto flex items-center justify-center mb-6" style={{ 
            width: '80px', height: '80px', borderRadius: '50%', 
            background: 'rgba(16, 185, 129, 0.15)', color: '#34d399'
          }}>
            <FiCheckCircle size={40} />
          </div>
          <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
          <p className="text-secondary mb-8">
            Your booking at <strong>{bookingData.hotelName}</strong> has been confirmed. 
            A confirmation email has been sent to your registered email address.
          </p>
          <div className="p-4 bg-secondary rounded-lg mb-8 text-left border border-border">
            <div className="flex justify-between mb-2">
              <span className="text-muted">Booking Reference:</span>
              <span className="font-bold text-primary">#BMS-{(Math.random() * 1000000).toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Total Paid:</span>
              <span className="font-bold">₹{bookingData.total}</span>
            </div>
          </div>
          <p className="text-sm text-muted animate-pulse">Redirecting to your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Complete Payment</h1>
        <p className="text-secondary">Securely complete your booking transaction</p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        
        {/* Left Column: Payment Form */}
        <div className="card p-8 h-fit">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b">
            <div className="bg-primary-glow p-3 rounded-full text-primary">
              <FiCreditCard size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Credit/Debit Card</h2>
              <p className="text-sm text-secondary">Safe money transfer using your bank account. We support Mastercard, Visa, Discover and Stripe.</p>
            </div>
          </div>

          <form onSubmit={handlePayment}>
            <div className="form-group">
              <Input
                label="Cardholder Name"
                type="text"
                value={cardDetails.name}
                onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                placeholder="Name on card"
                required
              />
            </div>
            
            <div className="form-group">
              <Input
                label="Card Number"
                type="text"
                value={cardDetails.number}
                onChange={(e) => {
                  // Basic formatting
                  let val = e.target.value.replace(/\D/g, '');
                  val = val.replace(/(.{4})/g, '$1 ').trim();
                  setCardDetails({...cardDetails, number: val});
                }}
                maxLength="19"
                placeholder="0000 0000 0000 0000"
                required
              />
            </div>

            <div className="grid grid-2 gap-4 mb-8">
              <Input
                label="Expiry Date"
                type="text"
                value={cardDetails.expiry}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (val.length > 2) val = val.slice(0,2) + '/' + val.slice(2,4);
                  setCardDetails({...cardDetails, expiry: val});
                }}
                maxLength="5"
                placeholder="MM/YY"
                required
              />
              <Input
                label="CVC/CVV"
                type="password"
                value={cardDetails.cvc}
                onChange={(e) => setCardDetails({...cardDetails, cvc: e.target.value.replace(/\D/g, '')})}
                maxLength="4"
                placeholder="123"
                required
              />
            </div>

            <Button type="submit" className="w-full btn-primary btn-lg flex items-center justify-center gap-2" loading={loading}>
              <FiLock /> Pay ₹{bookingData.total}
            </Button>
            
            <p className="text-xs text-muted text-center mt-4 flex items-center justify-center gap-1">
              <FiLock /> Your payment information is encrypted and secure.
            </p>
          </form>
        </div>

        {/* Right Column: Booking Summary */}
        <div className="card h-fit overflow-hidden border-primary" style={{ borderWidth: '2px' }}>
          <div className="h-48 relative">
            <img src={bookingData.image} alt={bookingData.hotelName} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-white text-xl font-bold mb-1">{bookingData.hotelName}</h3>
              <p className="text-gray-300 text-sm flex items-center gap-1">
                <FiMapPin /> {bookingData.location}
              </p>
            </div>
          </div>
          
          <div className="p-6">
            <h4 className="font-bold text-lg mb-4 border-b pb-2">Booking Summary</h4>
            
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="bg-secondary p-2 rounded-lg text-primary mt-1">
                  <FiCalendar size={18} />
                </div>
                <div>
                  <p className="text-sm text-secondary">Dates</p>
                  <p className="font-semibold text-sm">{formatDate(bookingData.checkIn)} - {formatDate(bookingData.checkOut)}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-secondary p-2 rounded-lg text-primary mt-1">
                  <FiUsers size={18} />
                </div>
                <div>
                  <p className="text-sm text-secondary">Guests & Rooms</p>
                  <p className="font-semibold text-sm">{bookingData.guests} Guests • {bookingData.rooms} Room</p>
                </div>
              </div>
            </div>
            
            <div className="bg-secondary rounded-xl p-4">
              <h4 className="font-bold mb-3 border-b border-border pb-2">Price Breakdown</h4>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-secondary">Room Rate</span>
                <span>₹{bookingData.amount}</span>
              </div>
              <div className="flex justify-between mb-4 text-sm">
                <span className="text-secondary">Taxes & Fees</span>
                <span>₹{bookingData.taxes}</span>
              </div>
              <div className="flex justify-between items-center border-t border-border pt-3">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-2xl text-primary-light">₹{bookingData.total}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Payment;
