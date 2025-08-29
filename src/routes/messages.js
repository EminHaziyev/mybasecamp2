const express = require('express');
const router = express.Router();
const { Message } = require('../sequelize');
const { ensureProjectMember } = require('../middleware/auth');

// Message#new (create)
router.post('/', ensureProjectMember, async (req, res) => {
  const { threadId, projectId, body } = req.body;
  await Message.create({ ThreadId: threadId, authorId: req.session.userId, body });
  req.flash('success', 'Message posted');
  res.redirect(`/projects/${projectId}`);
});

// Message#edit
router.put('/:id', ensureProjectMember, async (req, res) => {
  const { body, projectId } = req.body;
  await Message.update({ body }, { where: { id: req.params.id } });
  req.flash('success', 'Message updated');
  res.redirect(`/projects/${projectId}`);
});

// Message#destroy
router.delete('/:id/:projectId', ensureProjectMember, async (req, res) => {
  await Message.destroy({ where: { id: req.params.id } });
  req.flash('success', 'Message deleted');
  res.redirect(`/projects/${req.params.projectId}`);
});

module.exports = router;


