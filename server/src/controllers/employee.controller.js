import Employee from "../models/employee.model.js";

const allowedSortFields = [
  "_id",
  "employeeId",
  "firstName",
  "lastName",
  "department",
  "salary",
  "joiningDate",
  "createdAt",
];

export const getEmployees = async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);
  const { department, status, search, sortBy = "_id", sortOrder = "asc" } = req.query;

  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: "Invalid pagination parameters",
    });
  }

  const skip = (page - 1) * limit;
  if (!Number.isSafeInteger(skip)) {
    return res.status(400).json({
      success: false,
      message: "Pagination offset is too large",
    });
  }

  const filter = { isDeleted: false };

  if (department !== undefined) {
    if (typeof department !== "string" || !department.trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid department",
      });
    }

    filter.department = department.trim();
  }

  if (status !== undefined) {
    const allowedStatuses = Employee.schema.path("status").enumValues;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    filter.status = status;
  }

  if (search !== undefined) {
    if (typeof search !== "string" || !search.trim() || search.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid search parameter",
      });
    }

    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const searchPattern = {
      $regex: escapedSearch,
      $options: "i",
    };

    filter.$or = [
      { firstName: searchPattern },
      { lastName: searchPattern },
      { email: searchPattern },
      { employeeId: searchPattern },
    ];
  }

  if (!allowedSortFields.includes(sortBy)) {
    return res.status(400).json({
      success: false,
      message: "Invalid sort field",
    });
  }

  if (!["asc", "desc"].includes(sortOrder)) {
    return res.status(400).json({
      success: false,
      message: "Invalid sort order",
    });
  }
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const sort = {
    [sortBy]: sortDirection,
    _id: sortDirection,
  };
  const [employees, totalEmployees] = await Promise.all([
    Employee.find(filter).sort(sort).skip(skip).limit(limit),
    Employee.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalEmployees / limit);
  return res.status(200).json({
    success: true,
    message: "Employees fetched successfully",
    data: employees,
    pagination: {
      currentPage: page,
      totalPages,
      totalEmployees,
      limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  });
};

export const getEmployeeById = async (req, res) => {
  const { id } = req.params;

  const employee = await Employee.findOne({
    _id: id,
    isDeleted: false,
  });

  if (!employee) {
    return res.status(404).json({
      success: false,
      message: "Employee not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Employee fetched successfully",
    data: employee,
  });
};

export const createEmployee = async (req, res) => {
  const employee = await Employee.create(req.body);

  return res.status(201).json({
    success: true,
    message: "Employee created successfully",
    data: employee,
  });
};

const allowedFields = ["firstName", "lastName", "department", "designation", "salary", "status"];

export const updateEmployee = async (req, res) => {
  const { id } = req.params;

  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({
      success: false,
      message: "Invalid request body",
    });
  }

  const requestedFields = Object.keys(req.body);

  // Reject empty requests
  if (requestedFields.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No fields provided for update",
    });
  }

  // Reject unsupported fields
  const invalidFields = requestedFields.filter((field) => !allowedFields.includes(field));

  if (invalidFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Invalid fields: ${invalidFields.join(", ")}`,
    });
  }

  const updatedEmployee = await Employee.findOneAndUpdate(
    {
      _id: id,
      isDeleted: false,
    },
    { $set: req.body },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  if (!updatedEmployee) {
    return res.status(404).json({
      success: false,
      message: "Employee not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Employee updated successfully",
    data: updatedEmployee,
  });
};

export const deleteEmployee = async (req, res) => {
  const { id } = req.params;

  const deletedEmployee = await Employee.findOneAndUpdate(
    {
      _id: id,
      isDeleted: false,
    },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  if (!deletedEmployee) {
    return res.status(404).json({
      success: false,
      message: "Employee not found or already deleted",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Employee deleted successfully",
  });
};

export const restoreEmployee = async (req, res) => {
  const { id } = req.params;

  const restoredEmployee = await Employee.findOneAndUpdate(
    {
      _id: id,
      isDeleted: true,
    },
    {
      $set: {
        isDeleted: false,
        deletedAt: null,
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  if (!restoredEmployee) {
    return res.status(404).json({
      success: false,
      message: "Deleted employee not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Employee restored successfully",
    data: restoredEmployee,
  });
};
