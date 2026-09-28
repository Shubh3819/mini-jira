const express = require("express");

const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  assignTicket,
  updateTicketStatus,
} = require("../controllers/ticketController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createTicket);
router.get("/", protect, getTickets);
router.get("/:id", protect, getTicketById);
router.put("/:id", protect, updateTicket);
router.patch("/:id/assign", protect, assignTicket);
router.patch("/:id/status", protect, updateTicketStatus);
router.delete("/:id", protect, deleteTicket);

module.exports = router;