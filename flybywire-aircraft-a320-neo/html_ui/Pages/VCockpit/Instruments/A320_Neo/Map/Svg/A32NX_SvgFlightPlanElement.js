class SvgFlightPlanElement extends SvgMapElement {
    constructor() {
        super(...arguments);
        this.flightPlanIndex = NaN;
        this.highlightActiveLeg = true;
        this.points = [];
        this.latLong = new LatLong();
        this._debugTransitionIndex = 0;
        this._lastP0X = NaN;
        this._lastP0Y = NaN;
        this.hideReachedWaypoints = true;
        this._highlightedLegIndex = -1;
        this._isDashed = false;
    }

    id(map) {
        return "flight-plan-" + this.flightPlanIndex + "-map-" + map.index;
    }

    createDraw(map) {
        const container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        container.setAttribute("overflow", "visible");
        if (map.config.flightPlanNonActiveLegStrokeWidth > 0) {
            this._outlinePath = document.createElementNS(Avionics.SVG.NS, "path");
            this._outlinePath.setAttribute("stroke", map.config.flightPlanNonActiveLegStrokeColor);
            this._outlinePath.setAttribute("fill", "none");
            const outlinePathWidth = fastToFixed((map.config.flightPlanNonActiveLegStrokeWidth / map.overdrawFactor + map.config.flightPlanNonActiveLegWidth / map.overdrawFactor), 0);
            this._outlinePath.setAttribute("stroke-width", outlinePathWidth);
            this._outlinePath.setAttribute("stroke-linecap", "square");
            container.appendChild(this._outlinePath);
            this._outlineActive = document.createElementNS(Avionics.SVG.NS, "path");
            this._outlineActive.setAttribute("stroke", map.config.flightPlanActiveLegStrokeColor);
            this._outlineActive.setAttribute("fill", "none");
            const outlineActiveWidth = fastToFixed((map.config.flightPlanActiveLegStrokeWidth / map.overdrawFactor + map.config.flightPlanActiveLegWidth / map.overdrawFactor), 0);
            this._outlineActive.setAttribute("stroke-width", outlineActiveWidth);
            this._outlineActive.setAttribute("stroke-linecap", "square");
            container.appendChild(this._outlineActive);
            this._transitionOutlinePath = document.createElementNS(Avionics.SVG.NS, "path");
            this._transitionOutlinePath.setAttribute("stroke", map.config.flightPlanNonActiveLegStrokeColor);
            this._transitionOutlinePath.setAttribute("fill", "none");
            this._transitionOutlinePath.setAttribute("stroke-width", outlinePathWidth);
            this._transitionOutlinePath.setAttribute("stroke-linecap", "square");
            container.appendChild(this._transitionOutlinePath);
        }
        this._colorPath = document.createElementNS(Avionics.SVG.NS, "path");
        this._colorPath.setAttribute("stroke", map.config.flightPlanNonActiveLegColor);
        this._colorPath.setAttribute("fill", "none");
        if (this.flightPlanIndex === 1) {
            this._colorPath.setAttribute("stroke", "yellow");
        }
        const colorPathWidth = fastToFixed(map.config.flightPlanNonActiveLegWidth / map.overdrawFactor, 0);
        this._colorPath.setAttribute("stroke-width", colorPathWidth);
        this._colorPath.setAttribute("stroke-linecap", "square");
        container.appendChild(this._colorPath);
        this._colorActive = document.createElementNS(Avionics.SVG.NS, "path");
        this._colorActive.setAttribute("stroke", map.config.flightPlanActiveLegColor);
        this._colorActive.setAttribute("fill", "none");
        if (this.flightPlanIndex === 1) {
            this._colorActive.setAttribute("stroke", "yellow");
        }
        const colorActiveWidth = fastToFixed(map.config.flightPlanActiveLegWidth / map.overdrawFactor, 0);
        this._colorActive.setAttribute("stroke-width", colorActiveWidth);
        this._colorActive.setAttribute("stroke-linecap", "square");
        container.appendChild(this._colorActive);
        this._transitionPath = document.createElementNS(Avionics.SVG.NS, "path");
        this._transitionPath.setAttribute("stroke", map.config.flightPlanNonActiveLegColor);
        this._transitionPath.setAttribute("fill", "none");
        if (this.flightPlanIndex === 1) {
            this._transitionPath.setAttribute("stroke", "yellow");
        }
        this._transitionPath.setAttribute("stroke-width", colorPathWidth);
        this._transitionPath.setAttribute("stroke-linecap", "square");
        container.appendChild(this._transitionPath);
        this.setAsDashed(this._isDashed, true);
        return container;
    }

    updateDraw(map) {
        this._highlightedLegIndex = SimVar.GetSimVarValue("L:MAP_FLIGHTPLAN_HIGHLIT_WAYPOINT", "number");
        this.points = [];

        const geometry = this.source.getMultipleLegGeometry(false);

        const paths = geometry ? [this.makePathFromGeometry(geometry, map)] : [];
        paths.forEach((path, index) => this.makeOrUpdatePathElement(path, index, map));
        this.removeTrailingPathElements(paths.length);
    }

    /**
     *
     * @param geometry {Geometry}
     * @param map
     */
    makePathFromGeometry(geometry, map) {
        const path = [];

        let x = null;
        let y = null;

        const firstLeg = geometry.legs.get(1);

        // initial transition
        if (geometry.transitions.has(1)) {
            // draw the initial transition fully
            const transition = geometry.transitions.get(1);
            const [inbound, outbound] = transition.getTurningPoints();

            const {x: inbndX, y: inbndY} = map.coordinatesToXY(inbound);
            x = fastToFixed(inbndX, 1);
            y = fastToFixed(inbndY, 1);

            // move to starting point of transition
            path.push(`M ${x} ${y}`);

            // draw first transition
            const r = fastToFixed(transition.radius * map.NMToPixels(1), 0);
            const { x: outbndX, y: outbndY } = map.coordinatesToXY(outbound);

            x = fastToFixed(outbndX, 1);
            y = fastToFixed(outbndY, 1);
            const cw = transition.clockwise;

            path.push(`A ${r} ${r} 0 0 ${cw ? 1 : 0} ${x} ${y}`);
        } else if (geometry.legs.has(1)) {
            // Move to the starting point of the first leg
            const { x: toX, y: toY } = map.coordinatesToXY(firstLeg.from.infos.coordinates);
            x = fastToFixed(toX, 1);
            y = fastToFixed(toY, 1);

            path.push(`M ${x} ${y}`);

            // If the "to" waypoint ends in a discontinuity, we won't draw a line there later, so do it now
            if (firstLeg.to.endsInDiscontinuity) {
                const { x: toX, y: toY } = map.coordinatesToXY(firstLeg.to.infos.coordinates);

                x = fastToFixed(toX, 1);
                y = fastToFixed(toY, 1);

                path.push(`L ${x} ${y}`);
            }
        }

        let finalLeg = firstLeg;
        for (let i = 2; i <= geometry.legs.size; i++) {
            const [prevLeg, leg] = [geometry.legs.get(i - 1), geometry.legs.get(i)];
            const transition = geometry.transitions.get(i);

            if (transition) {
                // draw line to start of transition
                const [inbound, outbound] = transition.getTurningPoints();

                const {x: inbndX, y: inbndY} = map.coordinatesToXY(inbound);
                x = fastToFixed(inbndX, 1);
                y = fastToFixed(inbndY, 1);
                path.push(`${path.length ? "L" : "M"} ${x} ${y}`);

                // draw transition itself to end of transition
                const r = fastToFixed(transition.radius * map.NMToPixels(1), 0);
                const {x: outbndX, y: outbndY} = map.coordinatesToXY(outbound);

                x = fastToFixed(outbndX, 1);
                y = fastToFixed(outbndY, 1);
                const cw = transition.clockwise;

                path.push(`A ${r} ${r} 0 0 ${cw ? 1 : 0} ${x} ${y}`);

                /*const { x: cX, y: cY } = map.coordinatesToXY(transition.center);
                const pcx = fastToFixed(cX, 1);
                const pcy = fastToFixed(cY, 1);*/
            }

            // If there was no transition but the leg exists, we M or L to the from waypoint
            if (!transition && leg) {
                // draw line to start of next leg
                const { x: fromX, y: fromY } = map.coordinatesToXY(leg.from.infos.coordinates);
                x = fastToFixed(fromX, 1);
                y = fastToFixed(fromY, 1);

                // If the previous leg ended in a discontinuity OR this is the fist leg, we use an M command
                let lineCommand;
                if (prevLeg && prevLeg.to.endsInDiscontinuity) {
                    lineCommand = 'M';
                } else {
                    lineCommand = path.length > 0 ? 'L' : 'M';
                }

                path.push(`${lineCommand} ${x} ${y}`);
            }

            // If the to waypoint ends in a discontinuity, we will not L to it for the next leg - do that now
            if (leg && leg.to.endsInDiscontinuity) {
                // draw line to end of leg
                const { x: fromX, y: fromY } = map.coordinatesToXY(leg.to.infos.coordinates);
                x = fastToFixed(fromX, 1);
                y = fastToFixed(fromY, 1);

                path.push(`L ${x} ${y}`);
            }

            finalLeg = leg;
        }

        // draw to final leg
        if (finalLeg) {
            const { x: fromX, y: fromY } = map.coordinatesToXY(finalLeg.to.infos.coordinates);
            x = fastToFixed(fromX, 1);
            y = fastToFixed(fromY, 1);
            path.push(`${path.length ? "L" : "M"} ${x} ${y}`);
        }

        return path.join(" ");
    }

    /**
     * @param pathString {string}
     * @param index {number}
     * @param map
     */
    makeOrUpdatePathElement(pathString, index, map) {
        const existingElement = document.getElementById(`flight-plan-segment-${index}`);

        if (existingElement) {
            if (existingElement.getAttribute("d") !== pathString) {
                existingElement.setAttribute("d", pathString);
            }
        } else {
            const newElement = document.createElementNS(Avionics.SVG.NS, "path");

            newElement.setAttribute("id", `flight-plan-segment-${index}`);
            newElement.setAttribute("d", pathString);

            if (this.flightPlanIndex === 1) {
                newElement.setAttribute("stroke", "yellow");
            } else {
                newElement.setAttribute("stroke", map.config.flightPlanNonActiveLegColor);
            }

            newElement.setAttribute("fill", "none");

            newElement.setAttribute("stroke-width", fastToFixed(map.config.flightPlanNonActiveLegWidth, 0));
            newElement.setAttribute("stroke-linecap", "square");

            document.getElementById(this.id(map))
                .appendChild(newElement);
        }
    }

    /**
     * Remove any path elements that exist past the expected number of path elements from the DOM.
     * @param pathCount {number}
     */
    removeTrailingPathElements(pathCount) {
        let i = pathCount;
        let existingElement = document.getElementById(`flight-plan-segment-${i}`);
        while (existingElement) {
            existingElement.remove();
            i++;
            existingElement = document.getElementById(`flight-plan-segment-${i}`);
        }
    }

    setAsDashed(_val, _force = false) {
        if (_force || (_val != this._isDashed)) {
            this._isDashed = _val;
            if (this._colorActive && this._colorPath) {
                if (this._isDashed) {
                    const length = 14;
                    const spacing = 8;
                    this._colorPath.removeAttribute("stroke-linecap");
                    this._colorPath.setAttribute("stroke-dasharray", length + " " + spacing);
                    this._colorActive.removeAttribute("stroke-linecap");
                    this._colorActive.setAttribute("stroke-dasharray", length + " " + spacing);
                } else {
                    this._colorPath.removeAttribute("stroke-dasharray");
                    this._colorPath.setAttribute("stroke-linecap", "square");
                    this._colorActive.removeAttribute("stroke-dasharray");
                    this._colorActive.setAttribute("stroke-linecap", "square");
                }
            }
        }
    }
}

