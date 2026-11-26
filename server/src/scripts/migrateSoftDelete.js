import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Employee from "../models/employee.model.js";

await connectDB();

try {
  const result = await Employee.updateMany(
    {
      isDeleted: { $exists: false },
    },
    {
      $set: {
        isDeleted: false,
        deletedAt: null,
      },
    }
  );

  console.log("Matched documents:", result.matchedCount);
  console.log("Updated documents:", result.modifiedCount);
} finally {
  await mongoose.disconnect();
}