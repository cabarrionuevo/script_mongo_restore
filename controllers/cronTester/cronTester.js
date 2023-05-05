const express = require('express');
let router = express.Router();
let dropController = require('../../scripts/mongo_restore');

router.route('/dropBackupMongo').get(dropController.dropBackupMongo);
router.route('/shellScript').get(dropController.shellRestore);

module.exports = router;