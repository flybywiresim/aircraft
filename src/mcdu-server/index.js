/* eslint-disable no-console */

'use strict';

const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');
const network = require('network');
const print = require('pdf-to-printer');
const os = require('os');
const PDFDocument = require('pdfkit');
require('./standalone-patch');

// This tells pkg to include these files in the binary
path.join(__dirname, 'client/build/android-chrome-192x192.png');
path.join(__dirname, 'client/build/android-chrome-512x512.png');
path.join(__dirname, 'client/build/apple-touch-icon-180x180.png');
path.join(__dirname, 'client/build/bundle.js');
path.join(__dirname, 'client/build/favicon.ico');
path.join(__dirname, 'client/build/HoneywellMCDU.ttf');
path.join(__dirname, 'client/build/HoneywellMCDUSmall.ttf');
path.join(__dirname, 'client/build/index.html');
path.join(__dirname, 'client/build/mcdu-r2-c.png');
path.join(__dirname, '../../node_modules/pdf-to-printer/dist/SumatraPDF.exe');
path.join(__dirname, '../../node_modules/linebreak/src/classes.trie');
path.join(__dirname, '../../node_modules/pdfkit/js/data/Helvetica.afm');

const sumatraPdfPath = path.join(os.tmpdir(), 'SumatraPDF.exe');
fs.copyFileSync(path.join(__dirname, '../../node_modules/pdf-to-printer/dist/SumatraPDF.exe'), sumatraPdfPath);

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
});

const readNumber = (prompt, min, max, callback) => {
    readline.question(`${prompt} (${min}-${max}):`, (response) => {
        const number = parseInt(response, 10);
        if (number != null && number >= min && number <= max) {
            callback(number);
        } else {
            readNumber(prompt, min, max, callback);
        }
    });
};

let selectedPrinter = null;

// Parse command line args
let printerName = null;
let skipPrinter = false;
let httpPort = 8125;
let websocketPort = 8080;
let debug = false;

const args = [...process.argv];
args.splice(0, 2);

for (const arg of args) {
    if (arg === '--no-printer') {
        skipPrinter = true;
        continue;
    }
    if (arg.startsWith('--printer=')) {
        printerName = arg.split('=')[1];
        continue;
    }
    if (arg.startsWith('--http-port=')) {
        httpPort = parseInt(arg.split('=')[1], 10);
        if (!httpPort || httpPort < 0 || httpPort > 65353) {
            console.error(`Invalid http port: ${arg}`);
            process.exit(1);
        }
        continue;
    }
    if (arg.startsWith('--websocket-port=')) {
        websocketPort = parseInt(arg.split('=')[1], 10);
        if (!websocketPort || websocketPort < 0 || websocketPort > 65353) {
            console.error(`Invalid websocket port: ${arg}`);
            process.exit(1);
        }
        continue;
    }
    if (arg === '--debug') {
        debug = true;
        continue;
    }
    if (arg === '-h' || arg === '--help') {
        printUsage();
        process.exit(0);
    }
    console.error(`Unknown argument: ${arg}`);
    printUsage();
    process.exit(1);
}

if (printerName != null) {
    print.getPrinters().then((printers) => {
        selectedPrinter = printers.find((printer) => printer.name === printerName);
        if (!selectedPrinter) {
            console.error(`Unknown printer: ${printerName}`);
            process.exit(1);
            return;
        }
        start();
    });
} else if (!skipPrinter) {
    print.getPrinters().then((printers) => {
        if (printers) {
            readline.question('Would you like to enable printing to a real printer? (y/N): ', (response) => {
                if (response.toLowerCase() === 'y') {
                    console.log('The following printers are available:');
                    for (let i = 0; i < printers.length; i++) {
                        console.log(`  ${i + 1}: ${printers[i].name}`);
                    }
                    readNumber('Which printer would you like to use?', 1, printers.length, (printerIndex) => {
                        selectedPrinter = printers[printerIndex - 1];
                        start();
                    });
                } else {
                    start();
                }
            });
        } else {
            start();
        }
    });
} else {
    start();
}

