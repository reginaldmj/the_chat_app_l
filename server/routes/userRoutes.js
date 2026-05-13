import express from 'express';
import db from '../db.js';
import { requireAuth } from '../auth.js';

const router = express.Router();

router.get('/:id', (req, res) => {
  const user = db.findUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(db.publicUser(user));
});

// Member lists and account edits require a valid access token.
router.use(requireAuth);

router.get('/', (req, res) => {
  const currentUser = db.findUserById(req.user.id);
  if (!currentUser) return res.status(404).json({ error: 'Current user not found' });

  // Exclude the current user because this list is used for finding other people.
  const all = db.getAllUsers()
    .filter((user) => user.id !== currentUser.id)
    .sort((a, b) => (
      (a.displayName || a.username || '').localeCompare(b.displayName || b.username || '')
    ));

  res.json(all);
});

router.patch('/me', (req, res) => {
  try {
    const { displayName, role, username, email, avatarUrl } = req.body;
    const updatedUser = db.updateUser(req.user.id, { displayName, role, username, email, avatarUrl });
    if (!updatedUser) return res.status(404).json({ error: 'Not found' });
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/me', (req, res) => {
  const deleted = db.deleteUser(req.user.id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'User deleted' });
});

export default router;
