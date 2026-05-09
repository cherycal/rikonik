require('dotenv').config();

const express = require("express");
const path = require("path");


const dotenv = require("dotenv");
dotenv.config();
// or require('dotenv').config();

const exphbs = require('express-handlebars');
const { engine } = require ('express-handlebars');
const bodyParser = require("body-parser");

//const { response } = require("express");

const app = express();
const PORT = 5050; // process.env.PORT

// https://www.youtube.com/watch?v=1aXZQcG2Y6I
// http://localhost:3000/
// .../express-mysql> npm start

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname,'public')));

app.engine('hbs', engine({extname: '.hbs'}));
//Sets our app to use the handlebars engine
app.set('view engine', 'hbs');

const routes = require('./server/routes/user');
app.use('/', routes);

app.listen(PORT, () => console.log(`Listening on PORT ${PORT}`));
