require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Item = require('./models/Item');

const samples = [
  ['Black Wallet', 'Accessories', 'Black leather wallet with student ID and a few cards inside.', 'Central Library, Reading Hall', 'lost', -1],
  ['Blue Water Bottle', 'Other', 'Blue insulated stainless-steel bottle with a small sticker.', 'Cafeteria', 'found', -2],
  ['Scientific Calculator', 'Electronics', 'Casio scientific calculator, model FX-991ES.', 'Block B, Room 204', 'lost', -3],
  ['Engineering Mathematics Book', 'Books', 'First-year engineering mathematics textbook with handwritten notes.', 'Main Auditorium', 'found', -4],
  ['University ID Card', 'ID Cards', 'Student identity card found near the entrance.', 'Academic Block Entrance', 'found', -5],
  ['Wireless Earbuds Case', 'Electronics', 'White earbuds charging case; earbuds may be inside.', 'Sports Complex', 'lost', -6],
  ['Grey Hoodie', 'Clothing', 'Medium-size grey hoodie left on a chair.', 'Library Ground Floor', 'found', -7],
  ['House Keys', 'Keys', 'Two silver keys on a red keychain.', 'Parking Area', 'found', -8],
  ['USB Flash Drive', 'Electronics', 'Black 32GB USB drive with a label on it.', 'Computer Lab 1', 'lost', -9],
  ['Wrist Watch', 'Accessories', 'Round dial watch with a brown strap.', 'Student Activity Centre', 'found', -10]
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const email = 'sample.student@campus.edu';
    let user = await User.findOne({ email });
    if (!user) user = await User.create({ name: 'Sample Student', email, password: await bcrypt.hash('Student123!', 12) });
    await Item.deleteMany({ owner: user._id, title: { $in: samples.map(s => s[0]) } });
    await Item.insertMany(samples.map(([title, category, description, location, type, days]) => ({
      title, category, description, location, type, date: new Date(Date.now() + days * 86400000), owner: user._id
    })));
    console.log('10 sample items inserted.');
    console.log('Sample student login: sample.student@campus.edu / Student123!');
  } catch (err) { console.error(err.message); process.exitCode = 1; }
  finally { await mongoose.disconnect(); }
})();