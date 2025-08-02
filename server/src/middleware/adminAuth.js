const { User } = require('../models');

const adminAuth = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user || user.isAdmin === false) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = adminAuth;