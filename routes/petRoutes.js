const express = require('express');
const router = express.Router();
const upload = require('../config/upload');
const { isLoggedIn } = require('../middleware/auth');
const petController = require('../controllers/petController');

router.get('/pets/new', isLoggedIn, petController.newPetForm);
router.post('/pets', isLoggedIn, upload.single('pet_image'), petController.createPet);
router.get('/pets/edit/:id', isLoggedIn, petController.editPetForm);
router.post('/pets/edit/:id', isLoggedIn, upload.single('pet_image'), petController.updatePet);
router.post('/pets/delete/:id', isLoggedIn, petController.deletePet);

module.exports = router;
