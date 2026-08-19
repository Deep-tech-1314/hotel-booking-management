import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';

const initialForm = {
  name: '',
  description: '',
  category: 'hotel',
  starRating: '3',
  minPrice: '',
  maxPrice: '',
  street: '',
  city: '',
  state: '',
  country: 'India',
  zipCode: '',
  amenities: 'WiFi, Parking, Restaurant',
  checkIn: '2:00 PM',
  checkOut: '11:00 AM',
  cancellation: 'moderate',
  petsAllowed: false,
  smokingAllowed: false,
};

const OwnerHotelForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(initialForm);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;

    const fetchHotel = async () => {
      try {
        const { data } = await api.get(`/hotels/${id}`);
        const hotel = data.hotel;
        setForm({
          name: hotel.name || '',
          description: hotel.description || '',
          category: hotel.category || 'hotel',
          starRating: String(hotel.starRating || 3),
          minPrice: String(hotel.priceRange?.min || ''),
          maxPrice: String(hotel.priceRange?.max || ''),
          street: hotel.address?.street || '',
          city: hotel.address?.city || '',
          state: hotel.address?.state || '',
          country: hotel.address?.country || 'India',
          zipCode: hotel.address?.zipCode || '',
          amenities: (hotel.amenities || []).join(', '),
          checkIn: hotel.policies?.checkIn || '2:00 PM',
          checkOut: hotel.policies?.checkOut || '11:00 AM',
          cancellation: hotel.policies?.cancellation || 'moderate',
          petsAllowed: Boolean(hotel.policies?.petsAllowed),
          smokingAllowed: Boolean(hotel.policies?.smokingAllowed),
        });
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to load property');
      } finally {
        setLoading(false);
      }
    };

    fetchHotel();
  }, [id, isEdit]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Client-side validation
    if (!form.name.trim()) {
      return toast.error('Property name is required');
    }
    if (!form.description.trim()) {
      return toast.error('Description is required');
    }
    if (!form.city.trim()) {
      return toast.error('City is required');
    }
    if (!form.state.trim()) {
      return toast.error('State is required');
    }
    if (!form.country.trim()) {
      return toast.error('Country is required');
    }

    setSaving(true);

    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));

      const fileList = Array.from(images);
      if (fileList.length > 10) {
        toast.info('Maximum 10 images allowed. The first 10 images will be uploaded.');
      }
      fileList.slice(0, 10).forEach((file) => body.append('images', file));

      const request = isEdit
        ? api.put(`/hotels/${id}`, body)
        : api.post('/hotels', body);

      await request;
      toast.success(isEdit ? 'Property updated' : 'Property published successfully');
      navigate('/grand/hotels');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save property');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--grand-text-muted)' }}>Loading property...</div>;
  }

  return (
    <div className="owner-form-shell">
      <div className="owner-form-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="grand-h1" style={{ marginBottom: '6px' }}>{isEdit ? 'Edit Property' : 'Add New Property'}</h1>
          <p className="grand-subtext">Complete the details guests and admins need to review the listing.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="owner-form-grid">
        <section className="owner-panel">
          <h2 className="grand-h2" style={{ marginBottom: '16px' }}>Basic Info</h2>
          <Input label="Property Name" name="name" value={form.name} onChange={handleChange} required />
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="grand-label" style={{ marginBottom: '6px', display: 'block' }}>Description</label>
            <textarea className="form-textarea" name="description" value={form.description} onChange={handleChange} rows={6} required />
          </div>
          <div className="grid grid-2 gap-4">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" name="category" value={form.category} onChange={handleChange}>
                <option value="hotel">Hotel</option>
                <option value="resort">Resort</option>
                <option value="villa">Villa</option>
                <option value="apartment">Apartment</option>
                <option value="hostel">Hostel</option>
                <option value="guesthouse">Guesthouse</option>
                <option value="boutique">Boutique</option>
                <option value="heritage">Heritage</option>
                <option value="campsite">Campsite</option>
                <option value="treehouse">Treehouse</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Star Rating</label>
              <select className="form-select" name="starRating" value={form.starRating} onChange={handleChange}>
                <option value="1">1 Star</option>
                <option value="2">2 Stars</option>
                <option value="3">3 Stars</option>
                <option value="4">4 Stars</option>
                <option value="5">5 Stars</option>
              </select>
            </div>
          </div>
          <Input label="Amenities" name="amenities" value={form.amenities} onChange={handleChange} placeholder="WiFi, Pool, Spa" />
          <div className="grid grid-2 gap-4">
            <Input label="Min Price (₹/night)" name="minPrice" type="number" value={form.minPrice} onChange={handleChange} placeholder="e.g. 2000" />
            <Input label="Max Price (₹/night)" name="maxPrice" type="number" value={form.maxPrice} onChange={handleChange} placeholder="e.g. 15000" />
          </div>
        </section>

        <section className="owner-panel">
          <h2>Location</h2>
          <Input label="Street" name="street" value={form.street} onChange={handleChange} />
          <div className="grid grid-2 gap-4">
            <Input label="City" name="city" value={form.city} onChange={handleChange} required />
            <Input label="State" name="state" value={form.state} onChange={handleChange} required />
            <Input label="Country" name="country" value={form.country} onChange={handleChange} required />
            <Input label="Pincode" name="zipCode" value={form.zipCode} onChange={handleChange} />
          </div>

          <h2 className="mt-4">Policies</h2>
          <div className="grid grid-2 gap-4">
            <Input label="Check-in" name="checkIn" value={form.checkIn} onChange={handleChange} />
            <Input label="Check-out" name="checkOut" value={form.checkOut} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Cancellation</label>
            <select className="form-select" name="cancellation" value={form.cancellation} onChange={handleChange}>
              <option value="flexible">Flexible</option>
              <option value="moderate">Moderate</option>
              <option value="strict">Strict</option>
            </select>
          </div>
          <label className="owner-check"><input type="checkbox" name="petsAllowed" checked={form.petsAllowed} onChange={handleChange} /> Pets allowed</label>
          <label className="owner-check"><input type="checkbox" name="smokingAllowed" checked={form.smokingAllowed} onChange={handleChange} /> Smoking allowed</label>
        </section>

        <section className="owner-panel owner-form-wide">
          <h2>Images</h2>
          <input className="form-input" type="file" multiple accept="image/*" onChange={(event) => setImages(event.target.files)} />
          <p className="text-sm text-secondary mt-2">Upload up to 10 clear property photos. Images are optional — a placeholder will be used if none are uploaded. Existing images are kept when editing.</p>
          <div className="flex gap-2 mt-4">
            <Button type="submit" loading={saving}>{isEdit ? 'Save Property' : 'Submit Property'}</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/grand/hotels')}>Cancel</Button>
          </div>
        </section>
      </form>
    </div>
  );
};

export default OwnerHotelForm;
