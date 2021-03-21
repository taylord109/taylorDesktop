const http = require('http');
import * as express from "express"
const app = express();
import * as fs from 'fs';
import * as path from 'path';
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

type fileType = { name: string, path: string, filename: string, ext: string, thumbnail?: string, supported?: string };

class lib {

    public static async findDir(startPath: string, filter: RegExp, thumbnail = false, supported = false): Promise<Array<fileType>> {
        if (!fs.existsSync(startPath)) {
            console.log("no dir ", startPath);
            return;
        }
        return new Promise((resolve, reject) => {
            fs.readdir(startPath, async (err, files) => {
                return resolve(files);
            });
        }).then(async (files: Array<string>) => {
            let results: Array<fileType> = [];

            for (const filename of files) {
                var filePath = path.join(startPath, filename);
                var stat = await new Promise<fs.Stats>((resolve, reject) => {
                    fs.lstat(filePath, (err, results) => {
                        if (err) reject(err);
                        return resolve(results)
                    });
                });
                if (stat.isDirectory()) {
                    let recurseRes = await lib.findDir(filePath, filter);
                    results = [...results, ...recurseRes]; //recurse
                }
                if (filter.test(filePath)) {
                    let newFilePath = filePath.replace(/^.:/g, "").replace(/\\/g, '/');
                    const ext = path.extname(filename).replace('.', '');
                    const name = filename.replace(new RegExp('\.' + ext + '$', 'g'), '');
                    const pathThumbnail = path.join(startPath, name + '.jpg');
                    const thumbnail = pathThumbnail.replace(/^.:/g, "").replace(/\\/g, '/');
                    var hasThumbnail = await new Promise<boolean>((resolve, reject) => {
                        fs.lstat(pathThumbnail, (err, results) => {
                            if (err) return resolve(false)
                            return resolve(true);
                        });
                    });
                    const pathSupported = path.join(startPath, name + ' - Supported.' + ext);
                    const supported = pathSupported.replace(/^.:/g, "").replace(/\\/g, '/');
                    var hasSupported = await new Promise<boolean>((resolve, reject) => {
                        fs.lstat(pathThumbnail, (err, results) => {
                            if (err) return resolve(false)
                            return resolve(true);
                        });
                    });

                    let fileOutput: fileType = { name, path: newFilePath, filename, ext };
                    if (hasThumbnail) fileOutput.thumbnail = thumbnail;
                    if (hasSupported) fileOutput.supported = supported

                    results.push(fileOutput);
                }
            }
            return results;
        })
    }
}



app.get('/readZip', (req, res) => {
    try {
        //if (!req?.params?.dir) return res.status(500).end();
        lib.findDir("E:\\models\\printables\\artisian_club\\ashen_alfar_inquisitors", /^(?!.* - Supported\.zip$).*\.zip.*$/g, true, true).then((results) => {
            return res.status(200).json(results).end();
        });
    }
    catch (err) {
        return res.status(500).end();
    }
});

app.get('/readZipDesktop', (req, res) => {
    try {
        //if (!req?.params?.dir) return res.status(500).end();
        lib.findDir("B:\\Temp External\\Models\\Printable Models\\Artisian Club", /^(?!.* - Supported\.zip$).*\.zip.*$/g, true, true).then((results) => {
            return res.status(200).json(results).end();
        });
    }
    catch (err) {
        return res.status(500).end();
    }
});

app.listen(2100, () => {
    console.log('Node server running on port 2100');
});

