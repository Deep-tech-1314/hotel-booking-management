const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/bookmystay', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('Connected to DB');
  const existingAdmin = await User.findOne({ email: 'admin@bookmystay.com' });
  if (existingAdmin) {
    console.log('Admin already exists. Password is: admin123');
  } else {
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@bookmystay.com',
      password: 'admin123',
      phone: '1234567890',
      role: 'admin',
      isVerified: true
    });
    console.log('Admin created! Email: admin@bookmystay.com, Password: admin123');
  }
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
