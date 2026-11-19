const petModel = require('../models/petModel');
const journalModel = require('../models/journalModel');

// View All Journals
function listJournals(req, res) {
  const userId = req.session.user.id;
  let selectedPetId = req.query.petId;

  // Get all pets of this user
  petModel.getPetsByOwner(userId, (err, pets) => {
    if (err) return res.send('Error loading pets');

    // If no pet selected yet, default to first pet (if available)
    if (!selectedPetId && pets.length > 0) {
      selectedPetId = pets[0].id;
    }

    if (!selectedPetId) {
      // No pets at all
      return res.render('journals', {
        journals: [],
        pets,
        selectedPetId: '',
        pet: null,
        session: req.session,
        messages: req.flash('success'),
        errors: req.flash('error')
      });
    }

    journalModel.getJournalsByPetAndOwner(userId, selectedPetId, (err2, journals) => {
      if (err2) return res.send('Error loading journals');

      // Pet info always comes from the pets list
      const petInfo = pets.find(p => p.id == selectedPetId);

      return res.render('journals', {
        journals,
        pets,
        selectedPetId,
        pet: petInfo,
        session: req.session,
        messages: req.flash('success'),
        errors: req.flash('error')
      });
    });
  });
}

// New Journal Form
function newJournalForm(req, res) {
  const userId = req.session.user.id;
  const selectedPetId = req.query.petId; // Get optional petId from query

  petModel.getPetsByOwner(userId, (err, pets) => {
    if (err) return res.send('Error loading pets');

    res.render('newJournal', { pets, session: req.session, selectedPetId });
  });
}

// Handle New Journal Submission
function createJournal(req, res) {
  const { pet_id, activity, notes, entry_date } = req.body;
  const userId = req.session.user.id;

  journalModel.createJournal(userId, pet_id, activity, notes, entry_date, (err, result) => {
    if (err) return res.send('Error saving journal');
    if (result.affectedRows === 0) return res.status(403).send('Access denied: that pet is not yours.');

    // Redirect to journals page and keep selected pet
    res.redirect(`/journals?petId=${pet_id}`);
  });
}

// Edit Journal Form
function editJournalForm(req, res) {
  const journalId = req.params.id;
  const userId = req.session.user.id;

  journalModel.getJournalById(journalId, userId, (err, journalResults) => {
    if (err) return res.send('Error loading journal');
    if (journalResults.length === 0) return res.status(403).send('Access denied: this journal entry is not yours.');

    petModel.getPetsByOwner(userId, (err2, pets) => {
      if (err2) return res.send('Error fetching pets');

      res.render('editJournal', { journal: journalResults[0], pets, session: req.session });
    });
  });
}

// Handle Edit Submission
function updateJournal(req, res) {
  const { entry_date, activity, notes, pet_id } = req.body;
  const journalId = req.params.id;
  const userId = req.session.user.id;

  journalModel.updateJournal(userId, journalId, entry_date, activity, notes, pet_id, (err, result) => {
    if (err) return res.send('Error updating journal');
    if (result.affectedRows === 0) return res.status(403).send('Access denied: this journal entry is not yours.');
    res.redirect(`/journals?petId=${pet_id}`); // 🔁 Redirect back to selected pet
  });
}

// Delete Journal
function deleteJournal(req, res) {
  const journalId = req.params.id;
  const userId = req.session.user.id;

  // Find the entry (only if it is yours) so we know which pet to go back to
  journalModel.getJournalById(journalId, userId, (err, result) => {
    if (err) return res.send('Error loading journal.');
    if (result.length === 0) return res.status(403).send('Access denied: this journal entry is not yours.');

    const petId = result[0].pet_id;

    journalModel.deleteJournal(userId, journalId, (err2) => {
      if (err2) return res.send('Error deleting journal.');
      res.redirect(`/journals?petId=${petId}`);
    });
  });
}

// Search Journals
function searchJournals(req, res) {
  const userId = req.session.user.id;
  const searchQuery = `%${req.query.q}%`;
  const selectedPetId = req.query.petId;

  petModel.getPetsByOwner(userId, (err, pets) => {
    if (err) return res.send('Error loading pets');

    journalModel.searchJournals(userId, searchQuery, selectedPetId, (err2, journals) => {
      if (err2) return res.send('Error searching journals');

      let pet = null;
      if (selectedPetId) {
        const found = pets.find(p => p.id.toString() === selectedPetId);
        if (found) pet = found;
      }

      res.render('journals', {
        journals,
        pets,
        selectedPetId,
        pet,
        searchTerm: String(req.query.q || ''),
        session: req.session,
        messages: req.flash('success'),
        errors: req.flash('error')
      });
    });
  });
}

module.exports = {
  listJournals,
  newJournalForm,
  createJournal,
  editJournalForm,
  updateJournal,
  deleteJournal,
  searchJournals
};
