const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
  await mongoose.connect(MONGO_URL);
  console.log("connected to DB");
}

const initDB = async () => {
  try {
    await Listing.deleteMany({});
    await Listing.insertMany(initData.data.map((obj) => ({ ...obj, owner: "697470d8ac8ec06203d8e989" })));
    console.log("data was initialized");
  } catch (err) {
    console.log("Error initializing data:", err);
  }
};

async function run() {
  await main();
  await initDB();
}

run().catch((err) => {
  console.log("Error:", err);
});
