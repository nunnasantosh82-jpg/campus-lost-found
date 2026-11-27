const express = require('express');
const Claim = require('../models/Claim');
const Item = require('../models/Item');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.post('/', async (req, res, next) => {
  try {
    const { itemId, message } = req.body;
    if (!itemId || !message || String(message).trim().length < 10) return res.status(400).json({ message: 'Item and a claim message of at least 10 characters are required.' });
    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    if (String(item.owner) === String(req.user._id)) return res.status(400).json({ message: 'You cannot claim your own report.' });
    if (item.status !== 'open') return res.status(400).json({ message: 'This item is no longer open for claims.' });
    const claim = await Claim.create({ item: itemId, claimant: req.user._id, message });
    res.status(201).json({ message: 'Claim submitted for review.', claim });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'You have already submitted a claim for this item.' });
    next(error);
  }
});

router.get('/mine', async (req, res, next) => {
  try {
    const claims = await Claim.find({ claimant: req.user._id }).populate('item').sort({ createdAt: -1 });
    res.json({ claims });
  } catch (error) { next(error); }
});

router.get('/received', async (req, res, next) => {
  try {
    const ownedItems = await Item.find({ owner: req.user._id }).select('_id');
    const claims = await Claim.find({ item: { $in: ownedItems.map(x => x._id) } }).populate('item').populate('claimant', 'name email').sort({ createdAt: -1 });
    res.json({ claims });
  } catch (error) { next(error); }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Status must be approved or rejected.' });
    const claim = await Claim.findById(req.params.id).populate('item');
    if (!claim) return res.status(404).json({ message: 'Claim not found.' });
    if (String(claim.item.owner) !== String(req.user._id) && req.user.role !== 'admin') return res.status(403).json({ message: 'Only the item owner or admin can review this claim.' });
    if (claim.status !== 'pending') return res.status(400).json({ message: 'This claim has already been reviewed.' });
    claim.status = status;
    claim.reviewedBy = req.user._id;
    claim.reviewedAt = new Date();
    await claim.save();
    if (status === 'approved') {
      claim.item.status = 'claimed';
      await claim.item.save();
      await Claim.updateMany({ item: claim.item._id, _id: { $ne: claim._id }, status: 'pending' }, { status: 'rejected', reviewedBy: req.user._id, reviewedAt: new Date() });
    }
    res.json({ message: `Claim ${status}.`, claim });
  } catch (error) { next(error); }
});

router.get('/all', adminOnly, async (req, res, next) => {
  try {
    const claims = await Claim.find().populate('item').populate('claimant', 'name email').sort({ createdAt: -1 });
    res.json({ claims });
  } catch (error) { next(error); }
});

module.exports = router;