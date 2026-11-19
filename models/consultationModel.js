const db = require('../config/db');

// Saves a consultation ONLY if the pet belongs to ownerId (affectedRows = 0 otherwise)
function createConsultation(ownerId, petId, concernType, symptoms, urgency, callback) {
  const sql = `
    INSERT INTO consultations (pet_id, concern_type, symptoms, urgency)
    SELECT id, ?, ?, ? FROM pets WHERE id = ? AND owner_id = ?
  `;
  db.query(sql, [concernType, symptoms, urgency, petId, ownerId], callback);
}

// Only the consultations of pets that belong to ownerId, newest first
function getConsultationsByOwner(ownerId, callback) {
  const sql = `
    SELECT c.*, p.name AS pet_name, p.species
    FROM consultations c
    JOIN pets p ON p.id = c.pet_id
    WHERE p.owner_id = ?
    ORDER BY c.created_at DESC, c.id DESC
  `;
  db.query(sql, [ownerId], callback);
}

// For the admin (acting as the vet): open ones first, most urgent first
function getAllConsultations(callback) {
  const sql = `
    SELECT c.*, p.name AS pet_name, p.species, p.breed, p.age, u.name AS owner_name
    FROM consultations c
    JOIN pets p ON p.id = c.pet_id
    JOIN users u ON u.id = p.owner_id
    ORDER BY (c.status = 'open') DESC, FIELD(c.urgency, 'high', 'medium', 'low'), c.created_at ASC
  `;
  db.query(sql, callback);
}

// Only an open consultation can be answered
function replyToConsultation(adminId, consultationId, reply, callback) {
  const sql = `
    UPDATE consultations
    SET vet_reply = ?, status = 'answered', replied_by = ?, replied_at = NOW()
    WHERE id = ? AND status = 'open'
  `;
  db.query(sql, [reply, adminId, consultationId], callback);
}

module.exports = {
  createConsultation,
  getConsultationsByOwner,
  getAllConsultations,
  replyToConsultation
};
