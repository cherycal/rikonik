const express = require("express");
const router = express.Router();
const userController = require('../controllers/userController');
const { queryTable } = require('../controllers/userController');


router.post('/',userController.queryTable);
router.get('/',userController.default);
router.get('/multi',userController.multi);
router.get('/dbselect/:db',userController.dbselect);
router.get('/api/query',userController.queryAPI);
router.get('/table/:table',userController.selectTable);
router.get('/queryTable/:table',userController.queryTable);
// MOST specific first
router.get('/query/:table/where/*/orderBy/:orderBy/ad/:ad', userController.queryTable);
router.get('/query/:table/where/*/orderBy/:orderBy', userController.queryTable);
router.get('/query/:table/where/*', userController.queryTable);

// LESS specific
router.get('/query/:table/orderBy/:orderBy/ad/:ad', queryTable);
router.get('/query/:table/orderBy/:orderBy', queryTable);

// LEAST specific
router.get('/query/:table', queryTable);
router.get('/showTables',userController.showTables);
router.get('*', (req,res) => {
    res.send("Page not found");
})


router.get('/showTables',userController.showTables);

module.exports = router;