class SvgBackOnTrackElement extends SvgMapElement {
    constructor(overrideColor = "") {
        super();
        this.overrideColor = overrideColor;
        this._id = "back-on-track-" + SvgBackOnTrackElement.ID;
        SvgBackOnTrackElement.ID++;
    }

    id(map) {
        return this._id + "-map-" + map.index;

    }

    createDraw(map) {
        const container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        container.setAttribute("overflow", "visible");
        if (map.config.flightPlanDirectLegStrokeWidth > 0) {
            this._outlineLine = document.createElementNS(Avionics.SVG.NS, "line");
            this._outlineLine.setAttribute("stroke", this.overrideColor != "" ? this.overrideColor : map.config.flightPlanDirectLegStrokeColor);
            const outlineDirectLegWidth = fastToFixed((map.config.flightPlanDirectLegStrokeWidth / map.overdrawFactor + map.config.flightPlanDirectLegWidth), 0);
            this._outlineLine.setAttribute("stroke-width", outlineDirectLegWidth);
            this._outlineLine.setAttribute("stroke-linecap", "square");
            container.appendChild(this._outlineLine);
        }
        this._colorLine = document.createElementNS(Avionics.SVG.NS, "line");
        this._colorLine.setAttribute("stroke", this.overrideColor != "" ? this.overrideColor : map.config.flightPlanDirectLegColor);
        const colorDirectLegWidth = fastToFixed(map.config.flightPlanDirectLegWidth / map.overdrawFactor, 0);
        this._colorLine.setAttribute("stroke-width", colorDirectLegWidth);
        this._colorLine.setAttribute("stroke-linecap", "square");
        container.appendChild(this._colorLine);
        return container;
    }

