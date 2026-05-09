require('dotenv').config();

const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();   // <-- moved above CORS

app.use(cors({
    origin: [
        "https://www.rikonik.com",
        "https://turquoise-elk-ltca.squarespace.com"
    ]
}));

const dotenv = require("dotenv");
dotenv.config();

const exphbs = require('express-handlebars');
const { engine } = require ('express-handlebars');
const bodyParser = require("body-parser");

const PORT = 5050;

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname,'public')));

app.engine('hbs', engine({extname: '.hbs'}));
app.set('view engine', 'hbs');

const routes = require('./server/routes/user');
app.use('/', routes);

app.listen(PORT, () => console.log(`Listening on PORT ${PORT}`));