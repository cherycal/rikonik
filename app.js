require('dotenv').config();

const express = require("express");
const path = require("path");
const cors = require("cors");
// const hbs = require('hbs');
const app = express();

app.use(cors({
    origin: [
        "https://www.rikonik.com",
        "https://turquoise-elk-ltca.squarespace.com"
    ]
}));

const dotenv = require("dotenv");
dotenv.config();

const exphbs = require('express-handlebars');
const { engine } = require('express-handlebars');
const bodyParser = require("body-parser");

const PORT = 5050;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

app.engine('hbs', engine({ extname: '.hbs' }));  // GOOD
app.set('view engine', 'hbs');                   // GOOD

// Register helpers BEFORE rendering any templates
hbs.registerHelper("encode", function (str) {
  return encodeURIComponent(str || "");
});                                              // GOOD

const routes = require('./server/routes/user');
app.use('/', routes);

app.listen(PORT, () => console.log(`Listening on PORT ${PORT}`));