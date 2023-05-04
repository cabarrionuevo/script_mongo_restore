const express = require('express');
const router = express.Router();

//*****Importamos script
const dropBackupMongo = require('../../scripts/mongo_restore');

router.get('/dropBackupMongo', dropBackupMongo);

module.exports = router;