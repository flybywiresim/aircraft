/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * If set to true, will periodically ping the local webserver to send the object dumps started
 * with 'python src\tools\heapdump\app.py'.
 */
const ENABLE_DUMPING = true;

/**
 * If set to true, will periodically emit the number of objects in window and in the DOM into the
 * console.
 */
const ENABLE_COUNTING = true;

class ObjectDumper {

    static flatten(object, visited, outInstrumentId) {
        const result = {};
        if (typeof object === 'object' && object !== null) {
            const keys = Object.getOwnPropertyNames(object);
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const child = object[keys[i]];
                result[key] = this.processChild(child, visited, outInstrumentId);
                if (key === '_instrumentId') {
                    outInstrumentId.push(child);
                }

            }
        } else if (Array.isArray(object)) {
            for (let i = 0; i < object.length; i++) {
                const child = object[i];
                result[i] = this.processChild(child, visited, outInstrumentId);
            }
        } else {
            return object;
        }
        return result;
    }

    static processChild(child, visited, outInstrumentId) {
        const isObj = typeof child === 'object';
        if (!isObj || !visited.has(child)) {
            if (isObj) {
                visited.add(child);
            }
            return this.flatten(child, visited, outInstrumentId);
        } else {
            return "cyclic";
        }
    }

    static flattenDom(dom, visited, outInstrumentId) {
        const result = this.flatten(dom, visited, outInstrumentId);
        result["nodeName"] = dom.nodeName;
        result["children"] = [];
        for (let i = 0; i < dom.children.length; i++) {
            result["children"].push(this.flattenDom(dom.children[i], visited, outInstrumentId));
        }
        return result;
    }

    static dump() {
        fetch("http://127.0.0.1:5000/ping", {
            mode: 'cors',
            method: 'GET'
        }).then((response) => {
            if (response.status !== 501) {
                return;
            }
            console.log("Tracing active");
            const visited = new Set();
            const instrumentId = [];
            const result = {
                'dom' : this.flattenDom(document.getRootNode(), visited, instrumentId),
                'window' : this.flatten(window, visited)
            };
            const dataToSend = JSON.stringify(result);
            fetch("http://127.0.0.1:5000/collect?instrument=" + instrumentId[0], {
                method: 'POST',
                mode: 'cors',
                headers: {
                    // Use text/plain since cors isn't properly implemented on the Python server.
                    'Content-Type': 'text/plain',
                },
                body: dataToSend,
            }).then((response) => {
                console.log("Posted objects!");
            }).catch((reason) => {
                console.log("Failed! " + reason);
            });
        });
    }
}

class ObjectCounter {
    static countObject(object, visited) {
        if (typeof object === 'object' && object !== null) {
            const keys = Object.getOwnPropertyNames(object);
            let count = 0;
            for (let i = 0; i < keys.length; i++) {
                const child = object[keys[i]];
                if (!visited.has(child)) {
                    visited.add(child);
                    count += this.countObject(child, visited);
                }
            }
            return 1 + count;
        } else if (Array.isArray(object)) {
            let count = 0;
            for (let i = 0; i < object.length; i++) {
                const child = object[i];
                if (!visited.has(child)) {
                    visited.add(child);
                    count += this.countObject(child, visited);
                }
            }
            return 1 + count;
        } else {
            return 1;
        }
    }

    static countDom(dom, visited) {
        let result = this.countObject(dom, visited);
        for (let i = 0; i < dom.children.length; i++) {
            result += this.countDom(dom.children[i], visited);
        }
        return result;
    }

    static countObjects() {
        const visited = new Set();
        const count = this.countObject(window, visited) +
            this.countDom(window.document.getRootNode(), visited);
        console.log("Count: " + count);
    }
}

if (ENABLE_DUMPING) {
    window.setInterval(() => {
        ObjectDumper.dump();
    }, 2000);
}

if (ENABLE_COUNTING) {
    window.setInterval(() => {
        ObjectCounter.countObjects();
    }, 100);
}
