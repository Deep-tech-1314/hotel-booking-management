require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const seedData = require('./utils/seeder');

const runSeed = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected! Running seeder...');
    
    await seedData();
    
    console.log('Seeding complete. Exiting...');
    process.exit(0);
  } catch (error) {
    console.error('Error running seeder:', error);
    process.exit(1);
  }
};

runSeed();
