const path = require('path');
const { Sequelize, DataTypes, Op } = require('sequelize');
const bcrypt = require('bcrypt');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'db.sqlite'),
  logging: false
});

// Models
const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false }
});

User.hashPassword = async function(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

User.prototype.verifyPassword = function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

const Project = sequelize.define('Project', {
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT }
});

const Membership = sequelize.define('Membership', {
  role: { type: DataTypes.STRING, defaultValue: 'member' } // 'member' | 'admin'
});

const Attachment = sequelize.define('Attachment', {
  originalName: { type: DataTypes.STRING, allowNull: false },
  fileName: { type: DataTypes.STRING, allowNull: false },
  mimeType: { type: DataTypes.STRING, allowNull: false },
  sizeBytes: { type: DataTypes.INTEGER, allowNull: false }
});

const Thread = sequelize.define('Thread', {
  title: { type: DataTypes.STRING, allowNull: false }
});

const Message = sequelize.define('Message', {
  body: { type: DataTypes.TEXT, allowNull: false }
});

// Associations
User.belongsToMany(Project, { through: Membership });
Project.belongsToMany(User, { through: Membership });

Project.hasMany(Attachment, { onDelete: 'CASCADE' });
Attachment.belongsTo(Project);
Attachment.belongsTo(User, { as: 'uploader' });

Project.hasMany(Thread, { onDelete: 'CASCADE' });
Thread.belongsTo(Project);
Thread.belongsTo(User, { as: 'creator' });

Thread.hasMany(Message, { onDelete: 'CASCADE' });
Message.belongsTo(Thread);
Message.belongsTo(User, { as: 'author' });

module.exports = {
  sequelize,
  Sequelize,
  Op,
  User,
  Project,
  Membership,
  Attachment,
  Thread,
  Message
};


