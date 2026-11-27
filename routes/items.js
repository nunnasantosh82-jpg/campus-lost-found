const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const { protect } = require('../middleware/auth');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname).toLowerCase()}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype))
});

router.get('/', async (req, res, next) => {
  try {
    const { search, category, location, type, sort = 'newest', status = 'open' } = req.query;
    const filter = {};
    if (status !== 'all') filter.status = status;
    if (category) filter.category = category;
    if (location) filter.location = { $regex: String(location).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    if (type && ['lost', 'found'].includes(type)) filter.type = type;
    if (search) filter.$text = { $search: search };
    const sortBy = sort === 'oldest' ? { date: 1 } : sort === 'title' ? { title: 1 } : { createdAt: -1 };
    const items = await Item.find(filter).sort(sortBy).populate('owner', 'name').limit(100);
    res.json({ count: items.length, items });
  } catch (error) { next(error); }
});

router.get('/mine', protect, async (req, res, next) => {
  try {
    const items = await Item.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ items });
  } catch (error) { next(error); }
});

router.post('/', protect, upload.single('image'), async (req, res, next) => {
  try {
    const { title, category, description, location, date, type } = req.body;
    if (!title || !category || !description || !location || !date || !type) return res.status(400).json({ message: 'Please complete all required item fields.' });
    const item = await Item.create({
      title, category, description, location, date, type,
      image: req.file ? `/uploads/${req.file.filename}` : '',
      owner: req.user._id
    });
    res.status(201).json({ message: 'Item report submitted.', item });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate('owner', 'name');
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    res.json({ item });
  } catch (error) { next(error); }
});

router.patch('/:id', protect, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    if (String(item.owner) !== String(req.user._id) && req.user.role !== 'admin') return res.status(403).json({ message: 'You can only update your own reports.' });
    const allowed = ['title', 'category', 'description', 'location', 'date', 'status'];
    allowed.forEach(key => { if (req.body[key] !== undefined) item[key] = req.body[key]; });
    await item.save();
    res.json({ message: 'Item updated.', item });
  } catch (error) { next(error); }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    if (String(item.owner) !== String(req.user._id) && req.user.role !== 'admin') return res.status(403).json({ message: 'You can only delete your own reports.' });
    await Claim.deleteMany({ item: item._id });
    await item.deleteOne();
    res.json({ message: 'Item report deleted.' });
  } catch (error) { next(error); }
});

module.exports = router;