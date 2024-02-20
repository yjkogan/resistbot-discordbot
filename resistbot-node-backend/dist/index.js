"use strict";
var express = require('express');
var logger = require('morgan');
var app = express();
const port = process.env.PORT || 5555;
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
/* GET home page. */
app.get('/', function (req, res, next) {
    res.send('<h1>Hello from Node & Docker</h1>');
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
