const Stripe = require('stripe');

let stripe;
try {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2023-10-16',
  });
} catch (e) {
  console.warn('Stripe initialization failed:', e.message);
  // Create a dummy stripe object that throws clear errors when used
  stripe = new Proxy({}, {
    get: () => { throw new Error('Stripe is not configured'); }
  });
}

module.exports = stripe;
