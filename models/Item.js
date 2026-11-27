const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  category: { type: String, required: true, enum: ['Electronics', 'Books', 'ID Cards', 'Clothing', 'Accessories', 'Keys', 'Other'] },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  location: { type: String, required: true, trim: true, maxlength: 120 },
  date: { type: Date, required: true },
  type: { type: String, enum: ['lost', 'found'], required: true },
  image: { type: String, default: '' },
  status: { type: String, enum: ['open', 'claimed', 'returned', 'closed'], default: 'open' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

itemSchema.index({ title: 'text', description: 'text', location: 'text' });
module.exports = mongoose.model('Item', itemSchema);