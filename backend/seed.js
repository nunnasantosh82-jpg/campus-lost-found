require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Item = require("./models/Item");

const samples = [
 ["Black wallet","Accessories","Black leather wallet with student card inside","Library","2026-11-20","lost"],
 ["Blue water bottle","Other","Blue insulated bottle with a sticker","Cafeteria","2026-11-21","found"],
 ["Scientific calculator","Electronics","Casio calculator, grey colour","Block A - Room 204","2026-11-18","lost"],
 ["Physics notebook","Books","A notebook labelled Physics-II","Central Library","2026-11-22","found"],
 ["College ID card","ID Cards","ID card belonging to a first-year student","Main Gate","2026-11-23","found"],
 ["Wireless earbuds","Electronics","White earbuds in a charging case","Auditorium","2026-11-19","lost"],
 ["Grey hoodie","Clothing","Medium grey hoodie left on a chair","Sports Complex","2026-11-17","found"],
 ["Key bunch","Keys","Three keys with a small red keychain","Parking Area","2026-11-24","lost"],
 ["USB drive","Electronics","32GB silver USB flash drive","Computer Lab 2","2026-11-25","found"],
 ["Black umbrella","Other","Foldable black umbrella","Hostel Reception","2026-11-16","lost"]
];
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    let admin = await User.findOne({ email: "admin@campus.edu" });
    if (!admin) admin = await User.create({ name: "Campus Admin", email: "admin@campus.edu", password: await bcrypt.hash("Admin@123", 12), role: "admin" });
    let demo = await User.findOne({ email: "student@campus.edu" });
    if (!demo) demo = await User.create({ name: "Demo Student", email: "student@campus.edu", password: await bcrypt.hash("Student@123", 12) });
    if (await Item.countDocuments() === 0) {
      await Item.insertMany(samples.map((s, i) => ({ title:s[0], category:s[1], description:s[2], location:s[3], date:new Date(s[4]), type:s[5], owner: i % 2 ? demo._id : admin._id })));
    }
    console.log("Seed complete. Admin: admin@campus.edu / Admin@123");
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally { await mongoose.disconnect(); }
})();
