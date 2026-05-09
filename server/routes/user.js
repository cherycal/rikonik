const express = require("express");
const router = express.Router();
const userController = require('../controllers/userController');
const { queryTable } = require('../controllers/userController');

// POST
router.post('/', userController.queryTable);

// BASIC ROUTES
// ⭐ NEW: TABLE-ONLY ROUTE FOR SQUARESPACE
router.get('/tableonly/:db?', userController.tableOnly);

router.get('/', userController.default);
router.get('/multi', userController.multi);
router.get('/dbselect/:db', userController.dbselect);
router.get('/api/query', userController.queryAPI);
router.get('/table/:table', userController.selectTable);
router.get('/queryTable/:table', userController.queryTable);

// MOST SPECIFIC FIRST
router.get('/query/:table/where/*/orderBy/:orderBy/ad/:ad', userController.queryTable);
router.get('/query/:table/where/*/orderBy/:orderBy', userController.queryTable);
router.get('/query/:table/where/*', userController.queryTable);

// LESS SPECIFIC
router.get('/query/:table/orderBy/:orderBy/ad/:ad', queryTable);
router.get('/query/:table/orderBy/:orderBy', queryTable);

// LEAST SPECIFIC
router.get('/query/:table', queryTable);

// SHOW TABLES (you had this twice)
router.get('/showTables', userController.showTables);

// WILDCARD MUST BE LAST
router.get('*', (req, res) => {
    res.send("Page not found");
});

module.exports = router;