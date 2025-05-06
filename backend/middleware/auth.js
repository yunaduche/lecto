exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Accès refusé. Seuls les admins sont autorisés.' });
    }
  };
  