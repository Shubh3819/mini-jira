const Project = require("../models/Project");
const User = require("../models/User");
const Ticket = require("../models/Ticket");

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
      (memberId) => memberId.toString() === userId.toString(),
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

const removeProjectMember = async (req, res) => {
  try {
    const { userId } = req.params;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Only the project creator can remove members
    const isCreator =
      project.createdBy.toString() === req.user._id.toString();

    if (!isCreator) {
      return res.status(403).json({
        message: "Only the project creator can remove members",
      });
    }

    // Creator cannot remove themselves
    if (userId === project.createdBy.toString()) {
      return res.status(400).json({
        message: "Project creator cannot be removed",
      });
    }

    const isMember = project.members.some(
      (memberId) => memberId.toString() === userId,
    );

    if (!isMember) {
      return res.status(404).json({
        message: "User is not a project member",
      });
    }

    project.members = project.members.filter(
      (memberId) => memberId.toString() !== userId,
    );

    // Remove the user from any tickets they were assigned to
    await Ticket.updateMany(
      {
        project: project._id,
        assignedTo: userId,
      },
      {
        $set: {
          assignedTo: null,
        },
      },
    );

    await project.save();

    res.status(200).json({
      message: "Member removed successfully",
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
    const { name, key, description, members = [] } = req.body;

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

    const normalizedKey = key.toUpperCase();

    const existingProject = await Project.findOne({
      key: normalizedKey,
    });

    if (existingProject) {
      return res.status(409).json({
        message: "Project key already exists",
      });
    }

    // Validate members
    if (!Array.isArray(members)) {
      return res.status(400).json({
        message: "Members must be an array",
      });
    }

    const validUsers = await User.find({
      _id: { $in: members },
    }).select("_id");

    if (validUsers.length !== members.length) {
      return res.status(400).json({
        message: "One or more selected members do not exist",
      });
    }

    // Always include the project creator
    const memberIds = [
      req.user._id.toString(),
      ...members.map((id) => id.toString()),
    ];

    // Remove duplicate member IDs
    const uniqueMemberIds = [...new Set(memberIds)];

    const project = await Project.create({
      name,
      key: normalizedKey,
      description,
      createdBy: req.user._id,
      members: uniqueMemberIds,
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
      (memberId) => memberId.toString() === req.user._id.toString(),
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
    const project = await Project.findById(req.params.id).populate(
      "members",
      "name email role",
    );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isMember = project.members.some(
      (member) => member._id.toString() === req.user._id.toString(),
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

const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("name email role")
      .sort({ name: 1 });

    res.status(200).json({
      users,
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
  removeProjectMember,
  getUsers,
};