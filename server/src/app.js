import express from "express";
import employeeRoutes from "./routes/employee.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "HR Management API is running",
  });
});

app.use("/api/employees", employeeRoutes);

// Error handler
app.use(errorHandler);

export default app;