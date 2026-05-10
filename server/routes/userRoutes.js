import express from 'express';
import db from '../db.js';
import { requireAuth } from '../auth.js';

const router = express.Router();

// Every users route requires a valid access token.
router.use(requireAuth);

router.get('/', (req, res) => {
  // Exclude the current user because this list is used for finding other people.
  const all = db.getAllUsers().filter((user) => user.id !== req.user.id);
  res.json(all);
});

router.get('/:id', (req, res) => {
  const user = db.findUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(db.safeUser(user));
});

export default router;