const Ticket = require("../models/Ticket");
const Project = require("../models/Project");

const createTicket = async (req, res) => {
  try {
    const {
      title,
      description,
      project,
      type,
      priority,
      assignedTo,
      labels,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Ticket title is required",
      });
    }

    if (!project) {
      return res.status(400).json({
        message: "Project is required",
      });
    }

    const existingProject = await Project.findById(project);

    if (!existingProject) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Check whether the current user belongs to the project
    const isMember = existingProject.members.some(
      (memberId) =>
        memberId.toString() === req.user._id.toString(),
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You do not have access to this project",
      });
    }

    /*
     * Find the latest ticket using the PROJECT KEY.
     *
     * We do this instead of only checking project ID because
     * ticketKey is globally unique.
     *
     * Example:
     * ECOM-1
     * ECOM-2
     * ECOM-3
     */
    const lastTicket = await Ticket.findOne({
      ticketKey: {
        $regex: `^${existingProject.key}-`,
        $options: "i",
      },
    }).sort({ ticketNumber: -1 });

    const ticketNumber = lastTicket
      ? lastTicket.ticketNumber + 1
      : 1;

    const ticketKey = `${existingProject.key}-${ticketNumber}`;

    console.log("========== CREATE TICKET ==========");
    console.log("Project ID:", existingProject._id.toString());
    console.log("Project Key:", existingProject.key);
    console.log(
      "Last Ticket:",
      lastTicket
        ? `${lastTicket.ticketKey} (${lastTicket.ticketNumber})`
        : "None",
    );
    console.log("New Ticket Number:", ticketNumber);
    console.log("New Ticket Key:", ticketKey);
    console.log("===================================");

    const ticket = await Ticket.create({
      ticketNumber,
      ticketKey,
      title,
      description,
      project: existingProject._id,
      type,
      priority,
      assignedTo: assignedTo || null,
      labels,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Ticket created successfully",
      ticket,
    });
  } catch (error) {
    console.error("Create ticket error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "A ticket with this key already exists. Please try again.",
        error: error.message,
      });
    }

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const getTickets = async (req, res) => {
  try {
    const {
      project,
      status,
      priority,
      search,
    } = req.query;

    const projects = await Project.find({
      members: req.user._id,
    }).select("_id");

    const projectIds = projects.map(
      (project) => project._id,
    );

    const filter = {
      project: { $in: projectIds },
    };

    // Filter by project
    if (project) {
      filter.project = project;
    }

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Filter by priority
    if (priority) {
      filter.priority = priority;
    }

    // Search by title, description, or ticket key
    if (search) {
      filter.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
        {
          ticketKey: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const tickets = await Ticket.find(filter)
      .populate("project", "name key")
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      tickets,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("project", "name key")
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email");

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    const isMember = await Project.exists({
      _id: ticket.project._id,
      members: req.user._id,
    });

    if (!isMember) {
      return res.status(403).json({
        message: "You do not have access to this ticket",
      });
    }

    res.status(200).json({
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const updateTicket = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      status,
      priority,
      assignedTo,
      labels,
    } = req.body;

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    const project = await Project.findById(
      ticket.project,
    );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isMember = project.members.some(
      (memberId) =>
        memberId.toString() === req.user._id.toString(),
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You do not have access to this ticket",
      });
    }

    if (title !== undefined) {
      ticket.title = title;
    }

    if (description !== undefined) {
      ticket.description = description;
    }

    if (type !== undefined) {
      ticket.type = type;
    }

    if (status !== undefined) {
      ticket.status = status;
    }

    if (priority !== undefined) {
      ticket.priority = priority;
    }

    if (assignedTo !== undefined) {
      ticket.assignedTo = assignedTo;
    }

    if (labels !== undefined) {
      ticket.labels = labels;
    }

    await ticket.save();

    res.status(200).json({
      message: "Ticket updated successfully",
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const assignTicket = async (req, res) => {
  try {
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({
        message: "Assigned user ID is required",
      });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    const project = await Project.findById(
      ticket.project,
    );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Check whether current user belongs to the project
    const isMember = project.members.some(
      (memberId) =>
        memberId.toString() === req.user._id.toString(),
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You do not have access to this ticket",
      });
    }

    // Check whether assigned user belongs to the project
    const isAssignedUserMember = project.members.some(
      (memberId) =>
        memberId.toString() === assignedTo.toString(),
    );

    if (!isAssignedUserMember) {
      return res.status(400).json({
        message: "User is not a member of this project",
      });
    }

    ticket.assignedTo = assignedTo;

    await ticket.save();

    await ticket.populate(
      "assignedTo",
      "name email role",
    );

    res.status(200).json({
      message: "Ticket assigned successfully",
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    const project = await Project.findById(
      ticket.project,
    );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isMember = project.members.some(
      (memberId) =>
        memberId.toString() === req.user._id.toString(),
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You do not have access to this ticket",
      });
    }

    await ticket.deleteOne();

    res.status(200).json({
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "TODO",
      "IN_PROGRESS",
      "IN_REVIEW",
      "DONE",
    ];

    if (!status) {
      return res.status(400).json({
        message: "Status is required",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    const project = await Project.findById(
      ticket.project,
    );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isMember = project.members.some(
      (memberId) =>
        memberId.toString() === req.user._id.toString(),
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You do not have access to this ticket",
      });
    }

    ticket.status = status;

    await ticket.save();

    res.status(200).json({
      message: "Ticket status updated successfully",
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  assignTicket,
  updateTicketStatus,
};