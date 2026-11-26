const router = require("express").Router();
const { body, param } = require("express-validator");
const Claim = require("../models/Claim");
const Item = require("../models/Item");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");

router.post("/", protect, [body("itemId").isMongoId(), body("message").trim().notEmpty()], validate, async (req, res, next) => {
  try {
    const item = await Item.findById(req.body.itemId);
    if (!item || item.status !== "active") return res.status(404).json({ message: "Active item not found" });
    if (String(item.owner) === String(req.user._id)) return res.status(400).json({ message: "You cannot claim your own listing" });
    const claim = await Claim.create({ item: item._id, claimant: req.user._id, message: req.body.message, proof: req.body.proof || "" });
    res.status(201).json({ message: "Claim submitted", claim });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: "You have already claimed this item" });
    next(e);
  }
});
router.get("/mine", protect, async (req, res, next) => {
  try { res.json({ claims: await Claim.find({ claimant: req.user._id }).populate("item").sort({ createdAt: -1 }) }); }
  catch (e) { next(e); }
});
router.get("/received", protect, async (req, res, next) => {
  try {
    const ids = await Item.find({ owner: req.user._id }).distinct("_id");
    res.json({ claims: await Claim.find({ item: { $in: ids } }).populate("item").populate("claimant", "name email").sort({ createdAt: -1 }) });
  } catch (e) { next(e); }
});
router.patch("/:id/status", protect, [param("id").isMongoId(), body("status").isIn(["approved","rejected"])], validate, async (req, res, next) => {
  try {
    const claim = await Claim.findById(req.params.id).populate("item");
    if (!claim) return res.status(404).json({ message: "Claim not found" });
    if (String(claim.item.owner) !== String(req.user._id) && req.user.role !== "admin")
      return res.status(403).json({ message: "Only the listing owner or admin can review this claim" });
    claim.status = req.body.status;
    await claim.save();
    if (claim.status === "approved") {
      claim.item.status = "claimed";
      await claim.item.save();
    }
    res.json({ message: `Claim ${claim.status}`, claim });
  } catch (e) { next(e); }
});
router.get("/manage/all", protect, adminOnly, async (_req, res, next) => {
  try { res.json({ claims: await Claim.find().populate("item").populate("claimant", "name email").sort({ createdAt: -1 }) }); }
  catch (e) { next(e); }
});
module.exports = router;
