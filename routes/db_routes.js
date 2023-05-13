const express = require('express');
let router = express.Router();
let dbController = require('../controllers/db_controller');


router.route('/download').post(dbController.download).get(dbController.download);
router.route('/restore').post(dbController.restore);
router.route('/mask').get(dbController.mask);
router.route('/hosts').get(dbController.hosts);

module.exports = router;