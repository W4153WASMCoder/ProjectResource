const express = require('express');
const path = require('path');
var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'wasm-coder-project.c5is6oc4czys.us-east-2.rds.amazonaws.com',
    port: '3306',
    user: 'admin',
    password: process.env.WASM_CODER_PROJ_RESOURCE
});

var app = express();

connection.connect(function (err) {
    if (!err) {
        console.log("Database is connected ... ");
    } else {
        console.log("Error connecting database ... ");
    }
});

app.get('/', (req, res, next) => {
    console.log("Hello World!");
});

connection.query('show databases', function (error, results, fields) {
    if (error) throw error;
    console.log(results);
})

connection.end();

module.exports = app;
