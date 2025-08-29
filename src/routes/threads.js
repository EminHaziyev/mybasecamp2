const express = require('express');
const router = express.Router();
const { Thread } = require('../sequelize');
const { ensureProjectAdmin, ensureProjectMember } = require('../middleware/auth');

// Thread#new
router.get('/new/:projectId', ensureProjectAdmin, (req, res) => {
  res.render('threads/new', { projectId: req.params.projectId });
});

router.post('/', ensureProjectAdmin, async (req, res) => {
  const { projectId, title } = req.body;
  const thread = await Thread.create({ ProjectId: projectId, title, creatorId: req.session.userId });
  req.flash('success', 'Thread created');
  res.redirect(`/projects/${projectId}`);
});

// Thread#edit
router.get('/:id/edit/:projectId', ensureProjectAdmin, async (req, res) => {
  res.render('threads/edit', { id: req.params.id, projectId: req.params.projectId });
});

router.put('/:id', ensureProjectAdmin, async (req, res) => {
  const { title, projectId } = req.body;
  await Thread.update({ title }, { where: { id: req.params.id } });
  req.flash('success', 'Thread updated');
  res.redirect(`/projects/${projectId}`);
});

// Thread#destroy
router.delete('/:id/:projectId', ensureProjectAdmin, async (req, res) => {
  await Thread.destroy({ where: { id: req.params.id } });
  req.flash('success', 'Thread deleted');
  res.redirect(`/projects/${req.params.projectId}`);
});

module.exports = router;


