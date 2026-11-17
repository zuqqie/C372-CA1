const connection = require('../config/db');

function getJournalsByOwner(ownerId, callback) {
  const sql = `
    SELECT journal.*, pets.id AS pet_id
    FROM journal
    JOIN pets ON journal.pet_id = pets.id
    WHERE pets.owner_id = ?
  `;
  connection.query(sql, [ownerId], callback);
}

function getJournalsByPetAndOwner(ownerId, petId, callback) {
  const sql = `
    SELECT journal.*, pets.name, pets.species, pets.breed, pets.age, pets.image 
    FROM journal 
    JOIN pets ON journal.pet_id = pets.id 
    WHERE pets.owner_id = ? AND pets.id = ?
  `;
  connection.query(sql, [ownerId, petId], callback);
}

// Returns the entry ONLY if it belongs to a pet owned by ownerId
function getJournalById(journalId, ownerId, callback) {
  const sql = `
    SELECT journal.*
    FROM journal
    JOIN pets ON journal.pet_id = pets.id
    WHERE journal.id = ? AND pets.owner_id = ?
  `;
  connection.query(sql, [journalId, ownerId], callback);
}

// Inserts ONLY if the pet belongs to ownerId (affectedRows = 0 otherwise)
function createJournal(ownerId, petId, activity, notes, entryDate, callback) {
  const sql = `
    INSERT INTO journal (pet_id, activity, notes, entry_date)
    SELECT id, ?, ?, ? FROM pets WHERE id = ? AND owner_id = ?
  `;
  connection.query(sql, [activity, notes, entryDate, petId, ownerId], callback);
}

// Updates ONLY if the entry's current pet AND the new pet both belong to ownerId
function updateJournal(ownerId, journalId, entryDate, activity, notes, petId, callback) {
  const sql = `
    UPDATE journal
    SET entry_date = ?, activity = ?, notes = ?, pet_id = ?
    WHERE id = ?
      AND pet_id IN (SELECT id FROM pets WHERE owner_id = ?)
      AND ? IN (SELECT id FROM pets WHERE owner_id = ?)
  `;
  connection.query(sql, [entryDate, activity, notes, petId, journalId, ownerId, petId, ownerId], callback);
}

// Deletes ONLY if the entry belongs to a pet owned by ownerId
function deleteJournal(ownerId, journalId, callback) {
  const sql = `
    DELETE FROM journal
    WHERE id = ? AND pet_id IN (SELECT id FROM pets WHERE owner_id = ?)
  `;
  connection.query(sql, [journalId, ownerId], callback);
}

function searchJournals(ownerId, searchQuery, selectedPetId, callback) {
  let sql = `
    SELECT journal.*, pets.name, pets.species, pets.breed, pets.age, pets.image 
    FROM journal 
    JOIN pets ON journal.pet_id = pets.id 
    WHERE pets.owner_id = ? AND (journal.activity LIKE ? OR journal.notes LIKE ?)`;

  const params = [ownerId, searchQuery, searchQuery];

  if (selectedPetId) {
    sql += ' AND pets.id = ?';
    params.push(selectedPetId);
  }

  connection.query(sql, params, callback);
}

module.exports = {
  getJournalsByOwner,
  getJournalsByPetAndOwner,
  getJournalById,
  createJournal,
  updateJournal,
  deleteJournal,
  searchJournals
};
