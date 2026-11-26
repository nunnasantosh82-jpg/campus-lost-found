const mongoose = require("mongoose");
const claimSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  claimant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  proof: { type: String, default: "" },
  status: { type: String, enum: ["pending","approved","rejected"], default: "pending" }
}, { timestamps: true });
claimSchema.index({ item: 1, claimant: 1 }, { unique: true });
module.exports = mongoose.model("Claim", claimSchema);
