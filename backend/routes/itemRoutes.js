const router = require("express").Router();
const { body, param } = require("express-validator");
const Item = require("../models/Item");
const Claim = require("../models/Claim");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");

router.get("/", async (req, res, next) => {
  try {
    const { q, category, location, type, sort = "newest" } = req.query;
    const filter = { status: { $ne: "closed" } };
    if (category) filter.category = category;
    if (location) filter.location = { $regex: location, $options: "i" };
    if (type) filter.type = type;
    if (q) filter.$or = ["title","description","location"].map(k => ({ [k]: { $regex: q, $options: "i" } }));
    const items = await Item.find(filter).populate("owner", "name").sort({ date: sort === "oldest" ? 1 : -1 }).limit(100);
    res.json({ count: items.length, items });
  } catch (e) { next(e); }
});
router.get("/:id", [param("id").isMongoId()], validate, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate("owner", "name");
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json({ item });
  } catch (e) { next(e); }
});
router.post("/", protect, [
  body("title").trim().notEmpty(), body("category").notEmpty(), body("description").trim().notEmpty(),
  body("location").trim().notEmpty(), body("date").isISO8601(), body("type").isIn(["lost","found"])
], validate, async (req, res, next) => {
  try {
    const item = await Item.create({ ...req.body, owner: req.user._id });
    res.status(201).json({ message: "Report created", item });
  } catch (e) { next(e); }
});
router.patch("/:id", protect, [param("id").isMongoId()], validate, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (String(item.owner) !== String(req.user._id) && req.user.role !== "admin")
      return res.status(403).json({ message: "You cannot edit this listing" });
    const allowed = ["title","category","description","location","date","type","imageUrl","status"];
    allowed.forEach(k => { if (req.body[k] !== undefined) item[k] = req.body[k]; });
    await item.save();
    res.json({ message: "Item updated", item });
  } catch (e) { next(e); }
});
router.delete("/:id", protect, [param("id").isMongoId()], validate, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (String(item.owner) !== String(req.user._id) && req.user.role !== "admin")
      return res.status(403).json({ message: "You cannot delete this listing" });
    await Claim.deleteMany({ item: item._id });
    await item.deleteOne();
    res.json({ message: "Item deleted" });
  } catch (e) { next(e); }
});
router.get("/manage/all", protect, adminOnly, async (_req, res, next) => {
  try { res.json({ items: await Item.find().populate("owner", "name email").sort({ createdAt: -1 }) }); }
  catch (e) { next(e); }
});
module.exports = router;
