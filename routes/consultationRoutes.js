const express = require('express');
const router = express.Router();
const { isLoggedIn, isAdmin } = require('../middleware/auth');
const consultationController = require('../controllers/consultationController');

// Pet owners
router.get('/consultations', isLoggedIn, consultationController.listMine);
router.get('/consultations/new', isLoggedIn, consultationController.newForm);
router.post('/consultations', isLoggedIn, consultationController.create);

// Admin (acts as the vet)
router.get('/admin/consultations', isAdmin, consultationController.adminList);
router.post('/admin/consultations/:id/reply', isAdmin, consultationController.adminReply);

module.exports = router;
