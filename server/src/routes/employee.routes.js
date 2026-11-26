import express from "express";
import { getEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee, restoreEmployee } from "../controllers/employee.controller.js";


const router = express.Router();

// Get employee
router.get("/", getEmployees);
router.get("/:id", getEmployeeById);

// Create employee
router.post("/", createEmployee);

// Update employee
router.patch("/:id", updateEmployee);

// Delete employee
router.delete("/:id", deleteEmployee);

// Restore employee
router.patch("/:id/restore", restoreEmployee);

export default router;