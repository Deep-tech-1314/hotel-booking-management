import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHotels } from '../../redux/slices/hotelSlice';
import { trackHotelView } from '../../redux/slices/analyticsSlice';
import { calculateNights, formatPrice } from '../../utils/constants';
import {
  FiArrowRight, FiChevronLeft, FiChevronRight, FiHeart, FiMapPin,
  FiSliders, FiStar, FiX,
} from 'react-icons/fi';
import ImageLazy from '../../components/common/ImageLazy';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const AMENITIES = ['WiFi', 'Pool', 'Parking', 'AC', 'Spa', 'Restaurant', 'Room Service', 'Pet Friendly'];
const ULTIMATE_FALLBACK_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';

const getExploreCardImage = (hotel) => {
  if (hotel.images?.[0]?.url && (hotel.images[0].url.startsWith('http') || hotel.images[0].url.startsWith('/uploads'))) {
    return hotel.images[0].url;
  }
  const city = (hotel.address?.city || hotel.name || '').toLowerCase();
  if (city.includes('jaipur') || city.includes('jodhpur') || city.includes('udaipur') || city.includes('rajasthan')) {
    return 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80';
  }
  if (city.includes('goa')) {
    return 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80';
  }
  if (city.includes('munnar') || city.includes('alleppey') || city.includes('kerala') || city.includes('wayanad')) {
    return 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=1200&q=80';
  }
  if (city.includes('manali') || city.includes('shimla') || city.includes('spiti') || city.includes('ladakh') || city.includes('leh')) {
    return 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80';
  }
  return ULTIMATE_FALLBACK_IMG;
};

