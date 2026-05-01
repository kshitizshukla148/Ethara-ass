const express = require("express");
const { createTask, getTasks, updateTask } = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");
const { validateCreateTask, validateUpdateTask } = require("../validators/taskValidator");

const router = express.Router();

router.get("/", protect, getTasks);
router.post("/", protect, validateCreateTask, createTask);
router.put("/:id", protect, validateUpdateTask, updateTask);

module.exports = router;
