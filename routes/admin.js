const express = require('express');
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(protect, adminOnly);

router.get('/stats', async (_req, res, next) => {
  try {
    const [users, items, claims, openItems, lost, found, pendingClaims] = await Promise.all([
      User.countDocuments(), Item.countDocuments(), Claim.countDocuments(),
      Item.countDocuments({ status: 'open' }), Item.countDocuments({ type: 'lost' }),
      Item.countDocuments({ type: 'found' }), Claim.countDocuments({ status: 'pending' })
    ]);
    res.json({ stats: { users, items, claims, openItems, lost, found, pendingClaims } });
  } catch (error) { next(error); }
});

router.get('/items', async (_req, res, next) => {
  try { res.json({ items: await Item.find().populate('owner', 'name email').sort({ createdAt: -1 }) }); }
  catch (error) { next(error); }
});

router.patch('/items/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['open', 'claimed', 'returned', 'closed'].includes(status)) return res.status(400).json({ message: 'Invalid item status.' });
    const item = await Item.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    res.json({ message: 'Item status updated.', item });
  } catch (error) { next(error); }
});

router.delete('/items/:id', async (req, res, next) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    await Claim.deleteMany({ item: item._id });
    res.json({ message: 'Item deleted.' });
  } catch (error) { next(error); }
});

module.exports = router;