    updateDraw(map) {
        const p1 = map.coordinatesToXY(this.llaRequested);
        let p2;
        if (this.targetWaypoint) {
            p2 = map.coordinatesToXY(this.targetWaypoint.infos.coordinates);
        } else if (this.targetLla) {
            p2 = map.coordinatesToXY(this.targetLla);
        }
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        dx /= d;
        dy /= d;
        p1.x += dx * 5;
        p1.y += dy * 5;
        p2.x -= dx * 5;
        p2.y -= dy * 5;
        this._colorLine.setAttribute("x1", fastToFixed(p1.x, 0));
        this._colorLine.setAttribute("y1", fastToFixed(p1.y, 0));
        this._colorLine.setAttribute("x2", fastToFixed(p2.x, 0));
        this._colorLine.setAttribute("y2", fastToFixed(p2.y, 0));
        if (this._outlineLine) {
            this._outlineLine.setAttribute("x1", fastToFixed(p1.x, 0));
            this._outlineLine.setAttribute("y1", fastToFixed(p1.y, 0));
            this._outlineLine.setAttribute("x2", fastToFixed(p2.x, 0));
            this._outlineLine.setAttribute("y2", fastToFixed(p2.y, 0));
        }
    }
}

SvgBackOnTrackElement.ID = 0;

