const paymentModel = require('../models/paymentModel');
const MockProvider = require('../services/mockPaymentProvider');

// Provider result -> what we store (same idea as the Lesson 6 mapping, lowercase for the database)
const OUTCOMES = {
  APPROVED: { payment: 'approved', booking: 'confirmed' },
  DECLINED: { payment: 'declined', booking: 'payment_failed' }
};

function isPositiveInteger(value) {
  return typeof value === 'string' && /^[1-9]\d*$/.test(value.trim());
}

// GET /checkout/:bookingId  - review before paying
function showCheckout(req, res) {
  if (!isPositiveInteger(req.params.bookingId)) {
    req.flash('error', 'Booking not found.');
    return res.redirect('/bookings');
  }

  paymentModel.getOwnedBookingPayment(req.session.user.id, Number(req.params.bookingId), (err, booking) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Unable to load payment details.');
    }
    if (!booking) {
      req.flash('error', 'Booking not found.');
      return res.redirect('/bookings');
    }
    if (booking.payment_status === 'cancelled') {
      req.flash('error', 'This booking was cancelled.');
      return res.redirect('/bookings');
    }
    if (booking.payment_status === 'approved') {
      req.flash('success', 'This booking is already paid.');
      return res.redirect(`/receipt/${booking.booking_id}`);
    }

    res.render('checkout', {
      booking,
      messages: req.flash('success'),
      errors: req.flash('error'),
      session: req.session
    });
  });
}

// POST /checkout/:bookingId  - the simulated payment
async function payBooking(req, res) {
  const ownerId = req.session.user.id;
  const bookingId = req.params.bookingId;
  const testStatus = String(req.body.testStatus || '').toUpperCase();

  if (!isPositiveInteger(bookingId) || !OUTCOMES[testStatus]) {
    req.flash('error', 'Choose a valid payment outcome.');
    return res.redirect('/bookings');
  }

  paymentModel.getOwnedBookingPayment(ownerId, Number(bookingId), async (err, booking) => {
    if (err) {
      console.error(err);
      req.flash('error', 'Unable to process the payment. Please try again.');
      return res.redirect('/bookings');
    }
    if (!booking) {
      req.flash('error', 'Booking not found.');
      return res.redirect('/bookings');
    }
    if (booking.payment_status === 'approved') {
      req.flash('error', 'This booking is already paid.');
      return res.redirect(`/receipt/${booking.booking_id}`);
    }

    // Amount comes from the saved payment record, never from the browser
    let providerResult;
    try {
      providerResult = await MockProvider.createPayment({
        amount: booking.amount,
        currency: 'sgd',
        merchantReference: 'BOOKING-' + booking.booking_id,
        description: booking.service_name,
        testStatus
      });
    } catch (providerErr) {
      console.error(providerErr);
      req.flash('error', 'The payment provider could not be reached.');
      return res.redirect('/bookings');
    }

    const outcome = OUTCOMES[providerResult.status];
    paymentModel.savePaymentResult(
      ownerId, booking.booking_id, outcome.payment, outcome.booking, providerResult.providerPaymentId,
      (saveErr, saved) => {
        if (saveErr) {
          console.error(saveErr);
          req.flash('error', 'Unable to save the payment result. Please try again.');
          return res.redirect('/bookings');
        }
        if (!saved) {
          req.flash('error', 'This payment cannot be changed.');
          return res.redirect('/bookings');
        }

        if (outcome.payment === 'approved') {
          req.flash('success', 'Payment approved. Your booking is confirmed.');
        } else {
          req.flash('error', 'Payment declined. Your booking is not confirmed. You can try again.');
        }
        res.redirect(`/receipt/${booking.booking_id}`);
      }
    );
  });
}

// GET /receipt/:bookingId  - confirmation (reads the saved result, so a refresh is safe)
function showReceipt(req, res) {
  if (!isPositiveInteger(req.params.bookingId)) {
    req.flash('error', 'Booking not found.');
    return res.redirect('/bookings');
  }

  paymentModel.getOwnedBookingPayment(req.session.user.id, Number(req.params.bookingId), (err, booking) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Unable to load the receipt.');
    }
    if (!booking) {
      req.flash('error', 'Booking not found.');
      return res.redirect('/bookings');
    }

    res.render('receipt', {
      booking,
      messages: req.flash('success'),
      errors: req.flash('error'),
      session: req.session
    });
  });
}

module.exports = { showCheckout, payBooking, showReceipt };
