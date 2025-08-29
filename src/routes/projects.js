const express = require('express');
const router = express.Router();
const { Project, Membership, User, Attachment, Thread, Message } = require('../sequelize');
const { ensureAuth, ensureProjectAdmin, ensureProjectMember } = require('../middleware/auth');

// Project #new
router.get('/new', ensureAuth, (req, res) => {
  res.render('projects/new');
});

// Project #create
router.post('/', ensureAuth, async (req, res) => {
  const { name, description } = req.body;
  const project = await Project.create({ name, description });
  await Membership.create({ UserId: req.session.userId, ProjectId: project.id, role: 'admin' });
  req.flash('success', 'Project created');
  res.redirect(`/projects/${project.id}`);
});

// Project #show
router.get('/:id', ensureProjectMember, async (req, res) => {
  const project = await Project.findByPk(req.params.id, {
    include: [
      User,
      Attachment,
      { model: Thread, include: [{ model: Message, include: [{ model: User, as: 'author' }] }] }
    ]
  });
  res.render('projects/show', { project });
});

// Project #edit
router.get('/:id/edit', ensureProjectAdmin, async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  res.render('projects/edit', { project });
});

router.put('/:id', ensureProjectAdmin, async (req, res) => {
  const { name, description } = req.body;
  await Project.update({ name, description }, { where: { id: req.params.id } });
  req.flash('success', 'Project updated');
  res.redirect(`/projects/${req.params.id}`);
});

// Project #destroy
router.delete('/:id', ensureProjectAdmin, async (req, res) => {
  await Project.destroy({ where: { id: req.params.id } });
  req.flash('success', 'Project deleted');
  res.redirect('/');
});

// Add member to project
router.post('/:id/add-member', ensureProjectAdmin, async (req, res) => {
  const { email, role = 'member' } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect(`/projects/${req.params.id}`);
    }
    
    const existingMembership = await Membership.findOne({
      where: { UserId: user.id, ProjectId: req.params.id }
    });
    
    if (existingMembership) {
      req.flash('error', 'User is already a member of this project');
      return res.redirect(`/projects/${req.params.id}`);
    }
    
    await Membership.create({
      UserId: user.id,
      ProjectId: req.params.id,
      role
    });
    
    req.flash('success', 'Member added to project');
    res.redirect(`/projects/${req.params.id}`);
  } catch (e) {
    req.flash('error', 'Failed to add member');
    res.redirect(`/projects/${req.params.id}`);
  }
});

// Remove member from project
router.delete('/:id/remove-member/:userId', ensureProjectAdmin, async (req, res) => {
  try {
    await Membership.destroy({
      where: { UserId: req.params.userId, ProjectId: req.params.id }
    });
    req.flash('success', 'Member removed from project');
  } catch (e) {
    req.flash('error', 'Failed to remove member');
  }
  res.redirect(`/projects/${req.params.id}`);
});

module.exports = router;


