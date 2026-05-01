const express = require("express");
const { createProject, getProjects } = require("../controllers/projectController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { validateCreateProject } = require("../validators/projectValidator");

const router = express.Router();

router.get("/", protect, getProjects);
router.post("/", protect, authorizeRoles("admin"), validateCreateProject, createProject);

module.exports = router;
