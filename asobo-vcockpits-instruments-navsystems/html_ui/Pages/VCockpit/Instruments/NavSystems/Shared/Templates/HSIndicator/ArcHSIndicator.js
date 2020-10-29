class ArcHSIIndicator extends HSIndicator {
    createSVG() {
        Utils.RemoveAllChildren(this);
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "-28 -15 156 116");
        this.appendChild(this.root);
        {
            {
                const arcSize = 55;
                const arcRadius = 77.5;
                const arcWidth = 5;
                const beginPointHalfUnitSize = (arcSize / 2) / arcRadius;
                const beginPointTopX = 50 - Math.sin(beginPointHalfUnitSize) * (arcRadius + arcWidth / 2);
                const beginPointBotX = 50 - Math.sin(beginPointHalfUnitSize) * (arcRadius - arcWidth / 2);
                const endPointTopX = 50 + Math.sin(beginPointHalfUnitSize) * (arcRadius + arcWidth / 2);
                const endPointBotX = 50 + Math.sin(beginPointHalfUnitSize) * (arcRadius - arcWidth / 2);
                const pointTopY = 120 - Math.cos(beginPointHalfUnitSize) * (arcRadius + arcWidth / 2);
                const pointBotY = 120 - Math.cos(beginPointHalfUnitSize) * (arcRadius - arcWidth / 2);
                const turnRateBackground = document.createElementNS(Avionics.SVG.NS, "path");
                let path = "M" + beginPointBotX + " " + pointBotY + "A " + (arcRadius - arcWidth / 2) + " " + (arcRadius - arcWidth / 2) + " 0 0 1 " + endPointBotX + " " + pointBotY;
                path += "L" + endPointTopX + " " + pointTopY + "A " + (arcRadius + arcWidth / 2) + " " + (arcRadius + arcWidth / 2) + " 0 0 0 " + beginPointTopX + " " + pointTopY;
                turnRateBackground.setAttribute("d", path);
                turnRateBackground.setAttribute("fill", "#1a1d21");
                turnRateBackground.setAttribute("fill-opacity", "0.25");
                this.root.appendChild(turnRateBackground);
                const lines = [-18, -9, 9, 18];
                for (let i = 0; i < lines.length; i++) {
                    const line = document.createElementNS(Avionics.SVG.NS, "rect");
                    line.setAttribute("x", "49.5");
                    line.setAttribute("y", (45 - arcWidth).toString());
                    line.setAttribute("width", "1");
                    line.setAttribute("height", arcWidth.toString());
                    line.setAttribute("transform", "rotate(" + lines[i] + " 50 120)");
                    line.setAttribute("fill", "white");
                    this.root.appendChild(line);
                }
            }
            {
                const turnRateArc = document.createElementNS(Avionics.SVG.NS, "path");
                this.turnRateArc = turnRateArc;
                turnRateArc.setAttribute("fill", "#d12bc7");
                this.root.appendChild(turnRateArc);
            }
        }
        {
            this.backgroundCircle = document.createElementNS(Avionics.SVG.NS, "g");
            this.root.appendChild(this.backgroundCircle);
            {
                const circle = document.createElementNS(Avionics.SVG.NS, "circle");
                circle.setAttribute("cx", "50");
                circle.setAttribute("cy", "120");
                circle.setAttribute("r", "75");
                circle.setAttribute("fill", "#1a1d21");
                circle.setAttribute("fill-opacity", "0.25");
                this.backgroundCircle.appendChild(circle);
            }
            {
                let angle = 0;
                for (let i = 0; i < 72; i++) {
                    const line = document.createElementNS(Avionics.SVG.NS, "rect");
                    const length = i % 2 == 0 ? 4 : 2;
                    line.setAttribute("x", "49.5");
                    line.setAttribute("y", "45");
                    line.setAttribute("width", "1");
                    line.setAttribute("height", length.toString());
                    line.setAttribute("transform", "rotate(" + ((-angle / Math.PI) * 180 + 180) + " 50 120)");
                    line.setAttribute("fill", "white");
                    angle += (2 * Math.PI) / 72;
                    this.backgroundCircle.appendChild(line);
                }
            }
            {
                const texts = ["N", "3", "6", "E", "12", "15", "S", "21", "24", "W", "30", "33"];
                let angle = 0;
                for (let i = 0; i < texts.length; i++) {
                    const text = document.createElementNS(Avionics.SVG.NS, "text");
                    text.textContent = texts[i];
                    text.setAttribute("x", "50");
                    text.setAttribute("y", (i % 3) == 0 ? "59" : "56");
                    text.setAttribute("fill", "white");
                    text.setAttribute("font-size", (i % 3) == 0 ? "18" : "10");
                    text.setAttribute("font-family", "Roboto-Bold");
                    text.setAttribute("text-anchor", "middle");
                    text.setAttribute("alignment-baseline", "central");
                    text.setAttribute("transform", "rotate(" + angle + " 50 120)");
                    angle += 360 / texts.length;
                    this.backgroundCircle.appendChild(text);
                }
            }
            {
                this.headingBug = document.createElementNS(Avionics.SVG.NS, "polygon");
                this.headingBug.setAttribute("points", "46,45 47,45 50,49 53,45 54,45 54,50 46,50");
                this.headingBug.setAttribute("fill", "aqua");
                this.backgroundCircle.appendChild(this.headingBug);
            }
        }
        {
            this.currentTrackIndicator = document.createElementNS(Avionics.SVG.NS, "polygon");
            this.currentTrackIndicator.setAttribute("points", "50,41 52,45 50,49 48,45");
            this.currentTrackIndicator.setAttribute("fill", "#d12bc7");
            this.backgroundCircle.appendChild(this.currentTrackIndicator);
        }
        {
            this.course = document.createElementNS(Avionics.SVG.NS, "g");
            this.backgroundCircle.appendChild(this.course);
            {
                this.beginArrow = document.createElementNS(Avionics.SVG.NS, "polygon");
                this.beginArrow.setAttribute("points", "51,192 49,192 49,60 45,60 50,49 55,60 51,60");
                this.beginArrow.setAttribute("fill", "#d12bc7");
                this.course.appendChild(this.beginArrow);
            }
        }
        {
            const topTriangle = document.createElementNS(Avionics.SVG.NS, "polygon");
            topTriangle.setAttribute("points", "46,42 54,42 50,48");
            topTriangle.setAttribute("fill", "white");
            topTriangle.setAttribute("stroke", "black");
            this.root.appendChild(topTriangle);
        }
        {
            const bearingRectangle = document.createElementNS(Avionics.SVG.NS, "rect");
            bearingRectangle.setAttribute("x", "35");
            bearingRectangle.setAttribute("y", "30");
            bearingRectangle.setAttribute("height", "12");
            bearingRectangle.setAttribute("width", "30");
            bearingRectangle.setAttribute("fill", "#1a1d21");
            this.root.appendChild(bearingRectangle);
            const bearingText = document.createElementNS(Avionics.SVG.NS, "text");
            bearingText.setAttribute("fill", "white");
            bearingText.setAttribute("text-anchor", "middle");
            bearingText.setAttribute("x", "50");
            bearingText.setAttribute("y", "40");
            bearingText.setAttribute("font-size", "11");
            bearingText.setAttribute("font-family", "Roboto-Bold");
            this.bearingText = bearingText;
            this.root.appendChild(bearingText);
        }
        if (this.displayStyle == HSIndicatorDisplayType.HUD_Simplified) {
            return;
        }
        {
            const headingRectangle = document.createElementNS(Avionics.SVG.NS, "rect");
            headingRectangle.setAttribute("x", "-28");
            headingRectangle.setAttribute("y", "48");
            headingRectangle.setAttribute("height", "8");
            headingRectangle.setAttribute("width", "36");
            headingRectangle.setAttribute("fill", "#1a1d21");
            headingRectangle.setAttribute("fill-opacity", "1");
            this.root.appendChild(headingRectangle);
            const headingLeftText = document.createElementNS(Avionics.SVG.NS, "text");
            headingLeftText.textContent = "HDG";
            headingLeftText.setAttribute("fill", "white");
            headingLeftText.setAttribute("x", "-26");
            headingLeftText.setAttribute("y", "54.4");
            headingLeftText.setAttribute("font-size", "7");
            headingLeftText.setAttribute("font-family", "Roboto");
            this.root.appendChild(headingLeftText);
            const headingValue = document.createElementNS(Avionics.SVG.NS, "text");
            headingValue.setAttribute("fill", "#36c8d2");
            headingValue.setAttribute("x", "-10");
            headingValue.setAttribute("y", "54.4");
            headingValue.setAttribute("font-size", "7");
            headingValue.setAttribute("font-family", "Roboto");
            this.headingText = headingValue;
            this.root.appendChild(headingValue);
        }
        {
            const courseRectangle = document.createElementNS(Avionics.SVG.NS, "rect");
            courseRectangle.setAttribute("x", "92");
            courseRectangle.setAttribute("y", "48");
            courseRectangle.setAttribute("height", "8");
            courseRectangle.setAttribute("width", "36");
            courseRectangle.setAttribute("fill", "#1a1d21");
            this.root.appendChild(courseRectangle);
            const courseLeftText = document.createElementNS(Avionics.SVG.NS, "text");
            courseLeftText.textContent = "CRS";
            courseLeftText.setAttribute("fill", "white");
            courseLeftText.setAttribute("x", "94");
            courseLeftText.setAttribute("y", "54.4");
            courseLeftText.setAttribute("font-size", "7");
            courseLeftText.setAttribute("font-family", "Roboto");
            this.root.appendChild(courseLeftText);
            const courseValue = document.createElementNS(Avionics.SVG.NS, "text");
            courseValue.setAttribute("fill", "#d12bc7");
            courseValue.setAttribute("x", "110");
            courseValue.setAttribute("y", "54.4");
            courseValue.setAttribute("font-size", "7");
            courseValue.setAttribute("font-family", "Roboto");
            this.courseText = courseValue;
            this.root.appendChild(courseValue);
        }
        {
            this.navSourceBg = document.createElementNS(Avionics.SVG.NS, "rect");
            this.navSourceBg.setAttribute("fill", "#1a1d21");
            this.navSourceBg.setAttribute("fill-opacity", "1");
            this.navSourceBg.setAttribute("x", "28");
            this.navSourceBg.setAttribute("y", "74.5");
            this.navSourceBg.setAttribute("height", "7");
            this.navSourceBg.setAttribute("width", "14");
            this.root.appendChild(this.navSourceBg);
            this.navSource = document.createElementNS(Avionics.SVG.NS, "text");
            this.navSource.textContent = "GPS";
            this.navSource.setAttribute("fill", "#d12bc7");
            this.navSource.setAttribute("x", "35");
            this.navSource.setAttribute("y", "80");
            this.navSource.setAttribute("font-size", "6");
            this.navSource.setAttribute("font-family", "Roboto-Bold");
            this.navSource.setAttribute("text-anchor", "middle");
            this.root.appendChild(this.navSource);
            this.flightPhaseBg = document.createElementNS(Avionics.SVG.NS, "rect");
            this.flightPhaseBg.setAttribute("fill", "#1a1d21");
            this.flightPhaseBg.setAttribute("fill-opacity", "1");
            this.flightPhaseBg.setAttribute("x", "57");
            this.flightPhaseBg.setAttribute("y", "74.5");
            this.flightPhaseBg.setAttribute("height", "7");
            this.flightPhaseBg.setAttribute("width", "16");
            this.root.appendChild(this.flightPhaseBg);
            const flightPhase = document.createElementNS(Avionics.SVG.NS, "text");
            flightPhase.textContent = "TERM";
            flightPhase.setAttribute("fill", "#d12bc7");
            flightPhase.setAttribute("x", "65");
            flightPhase.setAttribute("y", "80");
            flightPhase.setAttribute("font-size", "6");
            flightPhase.setAttribute("font-family", "Roboto-Bold");
            flightPhase.setAttribute("text-anchor", "middle");
            this.flightPhase = flightPhase;
            this.root.appendChild(flightPhase);
        }
        {
            const cdiBackground = document.createElementNS(Avionics.SVG.NS, "rect");
            cdiBackground.setAttribute("x", "10");
            cdiBackground.setAttribute("y", "90");
            cdiBackground.setAttribute("width", "80");
            cdiBackground.setAttribute("height", "15");
            cdiBackground.setAttribute("fill", "#1a1d21");
            cdiBackground.setAttribute("stroke", "white");
            cdiBackground.setAttribute("stroke-width", "1");
            this.root.appendChild(cdiBackground);
            const circlePosition = [-30, -15, 15, 30];
            for (let i = 0; i < circlePosition.length; i++) {
                const CDICircle = document.createElementNS(Avionics.SVG.NS, "circle");
                CDICircle.setAttribute("cx", (50 + circlePosition[i]).toString());
                CDICircle.setAttribute("cy", "96");
                CDICircle.setAttribute("r", "1.5");
                CDICircle.setAttribute("stroke", "white");
                CDICircle.setAttribute("stroke-width", "0.75");
                CDICircle.setAttribute("fill-opacity", "0");
                this.root.appendChild(CDICircle);
            }
            this.cdiCentralLine = document.createElementNS(Avionics.SVG.NS, "rect");
            this.cdiCentralLine.setAttribute("x", "49.75");
            this.cdiCentralLine.setAttribute("y", "90");
            this.cdiCentralLine.setAttribute("width", "0.5");
            this.cdiCentralLine.setAttribute("height", "15");
            this.cdiCentralLine.setAttribute("fill", "white");
            this.root.appendChild(this.cdiCentralLine);
            {
                const CDISvg = document.createElementNS(Avionics.SVG.NS, "svg");
                CDISvg.setAttribute("x", "10");
                CDISvg.setAttribute("y", "90");
                CDISvg.setAttribute("width", "80");
                CDISvg.setAttribute("height", "15");
                CDISvg.setAttribute("viewBox", "10 90 80 15");
                this.root.appendChild(CDISvg);
                this.CDI = document.createElementNS(Avionics.SVG.NS, "g");
                CDISvg.appendChild(this.CDI);
                this.toIndicator = document.createElementNS(Avionics.SVG.NS, "polygon");
                this.toIndicator.setAttribute("points", "50,94 46,98 54,98");
                this.toIndicator.setAttribute("fill", "#d12bc7");
                this.CDI.appendChild(this.toIndicator);
                this.fromIndicator = document.createElementNS(Avionics.SVG.NS, "polygon");
                this.fromIndicator.setAttribute("points", "50,98 46,94 54,94");
                this.fromIndicator.setAttribute("fill", "#d12bc7");
                this.CDI.appendChild(this.fromIndicator);
            }
            this.crossTrackError = document.createElementNS(Avionics.SVG.NS, "text");
            this.crossTrackError.textContent = "3.15NM";
            this.crossTrackError.setAttribute("fill", "#d12bc7");
            this.crossTrackError.setAttribute("x", "50");
            this.crossTrackError.setAttribute("y", "99");
            this.crossTrackError.setAttribute("font-size", "6");
            this.crossTrackError.setAttribute("font-family", "Roboto-Bold");
            this.crossTrackError.setAttribute("text-anchor", "middle");
            this.root.appendChild(this.crossTrackError);
        }
        {
            {
                this.dme = document.createElementNS(Avionics.SVG.NS, "g");
                this.dme.setAttribute("display", "none");
                this.root.appendChild(this.dme);
                const dmeZone = document.createElementNS(Avionics.SVG.NS, "rect");
                dmeZone.setAttribute("x", "-15");
                dmeZone.setAttribute("y", "20");
                dmeZone.setAttribute("height", "26");
                dmeZone.setAttribute("width", "36");
                dmeZone.setAttribute("fill", "#1a1d21");
                dmeZone.setAttribute("fill-opacity", "1");
                this.dme.appendChild(dmeZone);
                const dme1 = document.createElementNS(Avionics.SVG.NS, "text");
                dme1.textContent = "DME";
                dme1.setAttribute("fill", "white");
                dme1.setAttribute("x", "-13");
                dme1.setAttribute("y", "26");
                dme1.setAttribute("font-size", "6");
                dme1.setAttribute("font-family", "Roboto-Bold");
                dme1.setAttribute("text-anchor", "start");
                this.dme.appendChild(dme1);
                this.dmeSource = document.createElementNS(Avionics.SVG.NS, "text");
                this.dmeSource.textContent = "NAV1";
                this.dmeSource.setAttribute("fill", "#36c8d2");
                this.dmeSource.setAttribute("x", "-13");
                this.dmeSource.setAttribute("y", "32");
                this.dmeSource.setAttribute("font-size", "6");
                this.dmeSource.setAttribute("font-family", "Roboto-Bold");
                this.dmeSource.setAttribute("text-anchor", "start");
                this.dme.appendChild(this.dmeSource);
                this.dmeIdent = document.createElementNS(Avionics.SVG.NS, "text");
                this.dmeIdent.textContent = "117.80";
                this.dmeIdent.setAttribute("fill", "#36c8d2");
                this.dmeIdent.setAttribute("x", "-13");
                this.dmeIdent.setAttribute("y", "38");
                this.dmeIdent.setAttribute("font-size", "6");
                this.dmeIdent.setAttribute("font-family", "Roboto-Bold");
                this.dmeIdent.setAttribute("text-anchor", "start");
                this.dme.appendChild(this.dmeIdent);
                this.dmeDistance = document.createElementNS(Avionics.SVG.NS, "text");
                this.dmeDistance.textContent = "97.7NM";
                this.dmeDistance.setAttribute("fill", "white");
                this.dmeDistance.setAttribute("x", "-13");
                this.dmeDistance.setAttribute("y", "44");
                this.dmeDistance.setAttribute("font-size", "6");
                this.dmeDistance.setAttribute("font-family", "Roboto-Bold");
                this.dmeDistance.setAttribute("text-anchor", "start");
                this.dme.appendChild(this.dmeDistance);
            }
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "toggle_dme":
                this.isDmeDisplayed = !this.isDmeDisplayed;
                if (this.dme) {
                    if (this.isDmeDisplayed) {
                        this.dme.setAttribute("display", "inherit");
                    } else {
                        this.dme.setAttribute("display", "none");
                    }
                }
                break;
        }
        if (oldValue == newValue) {
            return;
        }
        switch (name) {
            case "rotation":
                this.backgroundCircle.setAttribute("transform", "rotate(" + (-newValue) + " 50 120)");
                if (this.bearingText) {
                    const brg = fastToFixed(parseFloat(newValue), 0);
                    this.bearingText.textContent = "000".slice(brg.length) + brg + "°";
                }
                break;
            case "heading_bug_rotation":
                this.headingBug.setAttribute("transform", "rotate(" + (newValue) + ", 50, 120)");
                if (this.headingText) {
                    let headingValue = parseFloat(newValue);
                    if (headingValue == 0) {
                        headingValue = 360;
                    }
                    const hdg = fastToFixed(headingValue, 0);
                    this.headingText.textContent = "000".slice(hdg.length) + hdg + "°";
                }
                break;
            case "course":
                if (this.course) {
                    this.course.setAttribute("transform", "rotate(" + (newValue) + ", 50, 120)");
                    if (this.courseText) {
                        const crs = fastToFixed(parseFloat(newValue), 0);
                        this.courseText.textContent = "000".slice(crs.length) + crs + "°";
                    }
                }
                break;
            case "course_deviation":
                if (this.CDI) {
                    const deviation = parseFloat(newValue);
                    if (this.sourceIsGps) {
                        this.crossTrackGoal = (Math.min(Math.max(deviation, -this.crosstrackFullError * 4 / 3), this.crosstrackFullError * 4 / 3) * (30 / this.crosstrackFullError));
                        if (Math.abs(deviation) < this.crosstrackFullError) {
                            Avionics.Utils.diffAndSetAttribute(this.crossTrackError, "visibility", "hidden");
                            Avionics.Utils.diffAndSetAttribute(this.cdiCentralLine, "visibility", "visible");
                        } else {
                            Avionics.Utils.diffAndSetAttribute(this.crossTrackError, "visibility", "visible");
                            Avionics.Utils.diffAndSetAttribute(this.cdiCentralLine, "visibility", "hidden");
                            this.crossTrackError.textContent = fastToFixed(Math.abs(deviation), 1) + "NM";
                        }
                    } else {
                        Avionics.Utils.diffAndSetAttribute(this.crossTrackError, "visibility", "hidden");
                        this.crossTrackGoal = (Math.min(Math.max(deviation, -4 / 3), 4 / 3) * 30);
                    }
                }
                break;
            case "turn_rate":
                {
                    if (this.turnRateArc) {
                        const value = Math.max(Math.min(parseFloat(newValue), 4), -4);
                        const arcAngle = 6 * value * Math.PI / 180;
                        const arcRadius = 78;
                        const arcWidth = 2;
                        const arrowWidth = 6;
                        const beginPointTopX = 50;
                        const beginPointBotX = 50;
                        const beginPointTopY = 120 - arcRadius - (arcWidth / 2);
                        const beginPointBotY = 120 - arcRadius + (arcWidth / 2);
                        const endPointTopX = 50 + Math.sin(arcAngle) * (arcRadius + arcWidth / 2);
                        const endPointBotX = 50 + Math.sin(arcAngle) * (arcRadius - arcWidth / 2);
                        const endPointTopY = 120 - Math.cos(arcAngle) * (arcRadius + arcWidth / 2);
                        const endPointBotY = 120 - Math.cos(arcAngle) * (arcRadius - arcWidth / 2);
                        let path;
                        if (value == 4 || value == -4) {
                            const endPointArrowTopX = 50 + Math.sin(arcAngle) * (arcRadius + arrowWidth / 2);
                            const endPointArrowBotX = 50 + Math.sin(arcAngle) * (arcRadius - arrowWidth / 2);
                            const endPointArrowTopY = 120 - Math.cos(arcAngle) * (arcRadius + arrowWidth / 2);
                            const endPointArrowBotY = 120 - Math.cos(arcAngle) * (arcRadius - arrowWidth / 2);
                            const endPointArrowEndX = 50 + Math.sin(arcAngle + (value > 0 ? 0.1 : -0.1)) * (arcRadius);
                            const endPointArrowEndY = 120 - Math.cos(arcAngle + (value > 0 ? 0.1 : -0.1)) * (arcRadius);
                            path = "M" + beginPointBotX + " " + beginPointBotY + "A " + (arcRadius - arcWidth / 2) + " " + (arcRadius - arcWidth / 2) + " 0 0 " + (arcAngle > 0 ? "1" : "0") + " " + endPointBotX + " " + endPointBotY;
                            path += "L" + endPointArrowBotX + " " + endPointArrowBotY + " L" + endPointArrowEndX + " " + endPointArrowEndY + " L" + endPointArrowTopX + " " + endPointArrowTopY;
                            path += "L" + endPointTopX + " " + endPointTopY + "A " + (arcRadius + arcWidth / 2) + " " + (arcRadius + arcWidth / 2) + " 0 0 " + (arcAngle > 0 ? "0" : "1") + " " + beginPointTopX + " " + beginPointTopY;
                        } else {
                            path = "M" + beginPointBotX + " " + beginPointBotY + "A " + (arcRadius - arcWidth / 2) + " " + (arcRadius - arcWidth / 2) + " 0 0 " + (arcAngle > 0 ? "1" : "0") + " " + endPointBotX + " " + endPointBotY;
                            path += "L" + endPointTopX + " " + endPointTopY + "A " + (arcRadius + arcWidth / 2) + " " + (arcRadius + arcWidth / 2) + " 0 0 " + (arcAngle > 0 ? "0" : "1") + " " + beginPointTopX + " " + beginPointTopY;
                        }
                        this.turnRateArc.setAttribute("d", path);
                    }
                }
                break;
            case "nav_source":
                if (this.navSource) {
                    this.navSource.textContent = newValue;
                    const rect = this.navSource.getBBox();
                    this.navSourceBg.setAttribute("width", (rect.width + 2).toString());
                    this.navSourceBg.setAttribute("x", (rect.x - 1).toString());
                    switch (newValue) {
                        case "FMS":
                            this.sourceIsGps = true;
                            this.beginArrow.setAttribute("fill", "#d12bc7");
                            this.beginArrow.setAttribute("fill-opacity", "1");
                            this.beginArrow.setAttribute("stroke", "");
                            this.navSource.setAttribute("fill", "#d12bc7");
                            this.flightPhase.setAttribute("visibility", "visible");
                            this.flightPhaseBg.setAttribute("visibility", "visible");
                            this.toIndicator.setAttribute("fill", "#d12bc7");
                            this.fromIndicator.setAttribute("fill", "#d12bc7");
                            break;
                        case "VOR1":
                        case "LOC1":
                            this.sourceIsGps = false;
                            this.beginArrow.setAttribute("fill", "#10c210");
                            this.beginArrow.setAttribute("fill-opacity", "1");
                            this.beginArrow.setAttribute("stroke", "");
                            this.navSource.setAttribute("fill", "#10c210");
                            this.flightPhase.setAttribute("visibility", "hidden");
                            this.flightPhaseBg.setAttribute("visibility", "hidden");
                            this.toIndicator.setAttribute("fill", "#10c210");
                            this.fromIndicator.setAttribute("fill", "#10c210");
                            break;
                        case "VOR2":
                        case "LOC2":
                            this.sourceIsGps = false;
                            this.beginArrow.setAttribute("fill-opacity", "0");
                            this.beginArrow.setAttribute("stroke", "#10c210");
                            this.navSource.setAttribute("fill", "#10c210");
                            this.flightPhase.setAttribute("visibility", "hidden");
                            this.flightPhaseBg.setAttribute("visibility", "hidden");
                            this.toIndicator.setAttribute("fill", "#10c210");
                            this.fromIndicator.setAttribute("fill", "#10c210");
                            break;
                    }
                }
                break;
            case "flight_phase":
                if (this.flightPhase) {
                    this.flightPhase.textContent = newValue;
                    const flightPhaseRect = this.flightPhase.getBBox();
                    this.flightPhaseBg.setAttribute("width", (flightPhaseRect.width + 2).toString());
                    this.flightPhaseBg.setAttribute("x", (flightPhaseRect.x - 1).toString());
                }
                break;
            case "crosstrack_full_error":
                this.crosstrackFullError = parseFloat(newValue);
                break;
            case "show_dme":
                this.isDmeDisplayed = newValue == "true";
                if (this.dme) {
                    if (this.isDmeDisplayed) {
                        this.dme.setAttribute("display", "inherit");
                    } else {
                        this.dme.setAttribute("display", "none");
                    }
                }
                break;
            case "dme_source":
                if (this.dmeSource) {
                    this.dmeSource.textContent = newValue;
                }
                break;
            case "dme_ident":
                if (this.dmeIdent) {
                    this.dmeIdent.textContent = newValue;
                }
                break;
            case "dme_distance":
                if (this.dmeDistance) {
                    this.dmeDistance.textContent = (newValue == "" ? "" : fastToFixed(parseFloat(newValue), 1) + " NM");
                }
                break;
            case "to_from":
                if (this.toIndicator && this.fromIndicator) {
                    switch (newValue) {
                        case "0":
                            this.toIndicator.setAttribute("display", "none");
                            this.fromIndicator.setAttribute("display", "none");
                            break;
                        case "1":
                            this.toIndicator.setAttribute("display", "inherit");
                            this.fromIndicator.setAttribute("display", "none");
                            break;
                        case "2":
                            this.toIndicator.setAttribute("display", "none");
                            this.fromIndicator.setAttribute("display", "inherit");
                            break;
                    }
                }
                break;
            case "current_track":
                if (this.currentTrackIndicator) {
                    this.currentTrackIndicator.setAttribute("transform", "rotate(" + (newValue) + ", 50, 120)");
                }
                break;
        }
    }
    onEvent(_event) {
    }
    update(_deltaTime) {
        super.update(_deltaTime);
        if (SimVar.GetSimVarValue("L:PFD_DME_Displayed", "number") != 0) {
            Avionics.Utils.diffAndSetAttribute(this, "show_dme", "true");
        } else {
            Avionics.Utils.diffAndSetAttribute(this, "show_dme", "false");
        }
    }
}
customElements.define('glasscockpit-hsi-arc', ArcHSIIndicator);
//# sourceMappingURL=ArcHSIndicator.js.map