class SvgDirectToElement extends SvgMapElement {
    constructor(overrideColor = "") {
        super();
        this.overrideColor = overrideColor;
        this._id = "direct-to-" + SvgDirectToElement.ID;
        SvgDirectToElement.ID++;
    }

    id(map) {
        return this._id + "-map-" + map.index;

    }

    createDraw(map) {
        const container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        container.setAttribute("overflow", "visible");
        if (map.config.flightPlanDirectLegStrokeWidth > 0) {
            this._outlineLine = document.createElementNS(Avionics.SVG.NS, "line");
            this._outlineLine.setAttribute("stroke", this.overrideColor != "" ? this.overrideColor : map.config.flightPlanDirectLegStrokeColor);
            const outlineDirectLegWidth = fastToFixed((map.config.flightPlanDirectLegStrokeWidth / map.overdrawFactor + map.config.flightPlanDirectLegWidth), 0);
            this._outlineLine.setAttribute("stroke-width", outlineDirectLegWidth);
            this._outlineLine.setAttribute("stroke-linecap", "square");
            container.appendChild(this._outlineLine);
        }
        this._colorLine = document.createElementNS(Avionics.SVG.NS, "line");
        this._colorLine.setAttribute("stroke", this.overrideColor != "" ? this.overrideColor : map.config.flightPlanDirectLegColor);
        const colorDirectLegWidth = fastToFixed(map.config.flightPlanDirectLegWidth / map.overdrawFactor, 0);
        this._colorLine.setAttribute("stroke-width", colorDirectLegWidth);
        this._colorLine.setAttribute("stroke-linecap", "square");
        container.appendChild(this._colorLine);
        return container;
    }

