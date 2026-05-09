const { basicQuery } = require('../db');
//
let moment = require('moment');
let dbname = "Baseball25"

async function getTables(schema = "public") {
    const sql = `
        SELECT table_name AS "Tables_in_DB"
        FROM information_schema.tables
        WHERE table_schema = $1
        ORDER BY table_name;
    `;

    try {
        const result = await basicQuery(sql, [schema]);
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
        const dbname = "Neon"; 
        const table = "MLBPlayers";
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

exports.dbselect = async (req, res) => {
    try {
        // The schema the user wants to switch to
        const schema = req.params.db || "public";
        const dbname = schema;  // for UI display

        console.log("dbselect Params:", JSON.stringify(req.params));

        const table = "MLBPlayers";
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
        let orderTerm = req.body?.order_term || req.query.orderBy || "";

        if (orderTerm.trim() !== "") {
            orderTerm = orderTerm.replace(/'/g, "");
            orderTerm = " ORDER BY " + orderTerm + " " + asc;
        }

        // Flip asc/desc for UI column header clicks
        let ascFlag = asc === "asc" ? "desc" : "asc";

        // Final SQL — now schema‑aware
        const sql = `SELECT ${cols} FROM ${schema}.${table}${queryWhere}${orderTerm}`;
        console.log("SQL:", sql);

        // Run both queries in parallel
        const [tablesResult, queryResult] = await Promise.all([
            getTables(schema),   // now schema-aware
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
        console.error("Error in dbselect:", error);
        res.status(500).send("Server error");
    }
};

exports.multi = async (req, res) => {
    try {
        // Schema selection (default = public)
        const schema = req.params?.db || "public";

        // First query: list tables in this schema
        const tablePromise = getTables(schema);

        // Second query: simple SELECT * FROM MLBPlayers
        const sql = `SELECT * FROM ${schema}.MLBPlayers`;
        const queryPromise = basicQuery(sql);

        // Run both in parallel
        const [tablesResult, queryResult] = await Promise.all([
            tablePromise,
            queryPromise
        ]);

        const tableList = tablesResult.rows;
        const rows = queryResult.rows;

        res.render("index", {
            tableList,
            rows
        });

    } catch (error) {
        console.error("Error in multi:", error);
        res.status(500).send("Server error");
    }
};


exports.queryAPI = async (req, res) => {
    try {
        // Schema selection (default = public)
        const schema = req.params?.db || "public";
        const dbname = schema;

        // List tables for dropdown
        const tablePromise = getTables(schema);

        // Columns
        let cols = req.body.columns || req.query.columns || "*";
        cols = cols.replace(/'/g, "");
        if (!cols.trim()) cols = "*";

        // Table
        let table = req.body.table || req.query.table || "MLBPlayers";
        table = table.replace(/'/g, "");

        // WHERE clause
        let whereTerm = req.query.where || "";
        let queryWhere = "";

        if (whereTerm.trim() !== "") {
            whereTerm = whereTerm
                .replace(/'/g, "")
                .replace(/%27/g, "")
                .replace(/%20/g, " ")
                .replace(/%22/g, '"');

            queryWhere = " WHERE " + whereTerm;
        }

        // ORDER BY
        let asc = req.query.asc || "";
        let orderTerm = req.body.order_term || req.query.orderBy || "";

        if (orderTerm.trim() !== "") {
            orderTerm = orderTerm.replace(/'/g, "");
            orderTerm = " ORDER BY " + orderTerm + " " + asc;
        }

        // Flip asc/desc for UI
        let ascFlag = asc === "asc" ? "desc" : "asc";

        // Final SQL — schema‑aware
        const sql = `
            SELECT ${cols}
            FROM ${schema}.${table}
            ${queryWhere}
            ${orderTerm}
            LIMIT 2000
        `;

        console.log("queryAPI SQL:", sql);
        console.log("whereTerm:", whereTerm);
        console.log("queryWhere:", queryWhere);

        // Run both queries in parallel
        const [tablesResult, queryResult] = await Promise.all([
            tablePromise,
            basicQuery(sql)
        ]);

        const tableList = tablesResult.rows;
        const rows = queryResult.rows;
        const message = sql;

        res.render("index", {
            tableList,
            rows,
            table,
            message,
            whereTerm,
            orderTerm,
            cols,
            ascFlag,
            dbname
        });

    } catch (error) {
        console.error("Error in queryAPI:", error);
        res.status(500).send("Server error");
    }
};


exports.queryTable = async (req, res) => {
    try {
        // --- Table name ---
        let table = req.params.table || req.body.table_name || 'MLBPlayers';

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


