const express = require('express');
let router = express.Router();
let dbController = require('../controllers/db_controller');


router.route('/download').post(dbController.download).get(dbController.new);
router.route('/restore').get(dbController.restore);

module.exports = router;