export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

export const calculateNights = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
};

export const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    confirmed: 'primary',
    'checked-in': 'success',
    'checked-out': 'neutral',
    cancelled: 'danger',
    paid: 'success',
    refunded: 'warning',
    failed: 'danger',
  };
  return colors[status] || 'neutral';
};

export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const AMENITY_ICONS = {
  'WiFi': '📶', 'Pool': '🏊', 'Parking': '🅿️', 'AC': '❄️',
  'Gym': '💪', 'Spa': '💆', 'Restaurant': '🍽️', 'Bar': '🍸',
  'Room Service': '🛎️', 'Laundry': '👔', 'Pet Friendly': '🐾',
  'Beach Access': '🏖️', 'Mountain View': '⛰️', 'City View': '🌆',
};

export const CATEGORIES = [
  { value: 'hotel', label: 'Hotel', icon: '🏨' },
  { value: 'resort', label: 'Resort', icon: '🏖️' },
  { value: 'villa', label: 'Villa', icon: '🏡' },
  { value: 'apartment', label: 'Apartment', icon: '🏢' },
  { value: 'hostel', label: 'Hostel', icon: '🛏️' },
  { value: 'guesthouse', label: 'Guesthouse', icon: '🏠' },
  { value: 'boutique', label: 'Boutique', icon: '✨' },
  { value: 'heritage', label: 'Heritage', icon: '🏰' },
  { value: 'campsite', label: 'Campsite', icon: '🏕️' },
  { value: 'treehouse', label: 'Treehouse', icon: '🌳' },
];
