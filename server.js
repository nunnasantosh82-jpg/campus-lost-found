require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'Campus Lost and Found Portal' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/claims', require('./routes/claims'));
app.use('/api/admin', require('./routes/admin'));

app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ message: 'API route not found.' });
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.name === 'ValidationError') return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(', ') });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid record ID.' });
  if (err.code === 11000) return res.status(409).json({ message: 'A record with this value already exists.' });
  if (err instanceof require('multer').MulterError) return res.status(400).json({ message: err.message });
  res.status(500).json({ message: 'Server error. Please try again.' });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => app.listen(PORT, () => console.log(`Campus portal running at http://localhost:${PORT}`)))
  .catch(err => { console.error('Database connection failed:', err.message); process.exit(1); });