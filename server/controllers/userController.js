const { basicQuery } = require('../db');
//
let moment = require('moment');
let dbname = "Baseball25"

async function getTables() {
    const sql = `
        SELECT table_name AS "Tables_in_DB"
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
    `;

    try {
        const result = await basicQuery(sql);
        const queryTime = moment().format("h:mm:ss.SSS a MMM DD, YYYY");

        return {
            queryTime,
            rows: result.rows,
            sql
        };
    } catch (err) {
        console.error("getTables error:", err);
        return { queryTime: null, rows: [], sql, error: err.message };
    }
}

// function getDB(dbname_ = dbname) {
//     // console.log("database_name:" + database_name + ".")
//     //db = new sqlite3.Database('C:\\Ubuntu\\Shared\\data\\Baseball.db', sqlite3.OPEN_READWRITE, (err) => {
//     db = new sqlite3.Database('C:\\Users\\chanc\\prog\\data\\' + dbname_ + '.db', sqlite3.OPEN_READWRITE, (err) => {
//         if (err) {
//             return console.error(err.message);
//         }
//         console.log("getDB() DB connection successful");
//     });
//     return db;
// }

function closeDB(db) {
    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log("closeDB() DB closed");
    });
}

exports.default = async (req, res) => {
    try {
        const table = "ESPNRosters";
        const cols = "*";

        // WHERE clause
        let whereTerm = req.query.where || "";
        let queryWhere = "";

        if (whereTerm.trim() !== "") {
            console.log("req.query.where:", whereTerm);
            whereTerm = whereTerm.replace(/'/g, "");
            queryWhere = " WHERE " + whereTerm;
        }

        // ORDER BY clause
        let asc = req.query.asc || "";
        let orderTerm = req.body.order_term || req.query.orderBy || "";

        if (orderTerm.trim() !== "") {
            orderTerm = orderTerm.replace(/'/g, "");
            orderTerm = " ORDER BY " + orderTerm + " " + asc;
        }

        // Flip asc/desc for UI column header clicks
        let ascFlag = asc === "asc" ? "desc" : "asc";

        // Final SQL
        const sql = `SELECT ${cols} FROM ${table}${queryWhere}${orderTerm}`;
        console.log("SQL:", sql);

        // Run both queries in parallel
        const [tablesResult, queryResult] = await Promise.all([
            getTables(),
            basicQuery(sql)
        ]);

        const tableList = tablesResult.rows;
        const rows = queryResult.rows;
        const message = sql;

        res.render("index", {
            tableList,
            rows,
            message,
            table,
            cols,
            whereTerm,
            orderTerm,
            ascFlag,
            dbname
        });

    } catch (error) {
        console.error("Error in exports.default:", error);
        res.status(500).send("Server error");
    }
};

exports.dbselect = (req, res) => {
    //let db = getDB(req.params.db);
    dbname = req.params.db
    console.log("")
    console.log("exports.dbselect Params: " + JSON.stringify(req.params));
    const tablePromise = getTables();

    const cols = "*"
    let table = "ESPNRosters";

    let whereTerm = queryWhere = req.query.where || ' ';
    if (req.query.where) {
        console.log("req.query.where:" + req.query.where + ".");
    }
    console.log("exports.default Params: " + JSON.stringify(req.params));
    console.log("exports.default Req.body: " + JSON.stringify(req.body));
    if (req.query.where) {
        queryWhere = " WHERE " + req.query.where;
    }
    if (queryWhere != ' ') {
        queryWhere = queryWhere.replace(/'/g, '');
        whereTerm = whereTerm.replace(/'/g, '');
    } else {
        whereTerm = ""
    }

    // Ascending or descending sort 
    let asc = req.query.asc || "";
    let orderTerm = req.body.order_term || req.query.orderBy || " ";
    if (orderTerm != ' ') {
        orderTerm = orderTerm.replace(/'/g, '');
        orderTerm = " ORDER BY " + orderTerm;
        orderTerm += " " + asc;
    }
    // Flip ascending/descending when sorting by clicking on column
    // header
    let ascFlag = asc === "asc" ? "desc" : "asc";

    const sql = "select " + cols + " from " + table + " " + whereTerm + orderTerm
    const queryPromise = basicQuery(sql);
    const message = sql;

    Promise.all([tablePromise, queryPromise]).then(values => {
        const currentTime = moment().format("h:mm:ss.SSS a MMM DD, YYYY");
        let [tablesResult, queryResult] = values;
        tableList = tablesResult.rows;
        rows = queryResult.rows;
        if (queryResult.message) {
            message = queryResult.message;
        }
        res.render('index', { tableList, rows, message, table, cols, whereTerm, orderTerm, ascFlag, dbname });
        // res.render('index',{tableList, rows, table, message, whereTerm, orderTerm, cols, ascFlag} );
    }).catch(error => console.log(error.message));
    closeDB(db);
}

exports.multi = (req, res) => {
    let db = getDB();
    let tablePromise = getTables();
    const queryPromise = new Promise(resolve => {
        var sql = "select * from ESPNRosters";
        var params = [];
        db.all(sql, params, (err, rows) => {
            if (err) {
                return console.error(err.message);
            }
            const queryTime = moment().format("h:mm:ss.SSS a MMM DD, YYYY");
            resolve({ sql, queryTime, rows });
        });
    })
    Promise.all([tablePromise, queryPromise]).then(values => {
        const currentTime = moment().format("h:mm:ss.SSS a MMM DD, YYYY");
        let [tablesResult, queryResult] = values;
        // console.log(tablesResult.rows);
        // console.log(queryResult.rows);
        tableList = tablesResult.rows;
        rows = queryResult.rows;
        // res.json({
        //     "message":"success",
        //     "data":{currentTime,values}
        // });
        res.render('index', { tableList, rows });
    });
    closeDB(db);
}


exports.queryAPI = (req, res) => {

    // router.get('/api/query',userController.queryAPI);
    // open a sqlite3 connection
    let db = getDB();
    // list of tables/views for dropdown list
    let tablePromise = getTables();

    let cols = req.body.columns || req.query.columns || '*';

    // strip all single quotes: single quotes are necessary
    // for urls but will result in an error in a query
    cols = cols.replace(/'/g, '');
    if (cols == '') {
        cols = '*';
    }

    // the table to select from
    let table = req.body.table || req.query.table || "ESPNRosters";

    // the where clause
    let whereTerm = queryWhere = req.query.where || " ";

    //console.log('queryWhere from queryAPI 1:' + queryWhere + ':' );

    // The actual word WHERE is not in url request 
    if (req.query.where != "''") {
        queryWhere = " WHERE " + req.query.where;
    }

    //console.log('queryWhere from queryAPI 2:' + queryWhere + ':');

    // strip all single quotes: single quotes are necessary
    // for urls but will result in an error in a query
    if (queryWhere != ' ') {
        queryWhere = queryWhere.replace(/'/g, '');
        whereTerm = whereTerm.replace(/'/g, '');
        queryWhere = queryWhere.replace(/%27/g, '');
        queryWhere = queryWhere.replace(/%20/g, ' ');
        queryWhere = queryWhere.replace(/%22/g, '\"');
        whereTerm = whereTerm.replace(/%27/g, '');
        whereTerm = whereTerm.replace(/%20/g, ' ');
        whereTerm = whereTerm.replace(/%22/g, '\"');
    }

    // Ascending or descending sort 
    let asc = req.query.asc || "";
    let orderTerm = req.body.order_term || req.query.orderBy || " ";
    if (orderTerm != ' ') {
        orderTerm = orderTerm.replace(/'/g, '');
        orderTerm = " ORDER BY " + orderTerm;
        orderTerm += " " + asc;
    }

    // Flip ascending/descending when sorting by clicking on column
    // header
    let ascFlag = asc === "asc" ? "desc" : "asc";


    let query = "SELECT " + cols + " FROM " + table + " " + queryWhere + " " + orderTerm + " LIMIT 2000";
    let queries = [
        "SHOW TABLES",
        query
    ];
    let message = query;

    console.log('Data from queryAPI: ' + query)
    console.log("");
    console.log('Data from queryAPI: ' + query);
    console.log('whereTerm from queryAPI:' + whereTerm + ':');
    console.log('queryWhere from queryAPI:' + queryWhere + ':');

    const queryPromise = basicQuery(query);

    Promise.all([tablePromise, queryPromise]).then(values => {
        const currentTime = moment().format("h:mm:ss.SSS a MMM DD, YYYY");
        let [tablesResult, queryResult] = values;
        tableList = tablesResult.rows;
        rows = queryResult.rows;
        if (queryResult.message) {
            message = queryResult.message;
        }
        res.render('index', { tableList, rows, table, message, whereTerm, orderTerm, cols, ascFlag, dbname });
    });
    closeDB(db);
}


/*
exports.queryTable = (req, res) => {

    let db = getDB();
    let tablePromise = getTables();
    console.log("")
    console.log("exports.queryTable:")
    console.log("exports.queryTable Params: " + JSON.stringify(req.params));
    console.log("exports.queryTable Req.body: " + JSON.stringify(req.body));
    let args = new Object();
    let table = req.body.table_name || req.params.table || 'FGSplits';
    let whereTerm = queryWhere = req.body.where_term || "";
    if (req.body.where_term) {
        queryWhere = " WHERE " + whereTerm;
    }
    let asc = req.params.ad || "asc";
    let ascFlag = asc === "asc" ? "desc" : "asc";

    let orderTerm = req.body.order_term || '';
    if (req.params.orderBy) {
        orderTerm = " ORDER BY " + req.params.orderBy;
    }
    if (orderTerm != '') {
        orderTerm = orderTerm.replace(/\&/g, '');
        orderTerm = orderTerm + ' ';
        orderTerm += req.params.ad || '';
    }
    if (queryWhere != ' ') {
        queryWhere = queryWhere.replace(/'/g, '');
    }

    let cols = req.body.columns || "*";
    cols = cols.replace(/\s+/g, '');
    let query = "SELECT " + cols + " FROM " + table + " " + queryWhere + " " + orderTerm + " LIMIT 2000";
    let queries = [
        "SHOW TABLES",
        query
    ];

    let message = query;
    console.log('Data from queryTable: ' + query);
    console.log('whereTerm from queryTable: ' + whereTerm);
    console.log('queryWhere from queryTable: ' + queryWhere);
    console.log("Params: " + JSON.stringify(req.params));
    console.log("Req.body: " + JSON.stringify(req.body));

    const queryPromise = basicQuery(query);

    Promise.all([tablePromise, queryPromise]).then(values => {
        const currentTime = moment().format("h:mm:ss.SSS a MMM DD, YYYY");
        let [tablesResult, queryResult] = values;
        tableList = tablesResult.rows;
        rows = queryResult.rows;
        if (queryResult.message) {
            message = queryResult.message;
        }
        res.render('index', { tableList, rows, table, message, whereTerm, orderTerm, cols, ascFlag, dbname });
    });
    closeDB(db);

}
*/

exports.queryTable = async (req, res) => {
    try {
        // --- Table name ---
        let table = req.params.table || req.body.table_name || 'FGSplits';

        // --- WHERE clause ---
        let whereTerm = "";

        if (req.params[0]) {
            whereTerm = req.params[0];  // raw, untouched string
        }

        if (req.params.where) {
            whereTerm = decodeURIComponent(req.params.where);
        } else if (req.body.where_term) {
            whereTerm = req.body.where_term;
        }

        let queryWhere = "";
        if (whereTerm && whereTerm.trim() !== "") {
            queryWhere = " WHERE " + whereTerm.replace(/'/g, "");
        }

        // --- ORDER BY ---
        let orderTerm = "";
        if (req.params.orderBy) {
            orderTerm = " ORDER BY " + req.params.orderBy;
            if (req.params.ad) {
                orderTerm += " " + req.params.ad;
            }
        } else if (req.body.order_term) {
            orderTerm = req.body.order_term;
        }

        // --- Columns ---
        let cols = (req.body.columns || "*").replace(/\s+/g, "");

        // --- Final SQL ---
        let query = `SELECT ${cols} FROM ${table} ${queryWhere} ${orderTerm} LIMIT 2000`;

        // --- Run both queries in parallel ---
        const [tablesResult, queryResult] = await Promise.all([
            getTables(),          // <-- this must already use basicQuery internally
            basicQuery(query)
        ]);

        let tableList = tablesResult.rows;
        let rows = queryResult.rows;
        let message = queryResult.message || query;

        res.render('index', {
            tableList,
            rows,
            table,
            message,
            whereTerm,
            orderTerm,
            cols,
            ascFlag: req.params.ad === "asc" ? "desc" : "asc",
            dbname
        });

    } catch (err) {
        console.error("queryTable error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.selectTable = (req, res) => {

    let db = getDB();
    let tablePromise = getTables();

    console.log("exports.selectTable Params:\n" + JSON.stringify(req.params));
    //let args = new Object();
    table = Object.values(req.params)[0];
    orderBy = Object.values(req.params)[1];

    if (orderBy) {
        orderBy = orderBy.replace(/\&/g, '');
    }
    asc = Object.values(req.params)[2];
    let cols = req.body.columns || "*";
    cols = cols.replace(/\s+/g, '');

    query = 'SELECT ' + cols + ' FROM ' + table;

    if (orderBy && asc) {
        query += asc;
    }
    // asc desc ... 

    query += ' LIMIT 1000';

    var queries = [
        "SHOW TABLES",
        query
    ];

    let ascFlag = asc === "asc" ? "desc" : "asc";

    message = query;
    whereTerm = req.body.where_term;
    orderTerm = req.body.order_term;
    columnsTerm = req.body.columns;
    if (orderTerm) {
        orderTerm = orderTerm.replace('&', '');
    }

    console.log('query from selectTable: ' + query);

    const queryPromise = basicQuery(query);

    Promise.all([tablePromise, queryPromise]).then(values => {
        const currentTime = moment().format("h:mm:ss.SSS a MMM DD, YYYY");
        let [tablesResult, queryResult] = values;
        tableList = tablesResult.rows;
        rows = queryResult.rows;
        // res.render('index',{tableList, rows, table, message, whereTerm, orderTerm, cols, ascFlag} );
        res.render('index', { table, message, whereTerm, orderTerm, tableList, rows, ascFlag, columnsTerm })
    });
    closeDB(db);

}



exports.showTables = (req, res) => {

    let db = getDB();
    let tablePromise = getTables();

    let query = "select name, type as Tables_in_DB from SQLITE_SCHEMA order by name";
    let message = query;

    const queryPromise = basicQuery(query);

    Promise.all([tablePromise, queryPromise]).then(values => {
        const currentTime = moment().format("h:mm:ss.SSS a MMM DD, YYYY");
        let [tablesResult, queryResult] = values;
        tableList = tablesResult.rows;
        rows = queryResult.rows;
        console.log(rows);
        res.render('showTables', { rows, message });
    });
    closeDB(db);

    // pool.getConnection((err, connection) => {
    //     if(err){
    //         console.log(err);
    //         res.status(400);
    //         res.send("DB connection failed: " + query);
    //     }
    //     //showRows();
    //     const message = "Available tables: "
    //     //console.log('Connected by pool method using threadID: ' + connection.threadId);
    //     //console.log(typeof(req.params));
    //     const table = Object.values(req.params)[0];
    //     const query = 'SHOW TABLES';
    //     connection.query(query, (err, rows) => {
    //         connection.release();
    //         if(!err){
    //             res.render('showTables',{rows, message} );
    //         } else {
    //             console.log(err);
    //             res.status(400);
    //             res.send("Illegal query: " + query);
    //         }
    //         //console.log('Data from showTables: ' + query);

    //     });
    // });
}


