const { Membership, Project } = require('../sequelize');

function ensureAuth(req, res, next) {
  if (!req.session.userId) {
    req.flash('error', 'Please sign in first');
    return res.redirect('/sign-in');
  }
  next();
}

function ensureAdmin(req, res, next) {
  if (!req.session.userId || !res.locals.currentUser?.isAdmin) {
    req.flash('error', 'Admin only');
    return res.redirect('back');
  }
  next();
}

async function ensureProjectMember(req, res, next) {
  const userId = req.session.userId;
  const params = req.params || {};
  const body = req.body || {};
  const projectId = params.projectId || body.projectId || params.id;
  if (!userId) {
    req.flash('error', 'Please sign in first');
    return res.redirect('/sign-in');
  }
  if (!projectId) {
    req.flash('error', 'Project not specified');
    return res.redirect('back');
  }
  const membership = await Membership.findOne({ where: { UserId: userId, ProjectId: projectId } });
  if (!membership) {
    req.flash('error', 'You are not a member of this project');
    return res.redirect('back');
  }
  res.locals.membership = membership;
  next();
}

async function ensureProjectAdmin(req, res, next) {
  const userId = req.session.userId;
  const params = req.params || {};
  const body = req.body || {};
  const projectId = params.projectId || body.projectId || params.id;
  if (!projectId) {
    req.flash('error', 'Project not specified');
    return res.redirect('back');
  }
  const membership = await Membership.findOne({ where: { UserId: userId, ProjectId: projectId } });
  if (!membership || membership.role !== 'admin') {
    req.flash('error', 'Project admin only');
    return res.redirect('back');
  }
  next();
}

module.exports = { ensureAuth, ensureAdmin, ensureProjectMember, ensureProjectAdmin };


