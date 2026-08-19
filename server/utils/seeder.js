const mongoose = require('mongoose');
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const Transaction = require('../models/Transaction');
const ContentBlock = require('../models/ContentBlock');
const PlatformSettings = require('../models/PlatformSettings');

// ─── Helpers ────────────────────────────────────────────────────────────
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const pastDate = (daysBack) => addDays(new Date(), -daysBack);
const futureDate = (daysAhead) => addDays(new Date(), daysAhead);

// ─── 33 Indian Hotel Data ───────────────────────────────────────────────
const hotelData = [
  // 1. Jaipur (Hotel)
  {
    name: 'Haveli Amer Heritage',
    slug: 'haveli-amer-heritage-jaipur',
    description: 'Nestled along Amer Road beneath the shadow of the iconic Amer Fort, this heritage haveli captures the grandeur of Rajput architecture. Carved sandstone facades and jharokha balconies frame courtyards where peacocks still roam at dawn. Guests awaken to chai service on private terraces overlooking the Aravalli foothills.',
    category: 'hotel',
    starRating: 4,
    address: { street: 'Amer Road, Jaipur', city: 'Jaipur', state: 'Rajasthan', country: 'India', zipCode: '302002' },
    location: { type: 'Point', coordinates: [75.8513, 26.9855] },
    amenities: ['WiFi', 'Pool', 'Restaurant', 'Spa', 'Heritage Tours', 'Parking', 'Room Service', 'Laundry'],
    priceRange: { min: 4500, max: 12000, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80', public_id: 'jaipur-ext-1', caption: 'Pink sandstone haveli facade at sunset' },
      { url: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80', public_id: 'jaipur-room-1', caption: 'Heritage room with carved wooden furniture and jaali windows' },
      { url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=80', public_id: 'jaipur-amen-1', caption: 'Courtyard pool with Amer Fort views' },
    ],
    isFeatured: true,
    rooms: [
      { roomType: 'deluxe', title: 'Heritage Room', pricePerNight: 4500, maxGuests: 2, bedType: 'double', discount: 10, amenities: ['AC', 'WiFi', 'TV', 'Minibar', 'Room Service'] },
      { roomType: 'suite', title: 'Royal Suite', pricePerNight: 12000, maxGuests: 4, bedType: 'king', discount: 0, amenities: ['AC', 'WiFi', 'TV', 'Minibar', 'Balcony', 'Bathtub', 'Room Service'] },
    ],
  },
  // 2. Udaipur (Resort)
  {
    name: 'Lake Pichola Palace Resort',
    slug: 'lake-pichola-palace-resort-udaipur',
    description: 'Rising from the shimmering waters of Lake Pichola, this palatial resort offers a floating fantasy framed by the Aravalli Mountains. Sunset boat rides carry guests past the City Palace while the spa draws on centuries-old Mewar wellness rituals. Every suite opens to panoramic lake vistas that turn gold at dusk.',
    category: 'resort',
    starRating: 5,
    address: { street: 'Lake Palace Road, Udaipur', city: 'Udaipur', state: 'Rajasthan', country: 'India', zipCode: '313001' },
    location: { type: 'Point', coordinates: [73.6851, 24.5764] },
    amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Boat Rides', 'Concierge', 'Gym', 'Bar'],
    priceRange: { min: 7500, max: 22000, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1568495248636-6432b97bd949?auto=format&fit=crop&w=1200&q=80', public_id: 'udaipur-ext-1', caption: 'Palace resort rising from Lake Pichola at golden hour' },
      { url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80', public_id: 'udaipur-room-1', caption: 'Lake-view suite with Rajasthani decor and silk drapes' },
      { url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80', public_id: 'udaipur-amen-1', caption: 'Infinity pool overlooking Lake Pichola and City Palace' },
    ],
    isFeatured: true,
    rooms: [
      { roomType: 'deluxe', title: 'Lake View Room', pricePerNight: 7500, maxGuests: 2, bedType: 'king', discount: 0, amenities: ['AC', 'WiFi', 'TV', 'Minibar', 'Lake View'] },
      { roomType: 'suite', title: 'Palace Suite', pricePerNight: 22000, maxGuests: 4, bedType: 'king', discount: 0, amenities: ['AC', 'WiFi', 'TV', 'Minibar', 'Balcony', 'Bathtub', 'Butler Service'] },
    ],
  },
  // 3. Goa (Resort)
  {
    name: 'Calangute Shores Resort',
    slug: 'calangute-shores-resort-goa',
    description: 'Steps from Calangute Beach, this beachfront resort wraps around a lagoon-style infinity pool that seems to merge with the Arabian Sea. Portuguese-inspired architecture blends with tropical landscaping, and the sunset bar serves the finest Goan feni cocktails. Beach bonfires and live jazz make every evening unforgettable.',
    category: 'resort',
    starRating: 4,
    address: { street: 'Calangute Beach Road, North Goa', city: 'Goa', state: 'Goa', country: 'India', zipCode: '403516' },
    location: { type: 'Point', coordinates: [73.7517, 15.5440] },
    amenities: ['WiFi', 'Pool', 'Beach Access', 'Restaurant', 'Bar', 'Water Sports', 'Spa', 'Parking'],
    priceRange: { min: 6500, max: 18000, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80', public_id: 'goa-ext-1', caption: 'Beachfront pool at sunset with palm tree silhouettes' },
      { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', public_id: 'goa-room-1', caption: 'Tropical beach cottage with ocean-facing balcony' },
      { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', public_id: 'goa-amen-1', caption: 'Tropical beach with golden sand and turquoise water' },
    ],
    isFeatured: false,
    rooms: [
      { roomType: 'deluxe', title: 'Beach Cottage', pricePerNight: 6500, maxGuests: 2, bedType: 'queen', discount: 15, amenities: ['AC', 'WiFi', 'TV', 'Beach View', 'Balcony'] },
      { roomType: 'suite', title: 'Infinity Pool Villa', pricePerNight: 18000, maxGuests: 4, bedType: 'king', discount: 0, amenities: ['AC', 'WiFi', 'TV', 'Private Pool', 'Minibar', 'Bathtub'] },
    ],
  },
  // 4. Munnar (Villa)
  {
    name: 'Misty Peak Tea Estate Villa',
    slug: 'misty-peak-tea-estate-villa-munnar',
    description: 'Perched atop a working tea estate at 5,200 feet, this villa opens to endless carpets of emerald tea bushes rolling into mist-wrapped valleys. Private plunge pools look out over the Western Ghats while the estate chef serves Kerala cuisine with herbs plucked from the kitchen garden. Morning tea-plucking walks are a guest favourite.',
    category: 'villa',
    starRating: 4,
    address: { street: 'Mattupetty Road, Munnar', city: 'Munnar', state: 'Kerala', country: 'India', zipCode: '685612' },
    location: { type: 'Point', coordinates: [77.0595, 10.0889] },
    amenities: ['WiFi', 'Private Pool', 'Tea Garden Tour', 'Restaurant', 'Mountain View', 'Bonfire', 'Trekking', 'Parking'],
    priceRange: { min: 5000, max: 11000, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=1200&q=80', public_id: 'munnar-ext-1', caption: 'Villa amid rolling tea plantations at dawn' },
      { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80', public_id: 'munnar-room-1', caption: 'Wooden-floored room with panoramic valley views' },
      { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80', public_id: 'munnar-amen-1', caption: 'Misty green valley and rolling hills at dawn' },
    ],
    isFeatured: true,
    rooms: [
      { roomType: 'deluxe', title: 'Tea View Room', pricePerNight: 5000, maxGuests: 2, bedType: 'queen', discount: 10, amenities: ['AC', 'WiFi', 'TV', 'Tea View', 'Balcony'] },
      { roomType: 'suite', title: 'Private Villa', pricePerNight: 11000, maxGuests: 4, bedType: 'king', discount: 0, amenities: ['WiFi', 'Private Pool', 'Minibar', 'Balcony', 'Bathtub', 'Fireplace'] },
    ],
  },
  // 5. Alleppey (Guesthouse)
  {
    name: 'Kerala Backwater Haven',
    slug: 'kerala-backwater-haven-alleppey',
    description: 'This converted houseboat stay floats gently through the palm-fringed backwaters of Alleppey, offering a uniquely serene experience. Wooden houseboats with thatched roofs glide past paddy fields and tiny villages while the onboard cook prepares fresh karimeen fish. Fall asleep to the sound of water lapping against ancient teak hulls.',
    category: 'guesthouse',
    starRating: 3,
    address: { street: 'Nehru Trophy Finishing Point, Alleppey', city: 'Alleppey', state: 'Kerala', country: 'India', zipCode: '688012' },
    location: { type: 'Point', coordinates: [76.3388, 9.4981] },
    amenities: ['WiFi', 'Meals Included', 'Backwater Cruise', 'Fishing', 'Canoe Rides', 'Photography Tours'],
    priceRange: { min: 3500, max: 6000, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80', public_id: 'alleppey-ext-1', caption: 'Traditional houseboat on still green backwaters at sunset' },
      { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', public_id: 'alleppey-room-1', caption: 'Cozy houseboat cabin with wooden interiors and backwater views' },
      { url: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&w=1200&q=80', public_id: 'alleppey-amen-1', caption: 'Palm-lined tropical waterway with lush green canopy' },
    ],
    isFeatured: false,
    rooms: [
      { roomType: 'standard', title: 'Lower Deck Cabin', pricePerNight: 3500, maxGuests: 2, bedType: 'double', discount: 0, amenities: ['Fan', 'Meals', 'Backwater View'] },
      { roomType: 'deluxe', title: 'Upper Deck Cabin', pricePerNight: 6000, maxGuests: 3, bedType: 'queen', discount: 10, amenities: ['AC', 'Meals', 'Private Deck', 'Panoramic View'] },
    ],
  },
  // 6. Manali (Villa)
  {
    name: 'Old Manali Mountain Retreat',
    slug: 'old-manali-mountain-retreat',
    description: 'Tucked into the apple orchards of Old Manali with the Beas River rushing below, this mountain retreat combines alpine charm with Himachali warmth. Exposed pine beams frame rooms that glow with firelight, and the terrace café serves Kullu trout with valley views. Winter brings snow-draped silence; summer brings wildflower meadows.',
    category: 'villa',
    starRating: 3,
    address: { street: 'Old Manali Road, Manali', city: 'Manali', state: 'Himachal Pradesh', country: 'India', zipCode: '175131' },
    location: { type: 'Point', coordinates: [77.1887, 32.2396] },
    amenities: ['WiFi', 'Restaurant', 'Bar', 'Mountain View', 'Fireplace Lounge', 'Skiing Access', 'Trekking', 'Parking'],
    priceRange: { min: 2500, max: 5500, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80', public_id: 'manali-ext-1', caption: 'Alpine villa amid pine forests and snow peaks' },
      { url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80', public_id: 'manali-room-1', caption: 'Cozy room with wood cladding and snowy window view' },
      { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80', public_id: 'manali-amen-1', caption: 'Snow-capped mountain peaks at golden hour' },
    ],
    isFeatured: false,
    rooms: [
      { roomType: 'standard', title: 'Pine Wood Room', pricePerNight: 2500, maxGuests: 2, bedType: 'double', discount: 10, amenities: ['Heater', 'WiFi', 'TV', 'Valley View'] },
      { roomType: 'deluxe', title: 'Mountain Suite', pricePerNight: 5500, maxGuests: 4, bedType: 'king', discount: 0, amenities: ['Heater', 'WiFi', 'TV', 'Balcony', 'Fireplace'] },
    ],
  },
  // 7. Shimla (Hotel)
  {
    name: 'The Mall Colonial Hotel',
    slug: 'the-mall-colonial-hotel-shimla',
    description: 'Standing since 1903 on the famed Mall Road, this colonial hill hotel preserves the elegance of the British Raj with polished teak floors, grandfather clocks, and a reading room lined with leather-bound volumes. Valley-view suites frame sunrise over seven mountain ranges, and the wood-panelled bar serves single malts by firelight.',
    category: 'hotel',
    starRating: 4,
    address: { street: 'The Mall Road, Shimla', city: 'Shimla', state: 'Himachal Pradesh', country: 'India', zipCode: '171001' },
    location: { type: 'Point', coordinates: [77.1734, 31.1048] },
    amenities: ['WiFi', 'Restaurant', 'Bar', 'Library', 'Heritage Tours', 'Room Service', 'Fireplace Lounge', 'Parking'],
    priceRange: { min: 2800, max: 5500, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80', public_id: 'shimla-ext-1', caption: 'Colonial facade on Mall Road with mountain backdrop' },
      { url: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80', public_id: 'shimla-room-1', caption: 'Valley-view room with polished wood floors and period furniture' },
      { url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80', public_id: 'shimla-amen-1', caption: 'Colonial hotel with grand architecture and mountain setting' },
    ],
    isFeatured: false,
    rooms: [
      { roomType: 'standard', title: 'Standard Heritage Room', pricePerNight: 2800, maxGuests: 2, bedType: 'double', discount: 0, amenities: ['Heater', 'WiFi', 'TV', 'Room Service'] },
      { roomType: 'deluxe', title: 'Valley View Room', pricePerNight: 5500, maxGuests: 2, bedType: 'king', discount: 15, amenities: ['Heater', 'WiFi', 'TV', 'Valley View', 'Balcony', 'Minibar'] },
    ],
  },
  // 8. Rishikesh (Resort)
  {
    name: 'Tapovan Ganges Valley Resort',
    slug: 'tapovan-ganges-valley-resort-rishikesh',
    description: 'Overlooking the rushing turquoise waters of the Ganges near Lakshman Jhula, this spiritual and wellness resort is a sanctuary of peace. Wake to morning yoga on open-air platforms, indulge in holistic ayurvedic therapies, and listen to the river chants at dusk. Luxury guest rooms combine modern convenience with local stone and wood elements.',
    category: 'resort',
    starRating: 4,
    address: { street: 'Tapovan, Rishikesh', city: 'Rishikesh', state: 'Uttarakhand', country: 'India', zipCode: '249192' },
    location: { type: 'Point', coordinates: [78.3182, 30.1158] },
    amenities: ['WiFi', 'Pool', 'Yoga Studio', 'Ayurveda Spa', 'Organic Restaurant', 'Ganges View', 'River Rafting', 'Parking'],
    priceRange: { min: 4200, max: 9500, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&w=1200&q=80', public_id: 'rishikesh-ext-1', caption: 'Yoga and meditation retreat overlooking the Ganges' },
      { url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1200&q=80', public_id: 'rishikesh-room-1', caption: 'Spacious balcony suite with panoramic river and valley view' },
      { url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80', public_id: 'rishikesh-amen-1', caption: 'Serene meditation by the water at sunrise' },
    ],
    isFeatured: false,
    rooms: [
      { roomType: 'deluxe', title: 'Ganges View Deluxe', pricePerNight: 4200, maxGuests: 2, bedType: 'queen', discount: 10, amenities: ['AC', 'WiFi', 'TV', 'River View', 'Balcony'] },
      { roomType: 'suite', title: 'Maharishi Suite', pricePerNight: 9500, maxGuests: 3, bedType: 'king', discount: 0, amenities: ['AC', 'WiFi', 'TV', 'River View', 'Private Jacuzzi', 'Minibar'] },
    ],
  },
  // 9. Darjeeling (Hotel)
  {
    name: 'Snowy Peak Tea Bungalow',
    slug: 'snowy-peak-tea-bungalow-darjeeling',
    description: 'Built in 1885 during the peak of British tea trade, this restored bungalow overlooks the rolling hills of Darjeeling with Mount Kanchenjunga standing tall in the distance. Period fireplaces, brass beds, and private tea-gardens retain the charms of yesteryear, while modern attachments keep you comfortable in the Himalayan air.',
    category: 'hotel',
    starRating: 4,
    address: { street: 'AJC Bose Road, Darjeeling', city: 'Darjeeling', state: 'West Bengal', country: 'India', zipCode: '734101' },
    location: { type: 'Point', coordinates: [88.2663, 27.0410] },
    amenities: ['WiFi', 'Restaurant', 'Tea Plantation', 'Fireplace', 'Mountain View', 'Trekking Tours', 'Library', 'Parking'],
    priceRange: { min: 3800, max: 7800, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80', public_id: 'darjeeling-ext-1', caption: 'Charming mountain bungalow with Kanchenjunga peak views' },
      { url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80', public_id: 'darjeeling-room-1', caption: 'Master bedroom with high-post bed and active stone fireplace' },
      { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80', public_id: 'darjeeling-amen-1', caption: 'Misty mountain peaks and valleys at sunrise' },
    ],
    isFeatured: false,
    rooms: [
      { roomType: 'standard', title: 'Classic Fireplace Room', pricePerNight: 3800, maxGuests: 2, bedType: 'double', discount: 5, amenities: ['Heater', 'WiFi', 'Fireplace', 'Tea Service'] },
      { roomType: 'deluxe', title: 'Kanchenjunga Suite', pricePerNight: 7800, maxGuests: 3, bedType: 'king', discount: 0, amenities: ['Heater', 'WiFi', 'TV', 'Mountain View', 'Balcony', 'Minibar'] },
    ],
  },
  // 10. Coorg (Villa)
  {
    name: 'Madikeri Plantation Estate',
    slug: 'madikeri-plantation-estate-coorg',
    description: 'Hidden in 80 acres of coffee and spice plantations in the misty hills of Coorg, this estate villa is a sensory masterpiece. Wake to the aroma of fresh-roasted Arabica, walk through pepper and cardamom groves before breakfast, and spend evenings watching elephants at the estate boundary. Luxury meets wilderness in the Scotland of India.',
    category: 'villa',
    starRating: 4,
    address: { street: 'Madikeri–Virajpet Road, Coorg', city: 'Coorg', state: 'Karnataka', country: 'India', zipCode: '571201' },
    location: { type: 'Point', coordinates: [75.7382, 12.4244] },
    amenities: ['WiFi', 'Pool', 'Plantation Tour', 'Restaurant', 'Bonfire', 'Trekking', 'Bird Watching', 'Parking'],
    priceRange: { min: 4500, max: 9500, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80', public_id: 'coorg-ext-1', caption: 'Estate villa surrounded by coffee plantations and misty hills' },
      { url: 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?auto=format&fit=crop&w=1200&q=80', public_id: 'coorg-room-1', caption: 'Plantation room with teak furniture and forest canopy views' },
      { url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80', public_id: 'coorg-amen-1', caption: 'Rolling green hills and misty plantation landscape' },
    ],
    isFeatured: false,
    rooms: [
      { roomType: 'deluxe', title: 'Estate Deluxe Room', pricePerNight: 4500, maxGuests: 2, bedType: 'double', discount: 0, amenities: ['WiFi', 'TV', 'Plantation View', 'Room Service'] },
      { roomType: 'suite', title: 'Private Plantation Villa', pricePerNight: 9500, maxGuests: 4, bedType: 'king', discount: 15, amenities: ['WiFi', 'Pool Access', 'Balcony', 'Bathtub', 'Minibar'] },
    ],
  },
  // 11. Mumbai (Hotel)
  {
    name: 'Marine Lines Palace Hotel',
    slug: 'marine-lines-palace-hotel-mumbai',
    description: 'Overlooking the iconic Queen\'s Necklace and the Arabian Sea, this heritage-style luxury hotel offers a grand window into Mumbai\'s fast-paced glamour. Fine Art deco ceilings meet Italian marble corridors, and the signature seafood restaurant serves fresh catches of the day with sea breeze views.',
    category: 'hotel',
    starRating: 5,
    address: { street: 'Marine Lines, Mumbai', city: 'Mumbai', state: 'Maharashtra', country: 'India', zipCode: '400002' },
    location: { type: 'Point', coordinates: [72.8264, 18.9322] },
    amenities: ['WiFi', 'Pool', 'Ocean View', 'Restaurant', 'Bar', 'Gym', 'Concierge', 'Valet Parking'],
    priceRange: { min: 8500, max: 24000, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', public_id: 'mumbai-ext-1', caption: 'Grand luxury hotel exterior with pool' },
      { url: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80', public_id: 'mumbai-room-1', caption: 'Luxury ocean-view room with king bed and floor-to-ceiling windows' },
      { url: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80', public_id: 'mumbai-amen-1', caption: 'Luxury hotel lobby with grand chandelier' },
    ],
    isFeatured: false,
    rooms: [
      { roomType: 'deluxe', title: 'City Side Deluxe', pricePerNight: 8500, maxGuests: 2, bedType: 'double', discount: 10, amenities: ['AC', 'WiFi', 'TV', 'Minibar'] },
      { roomType: 'suite', title: 'Queen Necklace Suite', pricePerNight: 24000, maxGuests: 4, bedType: 'king', discount: 0, amenities: ['AC', 'WiFi', 'TV', 'Minibar', 'Sea View', 'Bathtub', 'Butler'] },
    ],
  },
  // 12. Delhi (Hotel)
  {
    name: 'Lutyens Heritage Hotel',
    slug: 'lutyens-heritage-hotel-delhi',
    description: 'Set in the leafy, prestigious Lutyens zone in the heart of New Delhi, this heritage hotel is an architectural tribute to the British Empire. Hand-carved sandstone arches, grand white pillars, and sprawling green lawns provide a peaceful oasis from Delhi\'s bustle. Classic high-tea is served daily on the garden terrace.',
    category: 'hotel',
    starRating: 5,
    address: { street: 'Connaught Place, New Delhi', city: 'Delhi', state: 'Delhi', country: 'India', zipCode: '110001' },
    location: { type: 'Point', coordinates: [77.2167, 28.6315] },
    amenities: ['WiFi', 'Pool', 'Restaurant', 'High Tea Terrace', 'Conference Rooms', 'Concierge', 'Gym', 'Valet Parking'],
    priceRange: { min: 6200, max: 15000, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80', public_id: 'delhi-ext-1', caption: 'Grand India Gate monument in New Delhi at dusk' },
      { url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80', public_id: 'delhi-room-1', caption: 'Elegant room with teak writing desk and period details' },
      { url: 'https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=1200&q=80', public_id: 'delhi-amen-1', caption: 'Grand heritage hotel with manicured gardens and pool' },
    ],
    isFeatured: false,
    rooms: [
      { roomType: 'standard', title: 'Lutyens Executive Room', pricePerNight: 6200, maxGuests: 2, bedType: 'queen', discount: 5, amenities: ['AC', 'WiFi', 'TV', 'Minibar'] },
      { roomType: 'suite', title: 'Imperial Viceroy Suite', pricePerNight: 15000, maxGuests: 3, bedType: 'king', discount: 0, amenities: ['AC', 'WiFi', 'TV', 'Private Lounge', 'Balcony', 'Bathtub'] },
    ],
  },
  // 13. Agra (Hotel)
  {
    name: 'Taj Nagri Heritage Hotel',
    slug: 'taj-nagri-heritage-hotel-agra',
    description: 'Located in Agra near the majestic Taj Mahal, this heritage hotel pays architectural tribute to the Mughal empire with sandstone gateways and detailed tile screens. Rooftop dining offers candlelit views of the white marble monument of love, while the garden terrace serves Mughal kebabs and mocktails by fire pits.',
    category: 'hotel',
    starRating: 4,
    address: { street: 'Taj Nagri Phase 2, Agra', city: 'Agra', state: 'Uttar Pradesh', country: 'India', zipCode: '282001' },
    location: { type: 'Point', coordinates: [78.0421, 27.1751] },
    amenities: ['WiFi', 'Pool', 'Rooftop Dining', 'Taj View', 'Gardens', 'Cultural Shows', 'Room Service', 'Parking'],
    priceRange: { min: 3800, max: 9200, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80', public_id: 'agra-ext-1', caption: 'Majestic Taj Mahal in Agra at golden hour' },
      { url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80', public_id: 'agra-room-1', caption: 'Classic room with marble floors and traditional Mughal prints' },
      { url: 'https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?auto=format&fit=crop&w=1200&q=80', public_id: 'agra-amen-1', caption: 'Scenic Mughal-style corridor leading to the central garden' },
    ],
    isFeatured: false,
    rooms: [
      { roomType: 'standard', title: 'Mughal Standard Room', pricePerNight: 3800, maxGuests: 2, bedType: 'double', discount: 0, amenities: ['AC', 'WiFi', 'TV', 'Room Service'] },
      { roomType: 'deluxe', title: 'Taj View Deluxe Room', pricePerNight: 9200, maxGuests: 2, bedType: 'king', discount: 10, amenities: ['AC', 'WiFi', 'TV', 'Taj View', 'Minibar', 'Room Service'] },
    ],
  },
  // 14. Varanasi (Guesthouse)
  {
    name: 'Assi Ghat Heritage Guesthouse',
    slug: 'assi-ghat-heritage-guesthouse-varanasi',
    description: 'Overlooking the sacred Assi Ghat where the morning aarti fills the air with chanting and marigold-scented smoke, this guesthouse offers an intimate window into Varanasi\'s 5,000-year-old soul. Rooms open to balconies where you can watch pilgrims descend the ancient steps, and rooftop dinners pair local cuisine with Ganges sunsets.',
    category: 'guesthouse',
    starRating: 3,
    address: { street: 'Assi Ghat, Varanasi', city: 'Varanasi', state: 'Uttar Pradesh', country: 'India', zipCode: '221005' },
    location: { type: 'Point', coordinates: [82.9956, 25.2818] },
    amenities: ['WiFi', 'Restaurant', 'Ghat View', 'Boat Rides', 'Cultural Tours', 'Rooftop Dining'],
    priceRange: { min: 900, max: 1800, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1561361041-c96e2a5a5888?auto=format&fit=crop&w=1200&q=80', public_id: 'varanasi-ext-1', caption: 'Heritage ghats and ancient temples along the sacred Ganges' },
      { url: 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&w=1200&q=80', public_id: 'varanasi-room-1', caption: 'Simple ghat-view room with traditional brass lamps' },
      { url: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80', public_id: 'varanasi-amen-1', caption: 'Ancient architectural details and historical corridors' },
    ],
    isFeatured: true,
    rooms: [
      { roomType: 'standard', title: 'Ghat View Standard', pricePerNight: 900, maxGuests: 2, bedType: 'double', discount: 0, amenities: ['Fan', 'WiFi', 'Ghat View'] },
      { roomType: 'deluxe', title: 'Heritage Deluxe Room', pricePerNight: 1800, maxGuests: 2, bedType: 'queen', discount: 5, amenities: ['AC', 'WiFi', 'TV', 'Ghat View', 'Balcony'] },
    ],
  },
  // 15. Jodhpur (Hotel)
  {
    name: 'Mehrangarh View Haveli',
    slug: 'mehrangarh-view-haveli-jodhpur',
    description: 'This blue-washed sandstone haveli stands directly in the shadow of Jodhpur\'s towering Mehrangarh Fort. Wake to views of the massive stone walls, walk through historic alleys just outside the door, and dine on the rooftop terrace while the fort lights up in gold at dusk.',
    category: 'hotel',
    starRating: 3,
    address: { street: 'Navchokiya, Near Clock Tower, Jodhpur', city: 'Jodhpur', state: 'Rajasthan', country: 'India', zipCode: '342001' },
    location: { type: 'Point', coordinates: [73.0243, 26.2967] },
    amenities: ['WiFi', 'Rooftop Restaurant', 'Fort View', 'Cultural Tours', 'Blue City Walks', 'Parking'],
    priceRange: { min: 1800, max: 3800, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80', public_id: 'jodh-ext-1', caption: 'Blue city architecture with Mehrangarh Fort backdrop' },
      { url: 'https://images.unsplash.com/photo-1561501900-3701fa6a0864?auto=format&fit=crop&w=1200&q=80', public_id: 'jodh-room-1', caption: 'Traditional room with elegant heritage decor' },
      { url: 'https://images.unsplash.com/photo-1599946347371-68eb71b16afc?auto=format&fit=crop&w=1200&q=80', public_id: 'jodh-amen-1', caption: 'Rooftop dining with fort view at sunset' },
    ],
    isFeatured: false,
    rooms: [
      { roomType: 'standard', title: 'Traditional Blue Room', pricePerNight: 1800, maxGuests: 2, bedType: 'double', discount: 10, amenities: ['WiFi', 'Fan', 'Fort View'] },
      { roomType: 'deluxe', title: 'Fort View Suite', pricePerNight: 3800, maxGuests: 3, bedType: 'queen', discount: 0, amenities: ['AC', 'WiFi', 'TV', 'Fort View', 'Minibar'] },
    ],
  },
  // 16. Andaman (Resort)
  {
    name: 'Havelock Shoreline Resort',
    slug: 'havelock-shoreline-resort-andaman',
    description: 'Nestled on the sandy white beaches of Havelock Island, this luxury resort offers private villas with direct sea entry and tropical jungle gardens. Wake to the sound of breaking waves, swim with colorful reef fish, and relax in beach hammocks under the coconut canopy.',
    category: 'resort',
    starRating: 5,
    address: { street: 'Havelock Island, South Andaman', city: 'Andaman', state: 'Andaman and Nicobar', country: 'India', zipCode: '744211' },
    location: { type: 'Point', coordinates: [92.9987, 11.9774] },
    amenities: ['WiFi', 'Pool', 'Beach Entry', 'Scuba Center', 'Seafront Grill', 'Bar', 'Gym', 'Spa'],
    priceRange: { min: 9500, max: 28000, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80', public_id: 'andaman-ext-1', caption: 'Tropical beachfront house with turquoise waters' },
      { url: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80', public_id: 'andaman-room-1', caption: 'Tropical wood beachfront villa with private ocean balcony' },
      { url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80', public_id: 'andaman-amen-1', caption: 'Crystal clear turquoise ocean water at beach resort' },
    ],
    isFeatured: false,
    rooms: [
      { roomType: 'deluxe', title: 'Garden Beach Villa', pricePerNight: 9500, maxGuests: 2, bedType: 'double', discount: 15, amenities: ['AC', 'WiFi', 'TV', 'Sea View'] },
      { roomType: 'suite', title: 'Oceanfront Lagoon Pool Suite', pricePerNight: 28000, maxGuests: 4, bedType: 'king', discount: 0, amenities: ['AC', 'WiFi', 'TV', 'Private Pool', 'Seafront Deck', 'Bathtub'] },
    ],
  },
  // 17. Ooty (Hotel)
  {
    name: 'Charing Cross Pine Hotel',
    slug: 'charing-cross-pine-hotel-ooty',
    description: 'Set amidst the historic tea gardens of Ooty, this heritage stone cottage captures the old-world charms of a British manor. Garden lawn high-teas, stone fireplaces, and wood-paneled walls make this the ultimate hill station getaway.',
    category: 'hotel',
    starRating: 4,
    address: { street: 'Charring Cross, Ooty', city: 'Ooty', state: 'Tamil Nadu', country: 'India', zipCode: '643001' },
    location: { type: 'Point', coordinates: [76.6950, 11.4102] },
    amenities: ['WiFi', 'Restaurant', 'Fireplace Room', 'Tea Garden Walks', 'Laundry', 'Parking'],
    priceRange: { min: 2800, max: 6200, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80', public_id: 'ooty-ext-1', caption: 'Charming colonial-style cottage surrounded by greenery' },
      { url: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1200&q=80', public_id: 'ooty-room-1', caption: 'Cozy room interior with carpet floors and warm decor' },
      { url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80', public_id: 'ooty-amen-1', caption: 'Scenic valley views with rolling green hills and mist' },
    ],
    isFeatured: false,
    rooms: [
      { roomType: 'standard', title: 'Classic Cottage Room', pricePerNight: 2800, maxGuests: 2, bedType: 'double', discount: 0, amenities: ['Heater', 'WiFi', 'TV'] },
      { roomType: 'deluxe', title: 'Premium Valley Suite', pricePerNight: 6200, maxGuests: 3, bedType: 'queen', discount: 10, amenities: ['Heater', 'WiFi', 'TV', 'Balcony', 'Valley View'] },
    ],
  },
  // 18. Bangalore (Hotel)
  {
    name: 'Indiranagar Boutique Hotel',
    slug: 'indiranagar-boutique-hotel-bangalore',
    description: 'Located in the hip and bustling district of Indiranagar, this modern boutique hotel blends industrial brick aesthetic with premium green landscaping. Fine craft cocktails and rooftop dinners pair with fast city connectivity.',
    category: 'hotel',
    starRating: 4,
    address: { street: '100 Feet Road, Indiranagar, Bangalore', city: 'Bangalore', state: 'Karnataka', country: 'India', zipCode: '560038' },
    location: { type: 'Point', coordinates: [77.6408, 12.9784] },
    amenities: ['WiFi', 'Rooftop Bar', 'Restaurant', 'Gym', 'Workspace', 'Laundry', 'Parking'],
    priceRange: { min: 3800, max: 7500, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80', public_id: 'blr-ext-1', caption: 'Modern boutique hotel with warm inviting exterior' },
      { url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80', public_id: 'blr-room-1', caption: 'Sleek room with modern furnishings and workspace' },
      { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80', public_id: 'blr-amen-1', caption: 'Modern restaurant with stylish interior design' },
    ],
    isFeatured: false,
    rooms: [
      { roomType: 'standard', title: 'Smart Studio Room', pricePerNight: 3800, maxGuests: 2, bedType: 'double', discount: 0, amenities: ['AC', 'WiFi', 'TV', 'Desk'] },
      { roomType: 'deluxe', title: 'Premium Terrace Room', pricePerNight: 7500, maxGuests: 2, bedType: 'king', discount: 15, amenities: ['AC', 'WiFi', 'TV', 'Balcony', 'Minibar'] },
    ],
  },
  // 19. Kolkata (Hotel)
  {
    name: 'Park Street Heritage Hotel',
    slug: 'park-street-heritage-hotel-kolkata',
    description: 'This classic Edwardian building on Kolkata\'s legendary Park Street captures the grandeur of India\'s old capital. Corridors lined with photographs from the 1920s lead to spacious rooms with high ceilings and mahogany writing desks.',
    category: 'hotel',
    starRating: 4,
    address: { street: 'Park Street, Kolkata', city: 'Kolkata', state: 'West Bengal', country: 'India', zipCode: '700016' },
    location: { type: 'Point', coordinates: [88.3517, 22.5530] },
    amenities: ['WiFi', 'Restaurant', 'Bar', 'Spa', 'Heritage Tours', 'Room Service', 'Concierge', 'Parking'],
    priceRange: { min: 4800, max: 11000, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=1200&q=80', public_id: 'kol-ext-1', caption: 'Grand colonial facade of the Park Street heritage hotel' },
      { url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80', public_id: 'kol-room-1', caption: 'Heritage room with Edwardian furniture and high ceilings' },
      { url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80', public_id: 'kol-amen-1', caption: 'Fine dining restaurant with elegant table settings' },
    ],
    isFeatured: false,
    rooms: [
      { roomType: 'deluxe', title: 'Heritage Room', pricePerNight: 4800, maxGuests: 2, bedType: 'queen', discount: 0, amenities: ['AC', 'WiFi', 'TV', 'Minibar', 'Room Service'] },
      { roomType: 'suite', title: 'Grand Suite', pricePerNight: 11000, maxGuests: 4, bedType: 'king', discount: 0, amenities: ['AC', 'WiFi', 'TV', 'Minibar', 'Lounge', 'Bathtub', 'Butler'] },
    ],
  },
  // 20. Leh (Guesthouse)
  {
    name: 'Ladakh Desert Highland Camp',
    slug: 'ladakh-desert-highland-camp-leh',
    description: 'At 11,500 feet in the cold desert of Ladakh, this luxury camp pitches Swiss-engineered tents on the banks of the Indus River with the Stok Range as a backdrop. Ladakhi rugs warm the floors, wood-burning stoves chase away the chill, and the night sky — free of light pollution — delivers a planetarium of stars visible nowhere else in India.',
    category: 'guesthouse',
    starRating: 3,
    address: { street: 'Leh City, Ladakh', city: 'Leh', state: 'Ladakh', country: 'India', zipCode: '194101' },
    location: { type: 'Point', coordinates: [77.5771, 34.1526] },
    amenities: ['WiFi', 'Restaurant', 'Stargazing', 'Bonfire', 'Mountain View', 'Cultural Tours', 'Trekking', 'Parking'],
    priceRange: { min: 1800, max: 3200, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1504457047772-27faf1c00561?auto=format&fit=crop&w=1200&q=80', public_id: 'leh-ext-1', caption: 'Scenic Ladakh landscape with mountains and river panorama' },
      { url: 'https://images.unsplash.com/photo-1578645510447-e20b4311e3ce?auto=format&fit=crop&w=1200&q=80', public_id: 'leh-room-1', caption: 'Cozy camp interior with local decor and warm furnishings' },
      { url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80', public_id: 'leh-amen-1', caption: 'Starry night sky over snow-capped mountain peaks' },
    ],
    isFeatured: false,
    rooms: [
      { roomType: 'standard', title: 'Standard Tent', pricePerNight: 1800, maxGuests: 2, bedType: 'twin', discount: 0, amenities: ['Heater', 'Attached Bath', 'Mountain View'] },
      { roomType: 'deluxe', title: 'Deluxe Tent', pricePerNight: 3200, maxGuests: 2, bedType: 'double', discount: 10, amenities: ['Heater', 'WiFi', 'Private Deck', 'Mountain View', 'Wood Stove'] },
    ],
  },
  // 21. Bangalore (Apartment)
  {
    name: 'Indiranagar Urban Suite',
    slug: 'indiranagar-urban-suite-bangalore',
    description: 'This sleek serviced apartment is located on 100 Feet Road, Indiranagar. Featuring floor-to-ceiling windows, a modern kitchen, and an open layout, it offers premium business comfort in the heart of Bangalore.',
    category: 'apartment',
    starRating: 4,
    address: { street: '100 Feet Road, Indiranagar', city: 'Bangalore', state: 'Karnataka', country: 'India', zipCode: '560038' },
    location: { type: 'Point', coordinates: [77.6408, 12.9784] },
    amenities: ['WiFi', 'Kitchenette', 'Gym Access', 'Smart TV', 'Laundry', 'Coffee Machine'],
    priceRange: { min: 3500, max: 6000, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80', public_id: 'apt-blr-ext', caption: 'Modern urban apartment with open living space' },
      { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80', public_id: 'apt-blr-room', caption: 'Stylish city apartment bedroom' },
      { url: 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?auto=format&fit=crop&w=1200&q=80', public_id: 'apt-blr-amen', caption: 'Modern kitchen with dining counter' }
    ],
    isFeatured: false,
    rooms: [
      { roomType: 'standard', title: 'Studio Apartment', pricePerNight: 3500, maxGuests: 2, bedType: 'double', discount: 10, amenities: ['AC', 'WiFi', 'Kitchenette', 'TV'] },
      { roomType: 'deluxe', title: '2BHK Executive Suite', pricePerNight: 6000, maxGuests: 4, bedType: 'king', discount: 0, amenities: ['AC', 'WiFi', 'Full Kitchen', 'Balcony', 'Washing Machine'] }
    ]
  },
  // 22. Mumbai (Apartment)
  {
    name: 'Marine Lines Skyline Apartment',
    slug: 'marine-lines-skyline-apartment-mumbai',
    description: 'Overlooking the seafront at Marine Lines, this luxury skyline serviced apartment provides high-rise comfort with top-tier amenities. Includes access to a shared rooftop sky pool and private gym.',
    category: 'apartment',
    starRating: 5,
    address: { street: 'Marine Lines, Mumbai', city: 'Mumbai', state: 'Maharashtra', country: 'India', zipCode: '400002' },
    location: { type: 'Point', coordinates: [72.8264, 18.9322] },
    amenities: ['WiFi', 'Rooftop Pool', 'Sea View', 'Gym Access', 'Concierge Desk', 'Secure Parking'],
    priceRange: { min: 4500, max: 9000, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80', public_id: 'apt-mum-ext', caption: 'Modern skyline apartment with stylish living area' },
      { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80', public_id: 'apt-mum-room', caption: 'Modern luxury bedroom with city views' },
      { url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80', public_id: 'apt-mum-amen', caption: 'Premium fitness center and gym facility' }
    ],
    isFeatured: true,
    rooms: [
      { roomType: 'standard', title: 'Superior Studio', pricePerNight: 4500, maxGuests: 2, bedType: 'queen', discount: 5, amenities: ['AC', 'WiFi', 'Kitchenette', 'Sea View'] },
      { roomType: 'suite', title: 'Penthouse Apartment', pricePerNight: 9000, maxGuests: 4, bedType: 'king', discount: 0, amenities: ['AC', 'WiFi', 'Full Kitchen', 'Ocean View', 'Private Jacuzzi'] }
    ]
  },
  // 23. Goa (Hostel)
  {
    name: 'Vagator Social Hostel',
    slug: 'vagator-social-hostel-goa',
    description: 'Steps from Vagator Beach, this vibrant social backpacker hostel features a courtyard pool, common hammocks, fairy lights, and daily group beach trips. Ideal for solo travelers and digital nomads.',
    category: 'hostel',
    starRating: 3,
    address: { street: 'Calangute Beach Road, North Goa', city: 'Goa', state: 'Goa', country: 'India', zipCode: '403516' },
    location: { type: 'Point', coordinates: [73.7517, 15.5440] },
    amenities: ['WiFi', 'Pool', 'Common Kitchen', 'Games Room', 'Cafe & Bar', 'Bicycle Rentals'],
    priceRange: { min: 800, max: 2200, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80', public_id: 'hst-goa-ext', caption: 'Social hostel courtyard with tropical vibes' },
      { url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80', public_id: 'hst-goa-room', caption: 'Colorful hostel common area' },
      { url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80', public_id: 'hst-goa-amen', caption: 'Resort pool area near the beach' }
    ],
    isFeatured: true,
    rooms: [
      { roomType: 'standard', title: '6-Bed Mixed Dorm', pricePerNight: 800, maxGuests: 1, bedType: 'twin', discount: 10, amenities: ['WiFi', 'Shared Bath', 'Locker'] },
      { roomType: 'deluxe', title: 'Private Twin Room', pricePerNight: 2200, maxGuests: 2, bedType: 'twin', discount: 0, amenities: ['AC', 'WiFi', 'Private Bath'] }
    ]
  },
  // 24. Jaipur (Hostel)
  {
    name: 'The Pink City Hostel',
    slug: 'the-pink-city-hostel-jaipur',
    description: 'A cozy, colorful social hostel located near Amer Road. Features a rooftop terrace lit with fairy lights, board games, community dinners, and walking tours of Jaipur\'s bazaars.',
    category: 'hostel',
    starRating: 3,
    address: { street: 'Amer Road, Jaipur', city: 'Jaipur', state: 'Rajasthan', country: 'India', zipCode: '302002' },
    location: { type: 'Point', coordinates: [75.8513, 26.9855] },
    amenities: ['WiFi', 'Rooftop Cafe', 'Board Games', 'Shared Lounge', 'Laundry Service', 'Kitchen Access'],
    priceRange: { min: 600, max: 1800, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80', public_id: 'hst-jodh-ext', caption: 'Colorful hostel with Rajasthani architecture' },
      { url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80', public_id: 'hst-jodh-room', caption: 'Clean comfortable hostel room' },
      { url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80', public_id: 'hst-jodh-amen', caption: 'Pink City rooftop views' }
    ],
    isFeatured: false,
    rooms: [
      { roomType: 'standard', title: '8-Bed Mixed Dorm', pricePerNight: 600, maxGuests: 1, bedType: 'twin', discount: 0, amenities: ['WiFi', 'Shared Bath', 'Locker'] },
      { roomType: 'deluxe', title: 'Private Room', pricePerNight: 1800, maxGuests: 2, bedType: 'double', discount: 5, amenities: ['AC', 'WiFi', 'Private Bath'] }
    ]
  },
  // 25. Boutique Goa
  {
    name: 'The Postcard, Goa',
    slug: 'the-postcard-goa',
    description: 'An intimate 10-room boutique hotel housed in a beautifully restored Portuguese colonial villa in South Goa. Whitewashed walls, terracotta tiles, private courtyard plunge pools, and tailored Goan cuisine capture absolute luxury.',
    category: 'boutique',
    starRating: 5,
    address: { street: 'Calangute Beach Road, North Goa', city: 'Goa', state: 'Goa', country: 'India', zipCode: '403516' },
    location: { type: 'Point', coordinates: [73.7517, 15.5440] },
    amenities: ['WiFi', 'Courtyard Pool', 'Fine Dining', 'Historical Tours', 'Garden Deck', 'Room Service'],
    priceRange: { min: 9500, max: 18000, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80', public_id: 'btq-goa-ext', caption: 'Whitewashed luxury villa with tropical gardens' },
      { url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80', public_id: 'btq-goa-room', caption: 'Designer bedroom with premium linens' },
      { url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80', public_id: 'btq-goa-amen', caption: 'Private infinity pool overlooking the ocean' }
    ],
    isFeatured: false,
    rooms: [
      { roomType: 'deluxe', title: 'Garden Room', pricePerNight: 9500, maxGuests: 2, bedType: 'king', discount: 10, amenities: ['AC', 'WiFi', 'Garden View'] },
      { roomType: 'suite', title: 'Courtyard Suite', pricePerNight: 18000, maxGuests: 2, bedType: 'king', discount: 0, amenities: ['AC', 'WiFi', 'Private Pool', 'Bathtub'] }
    ]
  },
  // 26. Boutique Jodhpur (Raas)
  {
    name: 'Raas Jodhpur',
    slug: 'raas-jodhpur',
    description: 'A contemporary boutique hotel within the shadow of Mehrangarh Fort. Sandstone structure blends beautifully with modern glass-and-stone architecture, offering fort-view rooms and an exquisite pool courtyard.',
    category: 'boutique',
    starRating: 5,
    address: { street: 'Pal Haveli Road, Jodhpur', city: 'Jodhpur', state: 'Rajasthan', country: 'India', zipCode: '342001' },
    location: { type: 'Point', coordinates: [73.0244, 26.2980] },
    amenities: ['WiFi', 'Pool', 'Rooftop Fort Dining', 'Spa', 'Sandstone Courtyard', 'Butler Service'],
    priceRange: { min: 8000, max: 15000, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=1200&q=80', public_id: 'btq-jodh-ext', caption: 'Sandstone boutique hotel with courtyard pool' },
      { url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80', public_id: 'btq-jodh-room', caption: 'Designer room with elegant modern decor' },
      { url: 'https://images.unsplash.com/photo-1561501900-3701fa6a0864?auto=format&fit=crop&w=1200&q=80', public_id: 'btq-jodh-amen', caption: 'Luxury resort terrace and outdoor area' }
    ],
    isFeatured: true,
    rooms: [
      { roomType: 'deluxe', title: 'Fort View Room', pricePerNight: 8000, maxGuests: 2, bedType: 'king', discount: 15, amenities: ['AC', 'WiFi', 'Fort View'] },
      { roomType: 'suite', title: 'Terrace Suite', pricePerNight: 15000, maxGuests: 4, bedType: 'king', discount: 0, amenities: ['AC', 'WiFi', 'Private Terrace', 'Fort View', 'Bathtub'] }
    ]
  },
  // 27. Boutique Coorg (The Tamara)
  {
    name: 'The Tamara Coorg',
    slug: 'the-tamara-coorg',
    description: 'A luxurious boutique forest retreat perched on the hills of a working coffee and cardamom estate in Coorg. Elevated wooden cottages look out over the mist-covered valleys and canopy paths.',
    category: 'boutique',
    starRating: 5,
    address: { street: 'Madikeri–Virajpet Road, Coorg', city: 'Coorg', state: 'Karnataka', country: 'India', zipCode: '571201' },
    location: { type: 'Point', coordinates: [75.7382, 12.4244] },
    amenities: ['WiFi', 'Infinity Pool', 'Plantation Tour', 'Restaurant', 'Spa', 'Nature Walks', 'Bird Watching'],
    priceRange: { min: 7500, max: 16000, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?auto=format&fit=crop&w=1200&q=80', public_id: 'btq-crg-ext', caption: 'Lush forest canopy and misty hills at dawn' },
      { url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80', public_id: 'btq-crg-room', caption: 'Forest-facing cottage room interior' },
      { url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80', public_id: 'btq-crg-amen', caption: 'Scenic lakeside view surrounded by mountains' }
    ],
    isFeatured: false,
    rooms: [
      { roomType: 'deluxe', title: 'Estate Room', pricePerNight: 7500, maxGuests: 2, bedType: 'double', discount: 10, amenities: ['AC', 'WiFi', 'Tea Maker', 'Balcony'] },
      { roomType: 'suite', title: 'Forest Villa', pricePerNight: 16000, maxGuests: 2, bedType: 'king', discount: 0, amenities: ['AC', 'WiFi', 'Private Jacuzzi', 'Balcony', 'Minibar'] }
    ]
  },
  // 28. Heritage Jodhpur (Umaid Bhawan)
  {
    name: 'Umaid Bhawan Palace',
    slug: 'umaid-bhawan-palace-jodhpur',
    description: 'Built between 1928 and 1943, this magnificent golden sandstone palace is part hotel and part royal residence. Sprawling green lawns, art deco indoor pools, royal museum tours, and butler service define heritage royalty.',
    category: 'heritage',
    starRating: 5,
    address: { street: 'Navchokiya, Near Clock Tower, Jodhpur', city: 'Jodhpur', state: 'Rajasthan', country: 'India', zipCode: '342001' },
    location: { type: 'Point', coordinates: [73.0243, 26.2967] },
    amenities: ['WiFi', 'Royal Pools', 'Museum Access', 'Fine Dining', 'Grand Gardens', 'Butler Service', 'Royal Escort'],
    priceRange: { min: 18000, max: 55000, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80', public_id: 'hrt-jodh-ext', caption: 'Grand luxury heritage hotel exterior at sunset' },
      { url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80', public_id: 'hrt-jodh-room', caption: 'Royal suite with classical furniture and marble floors' },
      { url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80', public_id: 'hrt-jodh-amen', caption: 'Palace gardens and spa with luxurious amenities' }
    ],
    isFeatured: false,
    rooms: [
      { roomType: 'deluxe', title: 'Deluxe Palace Room', pricePerNight: 18000, maxGuests: 2, bedType: 'king', discount: 5, amenities: ['AC', 'WiFi', 'Minibar', 'Room Service'] },
      { roomType: 'suite', title: 'Royal Suite', pricePerNight: 55000, maxGuests: 3, bedType: 'king', discount: 0, amenities: ['AC', 'WiFi', 'Bathtub', 'Butler', 'Private Lounge'] }
    ]
  },
  // 29. Heritage Udaipur (Taj Lake Palace)
  {
    name: 'Taj Lake Palace',
    slug: 'taj-lake-palace-udaipur',
    description: 'An 18th-century white marble palace floating beautifully on the waters of Lake Pichola. Accessible only by boat, it offers legendary hospitality, ornate rooms, and sunset lake view dining.',
    category: 'heritage',
    starRating: 5,
    address: { street: 'Lake Palace Road, Udaipur', city: 'Udaipur', state: 'Rajasthan', country: 'India', zipCode: '313001' },
    location: { type: 'Point', coordinates: [73.6851, 24.5764] },
    amenities: ['WiFi', 'Lake Pool', 'Boat Transfers', 'Royal Dining', 'Spa', 'Cultural Performances'],
    priceRange: { min: 25000, max: 75000, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1568495248636-6432b97bd949?auto=format&fit=crop&w=1200&q=80', public_id: 'hrt-udr-ext', caption: 'White marble palace floating on Lake Pichola' },
      { url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80', public_id: 'hrt-udr-room', caption: 'Ornate royal suite bedroom with lake views' },
      { url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80', public_id: 'hrt-udr-amen', caption: 'Luxury hotel courtyard with heritage architecture' }
    ],
    isFeatured: true,
    rooms: [
      { roomType: 'deluxe', title: 'Lake View Room', pricePerNight: 25000, maxGuests: 2, bedType: 'king', discount: 10, amenities: ['AC', 'WiFi', 'Lake View'] },
      { roomType: 'suite', title: 'Palace Royal Suite', pricePerNight: 75000, maxGuests: 4, bedType: 'king', discount: 0, amenities: ['AC', 'WiFi', 'Lake View', 'Jacuzzi', 'Butler'] }
    ]
  },
  // 30. Heritage Neemrana
  {
    name: 'Neemrana Fort Palace',
    slug: 'neemrana-fort-palace',
    description: 'A 15th-century historical fort built into the Aravalli hills and converted into a heritage hotel. Explore stepped corridors, amphitheaters, and enjoy zip-lining or sunset tea over the plains.',
    category: 'heritage',
    starRating: 4,
    address: { street: 'Amer Road, Jaipur', city: 'Jaipur', state: 'Rajasthan', country: 'India', zipCode: '302002' },
    location: { type: 'Point', coordinates: [75.8513, 26.9855] },
    amenities: ['WiFi', 'Hill Pools', 'Ziplining', 'Hanging Gardens', 'Amphitheater', 'Buffet Dining'],
    priceRange: { min: 7000, max: 14000, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80', public_id: 'hrt-nee-ext', caption: 'Majestic Rajasthani fort palace at golden hour' },
      { url: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80', public_id: 'hrt-nee-room', caption: 'Heritage room with stone arch windows and period furnishings' },
      { url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=80', public_id: 'hrt-nee-amen', caption: 'Panoramic view of historic fort and surrounding landscape' }
    ],
    isFeatured: false,
    rooms: [
      { roomType: 'standard', title: 'Fort Room', pricePerNight: 7000, maxGuests: 2, bedType: 'double', discount: 10, amenities: ['AC', 'WiFi', 'Stone Walls'] },
      { roomType: 'suite', title: 'Tower Suite', pricePerNight: 14000, maxGuests: 3, bedType: 'queen', discount: 0, amenities: ['AC', 'WiFi', 'Hill View', 'Private Lounge'] }
    ]
  },
  // 31. Campsite Spiti
  {
    name: 'Spiti Valley Luxury Camp',
    slug: 'spiti-valley-luxury-camp-kaza',
    description: 'Swiss-style canvas tents pitched in the high-altitude desert of Spiti Valley at 3,800 meters. Features premium wooden floors, sheepskin rugs, local heaters, and unparalleled views of the barren moonscape hills and clear starry sky.',
    category: 'campsite',
    starRating: 4,
    address: { street: 'Kaza, Spiti Valley, HP', city: 'Spiti', state: 'Himachal Pradesh', country: 'India', zipCode: '172114' },
    location: { type: 'Point', coordinates: [78.0694, 32.2257] },
    amenities: ['WiFi', 'Barbeque', 'Stargazing Guide', 'Heaters', 'Adventure Tours', 'Campfire'],
    priceRange: { min: 4500, max: 7500, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80', public_id: 'cmp-spt-ext', caption: 'Luxury camping tents in scenic mountain valley' },
      { url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80', public_id: 'cmp-spt-room', caption: 'Cozy tent interior with warm lighting' },
      { url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80', public_id: 'cmp-spt-amen', caption: 'Starry night sky over mountain peaks' }
    ],
    isFeatured: true,
    rooms: [
      { roomType: 'standard', title: 'Deluxe Tent', pricePerNight: 4500, maxGuests: 2, bedType: 'twin', discount: 10, amenities: ['Heater', 'Private Bath'] },
      { roomType: 'deluxe', title: 'Premium Heated Tent', pricePerNight: 7500, maxGuests: 2, bedType: 'double', discount: 0, amenities: ['WiFi', 'Heater', 'Attached Bath', 'Mountain View'] }
    ]
  },
  // 32. Campsite Kutch
  {
    name: 'Rann of Kutch White Desert Camp',
    slug: 'rann-of-kutch-white-desert-camp',
    description: 'A seasonal glamping camp pitched directly on the white salt flat desert of Kutch. Features traditional Kutchi folk performances at night, camel safaris, and sunrise view decks.',
    category: 'campsite',
    starRating: 4,
    address: { street: 'Dhordo Village, Rann of Kutch, Gujarat', city: 'Kutch', state: 'Gujarat', country: 'India', zipCode: '370510' },
    location: { type: 'Point', coordinates: [70.0669, 23.2420] },
    amenities: ['WiFi', 'Buffet Meals', 'Folk Performances', 'Desert Safari', 'Air Cooling', 'Activity Area'],
    priceRange: { min: 3800, max: 8000, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80', public_id: 'cmp-ktc-ext', caption: 'White tents on the scenic desert landscape' },
      { url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80', public_id: 'cmp-ktc-room', caption: 'Stunning sunset over scenic landscape' },
      { url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80', public_id: 'cmp-ktc-amen', caption: 'Road trip through scenic desert landscapes' }
    ],
    isFeatured: false,
    rooms: [
      { roomType: 'standard', title: 'Standard Tent', pricePerNight: 3800, maxGuests: 2, bedType: 'twin', discount: 5, amenities: ['Fan', 'Shared Bath'] },
      { roomType: 'deluxe', title: 'Luxury Swiss Tent', pricePerNight: 8000, maxGuests: 3, bedType: 'double', discount: 0, amenities: ['AC', 'WiFi', 'Attached Bath', 'Desert View'] }
    ]
  },
  // 33. Treehouse Wayanad
  {
    name: 'Vythiri Resort Treehouse',
    slug: 'vythiri-resort-treehouse-wayanad',
    description: 'A private luxury treehouse suite built into a 200-year-old tree in the Wayanad rainforest canopy. Features circular wood walls, a skylight for stargazing, and suspension canopy walkways.',
    category: 'treehouse',
    starRating: 5,
    address: { street: 'Vythiri, Wayanad, Kerala', city: 'Wayanad', state: 'Kerala', country: 'India', zipCode: '673576' },
    location: { type: 'Point', coordinates: [76.0499, 11.6854] },
    amenities: ['WiFi', 'Rainforest Pool', 'Canopy Walkways', 'Hanging Balcony', 'Skylight', 'Bird Watching'],
    priceRange: { min: 22000, max: 22000, currency: 'INR' },
    images: [
      { url: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?auto=format&fit=crop&w=1200&q=80', public_id: 'trh-wyn-ext', caption: 'Lush tropical forest canopy in Kerala' },
      { url: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80', public_id: 'trh-wyn-room', caption: 'Cozy cabin-style room with warm lighting' },
      { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80', public_id: 'trh-wyn-amen', caption: 'Misty forest valley and nature trails' }
    ],
    isFeatured: true,
    rooms: [
      { roomType: 'suite', title: 'Treehouse Suite', pricePerNight: 22000, maxGuests: 2, bedType: 'double', discount: 0, amenities: ['AC', 'WiFi', 'Skylight', 'Canopy View', 'Private Deck'] }
    ]
  }
];

// ─── Review Templates ───────────────────────────────────────────────────
const reviewTemplates = [
  { title: 'Incredible stay', comment: 'The property exceeded every expectation. Staff were warm and attentive, and the views were breathtaking.', rating: 5 },
  { title: 'Perfect getaway', comment: 'We loved everything — the location, the food, the ambiance. Will definitely be back with family.', rating: 5 },
  { title: 'Beautiful property', comment: 'The architecture and surroundings are stunning. Rooms were clean and comfortable. Minor WiFi issues but otherwise perfect.', rating: 4.5 },
  { title: 'Wonderful experience', comment: 'Great hospitality and delicious food. The cultural tours arranged by the hotel were a highlight of our trip.', rating: 4.5 },
  { title: 'Very comfortable', comment: 'Clean rooms, friendly staff, and a great restaurant. The pool area was well-maintained and peaceful.', rating: 4 },
  { title: 'Good value', comment: 'For the price, this place delivers exceptional value. Location is convenient and the breakfast spread was generous.', rating: 4 },
  { title: 'Memorable holiday', comment: 'The sunset views from our room were magical. The spa treatment was world-class. Highly recommend the suite.', rating: 5 },
  { title: 'Relaxing retreat', comment: 'Just what we needed. Quiet, well-designed rooms and genuinely helpful staff who went above and beyond.', rating: 4.5 },
  { title: 'Great location', comment: 'Couldn\'t ask for a better spot. Walking distance to all major attractions. The rooftop restaurant was a bonus.', rating: 4 },
  { title: 'Lovely ambience', comment: 'The heritage charm of this place is unmatched. Loved the courtyard and the evening cultural performance.', rating: 4 },
];

// ─── Main Seed Function ─────────────────────────────────────────────────
const seedData = async () => {
  try {
    console.log('🌱 Starting BookMyStay Database Seeder...');
    console.log('  Clearing existing data...');

    // Clear all collections (idempotent)
    await Promise.all([
      User.deleteMany({}),
      Hotel.deleteMany({}),
      Room.deleteMany({}),
      Booking.deleteMany({}),
      Review.deleteMany({}),
      Coupon.deleteMany({}),
      Transaction.deleteMany({}),
      ContentBlock.deleteMany({}),
    ]);

    // ── 1. Create Users ─────────────────────────────────────────────────
    console.log('  Creating users...');
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@bookmystay.com',
      password: 'Admin@123',
      role: 'admin',
      isVerified: true,
      status: 'active',
    });

    // 3 Unique Hotel Owners: Deep, Darshil, Sahil + default owner alias
    const deepOwner = await User.create({
      name: 'Deep',
      email: 'deep@bookmystay.com',
      password: 'Owner@123',
      role: 'owner',
      isVerified: true,
      status: 'active',
    });

    const darshilOwner = await User.create({
      name: 'Darshil',
      email: 'darshil@bookmystay.com',
      password: 'Owner@123',
      role: 'owner',
      isVerified: true,
      status: 'active',
    });

    const sahilOwner = await User.create({
      name: 'Sahil',
      email: 'sahil@bookmystay.com',
      password: 'Owner@123',
      role: 'owner',
      isVerified: true,
      status: 'active',
    });

    // Legacy owner account pointing to Deep
    const legacyOwner = await User.create({
      name: 'Hotel Owner',
      email: 'owner@bookmystay.com',
      password: 'Owner@123',
      role: 'owner',
      isVerified: true,
      status: 'active',
    });

    const ownerList = [deepOwner, darshilOwner, sahilOwner];

    const regularUsers = await User.create([
      { name: 'Priya Patel', email: 'priya.patel@gmail.com', phone: '+91 98201 45872', password: 'User@123', role: 'user', isVerified: true, status: 'active' },
      { name: 'Aarav Sharma', email: 'aarav.sharma@gmail.com', phone: '+91 98112 34901', password: 'User@123', role: 'user', isVerified: true, status: 'active' },
      { name: 'Rohan Mehta', email: 'rohan.mehta@gmail.com', phone: '+91 98450 12894', password: 'User@123', role: 'user', isVerified: true, status: 'active' },
      { name: 'Ananya Roy', email: 'ananya.roy@gmail.com', phone: '+91 98302 76110', password: 'User@123', role: 'user', isVerified: true, status: 'active' },
      { name: 'Vikram Malhotra', email: 'vikram.malhotra@gmail.com', phone: '+91 98710 88234', password: 'User@123', role: 'user', isVerified: true, status: 'active' },
    ]);

    const allUsers = regularUsers;

    // ── 2. Create Hotels ────────────────────────────────────────────────
    console.log(`  Creating ${hotelData.length} hotels distributed equally among Deep, Darshil, and Sahil...`);
    // 33 hotels total -> 11 assigned to Deep, 11 to Darshil, 11 to Sahil
    const hotelsToCreate = hotelData.map((h, index) => {
      const assignedOwner = ownerList[Math.floor(index / 11) % ownerList.length];
      return {
        name: h.name,
        slug: h.slug,
        description: h.description,
        category: h.category,
        starRating: h.starRating,
        address: h.address,
        location: h.location,
        amenities: h.amenities,
        priceRange: h.priceRange,
        images: h.images,
        isFeatured: h.isFeatured,
        status: 'approved',
        isApproved: true,
        owner: assignedOwner._id,
        rating: 4.2,
        numReviews: 4,
      };
    });

    const insertedHotels = await Hotel.insertMany(hotelsToCreate);

    // ── 3. Create Rooms ─────────────────────────────────────────────────
    console.log('  Creating rooms...');
    const roomImages = {
      standard: [{ url: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80', public_id: 'room-std-img' }],
      deluxe: [{ url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80', public_id: 'room-dlx-img' }],
      suite: [{ url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80', public_id: 'room-ste-img' }],
    };

    const roomDocs = [];
    for (let i = 0; i < insertedHotels.length; i++) {
      const hotel = insertedHotels[i];
      const roomDefs = hotelData[i].rooms;
      for (const rd of roomDefs) {
        roomDocs.push({
          hotel: hotel._id,
          roomType: rd.roomType,
          title: rd.title,
          description: `${rd.title} at ${hotel.name} — a comfortable stay with premium amenities.`,
          pricePerNight: rd.pricePerNight,
          maxGuests: rd.maxGuests,
          totalRooms: rd.roomType === 'suite' ? 2 : 5,
          bedType: rd.bedType,
          isAvailable: true,
          discount: rd.discount || 0,
          amenities: rd.amenities || [],
          images: roomImages[rd.roomType] || roomImages.standard,
        });
      }
    }

    const insertedRooms = await Room.insertMany(roomDocs);

    // Build a map: hotelId -> rooms for quick lookup
    const hotelRoomMap = {};
    for (const room of insertedRooms) {
      const hid = room.hotel.toString();
      if (!hotelRoomMap[hid]) hotelRoomMap[hid] = [];
      hotelRoomMap[hid].push(room);
    }

    // ── 4. Create Bookings ──────────────────────────────────────────────
    console.log('  Creating bookings...');
    const bookingStatuses = [
      ...Array(12).fill('confirmed'),
      ...Array(8).fill('checked-out'),
      ...Array(4).fill('pending'),
      ...Array(4).fill('cancelled'),
      ...Array(4).fill('checked-in'),
    ];

    const bookings = [];
    for (let i = 0; i < bookingStatuses.length; i++) {
      const status = bookingStatuses[i];
      const hotel = insertedHotels[i % insertedHotels.length];
      const rooms = hotelRoomMap[hotel._id.toString()] || [];
      const room = rooms[i % rooms.length];
      if (!room) continue;

      const user = allUsers[i % allUsers.length];

      let checkIn, checkOut;
      if (status === 'checked-out') {
        checkIn = pastDate(rand(10, 60));
        checkOut = addDays(checkIn, rand(2, 5));
      } else if (status === 'checked-in') {
        checkIn = pastDate(rand(0, 2));
        checkOut = futureDate(rand(2, 5));
      } else if (status === 'cancelled') {
        checkIn = pastDate(rand(5, 30));
        checkOut = addDays(checkIn, rand(2, 4));
      } else if (status === 'confirmed') {
        checkIn = futureDate(rand(5, 45));
        checkOut = addDays(checkIn, rand(2, 5));
      } else {
        checkIn = futureDate(rand(10, 30));
        checkOut = addDays(checkIn, rand(2, 4));
      }

      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      const roomCharges = room.pricePerNight * nights;
      const taxes = Math.round(roomCharges * 0.18);
      const serviceFee = Math.round(roomCharges * 0.05);
      const totalPrice = roomCharges + taxes + serviceFee;

      const isPaid = ['confirmed', 'checked-in', 'checked-out'].includes(status);

      bookings.push({
        user: user._id,
        hotel: hotel._id,
        room: room._id,
        checkIn,
        checkOut,
        guests: { adults: rand(1, 3), children: rand(0, 1) },
        numberOfRooms: 1,
        totalPrice,
        priceBreakdown: { roomCharges, taxes, serviceFee, discount: 0 },
        bookingStatus: status,
        paymentInfo: {
          id: isPaid ? `pay_seed_${i}_${Date.now()}` : undefined,
          status: isPaid ? 'paid' : status === 'cancelled' ? 'failed' : 'pending',
          method: isPaid ? pick(['card', 'upi']) : undefined,
          paidAt: isPaid ? checkIn : undefined,
        },
        commissionAmount: isPaid ? Math.round(totalPrice * 0.15) : 0,
        netAmount: isPaid ? totalPrice - Math.round(totalPrice * 0.15) : 0,
        cancellation: status === 'cancelled' ? {
          cancelledAt: addDays(checkIn, -rand(1, 5)),
          reason: 'Plans changed',
          refundAmount: Math.round(totalPrice * 0.5),
          refundStatus: 'processed',
        } : undefined,
      });
    }

    const insertedBookings = await Booking.insertMany(bookings);

    // ── 5. Create Transactions for paid bookings ────────────────────────
    console.log('  Creating transactions...');
    const hotelToOwnerMap = {};
    for (const h of insertedHotels) {
      hotelToOwnerMap[h._id.toString()] = h.owner;
    }

    const transactions = [];
    for (const booking of insertedBookings) {
      if (booking.paymentInfo?.status === 'paid') {
        transactions.push({
          booking: booking._id,
          hotel: booking.hotel,
          owner: hotelToOwnerMap[booking.hotel.toString()],
          user: booking.user,
          type: 'booking',
          grossAmount: booking.totalPrice,
          commissionRate: 15,
          commissionAmount: booking.commissionAmount,
          netAmount: booking.netAmount,
          status: 'completed',
          gateway: pick(['stripe', 'razorpay']),
          paymentId: booking.paymentInfo.id,
        });
      }
    }
    await Transaction.insertMany(transactions);

    // ── 6. Create Reviews directly on all hotels ────────────────────────
    console.log('  Creating reviews...');
    const reviews = [];
    for (let i = 0; i < insertedHotels.length; i++) {
      const hotel = insertedHotels[i];
      // Seed 3 unique reviews per hotel to achieve custom ratings (3.8 - 4.9)
      const reviewCount = rand(3, 5);
      for (let rIdx = 0; rIdx < reviewCount; rIdx++) {
        const tmpl = reviewTemplates[(i + rIdx) % reviewTemplates.length];
        const rating = pick([4, 4.5, 5]);
        const reviewer = allUsers[rIdx % allUsers.length];
        const rooms = hotelRoomMap[hotel._id.toString()] || [];
        const room = rooms[0];
        if (!room) continue;

        // 1. Create a synthetic checked-out booking for this review
        const checkIn = pastDate(rand(10, 90));
        const checkOut = addDays(checkIn, rand(2, 5));
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const roomCharges = room.pricePerNight * nights;
        const taxes = Math.round(roomCharges * 0.18);
        const serviceFee = Math.round(roomCharges * 0.05);
        const totalPrice = roomCharges + taxes + serviceFee;

        const booking = await Booking.create({
          user: reviewer._id,
          hotel: hotel._id,
          room: room._id,
          checkIn,
          checkOut,
          guests: { adults: rand(1, 3), children: 0 },
          numberOfRooms: 1,
          totalPrice,
          priceBreakdown: { roomCharges, taxes, serviceFee, discount: 0 },
          bookingStatus: 'checked-out',
          paymentInfo: {
            id: `pay_rev_${i}_${rIdx}_${Date.now()}`,
            status: 'paid',
            method: 'card',
            paidAt: checkIn,
          },
          commissionAmount: Math.round(totalPrice * 0.15),
          netAmount: totalPrice - Math.round(totalPrice * 0.15),
        });

        // 2. Push review linking to booking
        reviews.push({
          user: reviewer._id,
          hotel: hotel._id,
          booking: booking._id,
          rating,
          title: tmpl.title,
          comment: tmpl.comment,
          ratings: {
            cleanliness: rating,
            location: rating,
            service: rating,
            value: rating,
          },
        });
      }
    }
    await Review.insertMany(reviews);

    // ── 7. Recompute hotel ratings from reviews ─────────────────────────
    console.log('  Recomputing hotel ratings...');
    const ratingAgg = await Review.aggregate([
      { $group: { _id: '$hotel', avgRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
    ]);
    for (const r of ratingAgg) {
      await Hotel.findByIdAndUpdate(r._id, {
        rating: Math.round(r.avgRating * 10) / 10,
        numReviews: r.reviewCount,
      });
    }

    // ── 8. Create Coupons ───────────────────────────────────────────────
    console.log('  Creating coupons...');
    await Coupon.deleteMany({});
    const goaHotel = insertedHotels.find((h) => h.address.city === 'Goa');
    await Coupon.create([
      {
        code: 'BOOKMYSTAY',
        discountType: 'percentage',
        discountValue: 15,
        maxDiscount: 3000,
        minBookingAmount: 500,
        validFrom: new Date(),
        validUntil: addDays(new Date(), 365),
        usageLimit: 1000,
        usedCount: 0,
        applicableHotels: [], // global
        isActive: true,
        firstTimeUserOnly: true,
      },
      {
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        maxDiscount: 2000,
        minBookingAmount: 2000,
        validFrom: new Date(),
        validUntil: addDays(new Date(), 365),
        usageLimit: 100,
        usedCount: 0,
        applicableHotels: [], // global
        isActive: true,
        firstTimeUserOnly: true,
      },
      {
        code: 'GOA500',
        discountType: 'flat',
        discountValue: 500,
        minBookingAmount: 3000,
        validFrom: new Date(),
        validUntil: addDays(new Date(), 180),
        usageLimit: 50,
        usedCount: 0,
        applicableHotels: goaHotel ? [goaHotel._id] : [],
        isActive: true,
      },
    ]);

    // ── 9. Create PlatformSettings ──────────────────────────────────────
    await PlatformSettings.deleteMany({});
    await PlatformSettings.create({
      commissionRate: 15,
      maintenanceMode: false,
      stripeEnabled: true,
      razorpayEnabled: true,
      contactEmail: 'support@bookmystay.com',
    });

    // ── 10. Content Blocks ──────────────────────────────────────────────
    console.log('  Creating content blocks...');
    await ContentBlock.deleteMany({});
    await ContentBlock.create([
      {
        section: 'hero',
        title: 'Discover Incredible India',
        subtitle: 'Book from an exclusive collection of heritage hotels, mountain retreats, beachfront resorts, and hidden getaways across India.',
        content: {
          backgroundImage: 'https://images.unsplash.com/photo-1542314831-c6a4d1400820?q=80&w=2000&auto=format&fit=crop',
          backgroundVideo: '/videos/hero.mp4',
        },
        isActive: true,
        priority: 10,
      },
      {
        section: 'destinations',
        title: 'Trending Destinations',
        subtitle: 'Explore the most sought-after locations for your next Indian getaway.',
        content: [
          { name: 'Goa', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop', properties: 1 },
          { name: 'Jaipur', image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=800&auto=format&fit=crop', properties: 1 },
          { name: 'Udaipur', image: 'https://images.unsplash.com/photo-1568495248636-6432b97bd949?q=80&w=800&auto=format&fit=crop', properties: 1 },
          { name: 'Munnar', image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?q=80&w=800&auto=format&fit=crop', properties: 1 },
          { name: 'Manali', image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=800&auto=format&fit=crop', properties: 1 },
          { name: 'Rishikesh', image: 'https://images.unsplash.com/photo-1545389336-cf090694435e?q=80&w=800&auto=format&fit=crop', properties: 1 },
        ],
        isActive: true,
        priority: 9,
      },
      {
        section: 'features',
        title: 'Why BookMyStay',
        subtitle: 'We deliver unparalleled experiences from booking to checkout.',
        content: [
          { title: 'Best Rates Guaranteed', description: 'Discover exclusive prices you won\'t find anywhere else. If you do, we\'ll match it instantly.', icon: 'CheckCircle' },
          { title: 'Curated Excellence', description: 'Every property in our collection is rigorously verified by our team for premium quality and safety.', icon: 'Shield' },
          { title: '24/7 Concierge Support', description: 'Our dedicated luxury travel advisors are available round the clock to ensure a flawless trip.', icon: 'Headphones' },
        ],
        isActive: true,
        priority: 8,
      },
      {
        section: 'testimonials',
        title: 'Traveler Stories',
        subtitle: 'Read what our guests have to say about their unforgettable experiences.',
        content: [
          { name: 'Ananya Desai', role: 'Travel Blogger', content: 'BookMyStay helped me discover hidden gems across Rajasthan. The heritage havelis were absolutely magical.', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', rating: 5 },
          { name: 'Vikram Singh', role: 'Business Consultant', content: 'The seamless booking experience and instant confirmations save me hours. The customer support is genuinely world-class.', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', rating: 5 },
          { name: 'Meera Krishnan', role: 'Digital Nomad', content: 'From Kerala backwaters to Ladakh camps — every stay curated by BookMyStay has been an unforgettable experience.', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', rating: 4 },
        ],
        isActive: true,
        priority: 7,
      },
      {
        section: 'newsletter',
        title: 'Unlock Secret Deals',
        subtitle: 'Subscribe to our newsletter and get up to 20% off on your first booking.',
        content: {
          placeholder: 'Enter your email address',
          buttonText: 'Subscribe',
          disclaimer: 'We respect your privacy. Unsubscribe at any time.',
        },
        isActive: true,
        priority: 6,
      },
    ]);

    // ── Summary ─────────────────────────────────────────────────────────
    const totalBookings = await Booking.countDocuments();
    const totalReviews = await Review.countDocuments();
    const totalRooms = await Room.countDocuments();

    console.log('\n✅ BookMyStay Seeded Successfully');
    console.log(`   Hotels:   ${insertedHotels.length} (11 properties per owner)  |  Rooms:   ${totalRooms}  |  Users: 8`);
    console.log(`   Bookings: ${totalBookings}  |  Reviews: ${totalReviews}  |  Coupons: 2`);
    console.log(`   Admin:    admin@bookmystay.com  /  Admin@123`);
    console.log(`   Owner 1:  deep@bookmystay.com   /  Owner@123  (11 hotels)`);
    console.log(`   Owner 2:  darshil@bookmystay.com /  Owner@123  (11 hotels)`);
    console.log(`   Owner 3:  sahil@bookmystay.com   /  Owner@123  (11 hotels)\n`);
  } catch (error) {
    console.error('❌ Seeder Error:', error);
    throw error;
  }
};

module.exports = seedData;
