import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { FiMapPin, FiStar, FiTrash2 } from 'react-icons/fi';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';
import HotelCard from '../../components/common/HotelCard';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      const { data } = await api.get('/wishlist');
      setWishlist(data.wishlist);
    } catch (error) {
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const removeFromWishlist = async (hotelId) => {
    try {
      await api.delete(`/wishlist/${hotelId}`);
      setWishlist(wishlist.filter(hotel => hotel._id !== hotelId));
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  if (loading) {
    return <div className="page-loader"><div className="loader"></div></div>;
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>

      {wishlist.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-6xl mb-4">💔</div>
          <h3 className="text-xl mb-2">Your wishlist is empty</h3>
          <p className="text-secondary mb-4">Save properties you like to view them later.</p>
          <Link to="/hotels">
            <Button>Explore Hotels</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-4 cine-list-enter" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {wishlist.map((hotel) => (
            <HotelCard
              key={hotel._id}
              hotel={hotel}
              isWished={true}
              onWishToggle={removeFromWishlist}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