const SearchResults = () => {
  const [categoriesWithCounts, setCategoriesWithCounts] = useState([]);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/hotels/categories');
        if (data?.success) {
          setCategoriesWithCounts(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch categories counts', err);
      }
    };
    fetchCategories();
  }, []);

  const activeFilterCategories = useMemo(() => {
    if (categoriesWithCounts.length > 0) {
      return categoriesWithCounts.filter(c => c.count > 0);
    }
    return [
      { category: 'hotel', count: 8 },
      { category: 'resort', count: 4 },
      { category: 'villa', count: 3 },
      { category: 'apartment', count: 2 },
      { category: 'hostel', count: 2 },
      { category: 'guesthouse', count: 3 }
    ];
  }, [categoriesWithCounts]);

  const activeTabCategories = useMemo(() => {
    return ['all', ...activeFilterCategories.map(c => c.category)];
  }, [activeFilterCategories]);

  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { hotels, loading, totalPages, currentPage } = useSelector((s) => s.hotels);
  const { isAuthenticated } = useSelector((s) => s.auth);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(() => {
    const c = searchParams.get('category');
    return c ? c.split(',') : [];
  });
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [sortBy, setSortBy] = useState('recommended');
  const [sessionId] = useState(() => localStorage.getItem('bms_session') || 'sess_anon');
  const [wished, setWished] = useState(() => new Set());
  const [wishPending, setWishPending] = useState(() => new Set());

  // Seed wishlist state from server on mount (signed-in users only)
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/wishlist');
        if (cancelled) return;
        setWished(new Set((data.wishlist || []).map((h) => h._id)));
      } catch {
        // Silent: not critical for the page to render
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const city = searchParams.get('city') || searchParams.get('keyword') || '';
  const guests = searchParams.get('guests') || 'Any';
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const nights = checkIn && checkOut ? calculateNights(checkIn, checkOut) : null;
  const activeTab = useMemo(() => {
    if (selectedCategories.length === 1) return selectedCategories[0];
    return 'all';
  }, [selectedCategories]);

  useEffect(() => {
    const c = searchParams.get('category');
    setSelectedCategories(c ? c.split(',') : []);
  }, [searchParams]);

  useEffect(() => {
    const params = {
      limit: 100
    };
    
    // 1. City / Keyword
    const cityVal = searchParams.get('city') || searchParams.get('keyword');
    if (cityVal) params.city = cityVal;
    
    // 2. Page
    const pageVal = searchParams.get('page');
    if (pageVal) params.page = pageVal;
    
    // 3. Category
    const urlCategory = searchParams.get('category');
    if (selectedCategories.length > 0) {
      params.category = selectedCategories[0];
    } else if (urlCategory) {
      params.category = urlCategory;
    }
    
    // 4. Rating
    if (minRating > 0) params.rating = minRating;
    
    // 5. Price
    if (priceRange[0] > 0) params.minPrice = priceRange[0];
    if (priceRange[1] < 50000) params.maxPrice = priceRange[1];
    
    // 6. Amenities
    if (selectedAmenities.length > 0) {
      params.amenities = selectedAmenities.join(',');
    }
    
    // 7. Sort
    if (sortBy && sortBy !== 'recommended') {
      params.sort = sortBy;
    }
    
    dispatch(fetchHotels(params));
  }, [dispatch, searchParams, selectedCategories, selectedAmenities, priceRange, minRating, sortBy]);

  const filtered = useMemo(() => {
    const out = (hotels || []).filter((h) => {
      const price = h.cheapestPrice || h.price || 0;
      const catOk = selectedCategories.length === 0 || selectedCategories.includes(h.category);
      const amOk = selectedAmenities.length === 0 || selectedAmenities.every((a) => h.amenities?.includes(a));
      const prOk = price >= priceRange[0] && price <= priceRange[1];
      const rtOk = (h.rating || 0) >= minRating;
      return catOk && amOk && prOk && rtOk;
    });
    return [...out].sort((a, b) => {
      if (sortBy === 'price_asc') return (a.cheapestPrice || 0) - (b.cheapestPrice || 0);
      if (sortBy === 'price_desc') return (b.cheapestPrice || 0) - (a.cheapestPrice || 0);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return Number(b.isFeatured) - Number(a.isFeatured) || (b.rating || 0) - (a.rating || 0);
    });
  }, [hotels, selectedCategories, selectedAmenities, priceRange, minRating, sortBy]);

  const toggleIn = (value, list, setter) => {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  };

  const handleTab = (tab) => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'all') {
      next.delete('category');
    } else {
      next.set('category', tab);
    }
    next.delete('page');
    setSearchParams(next);
  };

  const handleHotelClick = (id) => dispatch(trackHotelView({ hotelId: id, sessionId }));

  const toggleWish = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Sign in to save stays to your wishlist');
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }
    if (wishPending.has(id)) return;

    const isOn = wished.has(id);
    // Optimistic update
    setWished((prev) => {
      const next = new Set(prev);
      isOn ? next.delete(id) : next.add(id);
      return next;
    });
    setWishPending((prev) => new Set(prev).add(id));

    try {
      if (isOn) {
        await api.delete(`/wishlist/${id}`);
      } else {
        await api.post(`/wishlist/${id}`);
      }
    } catch (err) {
      // Revert on failure
      setWished((prev) => {
        const next = new Set(prev);
        isOn ? next.add(id) : next.delete(id);
        return next;
      });
      const msg = err.response?.data?.message;
      // Server returns 400 "already in wishlist" if state was already on the server — treat as success
      if (msg && /already/i.test(msg)) {
        setWished((prev) => new Set(prev).add(id));
      } else {
        toast.error(msg || 'Wishlist update failed');
      }
    } finally {
      setWishPending((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const goToPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', p);
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedAmenities([]);
    setMinRating(0);
    setPriceRange([0, 50000]);
  };

  const isResortLanding = searchParams.get('category') === 'resort' && selectedCategories.length <= 1;
  const eyebrowText = isResortLanding ? 'The signature collection' : (city ? 'Search results' : 'The full collection');
  const titleText = isResortLanding
    ? <>Resorts, <em>handpicked.</em></>
    : city
      ? <>Stays in <em>{city}</em></>
      : <>The <em>collection</em></>;

  return (
    <div className="cine-search">
      {/* Header */}
      <header className="cine-search-header">
        <div className="container">
          <div className="cine-eyebrow">{eyebrowText}</div>
          <h1 className="cine-search-title">{titleText}</h1>
          <p className="cine-search-meta">
            {loading ? 'Searching the collection…' : `${filtered.length} ${filtered.length === 1 ? 'stay' : 'stays'}`}
            {guests !== 'Any' && (<><i>—</i>{guests} guests</>)}
            {nights && (<><i>—</i>{nights} night{nights === 1 ? '' : 's'}</>)}
          </p>
        </div>
      </header>

      {/* Sticky toolbar */}
      <div className="cine-search-toolbar">
        <div className="cine-search-toolbar-inner">
          <div className="cine-search-tabs" role="tablist">
            {activeTabCategories.map((tab) => (
              <button
                key={tab}
                role="tab"
                className={`cine-search-tab ${activeTab === tab ? 'is-active' : ''}`}
                onClick={() => handleTab(tab)}
              >
                {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="cine-search-controls">
            <select className="cine-search-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort by">
              <option value="recommended">Recommended</option>
              <option value="price_asc">Price · Low → High</option>
              <option value="price_desc">Price · High → Low</option>
              <option value="rating">Top rated</option>
            </select>
            <button className="cine-search-filters-btn" onClick={() => setFiltersOpen(true)}>
              <FiSliders size={14} /> Filters
              {(selectedAmenities.length || minRating || priceRange[0] > 0 || priceRange[1] < 50000) ? (
                <span style={{
                  marginLeft: 4,
                  background: 'var(--primary)',
                  color: 'white',
                  borderRadius: 999,
                  fontSize: '0.65rem',
                  padding: '2px 7px',
                  fontWeight: 700,
                }}>
                  {selectedAmenities.length + (minRating ? 1 : 0) + (priceRange[0] > 0 || priceRange[1] < 50000 ? 1 : 0)}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="cine-hotels-grid">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="cine-hotel-skel">
                <div className="cine-hotel-media" />
                <div className="cine-hotel-bar w-60" />
                <div className="cine-hotel-bar w-40" />
              </div>
            ))
          : filtered.map((hotel) => {
              const img = getExploreCardImage(hotel);
              const amenities = (hotel.amenities || []).slice(0, 3);
              return (
                <Link
                  to={`/hotel/${hotel._id}`}
                  key={hotel._id}
                  className="cine-hotel-card"
                  onClick={() => handleHotelClick(hotel._id)}
                >
                  <div className="cine-hotel-media">
                    <ImageLazy src={img} alt={hotel.name} className="cine-hotel-img" />
                    <button
                      className="cine-hotel-wish"
                      onClick={(e) => toggleWish(e, hotel._id)}
                      aria-label={wished.has(hotel._id) ? 'Remove from wishlist' : 'Save to wishlist'}
                    >
                      <FiHeart size={16} fill={wished.has(hotel._id) ? 'currentColor' : 'none'} />
                    </button>
                    <div className="cine-hotel-rating">
                      <FiStar size={12} fill="currentColor" />
                      {hotel.rating ? Number(hotel.rating).toFixed(1) : 'New'}
                    </div>
                    {hotel.category && <div className="cine-hotel-category">{hotel.category}</div>}
                  </div>
                  <h3 className="cine-hotel-name">{hotel.name}</h3>
                  <div className="cine-hotel-location">
                    <FiMapPin size={14} /> {hotel.address?.city}{hotel.address?.country ? `, ${hotel.address.country}` : ''}
                  </div>
                  <div className="cine-hotel-amenities">
                    {amenities.length
                      ? amenities.map((a, i) => (<span key={i} className="cine-hotel-amenity">{a}</span>))
                      : <span className="cine-hotel-amenity">Concierge</span>}
                  </div>
                  <div className="cine-hotel-foot">
                    <div>
                      <div className="cine-hotel-price-label">From</div>
                      <div className="cine-hotel-price-value">
                        {formatPrice(hotel.cheapestPrice || hotel.price || hotel.priceRange?.min || 0)}<span> / night</span>
                      </div>
                    </div>
                    <span className="cine-hotel-cta">Reserve <FiArrowRight size={14} /></span>
                  </div>
                </Link>
              );
            })}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="cine-empty">
          <div className="cine-empty-icon">— ✦ —</div>
          <h2 className="cine-empty-title">No stays match your filters</h2>
          <p className="cine-empty-lede">
            Try widening the price range, removing an amenity, or exploring another corner of the world.
          </p>
          <button className="cine-filter-foot" style={{ border: 0, background: 'transparent', display: 'inline-block', padding: 0 }} onClick={clearAll}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', borderRadius: 'var(--radius-full)',
              background: 'var(--text-primary)', color: 'white',
              fontFamily: 'var(--font-body)', fontWeight: 500,
              fontSize: '0.9rem', cursor: 'pointer',
            }}>
              Clear filters <FiArrowRight />
            </span>
          </button>
        </div>
      )}

      {!loading && totalPages >= 1 && (
        <div className="cine-pagination">
          <button disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}>
            <FiChevronLeft /> Previous
          </button>
          <span className="cine-pagination-info">Page {currentPage} of {totalPages}</span>
          <button disabled={currentPage >= totalPages} onClick={() => goToPage(currentPage + 1)}>
            Next <FiChevronRight />
          </button>
        </div>
      )}

      {/* Filter drawer */}
      <div
        className={`cine-filter-overlay ${filtersOpen ? 'is-open' : ''}`}
        onClick={() => setFiltersOpen(false)}
        aria-hidden={!filtersOpen}
      />
      <aside className={`cine-filter-drawer ${filtersOpen ? 'is-open' : ''}`} aria-hidden={!filtersOpen}>
        <div className="cine-filter-head">
          <h3>Refine</h3>
          <button className="cine-filter-close" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
            <FiX size={16} />
          </button>
        </div>
        <div className="cine-filter-body">
          <section className="cine-filter-section">
            <span className="cine-filter-label">Property type</span>
            <div className="cine-filter-chips">
              {activeFilterCategories.map((cObj) => {
                const c = cObj.category;
                const count = cObj.count;
                const displayName = c.charAt(0).toUpperCase() + c.slice(1);
                return (
                  <button
                    key={c}
                    className={`cine-filter-chip ${selectedCategories.includes(c) ? 'is-on' : ''}`}
                    onClick={() => toggleIn(c, selectedCategories, setSelectedCategories)}
                  >
                    {displayName} ({count})
                  </button>
                );
              })}
            </div>
          </section>
          <section className="cine-filter-section">
            <span className="cine-filter-label">Amenities</span>
            <div className="cine-filter-chips">
              {AMENITIES.map((a) => (
                <button
                  key={a}
                  className={`cine-filter-chip ${selectedAmenities.includes(a) ? 'is-on' : ''}`}
                  onClick={() => toggleIn(a, selectedAmenities, setSelectedAmenities)}
                >
                  {a}
                </button>
              ))}
            </div>
          </section>
          <section className="cine-filter-section">
            <span className="cine-filter-label">Minimum rating</span>
            <div className="cine-filter-chips">
              {[0, 3, 4, 4.5].map((r) => (
                <button
                  key={r}
                  className={`cine-filter-chip ${minRating === r ? 'is-on' : ''}`}
                  onClick={() => setMinRating(r)}
                >
                  {r === 0 ? 'Any' : `${r}+`}
                </button>
              ))}
            </div>
          </section>
          <section className="cine-filter-section">
            <span className="cine-filter-label">Price per night</span>
            <div className="cine-filter-price">
              <input
                type="number" min="0" value={priceRange[0]}
                onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                placeholder="Min"
              />
              <input
                type="number" min="0" value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                placeholder="Max"
              />
            </div>
          </section>
        </div>
        <div className="cine-filter-foot">
          <button onClick={clearAll}>Clear all</button>
          <button className="is-primary" onClick={() => setFiltersOpen(false)}>
            Show {filtered.length} {filtered.length === 1 ? 'stay' : 'stays'}
          </button>
        </div>
      </aside>
    </div>
  );
};

export default SearchResults;
