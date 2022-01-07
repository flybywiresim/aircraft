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
let websocketPort = 8380;
let debug = false;
let fontSize = 19;
let paperSize = 'A4';

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
            console.error(`Invalid http port: ${arg.split('=')[1]}`);
            process.exit(1);
        }
        continue;
    }
    if (arg.startsWith('--websocket-port=')) {
        websocketPort = parseInt(arg.split('=')[1], 10);
        if (!websocketPort || websocketPort < 0 || websocketPort > 65353) {
            console.error(`Invalid websocket port: ${arg.split('=')[1]}`);
            process.exit(1);
        }
        continue;
    }
    if (arg.startsWith('--font-size=')) {
        fontSize = parseInt(arg.split('=')[1], 10);
        if (!fontSize || fontSize < 1) {
            console.error(`Invalid font size: ${arg.split('=')[1]}`);
            process.exit(1);
        }
        continue;
    }
    if (arg.startsWith('--paper-size=')) {
        paperSize = arg.split('=')[1].toUpperCase();
        if (!validPaperSize(paperSize)) {
            console.error(`Invalid paper size: ${arg.split('=')[1]}`);
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

const margin = paperSize === 'A4' ? 30 : 10;

if (printerName != null) {
    print.getPrinters().then((printers) => {
        selectedPrinter = printers.find((printer) => printer.name === printerName);
        if (!selectedPrinter) {
            console.error(`Unknown printer: ${printerName}`);
            pressAnyKey(1);
            return;
        }
        start();
    }).catch((error) => {
        showError('Failed to load printers.\nMake sure the "Print Spooler" Windows service is running.', error);
        console.error('\nSee the documentation for more information:\n\x1b[47m\x1b[30mhttps://docs.flybywiresim.com/fbw-a32nx/feature-guides/web-mcdu/#troubleshooting\x1b[0m');
        pressAnyKey(1);
    });
} else if (!skipPrinter) {
    readline.question('Would you like to enable printing to a real printer? (y/N): ', (response) => {
        if (response.toLowerCase() === 'y') {
            print.getPrinters().then((printers) => {
                if (printers) {
                    console.log('The following printers are available:');
                    for (let i = 0; i < printers.length; i++) {
                        console.log(`  ${i + 1}: ${printers[i].name}`);
                    }
                    readNumber('Which printer would you like to use?', 1, printers.length, (printerIndex) => {
                        selectedPrinter = printers[printerIndex - 1];
                        start();
                    });
                } else {
                    console.error('Error: No printers detected');
                    pressAnyKey(1);
                }
            }).catch((error) => {
                showError('Failed to load printers.\nMake sure the "Print Spooler" Windows service is running.', error);
                console.error('\nSee the documentation for more information:\n\x1b[47m\x1b[30mhttps://docs.flybywiresim.com/fbw-a32nx/feature-guides/web-mcdu/#troubleshooting\x1b[0m');
                pressAnyKey(1);
            });
        } else {
            start();
        }
    });
} else {
    start();
}

/**
 * Starts the HTTP and Websocket servers
 */
function start() {
    console.log('Starting server...');

    // Simple HTTP server for the web-based client
    const httpServer = http.createServer((request, response) => {
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
    });
    let httpServerStarted = false;

    httpServer.listen(httpPort);

    httpServer.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`Error: Port ${httpPort} is already in use`);
            console.error('\nSee the documentation for more information:\n\x1b[47m\x1b[30mhttps://docs.flybywiresim.com/fbw-a32nx/feature-guides/web-mcdu/#occupied-port\x1b[0m');
            pressAnyKey(1);
        } else if (!httpServerStarted) {
            showError('Failed to start HTTP server', error);
            pressAnyKey(1);
        } else if (debug) {
            console.error(`${error}`);
        }
    });

    httpServer.on('listening', () => {
        httpServerStarted = true;
        network.get_private_ip((err, ip) => {
            // Create websocket server
            let wss = null;
            let serverRunning = false;

            wss = new WebSocket.Server({ port: websocketPort }, () => {
                serverRunning = true;
                console.clear();
                console.log('External MCDU server started.\n');
                console.log('Waiting for simulator...');
            });

            wss.on('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    console.error(`Error: Port ${websocketPort} is already in use`);
                    console.error('\nSee the documentation for more information:\n\x1b[47m\x1b[30mhttps://docs.flybywiresim.com/fbw-a32nx/feature-guides/web-mcdu/#occupied-port\x1b[0m');
                    pressAnyKey(1);
                } else if (!serverRunning) {
                    showError('Failed to start websocket server', error);
                    pressAnyKey(1);
                } else if (debug) {
                    console.error(`${error}`);
                }
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
                        console.log(`\nCan't connect? You may need to open TCP ports ${httpPort} and ${websocketPort} on your firewall.`);
                        console.log('See the documentation for more information:');
                        console.log('\x1b[47m\x1b[30mhttps://docs.flybywiresim.com/fbw-a32nx/feature-guides/web-mcdu/#firewall-configuration\x1b[0m\n');

                        if (selectedPrinter) {
                            console.log(`Printer: ${selectedPrinter.name}`);
                            console.log(`Font size: ${fontSize}`);
                            console.log(`Paper size: ${paperSize}`);
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
                            const doc = new PDFDocument({ size: paperSize, margin });
                            const pdfPath = path.join(os.tmpdir(), 'a32nxPrint.pdf');
                            doc.pipe(fs.createWriteStream(pdfPath));
                            doc.font(path.join(__dirname, 'client/build/RobotoMono-Bold.ttf'));
                            doc.fontSize(fontSize);
                            for (let i = 0; i < lines.length; i++) {
                                doc.text(lines[i], { align: 'left' });
                                doc.moveDown();
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
    });
}

/**
 * Prints usage information
 */
function printUsage() {
    console.log('\nUsage:');
    console.log('server [options]');
    console.log('\nOptions:');
    console.log('--debug              shows full error details and logs websocket traffic');
    console.log('--font-size=...      sets font size for printing (default: 19)');
    console.log('-h, --help           print command line options');
    console.log('--http-port=...      sets port for http server (default: 8125)');
    console.log('--no-printer         skips prompt to select printer');
    console.log('--paper-size=...     sets paper size for printing (default: A4)');
    console.log('--printer=...        enables printing to the specified printer');
    console.log('--websocket-port=... sets port for websocket server (default: 8380)');

    console.log('\nSee the documentation for more information:\n\x1b[47m\x1b[30mhttps://docs.flybywiresim.com/fbw-a32nx/feature-guides/web-mcdu/\x1b[0m');
}

/**
 * Shows a short error message. Also shows full error details if debug mode is enabled.
 * @param {string} message The short error message that is always displayed
 * @param {any[]} error The full error details that is only displayed in debug mode
 */
function showError(message, error) {
    console.error(`Error: ${message}\n`);
    if (debug) {
        console.error('Full error details:\n');
        console.error(error);
    } else {
        console.error('Run with the --debug option to see full error details.');
    }
}

/**
 * Shows "Press any key to continue..." prompt and exits the process if no args were passed or debug mode is enabled.
 * Otherwise, it just exits the process.
 * @param {number} exitCode
 */
function pressAnyKey(exitCode) {
    if (args.length > 0 && !debug) {
        process.exit(exitCode);
    }
    console.log('\nPress any key to continue...');
    process.stdin.setRawMode(true);
    process.stdin.once('data', () => {
        process.exit(exitCode);
    });
}

/**
 * Checks the paper size against valid paper sizes of the pdfkit library.
 * @param {string} size
 * @returns {boolean}
 */
function validPaperSize(size) {
    return !!(size.match(/^[ABC]\d\d?$/)
                || size.match(/^S?RA\d\d?$/)
                || size === 'EXECUTIVE'
                || size === 'LEGAL'
                || size === 'LETTER'
                || size === 'TABLOID'
                || size === '4A0'
                || size === '2A0'
                || size === 'FOLIO');
}
