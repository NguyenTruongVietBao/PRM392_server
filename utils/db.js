const mongoose = require('mongoose');

const connectDb = async () => {
  try {
    await mongoose.connect(
      'mongodb+srv://baron:baonguyen1303@cluster0.5fbqg.mongodb.net/PRM392_Project'
    );
    console.log('Connected to MongoDB');
  } catch {
    console.error('Error connecting to MongoDB');
  }
};

module.exports = connectDb;
