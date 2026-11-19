const express = require('express');
const router = express.Router();
const { isLoggedIn, isAdmin, blockAdmin } = require('../middleware/auth');
const serviceController = require('../controllers/serviceController');

router.use(['/services', '/bookings'], isLoggedIn, blockAdmin);
router.get('/services', isLoggedIn, serviceController.listServices);
router.post('/services/book', isLoggedIn, serviceController.createBooking);
router.get('/bookings', isLoggedIn, serviceController.listBookings);
router.post('/bookings/cancel/:id', isLoggedIn, serviceController.cancelBooking);
router.get('/admin/bookings', isAdmin, serviceController.adminListBookings);

module.exports = router;
