const express = require('express');
let router = express.Router();
let dropController = require('../../scripts/mongo_restore');

router.route('/dropBackupMongo').get(dropController.dropBackupMongo);

module.exports = router;