function start() {
    console.log('Starting server...');

    // Simple HTTP server for the web-based client
    http.createServer((request, response) => {
        let filePath = `.${request.url}`;
        if (filePath === './') filePath = './index.html';

        const extname = path.extname(filePath);
        let contentType = 'text/html';
        switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
        default:
            break;
        }

        fs.readFile(path.join(__dirname, './client/build/', filePath), (error, content) => {
            if (error) {
                if (error.code === 'ENOENT') {
                    fs.readFile(path.join(__dirname, './client/build/index.html'), (error, content) => {
                        response.writeHead(200, { 'Content-Type': 'text/html' });
                        if (contentType === 'text/javascript') {
                            content = content.toString('utf8').replace(/__WEBSOCKET_PORT__/g, websocketPort);
                        }
                        response.end(content, 'utf-8');
                    });
                } else {
                    response.writeHead(500);
                    response.end(`Error: ${error.code}`);
                    response.end();
                }
            } else {
                response.writeHead(200, { 'Content-Type': contentType });
                if (contentType === 'text/javascript') {
                    content = content.toString('utf8').replace(/__WEBSOCKET_PORT__/g, websocketPort);
                }
                response.end(content, 'utf-8');
            }
        });
    }).listen(httpPort);

    network.get_private_ip((err, ip) => {
        // Create websocket server
        let wss = null;

        wss = new WebSocket.Server({ port: websocketPort }, () => {
            console.clear();
            console.log('External MCDU server started.\n');
            console.log('Waiting for simulator...');
        });

        wss.on('error', (err) => {
            console.error(`${err}`);
            setTimeout(() => {
            }, 5000);
        });

        wss.on('connection', (ws) => {
            let isMcdu = false;
            ws.on('message', (message) => {
                if (message === 'mcduConnected') {
                    console.clear();
                    console.log('\x1b[32mSimulator connected!\x1b[0m\n');
                    if (err) {
                        console.log(`To control the MCDU from this device, open \x1b[47m\x1b[30mhttp://localhost:${httpPort}\x1b[0m in your browser.`);
                        console.log('\nTo control the MCDU from another device on your network, replace localhost with your local IP address.');
                        // eslint-disable-next-line max-len
                        console.log('To find your local IP address, see here: \x1b[47m\x1b[30mhttps://support.microsoft.com/en-us/windows/find-your-ip-address-in-windows-f21a9bbc-c582-55cd-35e0-73431160a1b9\x1b[0m');
                    } else {
                        console.log(`To control the MCDU from another device on your network, open \x1b[47m\x1b[30mhttp://${ip}:${httpPort}\x1b[0m in your browser.`);
                        console.log(`To control the MCDU from this device, open \x1b[47m\x1b[30mhttp://localhost:${httpPort}\x1b[0m in your browser.`);
                    }
                    isMcdu = true;
                    return;
                }
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(message);
                    }
                });
                if (debug) {
                    console.log(message);
                }
                if (message.startsWith('print:')) {
                    const { lines } = JSON.parse(message.substring(6));
                    if (selectedPrinter) {
                        const doc = new PDFDocument();
                        const pdfPath = path.join(os.tmpdir(), 'a32nxPrint.pdf');
                        doc.pipe(fs.createWriteStream(pdfPath));
                        doc.font(path.join(__dirname, 'client/build/ECAMFontRegular.ttf'));
                        doc.fontSize(19);
                        for (let i = 0; i < lines.length; i++) {
                            doc.text(lines[i], 36, 36 + (19 * i));
                        }
                        doc.end();
                        print.print(pdfPath, { printer: selectedPrinter.name, sumatraPdfPath });
                    }
                }
            });
            ws.on('close', () => {
                if (isMcdu) {
                    console.clear();
                    console.log('\x1b[31mLost connection to simulator.\x1b[0m\n\nWaiting for simulator...');
                }
            });
        });
    });
}

function printUsage() {
    console.log('\nUsage:');
    console.log('server [options]');
    console.log('\nOptions:');
    console.log('--debug              enables debug mode');
    console.log('-h, --help           print command line options');
    console.log('--http-port=...      sets port for http server (default: 8125)');
    console.log('--no-printer         skips prompt to select printer');
    console.log('--printer=...        enables printing to the specified printer');
    console.log('--websocket-port=... sets port for websocket server (default: 8080)');
}
