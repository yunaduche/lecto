const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userService = require('../services/userService');
require('dotenv').config();


const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Non autorisé' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide' });
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
          return res.status(403).json({ 
              message: 'Accès non autorisé pour ce rôle' 
          });
      }
      next();
  };
};

// Route de connexion
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await userService.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '9h' }
    );
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000 // 1 heure
    });
    let redirectUrl;
    switch (user.role) {
      case 'admin':
        redirectUrl = '/admin/dashboard';
        break;
      case 'bibliothecaire_jeunesse':
        redirectUrl = '/bibliothecaire/adulte/dashboard';
        break;
      case 'bibliothecaire_adulte':
        redirectUrl = '/bibliothecaire/adulte/dashboard';
        break;
      case 'chef_bibliothecaire':
        redirectUrl = '/bibliothecaire/chef/dashboard';
        break;
      default:
        redirectUrl = '/';
    }
   
    const userResponse = {
      id: user.id,
      username: user.username,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      
    };
    res.json({ 
      message: 'Connexion réussie', 
      user: userResponse,
      token,
      redirectUrl 
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
});


router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Déconnexion réussie' });
});

module.exports = { router, authMiddleware, checkRole };