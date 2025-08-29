const express = require('express');
const router = express.Router();
const { User } = require('../sequelize');

router.get('/sign-in', (req, res) => {
  res.render('users/sign-in');
});

router.post('/sign-in', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user || !(await user.verifyPassword(password))) {
    req.flash('error', 'Invalid email or password');
    return res.redirect('/sign-in');
  }
  req.session.userId = user.id;
  req.flash('success', 'Signed in');
  res.redirect('/');
});

router.post('/sign-out', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;


