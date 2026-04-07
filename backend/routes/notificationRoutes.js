import express from "express";
import Notification from "../models/Notification.js";
import auth from "../middleware/auth.js"; // I need to make sure auth works for multiple roles

const router = express.Router();

// Middleware to guess the model name based on role
const getModelName = (role) => {
    if (role === 'user') return 'User';
    if (role === 'employer') return 'Employer';
    return 'Admin';
};

router.get("/", auth(["super_admin", "employer", "user"]), async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
      onModel: getModelName(req.user.role)
    }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/read/:id", auth(["super_admin", "employer", "user"]), async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ msg: "Notification marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/read-all", auth(["super_admin", "employer", "user"]), async (req, res) => {
  try {
    await Notification.updateMany({
      recipient: req.user._id,
      onModel: getModelName(req.user.role)
    }, { isRead: true });
    res.json({ msg: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
