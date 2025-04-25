const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/registerDetails");
const db = mongoose.connection;
db.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Define schema and model
const transactionSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  timestamp: { type: Date, default: Date.now },
});

const Transactions = mongoose.model("Transactions", transactionSchema);

module.exports={Transactions,db, mongoose}
