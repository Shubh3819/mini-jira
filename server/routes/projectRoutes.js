const express = require("express");

const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  getUsers,
} = require("../controllers/projectController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createProject);

router.get("/", protect, getProjects);

// IMPORTANT: /users must come before /:id
router.get("/users", protect, getUsers);

router.get("/:id", protect, getProjectById);

router.put("/:id", protect, updateProject);

router.delete("/:id", protect, deleteProject);

router.get("/:id/members", protect, getProjectMembers);

router.post("/:id/members", protect, addProjectMember);

router.delete(
  "/:id/members/:userId",
  protect,
  removeProjectMember
);

module.exports = router;