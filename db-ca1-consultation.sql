-- CA1 extension: pet consultations
-- Safe to run more than once (CREATE TABLE IF NOT EXISTS). It does NOT delete any data.
USE petcare;

CREATE TABLE IF NOT EXISTS consultations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pet_id INT UNSIGNED NOT NULL,
  concern_type VARCHAR(30) NOT NULL,
  symptoms TEXT NOT NULL,
  urgency ENUM('low','medium','high') NOT NULL DEFAULT 'low',
  status ENUM('open','answered') NOT NULL DEFAULT 'open',
  vet_reply TEXT NULL,
  replied_by INT UNSIGNED NULL,
  replied_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_consultations_pet FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
  CONSTRAINT fk_consultations_vet FOREIGN KEY (replied_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
