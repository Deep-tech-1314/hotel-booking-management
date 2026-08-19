import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../utils/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { formatPrice } from '../../utils/constants';
import toast from 'react-hot-toast';

const initialRoom = {
  title: '',
  roomType: 'standard',
  description: '',
  pricePerNight: '',
  maxGuests: 2,
  totalRooms: 1,
  bedType: 'queen',
  amenities: 'WiFi, AC, Room Service',
};

const ManageHotelRooms = () => {
  const { id } = useParams();
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(initialRoom);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const { data } = await api.get(`/hotels/${id}`);
      setHotel(data.hotel);
      setRooms(data.rooms || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));

      const fileList = Array.from(images);
      if (fileList.length > 10) {
        toast.info('Maximum 10 images allowed. The first 10 images will be uploaded.');
      }
      fileList.slice(0, 10).forEach((file) => body.append('images', file));

      const { data } = await api.post(`/hotels/${id}/rooms`, body);

      setRooms((prev) => [...prev, data.room]);
      setForm(initialRoom);
      setImages([]);
      toast.success('Room added');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to add room');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (roomId) => {
    if (!window.confirm('Delete this room type? Existing booking history will remain.')) return;

    try {
      await api.delete(`/hotels/${id}/rooms/${roomId}`);
      setRooms((prev) => prev.filter((room) => room._id !== roomId));
      toast.success('Room deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete room');
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--grand-text-muted)' }}>Loading rooms...</div>;
  }

  return (
    <div className="owner-form-shell">
      <div className="owner-form-header">
        <div>
          <h1>Room Inventory</h1>
          <p>{hotel?.name || 'Property'} - manage room types, pricing, and available inventory.</p>
        </div>
        <Link to="/grand/hotels"><Button variant="secondary">Back to Properties</Button></Link>
      </div>

      <div className="owner-room-grid">
        <section className="owner-panel">
          <h2>Add Room Type</h2>
          <form onSubmit={handleSubmit}>
            <Input label="Room Title" name="title" value={form.title} onChange={handleChange} required />
            <div className="grid grid-2 gap-4">
              <div className="form-group">
                <label className="form-label">Room Type</label>
                <select className="form-select" name="roomType" value={form.roomType} onChange={handleChange}>
                  <option value="standard">Standard</option>
                  <option value="deluxe">Deluxe</option>
                  <option value="suite">Suite</option>
                  <option value="premium">Premium</option>
                  <option value="dormitory">Dormitory</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Bed Type</label>
                <select className="form-select" name="bedType" value={form.bedType} onChange={handleChange}>
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="queen">Queen</option>
                  <option value="king">King</option>
                  <option value="twin">Twin</option>
                </select>
              </div>
              <Input label="Price per Night" name="pricePerNight" type="number" min="0" value={form.pricePerNight} onChange={handleChange} required />
              <Input label="Max Guests" name="maxGuests" type="number" min="1" value={form.maxGuests} onChange={handleChange} required />
              <Input label="Total Rooms" name="totalRooms" type="number" min="1" value={form.totalRooms} onChange={handleChange} required />
              <Input label="Amenities" name="amenities" value={form.amenities} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" name="description" value={form.description} onChange={handleChange} rows={4} />
            </div>
            <input className="form-input mb-4" type="file" multiple accept="image/*" onChange={(event) => setImages(event.target.files)} />
            <Button type="submit" loading={saving}>Add Room</Button>
          </form>
        </section>

        <section className="owner-panel">
          <h2>Current Rooms</h2>
          {rooms.length === 0 ? (
            <div className="empty-panel">
              No room types yet. Add at least one room type to accept bookings.
            </div>
          ) : (
            <div className="owner-room-list">
              {rooms.map((room) => (
                <article key={room._id} className="owner-room-card">
                  <img
                    src={room.images?.[0]?.url || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&q=80&w=400'}
                    alt={room.title}
                  />
                  <div>
                    <div className="flex justify-between gap-2">
                      <h3>{room.title}</h3>
                      <span className="badge badge-primary">{room.roomType}</span>
                    </div>
                    <p>{room.maxGuests} guests - {room.totalRooms} rooms - {room.bedType} bed</p>
                    <strong>{formatPrice(room.pricePerNight)} / night</strong>
                    <div className="mt-4">
                      <Button variant="danger" size="sm" onClick={() => handleDelete(room._id)}>Delete</Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ManageHotelRooms;
