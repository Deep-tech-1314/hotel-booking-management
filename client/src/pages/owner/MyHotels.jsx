import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { FiBox, FiEdit, FiTrash2, FiPlus, FiEye } from 'react-icons/fi';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

const MyHotels = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyHotels = async () => {
    try {
      const { data } = await api.get('/hotels/owner/my-hotels');
      setHotels(data.hotels);
    } catch (error) {
      toast.error('Failed to load your properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyHotels();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this property? This cannot be undone.')) {
      try {
        await api.delete(`/hotels/${id}`);
        setHotels(hotels.filter(h => h._id !== id));
        toast.success('Property deleted successfully');
      } catch (error) {
        toast.error('Failed to delete property');
      }
    }
  };

  if (loading) {
    return <div className="page-loader"><div className="loader"></div></div>;
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="grand-h1">My Properties</h1>
        <Link to="/grand/hotels/new">
          <Button icon={<FiPlus />}>Add New Property</Button>
        </Link>
      </div>

      {hotels.length === 0 ? (
        <div className="card p-10 text-center">
          <h3 className="text-xl mb-2">No properties found</h3>
          <p className="text-secondary mb-4">You haven't listed any properties yet.</p>
          <Link to="/grand/hotels/new">
            <Button>List Your First Property</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {hotels.map((hotel) => (
            <div key={hotel._id} className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img 
                  src={hotel.images?.[0]?.url || 'https://images.unsplash.com/photo-1542314831-c6a4d1400820?auto=format&fit=crop&q=80&w=400'} 
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542314831-c6a4d1400820?auto=format&fit=crop&q=80&w=400' }}
                  alt={hotel.name}
                  style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-lg)' }}
                />
                <div>
                  <h3 className="text-xl font-bold mb-1">{hotel.name}</h3>
                  <p className="text-secondary text-sm mb-2">
                    {hotel.address.city}, {hotel.address.country}
                  </p>
                  <div className="flex gap-2">
                    <span className={`badge badge-${hotel.isApproved ? 'success' : 'warning'}`}>
                      {hotel.isApproved ? 'Approved' : 'Pending Approval'}
                    </span>
                    <span className="badge badge-primary">{hotel.category}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Link to={`/hotel/${hotel._id}`}>
                  <Button variant="ghost" size="sm" icon={<FiEye />} title="View Listing" />
                </Link>
                <Link to={`/grand/hotels/${hotel._id}/rooms`}>
                  <Button variant="ghost" size="sm" icon={<FiBox />} title="Manage Rooms" />
                </Link>
                <Link to={`/grand/hotels/${hotel._id}/edit`}>
                  <Button variant="secondary" size="sm" icon={<FiEdit />} title="Edit" />
                </Link>
                <Button 
                  variant="danger" 
                  size="sm" 
                  icon={<FiTrash2 />} 
                  onClick={() => handleDelete(hotel._id)}
                  title="Delete"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyHotels;
