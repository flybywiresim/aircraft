
"""
A32NX
Copyright (C) 2020-2021 FlyByWire Simulations and its contributors

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
"""

import json
import urllib.parse as urlparse
import threading
import time
from urllib.parse import urlparse
from urllib.parse import parse_qs
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

events = {}
active = False

lock = threading.Lock()

class MyRequestHandler(SimpleHTTPRequestHandler):
    def end_headers (self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST')
        self.send_header('Access-Control-Max-Age', '86400')
        SimpleHTTPRequestHandler.end_headers(self)

    def do_GET(self):
        global lock
        global events
        global active
        if self.path == '/ping':
            lock.acquire()
            if active:
                self.send_response(501)
            else:
                self.send_response(200)
            lock.release()
            self.end_headers()

        if self.path == '/':
            lock.acquire()
            events = {}
            active = True
            lock.release()

            time.sleep(4)

            lock.acquire()
            active = False
            copy = events
            lock.release()

            self.send_response(200)
            self.send_header('Content-Type', 'text/text')
            self.send_header('Content-Disposition', "attachment; filename=\"dump.json\"")
            self.end_headers()

            self.wfile.write(bytes(json.dumps(copy, sort_keys=True, indent=4), 'utf-8'))

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_POST(self):
        if '/collect' in self.path:
            global lock
            global events
            global active
            parsed_path = urlparse(self.path)
            instrument = parse_qs(parsed_path.query)['instrument'][0]
            print(instrument)
            data_string = self.rfile.read(int(self.headers['Content-Length']))
            print(int(self.headers['Content-Length']))
            parsed = json.loads(data_string)

            lock.acquire()
            if active:
                events[instrument] = parsed
            lock.release()

            self.send_response(200)
            self.end_headers()

def run(server_class=ThreadingHTTPServer, handler_class=MyRequestHandler):
    server_address = ('127.0.0.1', 5000)
    httpd = server_class(server_address, handler_class)
    httpd.serve_forever()


if __name__ == "__main__":
    run()
