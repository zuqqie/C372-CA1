const petModel = require('../models/petModel');
const consultationModel = require('../models/consultationModel');

const CONCERN_TYPES = [
  'Eating or drinking',
  'Behaviour',
  'Injury or pain',
  'Skin or fur',
  'Toilet habits',
  'Other'
];
const URGENCY_LEVELS = ['low', 'medium', 'high'];

// Positive whole number only (rejects '', 'abc', '0', '-1', '1.5')
function isPositiveInteger(value) {
  return typeof value === 'string' && /^[1-9]\d*$/.test(value.trim());
}

// GET /consultations - my consultations
function listMine(req, res) {
  const ownerId = req.session.user.id;

  consultationModel.getConsultationsByOwner(ownerId, (err, consultations) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error loading consultations.');
    }
    res.render('consultations', {
      consultations,
      session: req.session,
      messages: req.flash('success'),
      errors: req.flash('error')
    });
  });
}

// GET /consultations/new
function newForm(req, res) {
  const ownerId = req.session.user.id;

  petModel.getPetsByOwner(ownerId, (err, pets) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error loading pets.');
    }
    res.render('newConsultation', {
      pets,
      concernTypes: CONCERN_TYPES,
      selectedPetId: String(req.query.petId || ''),
      session: req.session,
      errors: req.flash('error')
    });
  });
}

// POST /consultations
function create(req, res) {
  const ownerId = req.session.user.id;
  const petId = req.body.petId;
  const concernType = req.body.concernType;
  const urgency = req.body.urgency;
  const symptoms = typeof req.body.symptoms === 'string' ? req.body.symptoms.trim() : '';

  // Check the input on the server. The browser form can be bypassed.
  if (!isPositiveInteger(String(petId || ''))) {
    req.flash('error', 'Please choose a pet.');
    return res.redirect('/consultations/new');
  }
  if (!CONCERN_TYPES.includes(concernType)) {
    req.flash('error', 'Please choose what your concern is about.');
    return res.redirect(`/consultations/new?petId=${petId}`);
  }
  if (!URGENCY_LEVELS.includes(urgency)) {
    req.flash('error', 'Please choose how urgent it is.');
    return res.redirect(`/consultations/new?petId=${petId}`);
  }
  if (symptoms.length < 10 || symptoms.length > 1000) {
    req.flash('error', 'Please describe the problem in 10 to 1000 characters.');
    return res.redirect(`/consultations/new?petId=${petId}`);
  }

  consultationModel.createConsultation(ownerId, petId, concernType, symptoms, urgency, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error saving consultation.');
    }
    if (result.affectedRows === 0) {
      return res.status(403).send('Access denied: that pet is not yours.');
    }
    req.flash('success', 'Your consultation request was sent. A vet will reply here.');
    res.redirect('/consultations');
  });
}

// GET /admin/consultations (admin acts as the vet)
function adminList(req, res) {
  consultationModel.getAllConsultations((err, consultations) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error loading consultations.');
    }
    res.render('adminConsultations', {
      consultations,
      session: req.session,
      messages: req.flash('success'),
      errors: req.flash('error')
    });
  });
}

// POST /admin/consultations/:id/reply
function adminReply(req, res) {
  const consultationId = req.params.id;
  const reply = typeof req.body.reply === 'string' ? req.body.reply.trim() : '';

  if (!isPositiveInteger(String(consultationId))) {
    return res.status(400).send('Invalid consultation.');
  }
  if (reply.length < 5 || reply.length > 1000) {
    req.flash('error', 'Please write a reply of 5 to 1000 characters.');
    return res.redirect('/admin/consultations');
  }

  consultationModel.replyToConsultation(req.session.user.id, consultationId, reply, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error saving reply.');
    }
    if (result.affectedRows === 0) {
      req.flash('error', 'That consultation was not found or already has a reply.');
    } else {
      req.flash('success', 'Reply sent.');
    }
    res.redirect('/admin/consultations');
  });
}

module.exports = { listMine, newForm, create, adminList, adminReply };
