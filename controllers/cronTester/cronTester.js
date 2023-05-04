const express = require('express');
const { dropBackupMongo } = require('../../scripts/mongo_restore');
const router = express.Router();

router.get('/dropBackupMongo', dropBackupMongo);
module.exports = router;