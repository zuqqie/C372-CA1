const connection = require('../config/db');

function createPet(ownerId, name, species, breed, age, image, callback) {
  const sql = 'INSERT INTO pets (owner_id, name, species, breed, age, image) VALUES (?, ?, ?, ?, ?, ?)';
  connection.query(sql, [ownerId, name, species, breed, age, image], callback);
}

function getPetsByOwner(ownerId, callback) {
  const sql = 'SELECT * FROM pets WHERE owner_id = ?';
  connection.query(sql, [ownerId], callback);
}

// Returns the pet ONLY if it belongs to ownerId
function getPetByIdAndOwner(petId, ownerId, callback) {
  const sql = 'SELECT * FROM pets WHERE id = ? AND owner_id = ?';
  connection.query(sql, [petId, ownerId], callback);
}

// Updates ONLY if the pet belongs to ownerId. A null image keeps the existing photo.
function updatePet(ownerId, petId, name, species, breed, age, image, callback) {
  const sql = `
    UPDATE pets
    SET name = ?, species = ?, breed = ?, age = ?, image = COALESCE(?, image)
    WHERE id = ? AND owner_id = ?
  `;
  connection.query(sql, [name, species, breed, age, image, petId, ownerId], callback);
}

function countBookingsForPet(petId, callback) {
  const sql = 'SELECT COUNT(*) AS total FROM service_bookings WHERE pet_id = ?';
  connection.query(sql, [petId], callback);
}

// Deletes ONLY if the pet belongs to ownerId (its journal entries are removed by the database)
function deletePet(ownerId, petId, callback) {
  const sql = 'DELETE FROM pets WHERE id = ? AND owner_id = ?';
  connection.query(sql, [petId, ownerId], callback);
}

module.exports = {
  createPet,
  getPetsByOwner,
  getPetByIdAndOwner,
  updatePet,
  countBookingsForPet,
  deletePet
};
