const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/auth');
const checkoutController = require('../controllers/checkoutController');

// Simulated payment for a booking (no real money). Separate from the Lesson 6 Postman endpoints.
router.get('/checkout/:bookingId', isLoggedIn, checkoutController.showCheckout);
router.post('/checkout/:bookingId', isLoggedIn, checkoutController.payBooking);
router.get('/receipt/:bookingId', isLoggedIn, checkoutController.showReceipt);

module.exports = router;
