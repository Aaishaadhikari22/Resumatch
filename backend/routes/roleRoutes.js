import express from "express";
import Role from "../models/Role.js";

const router = express.Router();

/* ================= CREATE ROLE ================= */
router.post("/", async (req, res) => {
  try {
    const role = await Role.create(req.body);
    res.json(role);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

/* ================= GET ALL ROLES ================= */

router.get("/all", async (req, res) => {
  try {
    const roles = await Role.find();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ================= UPDATE ROLE ================= */
router.put("/:id", async (req, res) => {
  try {
    const role = await Role.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(role);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

/* ================= DELETE ROLE ================= */
router.delete("/:id", async (req, res) => {
  try {
    await Role.findByIdAndDelete(req.params.id);
    res.json({ msg: "Role deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

export default router;