    updateDraw(map) {
        const p1 = map.coordinatesToXY(this.llaRequested);
        let p2;
        if (this.targetWaypoint) {
            p2 = map.coordinatesToXY(this.targetWaypoint.infos.coordinates);
        } else if (this.targetLla) {
            p2 = map.coordinatesToXY(this.targetLla);
        }
        if (SimVar.GetSimVarValue("GPS OBS ACTIVE", "boolean")) {
            const magvar = SimVar.GetSimVarValue("MAGVAR", "degrees");
            const dir = SimVar.GetSimVarValue("GPS OBS VALUE", "degree") + magvar;
            const offsetLat = map.NMToPixels(360) * Math.cos(dir * Math.PI / 180);
            const offsetLong = map.NMToPixels(360) * Math.sin(dir * Math.PI / 180);
            p1.x -= offsetLong;
            p1.y += offsetLat;
            p2.x -= p1.x - p2.x;
            p2.y -= p1.y - p2.y;
        }
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        dx /= d;
        dy /= d;
        p1.x += dx * 5;
        p1.y += dy * 5;
        p2.x -= dx * 5;
        p2.y -= dy * 5;
        this._colorLine.setAttribute("x1", fastToFixed(p1.x, 0));
        this._colorLine.setAttribute("y1", fastToFixed(p1.y, 0));
        this._colorLine.setAttribute("x2", fastToFixed(p2.x, 0));
        this._colorLine.setAttribute("y2", fastToFixed(p2.y, 0));
        if (this._outlineLine) {
            this._outlineLine.setAttribute("x1", fastToFixed(p1.x, 0));
            this._outlineLine.setAttribute("y1", fastToFixed(p1.y, 0));
            this._outlineLine.setAttribute("x2", fastToFixed(p2.x, 0));
            this._outlineLine.setAttribute("y2", fastToFixed(p2.y, 0));
        }
    }
}

SvgDirectToElement.ID = 0;

class SvgApproachFlightPlanDebugElement extends SvgMapElement {
    constructor() {
        super(...arguments);
        this.flightPlanIndex = NaN;
    }

    id(map) {
        return "flight-plan-" + this.flightPlanIndex + "-map-" + map.index;

    }

    createDraw(map) {
        const container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        container.setAttribute("overflow", "visible");
        this._path = document.createElementNS(Avionics.SVG.NS, "path");
        this._path.setAttribute("stroke", "red");
        this._path.setAttribute("stroke-width", "4");
        this._path.setAttribute("fill", "none");
        container.appendChild(this._path);
        return container;
    }

    updateDraw(map) {
        if (this.source && this.source.waypoints) {
            let d = "";
            const waypoints = this.source.waypoints;
            for (let i = 0; i < waypoints.length; i++) {
                const wpPoints = [];
                if (waypoints[i].transitionLLas) {
                    for (let j = 0; j < waypoints[i].transitionLLas.length; j++) {
                        wpPoints.push(waypoints[i].transitionLLas[j]);
                    }
                }
                wpPoints.push(waypoints[i].lla);
                for (let j = 0; j < wpPoints.length; j++) {
                    const lla = wpPoints[j];
                    const xy = map.coordinatesToXY(lla);
                    if (i === 0 && j === 0) {
                        d += "M" + xy.x.toFixed(0) + " " + xy.y.toFixed(0) + " ";
                    } else {
                        d += "L" + xy.x.toFixed(0) + " " + xy.y.toFixed(0) + " ";
                    }
                }
            }
            this._path.setAttribute("d", d);
        }
    }
}

//# sourceMappingURL=SvgFlightPlanElement.js.map
