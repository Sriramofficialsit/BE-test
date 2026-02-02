const mongoose = require("mongoose");
require("dotenv").config();

const dbconnect = async() => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Database connected successfully");
  } catch (error) {
    return error.message;
  }
};
module.exports = dbconnect;
