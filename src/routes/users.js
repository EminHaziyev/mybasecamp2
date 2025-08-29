const express = require('express');
const router = express.Router();
const { User, Project, Attachment, Thread, Message } = require('../sequelize');
const { ensureAuth, ensureAdmin } = require('../middleware/auth');

// User #new
router.get('/new', (req, res) => {
  res.render('users/new');
});

// User #create
router.post('/', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name, email, passwordHash });
    req.session.userId = user.id;
    req.flash('success', 'Welcome! Account created');
    res.redirect(`/users/${user.id}`);
  } catch (e) {
    req.flash('error', 'Email already used or invalid');
    res.redirect('/users/new');
  }
});

// User #show
router.get('/:id', ensureAuth, async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    include: [{
      model: Project,
      through: { attributes: ['role'] },
      include: [
        { model: User, attributes: ['id', 'name', 'email'] },
        { model: Attachment },
        { model: Thread, include: [{ model: Message, include: [{ model: User, as: 'author' }] }] }
      ]
    }]
  });
  if (!user) return res.redirect('/');
  res.render('users/show', { user });
});

// User #destroy
router.delete('/:id', ensureAuth, async (req, res) => {
  if (parseInt(req.params.id) !== req.session.userId && !res.locals.currentUser.isAdmin) {
    req.flash('error', 'Not permitted');
    return res.redirect('back');
  }
  await User.destroy({ where: { id: req.params.id } });
  if (parseInt(req.params.id) === req.session.userId) {
    req.session.destroy(() => res.redirect('/'));
  } else {
    req.flash('success', 'User deleted');
    res.redirect('/');
  }
});

// Role Permission: setAdmin
router.post('/:id/set-admin', ensureAdmin, async (req, res) => {
  await User.update({ isAdmin: true }, { where: { id: req.params.id } });
  req.flash('success', 'Granted admin');
  res.redirect(`/users/${req.params.id}`);
});

// Role Permission: removeAdmin
router.post('/:id/remove-admin', ensureAdmin, async (req, res) => {
  await User.update({ isAdmin: false }, { where: { id: req.params.id } });
  req.flash('success', 'Admin removed');
  res.redirect(`/users/${req.params.id}`);
});

module.exports = router;


