const http = require('http');
import * as express from "express"
const app = express();
import * as fs from 'fs';
const readline = require('readline');
const { getPath } = require("windows-shortcuts-ps");

app.get('/', (req, res) => {
    res.send("Hello World - Desk");
});
app.get('/new', (req, res) => {
    res.send("Wow - Desk");
});
app.get('/sharedList', (req, res) => {
    try {
        fs.readdir(__dirname + "/../shared/", (err, files) => {
            if (err || !files || !Array.isArray(files)) return res.status(500).end();
            return res.send(JSON.stringify(files)).end();
        })
    }
    catch (err) {
        return res.status(500).end();
    }
});
app.get('/shared/:filename', (req, res) => {
    try {
        if (!req?.params?.filename) return res.status(500).end();


        var stream = fs.createReadStream(__dirname + "/../shared/" + req?.params?.filename, { highWaterMark: Math.pow(2, 16) });

        stream.on('error', function (error) {
            res.writeHead(404, 'Not Found');
            res.end();
        });

        stream.pipe(res);
    }
    catch (err) {
        return res.status(500).end();
    }
});

app.get('/shared/:lnkname/:filename', (req, res) => {
    try {
        if (!req?.params?.filename && !req?.params?.lnkname) return res.status(500).end();

        const link = __dirname + "/../shared/" + req?.params?.lnkname + ".lnk";
        getPath(link).then((actualPath) => {
            console.log(actualPath);
            var stream = fs.createReadStream(actualPath + "/" + req?.params?.filename, { highWaterMark: Math.pow(2, 16) });

            stream.on('error', function (error) {
                res.writeHead(404, 'Not Found');
                res.end();
            });

            stream.pipe(res);
        });
    }
    catch (err) {
        return res.status(500).end();
    }
});

app.listen(2100, () => {
    console.log('Node server running on port 2100');
});