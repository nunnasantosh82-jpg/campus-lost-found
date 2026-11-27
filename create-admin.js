require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const email = (process.env.ADMIN_EMAIL || 'admin@campus.edu').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
    let user = await User.findOne({ email }).select('+password');
    if (user) {
      user.role = 'admin';
      user.password = await bcrypt.hash(password, 12);
      user.name = process.env.ADMIN_NAME || 'Campus Administrator';
      await user.save();
      console.log(`Admin account updated: ${email}`);
    } else {
      await User.create({ name: process.env.ADMIN_NAME || 'Campus Administrator', email, password: await bcrypt.hash(password, 12), role: 'admin' });
      console.log(`Admin account created: ${email}`);
    }
  } catch (err) { console.error(err.message); process.exitCode = 1; }
  finally { await mongoose.disconnect(); }
})();