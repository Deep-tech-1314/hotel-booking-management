import React from 'react';

const NotFound = () => {
  return (
    <div className="container flex flex-col items-center justify-center text-center py-20" style={{ minHeight: '60vh' }}>
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-3xl font-bold mb-6">Page Not Found</h2>
      <p className="text-secondary mb-8 max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <a href="/" className="btn btn-primary">
        Return to Home
      </a>
    </div>
  );
};

export default NotFound;
