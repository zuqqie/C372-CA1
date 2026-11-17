const petModel = require('../models/petModel');
const serviceModel = require('../models/serviceModel');
const serviceBookingModel = require('../models/serviceBookingModel');

// Today as a LOCAL calendar date (YYYY-MM-DD), not a UTC date
function getToday() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${mm}-${dd}`;
}

// Positive whole number only (rejects '', 'abc', '0', '-1', '1.5')
function isPositiveInteger(value) {
  return typeof value === 'string' && /^[1-9]\d*$/.test(value.trim());
}

// Format AND real calendar date (rejects 2026-02-30)
function isRealDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

// GET /services
function listServices(req, res) {
  const ownerId = req.session.user.id;

  petModel.getPetsByOwner(ownerId, (petErr, pets) => {
    if (petErr) {
      console.error(petErr);
      return res.status(500).send('Unable to load pets.');
    }

    serviceModel.getActiveServices((serviceErr, services) => {
      if (serviceErr) {
        console.error(serviceErr);
        return res.status(500).send('Unable to load services.');
      }

      // Preselect only a pet that really belongs to this customer
      const requestedPetId = String(req.query.petId || '');
      const ownedPet = pets.find((pet) => String(pet.id) === requestedPetId);

      res.render('services', {
        pets,
        services,
        selectedPetId: ownedPet ? String(ownedPet.id) : '',
        today: getToday(),
        messages: req.flash('success'),
        errors: req.flash('error'),
        session: req.session
      });
    });
  });
}

// POST /services/book
function createBooking(req, res) {
  const { petId, serviceId, bookingDate } = req.body;

  const dateValid = isRealDate(bookingDate) && bookingDate >= getToday();
  if (!isPositiveInteger(petId) || !isPositiveInteger(serviceId) || !dateValid) {
    req.flash('error', 'Choose a pet, service, and valid booking date.');
    return res.redirect('/services');
  }

  // Owner ID always comes from the session, never from the form
  const ownerId = req.session.user.id;

  serviceBookingModel.createPendingBooking(
    ownerId, Number(petId), Number(serviceId), bookingDate,
    (err, result) => {
      if (err) {
        console.error(err);
        req.flash('error', 'Unable to create the booking. Please try again.');
        return res.redirect(`/services?petId=${encodeURIComponent(petId)}`);
      }

      if (!result) {
        req.flash('error', 'That pet or service is unavailable for booking.');
        return res.redirect('/services');
      }

      req.flash('success', 'Booking created. Payment is pending; no payment has been processed.');
      res.redirect('/bookings');
    }
  );
}

// GET /bookings
function listBookings(req, res) {
  serviceBookingModel.getBookingsByOwner(req.session.user.id, (err, bookings) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Unable to load booking history.');
    }

    res.render('bookings', {
      bookings,
      messages: req.flash('success'),
      errors: req.flash('error'),
      session: req.session
    });
  });
}

module.exports = { listServices, createBooking, listBookings };
