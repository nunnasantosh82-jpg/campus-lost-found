const router = require("express").Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Item = require("../models/Item");
const Claim = require("../models/Claim");
router.use(protect, adminOnly);
router.get("/stats", async (_req, res, next) => {
  try {
    const [users, items, claims, lost, found, pending] = await Promise.all([
      User.countDocuments(), Item.countDocuments(), Claim.countDocuments(),
      Item.countDocuments({ type: "lost" }), Item.countDocuments({ type: "found" }), Claim.countDocuments({ status: "pending" })
    ]);
    res.json({ users, items, claims, lost, found, pending });
  } catch (e) { next(e); }
});
router.patch("/items/:id/status", async (req, res, next) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json({ item });
  } catch (e) { next(e); }
});
module.exports = router;
