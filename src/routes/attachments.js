const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { Attachment, Project, Membership } = require('../sequelize');
const { ensureProjectMember } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});

const upload = multer({ storage });

// Attachment#create
router.post('/:projectId', ensureProjectMember, upload.single('file'), async (req, res) => {
  const { projectId } = req.params;
  if (!req.file) {
    req.flash('error', 'No file uploaded');
    return res.redirect(`/projects/${projectId}`);
  }
  await Attachment.create({
    ProjectId: projectId,
    uploaderId: req.session.userId,
    originalName: req.file.originalname,
    fileName: req.file.filename,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size
  });
  req.flash('success', 'Attachment added');
  res.redirect(`/projects/${projectId}`);
});

// Attachment#destroy
router.delete('/:projectId/:id', ensureProjectMember, async (req, res) => {
  const { projectId, id } = req.params;
  const attachment = await Attachment.findByPk(id);
  if (attachment) {
    const filePath = path.join(uploadDir, attachment.fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await attachment.destroy();
  }
  req.flash('success', 'Attachment removed');
  res.redirect(`/projects/${projectId}`);
});

module.exports = router;


