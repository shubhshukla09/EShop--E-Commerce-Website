import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="container" style={{ paddingTop: '50px' }}>
      <div className="card">
        <div className="card-body" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <h2>User Profile</h2>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            Welcome, {user?.name}!
          </p>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            This page would allow you to edit your profile information, change password, 
            and manage account settings.
          </p>
          <Link to="/orders" className="btn btn-primary">
            View My Orders
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;
