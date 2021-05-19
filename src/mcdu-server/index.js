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

let selectedPrinter = null;

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
                        response.end(content, 'utf-8');
                    });
                } else {
                    response.writeHead(500);
                    response.end(`Error: ${error.code}`);
                    response.end();
                }
            } else {
                response.writeHead(200, { 'Content-Type': contentType });
                response.end(content, 'utf-8');
            }
        });
    }).listen(8125);

    network.get_private_ip((err, ip) => {
        // Create websocket server
        const websocketPort = process.argv[2] || 8080;
        let wss = null;

        wss = new WebSocket.Server({ port: websocketPort }, () => {
            console.clear();
            console.log('External MCDU server started.\n');
            console.log('Waiting for simulator...');
        });

        wss.on('error', (err) => {
            console.error(`${err}`);
            setTimeout(() => {}, 5000);
        });

        wss.on('connection', (ws) => {
            let isMcdu = false;
            ws.on('message', (message) => {
                if (message === 'mcduConnected') {
                    console.clear();
                    console.log('\x1b[32mSimulator connected!\x1b[0m\n');
                    if (err) {
                        console.log('To control the MCDU from this device, open \x1b[47m\x1b[30mhttp://localhost:8125\x1b[0m in your browser.');
                        console.log('\nTo control the MCDU from another device on your network, replace localhost with your local IP address.');
                        // eslint-disable-next-line max-len
                        console.log('To find your local IP address, see here: \x1b[47m\x1b[30mhttps://support.microsoft.com/en-us/windows/find-your-ip-address-in-windows-f21a9bbc-c582-55cd-35e0-73431160a1b90\x1b[0m');
                    } else {
                        console.log(`To control the MCDU from another device on your network, open \x1b[47m\x1b[30mhttp://${ip}:8125\x1b[0m in your browser.`);
                        console.log('To control the MCDU from this device, open \x1b[47m\x1b[30mhttp://localhost:8125\x1b[0m in your browser.');
                    }
                    isMcdu = true;
                    return;
                }
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(message);
                    }
                });
                if (message.startsWith('print:')) {
                    const { lines } = JSON.parse(message.substring(6));
                    if (selectedPrinter) {
                        const doc = new PDFDocument();
                        const pdfPath = path.join(os.tmpdir(), 'a32nxPrint.pdf');
                        doc.pipe(fs.createWriteStream(pdfPath));
                        doc.font(path.join(__dirname, 'client/public/ECAMFontRegular.ttf'));
                        doc.fontSize(19);
                        for (let i = 0; i < lines.length; i++) {
                            console.log(lines[i]);
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

print.getPrinters().then((printers) => {
    if (printers) {
        readline.question('Would you like to enable printing to a real printer? (y/N): ', (response) => {
            if (response.toLowerCase() === 'y') {
                console.log('The following printers are available:');
                for (let i = 0; i < printers.length; i++) {
                    console.log(`  ${i + 1}: ${printers[i].name}`);
                }
                readNumber('Which printer would you like to use?', 1, printers.length, (printerIndex) => {
                    console.log(printers[printerIndex - 1]);
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
