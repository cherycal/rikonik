const { basicQuery } = require('../db');
//
let moment = require('moment');
let dbname = "public"
const { resolveSchema } = require("../../utils/schema");


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
        const schema = resolveSchema(req);
        const dbname = schema;

        const table = "MLBPlayers";   // or whatever your default table is
        const cols = "*";

        // WHERE clause
        let whereTerm = req.query.where || "";
        let queryWhere = "";

        if (whereTerm.trim() !== "") {
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

        let ascFlag = asc === "asc" ? "desc" : "asc";

        const sql = `SELECT ${cols} FROM ${table}${queryWhere}${orderTerm}`;

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
            table,
            message,
            whereTerm,
            orderTerm,
            cols,
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
        const schema = resolveSchema(req);
        const dbname = schema;


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
        const schema = resolveSchema(req);
        const dbname = schema;

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
        const schema = resolveSchema(req);
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
            // Explicitly decode because Express is no longer doing it
            try {
                whereTerm = decodeURIComponent(whereTerm);
            } catch (e) {
                console.warn("decodeURIComponent failed, using raw whereTerm");
            }
            queryWhere = " WHERE " + whereTerm;
        }

        // ORDER BY
        let asc = req.query.asc || "";
        let orderTerm = req.body?.order_term || req.query.orderBy || "";

        if (orderTerm.trim() !== "") {
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
            LIMIT 200
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
        // --- Schema selection (default = public) ---
        const schema = resolveSchema(req);
        const dbname = schema;

        // --- Table name ---
        let table = req.params.table || req.body.table_name || "mlbplayers";
        table = table.replace(/'/g, "");

        // --- WHERE clause ---
        let whereTerm = "";

        // Support multiple legacy patterns
        if (req.params.where) {
            whereTerm = decodeURIComponent(req.params.where);
        } else if (req.body.where_term) {
            whereTerm = req.body.where_term;
        } else if (req.params[0]) {
            whereTerm = req.params[0];
        }

        let queryWhere = "";
        if (whereTerm && whereTerm.trim() !== "") {
            // DO NOT strip quotes — Postgres needs them
            queryWhere = " WHERE " + whereTerm;
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
        let cols = req.body.columns || "*";
        cols = cols.replace(/'/g, "").replace(/\s+/g, "");
        if (!cols.trim()) cols = "*";

        // --- Final SQL (schema-aware) ---
        const sql = `
            SELECT ${cols}
            FROM ${schema}.${table}
            ${queryWhere}
            ${orderTerm}
            LIMIT 2000
        `;

        console.log("queryTable SQL:", sql);

        // --- Run both queries in parallel ---
        const [tablesResult, queryResult] = await Promise.all([
            getTables(schema),
            basicQuery(sql)
        ]);

        const tableList = tablesResult.rows;
        const rows = queryResult.rows;
        const message = queryResult.message || sql;

        // Flip asc/desc for UI
        const ascFlag = req.params.ad === "asc" ? "desc" : "asc";

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

    } catch (err) {
        console.error("queryTable error:", err);
        res.status(500).json({ error: err.message });
    }
};


// NEED to rewrite selectTable and showTables to use basicQuery and getTables, and to be schema-aware. Then we can delete queryTable and just use it for all queries since it's so flexible.

exports.selectTable = async (req, res) => {
    try {
        // --- Schema selection (default = public) ---
        const schema = resolveSchema(req);
        const dbname = schema;

        console.log("selectTable Params:", JSON.stringify(req.params));

        // --- Extract table, orderBy, asc from params ---
        // Old code used Object.values(req.params)[0..2]
        const table = (req.params.table || "").replace(/'/g, "") || "MLBPlayers";
        let orderBy = req.params.orderBy || "";
        let asc = req.params.ad || "";

        if (orderBy) {
            orderBy = orderBy.replace(/&/g, "");
        }

        // --- Columns ---
        let cols = req.body.columns || "*";
        cols = cols.replace(/\s+/g, "");
        if (!cols.trim()) cols = "*";

        // --- ORDER BY clause ---
        let orderTerm = "";
        if (orderBy && asc) {
            orderTerm = ` ORDER BY ${orderBy} ${asc}`;
        }

        // --- WHERE clause (optional) ---
        let whereTerm = req.body.where_term || "";
        let queryWhere = "";
        if (whereTerm && whereTerm.trim() !== "") {
            queryWhere = " WHERE " + whereTerm;
        }

        // --- Final SQL (schema-aware) ---
        const sql = `
            SELECT ${cols}
            FROM ${schema}.${table}
            ${queryWhere}
            ${orderTerm}
            LIMIT 1000
        `;

        console.log("query from selectTable:", sql);

        // --- Run both queries in parallel ---
        const [tablesResult, queryResult] = await Promise.all([
            getTables(schema),
            basicQuery(sql)
        ]);

        const tableList = tablesResult.rows;
        const rows = queryResult.rows;
        const message = sql;

        // Flip asc/desc for UI
        const ascFlag = asc === "asc" ? "desc" : "asc";

        res.render("index", {
            table,
            message,
            whereTerm,
            orderTerm,
            tableList,
            rows,
            ascFlag,
            columnsTerm: req.body.columns,
            dbname
        });

    } catch (err) {
        console.error("selectTable error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.showTables = async (req, res) => {
    try {
        // Schema selection (default = public)
        const schema = resolveSchema(req);
        const dbname = schema;


        // Get table list from this schema
        const tablesResult = await getTables(schema);

        const rows = tablesResult.rows;
        const message = `Tables in schema: ${schema}`;

        console.log("showTables rows:", rows);

        res.render("showTables", {
            rows,
            message,
            dbname
        });

    } catch (err) {
        console.error("showTables error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.tableOnly = async (req, res) => {
    try {
        console.log("🔥 tableOnly route HIT");
        console.log("🔥 URL HIT:", req.originalUrl);


        const schema = req.params.db || "public";
        const table = "MLBPlayers";
        const cols = "*";

        const sql = `SELECT ${cols} FROM ${schema}.${table}`;

        console.log("schema =", schema);
        console.log("sql =", sql);

        const result = await basicQuery(sql);

        res.render("partials/table", {
            layout: false,
            cols: result.fields.map(f => f.name),
            rows: result.rows
        });

    } catch (err) {
        console.error("Error in tableOnly:", err);
        res.status(500).send("Server error");
    }
};