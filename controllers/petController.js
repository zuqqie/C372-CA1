const petModel = require('../models/petModel');

// Add Pet Form
function newPetForm(req, res) {
  res.render('newPet', { session: req.session });
}

// Handle Add Pet Submission
function createPet(req, res) {
  const { pet_name, species, breed, age } = req.body;
  let petImage;

  if (req.file) {
    petImage = req.file.filename; // use uploaded filename
  } else {
    petImage = null;
  }

  const ownerId = req.session.user.id;

  petModel.createPet(ownerId, pet_name, species, breed, age, petImage, (err) => {
    if (err) {
      console.error(err);
      return res.send('Failed to add pet.');
    }
    res.redirect('/journals');
  });
}

// Edit Pet Form (only for your own pet)
function editPetForm(req, res) {
  const userId = req.session.user.id;

  petModel.getPetByIdAndOwner(req.params.id, userId, (err, results) => {
    if (err) return res.send('Error loading pet.');
    if (results.length === 0) return res.status(403).send('Access denied: this pet is not yours.');

    res.render('editPet', { pet: results[0], session: req.session });
  });
}

// Handle Edit Pet Submission
function updatePet(req, res) {
  const userId = req.session.user.id;
  const petId = req.params.id;
  const { pet_name, species, breed, age } = req.body;
  const newImage = req.file ? req.file.filename : null; // null = keep the old photo

  petModel.updatePet(userId, petId, pet_name, species, breed, age, newImage, (err, result) => {
    if (err) {
      console.error(err);
      return res.send('Failed to update pet.');
    }
    if (result.affectedRows === 0) return res.status(403).send('Access denied: this pet is not yours.');

    req.flash('success', 'Pet updated.');
    res.redirect(`/journals?petId=${petId}`);
  });
}

// Delete Pet (POST only; blocked if the pet has booking history)
function deletePet(req, res) {
  const userId = req.session.user.id;
  const petId = req.params.id;

  petModel.getPetByIdAndOwner(petId, userId, (err, results) => {
    if (err) return res.send('Error loading pet.');
    if (results.length === 0) return res.status(403).send('Access denied: this pet is not yours.');

    petModel.countBookingsForPet(petId, (err2, rows) => {
      if (err2) return res.send('Error checking bookings.');

      if (rows[0].total > 0) {
        req.flash('error', 'This pet has booking history and cannot be deleted.');
        return res.redirect(`/journals?petId=${petId}`);
      }

      petModel.deletePet(userId, petId, (err3) => {
        if (err3) return res.send('Failed to delete pet.');
        req.flash('success', 'Pet deleted.');
        res.redirect('/journals');
      });
    });
  });
}

module.exports = { newPetForm, createPet, editPetForm, updatePet, deletePet };
