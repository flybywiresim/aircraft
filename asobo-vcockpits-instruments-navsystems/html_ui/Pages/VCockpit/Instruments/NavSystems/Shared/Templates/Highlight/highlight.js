class Highlight extends HTMLElement {
    constructor() {
        super();
        this.built = false;
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
    }
    static get observedAttributes() {
        return [
            "active",
            "elements"
        ];
    }
    connectedCallback() {
        this.tryBuild();
    }
    tryBuild() {
        const rect = this.getBoundingClientRect();
        if (!this.built && rect.height != 0) {
            this.built = true;
            this.root.setAttribute("width", "100%");
            this.root.setAttribute("height", "100%");
            this.root.setAttribute("display", "none");
            const vbox = "0 0 " + rect.width + " " + rect.height;
            this.root.setAttribute("viewBox", vbox);
            this.appendChild(this.root);
            this.height = rect.height;
            this.width = rect.width;
            this.background = document.createElementNS(Avionics.SVG.NS, "path");
            let d = "M0 0";
            d += "L" + rect.width + " " + 0;
            d += "L" + rect.width + " " + rect.height;
            d += "L0 " + rect.height;
            d += "L0 0";
            this.background.setAttribute("d", d);
            this.background.setAttribute("fill", "black");
            this.background.setAttribute("fill-opacity", "0.90");
            this.background.setAttribute("fill-rule", "evenodd");
            this.root.appendChild(this.background);
            this.rectangles = document.createElementNS(Avionics.SVG.NS, "path");
            this.rectangles.setAttribute("d", "");
            this.rectangles.setAttribute("stroke", "#01b0f1");
            this.rectangles.setAttribute("stroke-width", "6");
            this.rectangles.setAttribute("fill", "none");
            this.rectangles.setAttribute("stroke-linecap", "square");
            this.root.appendChild(this.rectangles);
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        this.tryBuild();
        if (oldValue == newValue) {
            return;
        }
        switch (name) {
            case "active":
                if (newValue == "true") {
                    this.root.setAttribute("display", "inherit");
                } else {
                    this.root.setAttribute("display", "none");
                }
                break;
            case "elements":
                let d = "M0 0";
                d += "L" + this.width + " " + 0;
                d += "L" + this.width + " " + this.height;
                d += "L0 " + this.height;
                d += "L0 0";
                let bgPath = "";
                const paths = [];
                const elems = newValue.split(";");
                for (let i = 0; i < elems.length; i++) {
                    const coords = elems[i].split(" ");
                    paths.push(new drawPath(elems[i]));
                    bgPath += "M" + (parseInt(coords[0]) - 4) + " " + (parseInt(coords[1]) - 4);
                    bgPath += "L" + (parseInt(coords[0]) - 4) + " " + (parseInt(coords[3]) + 4);
                    bgPath += "L" + (parseInt(coords[2]) + 4) + " " + (parseInt(coords[3]) + 4);
                    bgPath += "L" + (parseInt(coords[2]) + 4) + " " + (parseInt(coords[1]) - 4);
                    bgPath += "L" + (parseInt(coords[0]) - 4) + " " + (parseInt(coords[1]) - 4);
                }
                for (let i = 0; i < paths.length; i++) {
                    for (let j = 0; j < paths.length; j++) {
                        if (i != j && paths[i].isOverlapping(paths[j])) {
                            paths[i] = paths[i].merge(paths[j]);
                            paths.splice(j, 1);
                            j--;
                        }
                    }
                }
                let rectanglePath = "";
                for (let i = 0; i < paths.length; i++) {
                    rectanglePath += "M" + paths[i].points[0].x + " " + paths[i].points[0].y;
                    for (let j = 1; j < paths[i].points.length; j++) {
                        rectanglePath += "L" + paths[i].points[j].x + " " + paths[i].points[j].y;
                    }
                    rectanglePath += "L" + paths[i].points[0].x + " " + paths[i].points[0].y;
                }
                if (this.background) {
                    this.background.setAttribute("d", d + rectanglePath);
                }
                if (this.rectangles) {
                    this.rectangles.setAttribute("d", rectanglePath);
                }
                if (this.rectangleTest) {
                }
                break;
        }
    }
}
class drawPoint {
    constructor(_x, _y) {
        this.x = _x;
        this.y = _y;
    }
}
class drawPath {
    constructor(_points) {
        this.points = [];
        if (_points != "") {
            const coords = _points.split(" ");
            this.points.push(new drawPoint(parseInt(coords[0]) - 4, parseInt(coords[1]) - 4));
            this.points.push(new drawPoint(parseInt(coords[0]) - 4, parseInt(coords[3]) + 4));
            this.points.push(new drawPoint(parseInt(coords[2]) + 4, parseInt(coords[3]) + 4));
            this.points.push(new drawPoint(parseInt(coords[2]) + 4, parseInt(coords[1]) - 4));
        }
    }
    isPointInside(_point) {
        let nbIntersections = 0;
        for (let i = 0; i < this.points.length; i++) {
            if ((this.points[i].x < _point.x != this.points[(i + 1) % this.points.length].x < _point.x) && this.points[i].y < _point.y) {
                nbIntersections++;
            }
        }
        return nbIntersections % 2 == 1;
    }
    getDestinationIndex(_point) {
        for (let i = 0; i < this.points.length; i++) {
            if ((this.points[i].y == _point.y && (_point.x == this.points[i].x || ((this.points[i].x <= _point.x != this.points[(i + 1) % this.points.length].x <= _point.x) && _point.x != this.points[(i + 1) % this.points.length].x)))
                || (this.points[i].x == _point.x && (_point.y == this.points[i].y || ((this.points[i].y <= _point.y != this.points[(i + 1) % this.points.length].y <= _point.y) && _point.y != this.points[(i + 1) % this.points.length].y)))) {
                return (i + 1) % this.points.length;
            }
        }
        return NaN;
    }
    getIntersectionIndex(_p1, _p2) {
        let elem = -1;
        let dist = (_p1.x != _p2.x ? Math.abs(_p2.x - _p1.x) : Math.abs(_p1.y - _p2.y)) + 1;
        for (let i = 0; i < this.points.length; i++) {
            if ((_p1.x != _p2.x ? (this.points[i].y < _p1.y != this.points[(i + 1) % this.points.length].y < _p1.y) && (this.points[i].x < _p1.x != this.points[i].x < _p2.x) : (this.points[i].x < _p1.x != this.points[(i + 1) % this.points.length].x < _p1.x) && (this.points[i].y < _p1.y != this.points[i].y < _p2.y)) && !(_p1.x == this.points[i].x && _p1.y == this.points[i].y) && !(_p1.x == this.points[(i + 1) % this.points.length].x && _p1.y == this.points[(i + 1) % this.points.length].y)) {
                const localDist = (_p1.x != _p2.x ? Math.abs(_p1.x - this.points[i].x) : Math.abs(_p1.y - this.points[i].y));
                if (localDist < dist && localDist > 0) {
                    elem = i;
                    dist = localDist;
                }
            }
        }
        return elem;
    }
    isOverlapping(_other) {
        for (let i = 0; i < _other.points.length; i++) {
            if (this.getIntersectionIndex(_other.points[i], _other.points[(i + 1) % _other.points.length]) != -1) {
                return true;
            }
        }
        return false;
    }
    merge(_other) {
        const newPath = new drawPath("");
        let index = 0;
        let isOnOther = false;
        let finish = false;
        let counter = 100;
        let currPoint;
        let nextPoint;
        while (_other.isPointInside(this.points[index])) {
            index++;
            if (index == this.points.length) {
                return _other;
            }
        }
        const startIndex = index;
        currPoint = this.points[index];
        while (!finish && counter > 0) {
            const direction = this.getDestinationIndex(currPoint);
            const directionOther = _other.getDestinationIndex(currPoint);
            if (!isNaN(direction) && isNaN(directionOther)) {
                nextPoint = this.points[direction];
            } else if (isNaN(direction) && !isNaN(directionOther)) {
                nextPoint = _other.points[directionOther];
            } else if (!isNaN(direction) && !isNaN(directionOther)) {
                if (this.points[direction].x > currPoint.x) {
                    if (_other.points[directionOther].x > currPoint.x) {
                        if (this.points[direction].x < _other.points[directionOther].x) {
                            nextPoint = this.points[direction];
                            isOnOther = false;
                        } else {
                            nextPoint = _other.points[directionOther];
                            isOnOther = true;
                        }
                    } else if (_other.points[directionOther].y > currPoint.y) {
                        nextPoint = _other.points[directionOther];
                        isOnOther = true;
                    } else {
                        nextPoint = this.points[direction];
                        isOnOther = false;
                    }
                } else if (this.points[direction].x < currPoint.x) {
                    if (_other.points[directionOther].x < currPoint.x) {
                        if (this.points[direction].x > _other.points[directionOther].x) {
                            nextPoint = this.points[direction];
                            isOnOther = false;
                        } else {
                            nextPoint = _other.points[directionOther];
                            isOnOther = true;
                        }
                    } else if (_other.points[directionOther].y < currPoint.y) {
                        nextPoint = _other.points[directionOther];
                        isOnOther = true;
                    } else {
                        nextPoint = this.points[direction];
                        isOnOther = false;
                    }
                } else if (this.points[direction].y < currPoint.y) {
                    if (_other.points[directionOther].y < currPoint.y) {
                        if (this.points[direction].y > _other.points[directionOther].y) {
                            nextPoint = this.points[direction];
                            isOnOther = false;
                        } else {
                            nextPoint = _other.points[directionOther];
                            isOnOther = true;
                        }
                    } else if (_other.points[directionOther].x > currPoint.x) {
                        nextPoint = _other.points[directionOther];
                        isOnOther = true;
                    } else {
                        nextPoint = this.points[direction];
                        isOnOther = false;
                    }
                } else {
                    if (_other.points[directionOther].y > currPoint.y) {
                        if (this.points[direction].y < _other.points[directionOther].y) {
                            nextPoint = this.points[direction];
                            isOnOther = false;
                        } else {
                            nextPoint = _other.points[directionOther];
                            isOnOther = true;
                        }
                    } else if (_other.points[directionOther].x < currPoint.x) {
                        nextPoint = _other.points[directionOther];
                        isOnOther = true;
                    } else {
                        nextPoint = this.points[direction];
                        isOnOther = false;
                    }
                }
            } else {
                throw new Error("Error in highlight rectangles merging : could not find any points to continue the highlight polygon");
            }
            newPath.points.push(currPoint);
            if (isOnOther) {
                const intersectionIndex = this.getIntersectionIndex(currPoint, nextPoint);
                if (intersectionIndex == -1) {
                    currPoint = nextPoint;
                } else {
                    if (currPoint.x == nextPoint.x) {
                        currPoint = new drawPoint(currPoint.x, this.points[intersectionIndex].y);
                    } else {
                        currPoint = new drawPoint(this.points[intersectionIndex].x, currPoint.y);
                    }
                }
            } else {
                const intersectionIndex = _other.getIntersectionIndex(currPoint, nextPoint);
                if (intersectionIndex == -1) {
                    currPoint = nextPoint;
                } else {
                    if (currPoint.x == nextPoint.x) {
                        currPoint = new drawPoint(currPoint.x, _other.points[intersectionIndex].y);
                    } else {
                        currPoint = new drawPoint(_other.points[intersectionIndex].x, currPoint.y);
                    }
                }
            }
            counter--;
            if (this.points[startIndex].x == currPoint.x && this.points[startIndex].y == currPoint.y) {
                finish = true;
            }
        }
        return newPath;
    }
}
customElements.define('glasscockpit-highlight', Highlight);
//# sourceMappingURL=highlight.js.map