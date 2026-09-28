const Project = require("../models/Project");
const User = require("../models/User");

const addProjectMember = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Only the project creator can add members
    const isCreator =
      project.createdBy.toString() === req.user._id.toString();

    if (!isCreator) {
      return res.status(403).json({
        message: "Only the project creator can add members",
      });
    }

    // Check whether user exists
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Check whether user is already a member
    const isAlreadyMember = project.members.some(
      (memberId) => memberId.toString() === userId.toString()
    );

    if (isAlreadyMember) {
      return res.status(409).json({
        message: "User is already a project member",
      });
    }

    project.members.push(userId);

    await project.save();

    res.status(200).json({
      message: "Member added successfully",
      member: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const createProject = async (req, res) => {
  try {
    const { name, key, description } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Project name is required",
      });
    }

    if (!key) {
      return res.status(400).json({
        message: "Project key is required",
      });
    }

    const existingProject = await Project.findOne({
      key: key.toUpperCase(),
    });

    if (existingProject) {
      return res.status(409).json({
        message: "Project key already exists",
      });
    }

    const project = await Project.create({
      name,
      key,
      description,
      createdBy: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      members: req.user._id,
    });

    res.status(200).json({
      projects,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isMember = project.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You do not have access to this project",
      });
    }

    res.status(200).json({
      project,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const updateProject = async (req, res) => {
  try {
    const { name, key, description } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isCreator =
      project.createdBy.toString() === req.user._id.toString();

    if (!isCreator) {
      return res.status(403).json({
        message: "Only the project creator can update this project",
      });
    }

    if (name !== undefined) {
      project.name = name;
    }

    if (description !== undefined) {
      project.description = description;
    }

    if (key !== undefined) {
      const normalizedKey = key.toUpperCase();

      if (normalizedKey !== project.key) {
        const existingProject = await Project.findOne({
          key: normalizedKey,
        });

        if (existingProject) {
          return res.status(409).json({
            message: "Project key already exists",
          });
        }

        project.key = normalizedKey;
      }
    }

    await project.save();

    res.status(200).json({
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isCreator =
      project.createdBy.toString() === req.user._id.toString();

    if (!isCreator) {
      return res.status(403).json({
        message: "Only the project creator can delete this project",
      });
    }

    await project.deleteOne();

    res.status(200).json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const getProjectMembers = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("members", "name email role");

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isMember = project.members.some(
      (member) => member._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You do not have access to this project",
      });
    }

    res.status(200).json({
      members: project.members,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
};