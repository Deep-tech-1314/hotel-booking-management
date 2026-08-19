const ContentBlock = require('../models/ContentBlock');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');

/**
 * @desc   Get all active content blocks (for home page)
 * @route  GET /api/v1/content/home
 * @access Public
 */
exports.getHomeContent = asyncHandler(async (req, res, next) => {
  const blocks = await ContentBlock.find({ isActive: true })
    .sort({ priority: -1, createdAt: -1 })
    .populate('updatedBy', 'name');

  const content = {};
  blocks.forEach((block) => {
    content[block.section] = block;
  });

  res.status(200).json({
    success: true,
    data: content,
  });
});

/**
 * @desc   Get all content blocks, including inactive (admin editor)
 * @route  GET /api/v1/content
 * @access Private/Admin
 */
exports.getAllContent = asyncHandler(async (req, res, next) => {
  const blocks = await ContentBlock.find({})
    .sort({ priority: -1, createdAt: -1 })
    .populate('updatedBy', 'name');

  res.status(200).json({
    success: true,
    count: blocks.length,
    data: blocks,
  });
});

/**
 * @desc   Get single content section
 * @route  GET /api/v1/content/section/:section
 * @access Public
 */
exports.getSection = asyncHandler(async (req, res, next) => {
  const block = await ContentBlock.findOne({
    section: req.params.section,
    isActive: true,
  });

  if (!block) {
    return next(new ApiError('Content section not found', 404));
  }

  res.status(200).json({
    success: true,
    data: block,
  });
});

/**
 * @desc   Create or update content block (upsert)
 * @route  POST /api/v1/content
 * @access Private/Admin
 */
exports.upsertContent = asyncHandler(async (req, res, next) => {
  const { section, title, subtitle, content, priority, isActive } = req.body;

  const block = await ContentBlock.findOneAndUpdate(
    { section },
    {
      section,
      title,
      subtitle,
      content,
      priority: priority || 0,
      isActive: isActive !== false,
      updatedBy: req.user.id,
    },
    { upsert: true, new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: block,
  });
});

/**
 * @desc   Delete content block
 * @route  DELETE /api/v1/content/:id
 * @access Private/Admin
 */
exports.deleteContent = asyncHandler(async (req, res, next) => {
  const block = await ContentBlock.findById(req.params.id);

  if (!block) {
    return next(new ApiError('Content block not found', 404));
  }

  await block.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Content block deleted',
  });
});

/**
 * @desc   Seed default home content (idempotent)
 * @route  POST /api/v1/content/seed
 * @access Private/Admin
 */
exports.seedHomeContent = asyncHandler(async (req, res, next) => {
  const defaults = [
    {
      section: 'hero',
      title: 'Elevate Your Journey',
      subtitle: 'Discover and book from an exclusive collection of luxury resorts, boutique hotels, and serene villas worldwide.',
      content: {
        backgroundImage: 'https://images.unsplash.com/photo-1542314831-c6a4d1400820?q=80&w=2000&auto=format&fit=crop',
        backgroundVideo: '/videos/hero.mp4',
        ctaText: 'Explore Stays',
        ctaLink: '/hotels',
      },
      priority: 10,
    },
    {
      section: 'destinations',
      title: 'Trending Destinations',
      subtitle: 'Explore the most sought-after locations for your next getaway.',
      content: [
        { name: 'Maldives', image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=800&auto=format&fit=crop', properties: 1240 },
        { name: 'Santorini', image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5f1?q=80&w=800&auto=format&fit=crop', properties: 856 },
        { name: 'Kyoto', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop', properties: 932 },
        { name: 'Bali', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800&auto=format&fit=crop', properties: 1428 },
        { name: 'Swiss Alps', image: 'https://images.unsplash.com/photo-1531315630201-bb15abeb1653?q=80&w=800&auto=format&fit=crop', properties: 615 },
        { name: 'Dubai', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=800&auto=format&fit=crop', properties: 1384 },
      ],
      priority: 9,
    },
    {
      section: 'featured_deals',
      title: 'Exclusive Offers',
      subtitle: 'Handpicked stays with extraordinary discounts.',
      content: [], // populated dynamically from hotels
      priority: 8,
    },
    {
      section: 'testimonials',
      title: 'Traveler Stories',
      subtitle: 'Read what our guests have to say about their unforgettable experiences.',
      content: [
        { name: 'Sarah Jenkins', role: 'Travel Blogger', content: 'BookMyStay completely transformed how I travel. The interface is stunning, and I always find the most exclusive boutique hotels here.', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', rating: 5 },
        { name: 'David Chen', role: 'Business Consultant', content: 'The seamless booking experience and instant confirmations save me hours. The customer support is genuinely world-class.', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', rating: 5 },
        { name: 'Elena Rodriguez', role: 'Digital Nomad', content: "I've booked over 30 stays through this platform. The pricing transparency and verified property badges give me total peace of mind.", avatar: 'https://randomuser.me/api/portraits/women/68.jpg', rating: 4 },
      ],
      priority: 7,
    },
    {
      section: 'features',
      title: 'Why BookMyStay',
      subtitle: 'We deliver unparalleled experiences from booking to checkout.',
      content: [
        { icon: 'CheckCircle', title: 'Best Rates Guaranteed', description: 'Discover exclusive prices you won\'t find anywhere else. If you do, we\'ll match it instantly.' },
        { icon: 'Shield', title: 'Curated Excellence', description: 'Every property in our collection is rigorously verified by our team for premium quality and safety.' },
        { icon: 'Headphones', title: '24/7 Concierge Support', description: 'Our dedicated luxury travel advisors are available round the clock to ensure a flawless trip.' },
      ],
      priority: 6,
    },
    {
      section: 'newsletter',
      title: 'Unlock Secret Deals',
      subtitle: 'Subscribe to our newsletter and get up to 20% off on your first luxury booking.',
      content: {
        placeholder: 'Enter your email address',
        buttonText: 'Subscribe',
        disclaimer: 'We respect your privacy. Unsubscribe at any time.',
      },
      priority: 5,
    },
  ];

  const results = await Promise.all(
    defaults.map((item) =>
      ContentBlock.findOneAndUpdate(
        { section: item.section },
        { ...item, updatedBy: req.user?.id },
        { upsert: true, new: true }
      )
    )
  );

  res.status(200).json({
    success: true,
    count: results.length,
    data: results,
  });
});
