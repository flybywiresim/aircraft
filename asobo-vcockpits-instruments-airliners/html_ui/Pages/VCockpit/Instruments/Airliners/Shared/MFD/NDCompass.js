class Jet_MFD_NDCompass extends Jet_NDCompass {
    constructor() {
        super();
    }
    connectedCallback() {
        super.connectedCallback();
    }
    init() {
        super.init();
    }
    constructArc() {
        super.constructArc();
        if (this.aircraft == Aircraft.CJ4) {
            this.constructArc_CJ4();
        } else if (this.aircraft == Aircraft.B747_8) {
            this.constructArc_B747_8();
        } else if (this.aircraft == Aircraft.AS01B) {
            this.constructArc_AS01B();
        } else {
            this.constructArc_A320_Neo();
        }
    }
    constructArc_CJ4() {
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "-225 -215 550 516");
        this.appendChild(this.root);
        const trsGroup = document.createElementNS(Avionics.SVG.NS, "g");
        trsGroup.setAttribute("transform", "translate(0, 70)");
        this.root.appendChild(trsGroup);
        {
            const viewBox = document.createElementNS(Avionics.SVG.NS, "svg");
            viewBox.setAttribute("x", "-225");
            viewBox.setAttribute("y", "-300");
            viewBox.setAttribute("viewBox", "-325 -350 750 600");
            trsGroup.appendChild(viewBox);
            const circleRadius = 350;
            const maskHeight = 200;
            this.arcMaskGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.arcMaskGroup.setAttribute("id", "mask");
            viewBox.appendChild(this.arcMaskGroup);
            {
                const topMask = document.createElementNS(Avionics.SVG.NS, "path");
                topMask.setAttribute("d", "M0 " + -maskHeight + ", L" + circleRadius * 2 + " " + -maskHeight + ", L" + circleRadius * 2 + " " + circleRadius + ", A 25 25 0 1 0 0, " + circleRadius + "Z");
                topMask.setAttribute("transform", "translate(" + (50 - circleRadius) + ", " + (50 - circleRadius) + ")");
                topMask.setAttribute("fill", "black");
                this.arcMaskGroup.appendChild(topMask);
            }
            const fixedGroup = document.createElementNS(Avionics.SVG.NS, "g");
            fixedGroup.setAttribute("id", "fixedElements");
            viewBox.appendChild(fixedGroup);
            {
                const arc = new Avionics.SVGArc;
                arc.init("mainArc", circleRadius, 2, "white");
                arc.translate(50, 50);
                arc.rotate(-90 + 26.5);
                arc.setPercent(35);
                fixedGroup.appendChild(arc.svg);
                const vec = new Vec2(1, 0.45);
                vec.SetNorm(circleRadius * 0.92);
                this.addMapRange(fixedGroup, 50 - vec.x, 50 - vec.y, "white", "20", false, 1.0, false);
                {
                    const smallCircleRadius = 170;
                    const circle = document.createElementNS(Avionics.SVG.NS, "circle");
                    circle.setAttribute("cx", "50");
                    circle.setAttribute("cy", "50");
                    circle.setAttribute("r", smallCircleRadius.toString());
                    circle.setAttribute("fill-opacity", "0");
                    circle.setAttribute("stroke", "white");
                    circle.setAttribute("stroke-width", "2");
                    circle.setAttribute("stroke-opacity", "1");
                    fixedGroup.appendChild(circle);
                    dashSpacing = 12;
                    let radians = 0;
                    for (let i = 0; i < dashSpacing; i++) {
                        const line = document.createElementNS(Avionics.SVG.NS, "line");
                        const length = 15;
                        const lineStart = 50 + smallCircleRadius - length * 0.5;
                        const lineEnd = 50 + smallCircleRadius + length * 0.5;
                        const degrees = (radians / Math.PI) * 180;
                        line.setAttribute("x1", "50");
                        line.setAttribute("y1", lineStart.toString());
                        line.setAttribute("x2", "50");
                        line.setAttribute("y2", lineEnd.toString());
                        line.setAttribute("transform", "rotate(" + (-degrees + 180) + " 50 50)");
                        line.setAttribute("stroke", "white");
                        line.setAttribute("stroke-width", "4");
                        line.setAttribute("stroke-opacity", "0.8");
                        fixedGroup.appendChild(line);
                        radians += (2 * Math.PI) / dashSpacing;
                    }
                    vec.SetNorm(smallCircleRadius * 0.82);
                    this.addMapRange(fixedGroup, 50 - vec.x, 50 - vec.y, "white", "20", false, 0.5, false);
                }
                const clipRect = document.createElementNS(Avionics.SVG.NS, "rect");
                clipRect.setAttribute("x", (50 - circleRadius).toString());
                clipRect.setAttribute("y", (-105 - circleRadius).toString());
                clipRect.setAttribute("width", (circleRadius * 2).toString());
                clipRect.setAttribute("height", (circleRadius).toString());
                clipRect.setAttribute("fill", "white");
                const clipPath = document.createElementNS(Avionics.SVG.NS, "clipPath");
                clipPath.setAttribute("id", "clip");
                clipPath.appendChild(clipRect);
                fixedGroup.appendChild(clipPath);
            }
            const clipGroup = document.createElementNS(Avionics.SVG.NS, "g");
            clipGroup.setAttribute("id", "clipElements");
            clipGroup.setAttribute("clip-path", "url(#clip)");
            viewBox.appendChild(clipGroup);
            {
                this.graduations = document.createElementNS(Avionics.SVG.NS, "g");
                this.graduations.setAttribute("id", "graduations");
                clipGroup.appendChild(this.graduations);
                {
                    var dashSpacing = 72;
                    const texts = ["N", "E", "S", "W"];
                    let radians = 0;
                    for (let i = 0; i < dashSpacing; i++) {
                        const line = document.createElementNS(Avionics.SVG.NS, "line");
                        const bIsBig = (i % 2 == 0) ? true : false;
                        const bIsText = (i % 6 == 0) ? true : false;
                        const length = (bIsBig) ? 15 : 8.5;
                        const lineStart = 50 + circleRadius;
                        const lineEnd = 50 + circleRadius + length;
                        const degrees = (radians / Math.PI) * 180;
                        line.setAttribute("x1", "50");
                        line.setAttribute("y1", lineStart.toString());
                        line.setAttribute("x2", "50");
                        line.setAttribute("y2", lineEnd.toString());
                        line.setAttribute("transform", "rotate(" + (-degrees + 180) + " 50 50)");
                        line.setAttribute("stroke", "white");
                        line.setAttribute("stroke-width", "3");
                        line.setAttribute("stroke-opacity", "0.8");
                        this.graduations.appendChild(line);
                        if (bIsText) {
                            const text = document.createElementNS(Avionics.SVG.NS, "text");
                            if (Math.round(degrees) % 90 == 0) {
                                const id = Math.round(degrees) / 90;
                                text.textContent = texts[id];
                            } else {
                                text.textContent = fastToFixed(degrees / 10, 0);
                            }
                            text.setAttribute("x", "50");
                            text.setAttribute("y", (-(circleRadius - 50 + length + 10)).toString());
                            text.setAttribute("fill", "white");
                            text.setAttribute("font-size", "25");
                            text.setAttribute("font-family", "Roboto-Light");
                            text.setAttribute("text-anchor", "middle");
                            text.setAttribute("alignment-baseline", "bottom");
                            text.setAttribute("transform", "rotate(" + degrees + " 50 50)");
                            this.graduations.appendChild(text);
                        }
                        radians += (2 * Math.PI) / dashSpacing;
                    }
                }
            }
            this.rotatingCircle = document.createElementNS(Avionics.SVG.NS, "g");
            this.rotatingCircle.setAttribute("id", "RotatingCircle");
            viewBox.appendChild(this.rotatingCircle);
            {
                this.courseGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.courseGroup.setAttribute("id", "CourseInfo");
                this.rotatingCircle.appendChild(this.courseGroup);
                {
                    this.course = document.createElementNS(Avionics.SVG.NS, "g");
                    this.course.setAttribute("id", "course");
                    this.courseGroup.appendChild(this.course);
                    {
                        this.courseColor = "";
                        if (this.navigationMode == Jet_NDCompass_Navigation.ILS) {
                            this.courseColor = "#ff00ff";
                        } else if (this.navigationMode == Jet_NDCompass_Navigation.VOR) {
                            this.courseColor = "#00ffff";
                        }
                        this.courseTO = document.createElementNS(Avionics.SVG.NS, "path");
                        this.courseTO.setAttribute("d", "M46 110 l8 0 l0 25 l-4 5 l-4 -5 l0 -25 Z");
                        this.courseTO.setAttribute("fill", "none");
                        this.courseTO.setAttribute("transform", "rotate(180 50 50)");
                        this.courseTO.setAttribute("stroke", this.courseColor.toString());
                        this.courseTO.setAttribute("stroke-width", "1");
                        this.course.appendChild(this.courseTO);
                        this.courseTOLine = document.createElementNS(Avionics.SVG.NS, "path");
                        this.courseTOLine.setAttribute("d", "M50 140 l0 " + (circleRadius - 90) + " Z");
                        this.courseTOLine.setAttribute("transform", "rotate(180 50 50)");
                        this.courseTOLine.setAttribute("stroke", this.courseColor.toString());
                        this.courseTOLine.setAttribute("stroke-width", "1");
                        this.course.appendChild(this.courseTOLine);
                        this.courseDeviation = document.createElementNS(Avionics.SVG.NS, "rect");
                        this.courseDeviation.setAttribute("x", "45");
                        this.courseDeviation.setAttribute("y", "-10");
                        this.courseDeviation.setAttribute("width", "10");
                        this.courseDeviation.setAttribute("height", "125");
                        this.courseDeviation.setAttribute("fill", this.courseColor.toString());
                        this.course.appendChild(this.courseDeviation);
                        this.courseFROM = document.createElementNS(Avionics.SVG.NS, "path");
                        this.courseFROM.setAttribute("d", "M46 -15 l8 0 l0 -20 l-8 0 l0 20 Z");
                        this.courseFROM.setAttribute("fill", "none");
                        this.courseFROM.setAttribute("transform", "rotate(180 50 50)");
                        this.courseFROM.setAttribute("stroke", this.courseColor.toString());
                        this.courseFROM.setAttribute("stroke-width", "1");
                        this.course.appendChild(this.courseFROM);
                        this.courseFROMLine = document.createElementNS(Avionics.SVG.NS, "path");
                        this.courseFROMLine.setAttribute("d", "M50 -35 l0 " + (-circleRadius + 85) + " Z");
                        this.courseFROMLine.setAttribute("fill", "none");
                        this.courseFROMLine.setAttribute("transform", "rotate(180 50 50)");
                        this.courseFROMLine.setAttribute("stroke", this.courseColor.toString());
                        this.courseFROMLine.setAttribute("stroke-width", "1");
                        this.course.appendChild(this.courseFROMLine);
                        const circlePosition = [-80, -40, 40, 80];
                        for (let i = 0; i < circlePosition.length; i++) {
                            const CDICircle = document.createElementNS(Avionics.SVG.NS, "circle");
                            CDICircle.setAttribute("cx", (50 + circlePosition[i]).toString());
                            CDICircle.setAttribute("cy", "50");
                            CDICircle.setAttribute("r", "5");
                            CDICircle.setAttribute("fill", "none");
                            CDICircle.setAttribute("stroke", "white");
                            CDICircle.setAttribute("stroke-width", "2");
                            this.course.appendChild(CDICircle);
                        }
                    }
                }
                this.trackingGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.trackingGroup.setAttribute("id", "trackingGroup");
                {
                    const rad = 5;
                    this.trackingBug = document.createElementNS(Avionics.SVG.NS, "circle");
                    this.trackingBug.setAttribute("id", "trackingBug");
                    this.trackingBug.setAttribute("cx", "50");
                    this.trackingBug.setAttribute("cy", (50 + circleRadius + rad).toString());
                    this.trackingBug.setAttribute("r", rad.toString());
                    this.trackingBug.setAttribute("fill", "none");
                    this.trackingBug.setAttribute("stroke", "#ff00e0");
                    this.trackingBug.setAttribute("stroke-width", "2");
                    this.trackingGroup.appendChild(this.trackingBug);
                }
                this.rotatingCircle.appendChild(this.trackingGroup);
                this.headingGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.headingGroup.setAttribute("id", "headingGroup");
                {
                }
                this.rotatingCircle.appendChild(this.headingGroup);
                this.selectedHeadingGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.selectedHeadingGroup.setAttribute("id", "selectedHeadingGroup");
                {
                    this.selectedHeadingLine = Avionics.SVG.computeDashLine(50, 50, circleRadius, 15, 3, "#00F2FF");
                    this.selectedHeadingLine.setAttribute("id", "selectedHeadingLine");
                    this.selectedHeadingGroup.appendChild(this.selectedHeadingLine);
                    this.selectedHeadingBug = document.createElementNS(Avionics.SVG.NS, "path");
                    this.selectedHeadingBug.setAttribute("id", "selectedHeadingBug");
                    this.selectedHeadingBug.setAttribute("d", "M50 " + (50 + circleRadius) + " h 22 v 18 h -7 l -15 -18 l -15 18 h -7 v -18 z");
                    this.selectedHeadingBug.setAttribute("fill", "#00F2FF");
                    this.selectedHeadingGroup.appendChild(this.selectedHeadingBug);
                }
                this.rotatingCircle.appendChild(this.selectedHeadingGroup);
                this.ilsGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.ilsGroup.setAttribute("id", "ILSGroup");
                {
                    const ilsBug = document.createElementNS(Avionics.SVG.NS, "path");
                    ilsBug.setAttribute("id", "ilsBug");
                    ilsBug.setAttribute("d", "M50 " + (50 + circleRadius) + " l0 40 M35 " + (50 + circleRadius + 10) + " l30 0");
                    ilsBug.setAttribute("fill", "transparent");
                    ilsBug.setAttribute("stroke", "#FF0CE2");
                    ilsBug.setAttribute("stroke-width", "3");
                    this.ilsGroup.appendChild(ilsBug);
                }
                this.rotatingCircle.appendChild(this.ilsGroup);
            }
            this.currentRefGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.currentRefGroup.setAttribute("id", "currentRefGroup");
            {
                const centerX = 50;
                const centerY = -340;
                const rectWidth = 65;
                const rectHeight = 40;
                const rectArrowFactor = 0.35;
                const rect = document.createElementNS(Avionics.SVG.NS, "rect");
                rect.setAttribute("x", (centerX - rectWidth * 0.5).toString());
                rect.setAttribute("y", (centerY - rectHeight * 0.5).toString());
                rect.setAttribute("width", rectWidth.toString());
                rect.setAttribute("height", rectHeight.toString());
                rect.setAttribute("fill", "black");
                this.currentRefGroup.appendChild(rect);
                let d = "M" + (centerX - (rectWidth * 0.5)) + " " + (centerY - (rectHeight * 0.5));
                d += " l0 " + rectHeight;
                d += " l" + (rectWidth * rectArrowFactor) + " 0";
                d += " l" + (rectWidth * 0.5 - rectWidth * rectArrowFactor) + " 9";
                d += " l" + (rectWidth * 0.5 - rectWidth * rectArrowFactor) + " -9";
                d += " l" + (rectWidth * rectArrowFactor) + " 0";
                d += " l0 " + (-rectHeight);
                const path = document.createElementNS(Avionics.SVG.NS, "path");
                path.setAttribute("d", d);
                path.setAttribute("fill", "none");
                path.setAttribute("stroke", "white");
                path.setAttribute("stroke-width", "2");
                this.currentRefGroup.appendChild(path);
                this.currentRefValue = document.createElementNS(Avionics.SVG.NS, "text");
                this.currentRefValue.textContent = "";
                this.currentRefValue.setAttribute("x", centerX.toString());
                this.currentRefValue.setAttribute("y", centerY.toString());
                this.currentRefValue.setAttribute("fill", "green");
                this.currentRefValue.setAttribute("font-size", "28");
                this.currentRefValue.setAttribute("font-family", "Roboto-Bold");
                this.currentRefValue.setAttribute("text-anchor", "middle");
                this.currentRefValue.setAttribute("alignment-baseline", "central");
                this.currentRefGroup.appendChild(this.currentRefValue);
            }
            viewBox.appendChild(this.currentRefGroup);
            this.selectedRefGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.selectedRefGroup.setAttribute("id", "selectedRefGroup");
            {
                const centerX = -150;
                const centerY = -355;
                const spaceX = 5;
                this.selectedRefMode = document.createElementNS(Avionics.SVG.NS, "text");
                this.selectedRefMode.textContent = "HDG";
                this.selectedRefMode.setAttribute("x", (centerX - spaceX).toString());
                this.selectedRefMode.setAttribute("y", centerY.toString());
                this.selectedRefMode.setAttribute("fill", "#00F2FF");
                this.selectedRefMode.setAttribute("font-size", "18");
                this.selectedRefMode.setAttribute("font-family", "Roboto-Bold");
                this.selectedRefMode.setAttribute("text-anchor", "end");
                this.selectedRefMode.setAttribute("alignment-baseline", "central");
                this.selectedRefGroup.appendChild(this.selectedRefMode);
                this.selectedRefValue = document.createElementNS(Avionics.SVG.NS, "text");
                this.selectedRefValue.textContent = "";
                this.selectedRefValue.setAttribute("x", (centerX + spaceX).toString());
                this.selectedRefValue.setAttribute("y", centerY.toString());
                this.selectedRefValue.setAttribute("fill", "#00F2FF");
                this.selectedRefValue.setAttribute("font-size", "23");
                this.selectedRefValue.setAttribute("font-family", "Roboto-Bold");
                this.selectedRefValue.setAttribute("text-anchor", "start");
                this.selectedRefValue.setAttribute("alignment-baseline", "central");
                this.selectedRefGroup.appendChild(this.selectedRefValue);
            }
            viewBox.appendChild(this.selectedRefGroup);
        }
    }
    constructArc_A320_Neo() {
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "-225 -215 550 516");
        this.appendChild(this.root);
        const trsGroup = document.createElementNS(Avionics.SVG.NS, "g");
        trsGroup.setAttribute("transform", "translate(0, 200)");
        this.root.appendChild(trsGroup);
        {
            const viewBox = document.createElementNS(Avionics.SVG.NS, "svg");
            viewBox.setAttribute("x", "-225");
            viewBox.setAttribute("y", "-475");
            viewBox.setAttribute("viewBox", "-225 -550 550 600");
            trsGroup.appendChild(viewBox);
            const circleRadius = 425;
            const dashSpacing = 72;
            const maskHeight = 200;
            this.arcMaskGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.arcMaskGroup.setAttribute("id", "MaskGroup");
            viewBox.appendChild(this.arcMaskGroup);
            {
                const topMask = document.createElementNS(Avionics.SVG.NS, "path");
                topMask.setAttribute("d", "M0 " + -maskHeight + ", L" + circleRadius * 2 + " " + -maskHeight + ", L" + circleRadius * 2 + " " + circleRadius + ", A 25 25 0 1 0 0, " + circleRadius + "Z");
                topMask.setAttribute("transform", "translate(" + (50 - circleRadius) + ", " + (50 - circleRadius) + ")");
                topMask.setAttribute("fill", "black");
                this.arcMaskGroup.appendChild(topMask);
            }
            this.arcRangeGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.arcRangeGroup.setAttribute("id", "ArcRangeGroup");
            viewBox.appendChild(this.arcRangeGroup);
            {
                const rads = [0.25, 0.50, 0.75];
                const cone = [Math.PI, 0.92 * Math.PI, 0.88 * Math.PI];
                const count = [10, 22, 34];
                const width = 14;
                for (let r = 0; r < rads.length; r++) {
                    const rad = circleRadius * rads[r];
                    let radians = (Math.PI - cone[r]) * 0.5;
                    for (let i = 0; i <= count[r]; i++) {
                        const line = document.createElementNS(Avionics.SVG.NS, "rect");
                        const degrees = (radians / Math.PI) * 180;
                        line.setAttribute("x", "50");
                        line.setAttribute("y", (50 + rad).toString());
                        line.setAttribute("width", width.toString());
                        line.setAttribute("height", "2");
                        line.setAttribute("transform", "rotate(" + (-degrees - 90) + " 50 50)");
                        line.setAttribute("fill", "white");
                        this.arcRangeGroup.appendChild(line);
                        radians += cone[r] / (count[r] + 0.5);
                    }
                    const vec = new Vec2(1, 0.6);
                    vec.SetNorm(rad - 25);
                    this.addMapRange(this.arcRangeGroup, 50 + vec.x, 50 - vec.y, "#00F2FF", "18", false, rads[r], true);
                    this.addMapRange(this.arcRangeGroup, 50 - vec.x, 50 - vec.y, "#00F2FF", "18", false, rads[r], true);
                }
                const vec = new Vec2(1, 0.6);
                vec.SetNorm(circleRadius - 25);
                this.addMapRange(this.arcRangeGroup, 50 + vec.x, 50 - vec.y, "#00F2FF", "18", false, 1.0, true);
                this.addMapRange(this.arcRangeGroup, 50 - vec.x, 50 - vec.y, "#00F2FF", "18", false, 1.0, true);
            }
            this.rotatingCircle = document.createElementNS(Avionics.SVG.NS, "g");
            this.rotatingCircle.setAttribute("id", "RotatingCircle");
            viewBox.appendChild(this.rotatingCircle);
            {
                const circle = document.createElementNS(Avionics.SVG.NS, "circle");
                circle.setAttribute("cx", "50");
                circle.setAttribute("cy", "50");
                circle.setAttribute("r", circleRadius.toString());
                circle.setAttribute("fill-opacity", "0");
                circle.setAttribute("stroke", "white");
                circle.setAttribute("stroke-width", "2");
                this.rotatingCircle.appendChild(circle);
                const graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
                graduationGroup.setAttribute("id", "graduationGroup");
                {
                    let radians = 0;
                    for (let i = 0; i < dashSpacing; i++) {
                        const line = document.createElementNS(Avionics.SVG.NS, "line");
                        const bIsBig = (i % 2 == 0) ? true : false;
                        const length = (bIsBig) ? 16 : 8.5;
                        const lineStart = 50 + circleRadius;
                        const lineEnd = 50 + circleRadius + length;
                        const degrees = (radians / Math.PI) * 180;
                        line.setAttribute("x1", "50");
                        line.setAttribute("y1", lineStart.toString());
                        line.setAttribute("x2", "50");
                        line.setAttribute("y2", lineEnd.toString());
                        line.setAttribute("transform", "rotate(" + (-degrees + 180) + " 50 50)");
                        line.setAttribute("stroke", "white");
                        line.setAttribute("stroke-width", "3");
                        if (bIsBig) {
                            const text = document.createElementNS(Avionics.SVG.NS, "text");
                            text.textContent = fastToFixed(degrees / 10, 0);
                            text.setAttribute("x", "50");
                            text.setAttribute("y", (-(circleRadius - 50 + length + 10)).toString());
                            text.setAttribute("fill", "white");
                            text.setAttribute("font-size", (i % 3 == 0) ? "28" : "20");
                            text.setAttribute("font-family", "Roboto-Bold");
                            text.setAttribute("text-anchor", "middle");
                            text.setAttribute("alignment-baseline", "bottom");
                            text.setAttribute("transform", "rotate(" + degrees + " 50 50)");
                            graduationGroup.appendChild(text);
                        }
                        radians += (2 * Math.PI) / dashSpacing;
                        graduationGroup.appendChild(line);
                    }
                }
                this.rotatingCircle.appendChild(graduationGroup);
                this.trackingGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.trackingGroup.setAttribute("id", "trackingGroup");
                {
                    const halfw = 7;
                    const halfh = 10;
                    this.trackingLine = document.createElementNS(Avionics.SVG.NS, "path");
                    this.trackingLine.setAttribute("id", "trackingLine");
                    this.trackingLine.setAttribute("d", "M50 50 v " + (circleRadius - halfh * 2));
                    this.trackingLine.setAttribute("fill", "transparent");
                    this.trackingLine.setAttribute("stroke", "#00FF21");
                    this.trackingLine.setAttribute("stroke-width", "3");
                    this.trackingGroup.appendChild(this.trackingLine);
                    const p1 = (50) + ", " + (50 + circleRadius);
                    const p2 = (50 + halfw) + ", " + (50 + circleRadius - halfh);
                    const p3 = (50) + ", " + (50 + circleRadius - halfh * 2);
                    const p4 = (50 - halfw) + ", " + (50 + circleRadius - halfh);
                    this.trackingBug = document.createElementNS(Avionics.SVG.NS, "polygon");
                    this.trackingBug.setAttribute("id", "trackingBug");
                    this.trackingBug.setAttribute("points", p1 + " " + p2 + " " + p3 + " " + p4);
                    this.trackingBug.setAttribute("stroke", "#00FF21");
                    this.trackingBug.setAttribute("stroke-width", "2");
                    this.trackingGroup.appendChild(this.trackingBug);
                }
                this.rotatingCircle.appendChild(this.trackingGroup);
                this.headingGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.headingGroup.setAttribute("id", "headingGroup");
                {
                    this.headingBug = document.createElementNS(Avionics.SVG.NS, "path");
                    this.headingBug.setAttribute("id", "headingBug");
                    this.headingBug.setAttribute("d", "M50 " + (50 + circleRadius) + " l -11 20 l 22 0 z");
                    this.headingBug.setAttribute("stroke", "white");
                    this.headingBug.setAttribute("stroke-width", "2");
                    this.headingGroup.appendChild(this.headingBug);
                }
                this.rotatingCircle.appendChild(this.headingGroup);
                this.selectedHeadingGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.selectedHeadingGroup.setAttribute("id", "selectedHeadingGroup");
                {
                    this.selectedHeadingBug = document.createElementNS(Avionics.SVG.NS, "path");
                    this.selectedHeadingBug.setAttribute("id", "selectedHeadingBug");
                    this.selectedHeadingBug.setAttribute("d", "M50 " + (50 + circleRadius) + " l -11 20 l 22 0 z");
                    this.selectedHeadingBug.setAttribute("stroke", "#00F2FF");
                    this.selectedHeadingBug.setAttribute("stroke-width", "2");
                    this.selectedHeadingBug.setAttribute("fill", "none");
                    this.selectedHeadingGroup.appendChild(this.selectedHeadingBug);
                }
                this.rotatingCircle.appendChild(this.selectedHeadingGroup);
                this.ilsGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.ilsGroup.setAttribute("id", "ILSGroup");
                {
                    const ilsBug = document.createElementNS(Avionics.SVG.NS, "path");
                    ilsBug.setAttribute("id", "ilsBug");
                    ilsBug.setAttribute("d", "M50 " + (50 + circleRadius) + " l0 40 M35 " + (50 + circleRadius + 10) + " l30 0");
                    ilsBug.setAttribute("fill", "transparent");
                    ilsBug.setAttribute("stroke", "#FF0CE2");
                    ilsBug.setAttribute("stroke-width", "3");
                    this.ilsGroup.appendChild(ilsBug);
                }
                this.rotatingCircle.appendChild(this.ilsGroup);
            }
            {
                const lineStart = 50 - circleRadius - 18;
                const lineEnd = 50 - circleRadius + 18;
                const neutralLine = document.createElementNS(Avionics.SVG.NS, "line");
                neutralLine.setAttribute("id", "NeutralLine");
                neutralLine.setAttribute("x1", "50");
                neutralLine.setAttribute("y1", lineStart.toString());
                neutralLine.setAttribute("x2", "50");
                neutralLine.setAttribute("y2", lineEnd.toString());
                neutralLine.setAttribute("stroke", "yellow");
                neutralLine.setAttribute("stroke-width", "4");
                viewBox.appendChild(neutralLine);
            }
        }
    }
    constructArc_B747_8() {
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "-225 -215 550 516");
        this.appendChild(this.root);
        const trsGroup = document.createElementNS(Avionics.SVG.NS, "g");
        trsGroup.setAttribute("transform", "translate(-266, -208) scale(1.15)");
        this.root.appendChild(trsGroup);
        {
            const viewBox = document.createElementNS(Avionics.SVG.NS, "svg");
            viewBox.setAttribute("viewBox", "-250 -475 600 700");
            trsGroup.appendChild(viewBox);
            const circleRadius = 450;
            const dashSpacing = 72;
            const maskHeight = 200;
            this.arcMaskGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.arcMaskGroup.setAttribute("id", "MaskGroup");
            viewBox.appendChild(this.arcMaskGroup);
            {
                const topMask = document.createElementNS(Avionics.SVG.NS, "path");
                topMask.setAttribute("d", "M0 " + -maskHeight + ", L" + circleRadius * 2 + " " + -maskHeight + ", L" + circleRadius * 2 + " " + circleRadius + ", A 25 25 0 1 0 0, " + circleRadius + "Z");
                topMask.setAttribute("transform", "translate(" + (50 - circleRadius) + ", " + (50 - circleRadius) + ")");
                topMask.setAttribute("fill", "black");
                this.arcMaskGroup.appendChild(topMask);
            }
            this.arcRangeGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.arcRangeGroup.setAttribute("id", "ArcRangeGroup");
            viewBox.appendChild(this.arcRangeGroup);
            {
                const rads = [0.25, 0.50, 0.75];
                for (let r = 0; r < rads.length; r++) {
                    const rad = circleRadius * rads[r];
                    const path = document.createElementNS(Avionics.SVG.NS, "path");
                    path.setAttribute("d", "M" + (50 - rad) + ",50 a1,1 0 0 1 " + (rad * 2) + ",0");
                    path.setAttribute("fill", "none");
                    path.setAttribute("stroke", "white");
                    path.setAttribute("stroke-width", "2");
                    this.arcRangeGroup.appendChild(path);
                }
            }
            this.rotatingCircle = document.createElementNS(Avionics.SVG.NS, "g");
            this.rotatingCircle.setAttribute("id", "RotatingCircle");
            viewBox.appendChild(this.rotatingCircle);
            {
                const circleGroup = document.createElementNS(Avionics.SVG.NS, "g");
                circleGroup.setAttribute("id", "circleGroup");
                {
                    const circle = document.createElementNS(Avionics.SVG.NS, "circle");
                    circle.setAttribute("cx", "50");
                    circle.setAttribute("cy", "50");
                    circle.setAttribute("r", circleRadius.toString());
                    circle.setAttribute("fill-opacity", "0");
                    circle.setAttribute("stroke", "white");
                    circle.setAttribute("stroke-width", "2");
                    circleGroup.appendChild(circle);
                    let radians = 0;
                    for (let i = 0; i < dashSpacing; i++) {
                        const line = document.createElementNS(Avionics.SVG.NS, "line");
                        const bIsBig = (i % 2 == 0) ? true : false;
                        const length = (bIsBig) ? 16 : 8.5;
                        const lineStart = 50 + circleRadius;
                        const lineEnd = lineStart - length;
                        const degrees = (radians / Math.PI) * 180;
                        line.setAttribute("x1", "50");
                        line.setAttribute("y1", lineStart.toString());
                        line.setAttribute("x2", "50");
                        line.setAttribute("y2", lineEnd.toString());
                        line.setAttribute("transform", "rotate(" + (-degrees + 180) + " 50 50)");
                        line.setAttribute("stroke", "white");
                        line.setAttribute("stroke-width", "3");
                        if (bIsBig) {
                            const text = document.createElementNS(Avionics.SVG.NS, "text");
                            text.textContent = (i % 3 == 0) ? fastToFixed(degrees / 10, 0) : "";
                            text.setAttribute("x", "50");
                            text.setAttribute("y", (-(circleRadius - 50 - length - 18)).toString());
                            text.setAttribute("fill", "white");
                            text.setAttribute("font-size", (i % 3 == 0) ? "28" : "20");
                            text.setAttribute("font-family", "Roboto-Bold");
                            text.setAttribute("text-anchor", "middle");
                            text.setAttribute("alignment-baseline", "central");
                            text.setAttribute("transform", "rotate(" + degrees + " 50 50)");
                            circleGroup.appendChild(text);
                        }
                        radians += (2 * Math.PI) / dashSpacing;
                        circleGroup.appendChild(line);
                    }
                }
                this.rotatingCircle.appendChild(circleGroup);
                this.trackingGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.trackingGroup.setAttribute("id", "trackingGroup");
                {
                    this.trackingLine = document.createElementNS(Avionics.SVG.NS, "path");
                    this.trackingLine.setAttribute("id", "trackingLine");
                    this.trackingLine.setAttribute("d", "M50 70 v " + (circleRadius - 20));
                    this.trackingLine.setAttribute("fill", "transparent");
                    this.trackingLine.setAttribute("stroke", "white");
                    this.trackingLine.setAttribute("stroke-width", "3");
                    this.trackingGroup.appendChild(this.trackingLine);
                }
                this.headingGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.headingGroup.setAttribute("id", "headingGroup");
                {
                    this.headingBug = document.createElementNS(Avionics.SVG.NS, "path");
                    this.headingBug.setAttribute("id", "headingBug");
                    this.headingBug.setAttribute("d", "M50 " + (50 + circleRadius) + " l -11 20 l 22 0 z");
                    this.headingBug.setAttribute("fill", "none");
                    this.headingBug.setAttribute("stroke", "white");
                    this.headingGroup.appendChild(this.headingBug);
                }
                this.rotatingCircle.appendChild(this.headingGroup);
                this.courseGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.courseGroup.setAttribute("id", "CourseInfo");
                this.rotatingCircle.appendChild(this.courseGroup);
                {
                    this.course = document.createElementNS(Avionics.SVG.NS, "g");
                    this.course.setAttribute("id", "course");
                    this.courseGroup.appendChild(this.course);
                    {
                        this.courseColor = "";
                        if (this.navigationMode == Jet_NDCompass_Navigation.ILS) {
                            this.courseColor = "#ff00ff";
                        } else if (this.navigationMode == Jet_NDCompass_Navigation.VOR) {
                            this.courseColor = "#00ffff";
                        }
                        this.courseTO = document.createElementNS(Avionics.SVG.NS, "path");
                        this.courseTO.setAttribute("d", "M46 110 l8 0 l0 25 l-4 5 l-4 -5 l0 -25 Z");
                        this.courseTO.setAttribute("fill", "none");
                        this.courseTO.setAttribute("transform", "rotate(180 50 50)");
                        this.courseTO.setAttribute("stroke", this.courseColor.toString());
                        this.courseTO.setAttribute("stroke-width", "1");
                        this.course.appendChild(this.courseTO);
                        this.courseTOLine = document.createElementNS(Avionics.SVG.NS, "path");
                        this.courseTOLine.setAttribute("d", "M50 140 l0 " + (circleRadius - 90) + " Z");
                        this.courseTOLine.setAttribute("transform", "rotate(180 50 50)");
                        this.courseTOLine.setAttribute("stroke", this.courseColor.toString());
                        this.courseTOLine.setAttribute("stroke-width", "1");
                        this.course.appendChild(this.courseTOLine);
                        this.courseDeviation = document.createElementNS(Avionics.SVG.NS, "rect");
                        this.courseDeviation.setAttribute("x", "45");
                        this.courseDeviation.setAttribute("y", "-10");
                        this.courseDeviation.setAttribute("width", "10");
                        this.courseDeviation.setAttribute("height", "125");
                        this.courseDeviation.setAttribute("fill", this.courseColor.toString());
                        this.course.appendChild(this.courseDeviation);
                        this.courseFROM = document.createElementNS(Avionics.SVG.NS, "path");
                        this.courseFROM.setAttribute("d", "M46 -15 l8 0 l0 -20 l-8 0 l0 20 Z");
                        this.courseFROM.setAttribute("fill", "none");
                        this.courseFROM.setAttribute("transform", "rotate(180 50 50)");
                        this.courseFROM.setAttribute("stroke", this.courseColor.toString());
                        this.courseFROM.setAttribute("stroke-width", "1");
                        this.course.appendChild(this.courseFROM);
                        this.courseFROMLine = document.createElementNS(Avionics.SVG.NS, "path");
                        this.courseFROMLine.setAttribute("d", "M50 -35 l0 " + (-circleRadius + 85) + " Z");
                        this.courseFROMLine.setAttribute("fill", "none");
                        this.courseFROMLine.setAttribute("transform", "rotate(180 50 50)");
                        this.courseFROMLine.setAttribute("stroke", this.courseColor.toString());
                        this.courseFROMLine.setAttribute("stroke-width", "1");
                        this.course.appendChild(this.courseFROMLine);
                        const circlePosition = [-80, -40, 40, 80];
                        for (let i = 0; i < circlePosition.length; i++) {
                            const CDICircle = document.createElementNS(Avionics.SVG.NS, "circle");
                            CDICircle.setAttribute("cx", (50 + circlePosition[i]).toString());
                            CDICircle.setAttribute("cy", "50");
                            CDICircle.setAttribute("r", "5");
                            CDICircle.setAttribute("fill", "none");
                            CDICircle.setAttribute("stroke", "white");
                            CDICircle.setAttribute("stroke-width", "2");
                            this.course.appendChild(CDICircle);
                        }
                    }
                }
                this.selectedHeadingGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.selectedHeadingGroup.setAttribute("id", "selectedHeadingGroup");
                {
                    this.selectedHeadingLine = Avionics.SVG.computeDashLine(50, 70, (circleRadius - 5), 15, 3, "#ff00e0");
                    this.selectedHeadingLine.setAttribute("id", "selectedHeadingLine");
                    this.selectedHeadingGroup.appendChild(this.selectedHeadingLine);
                    this.selectedHeadingBug = document.createElementNS(Avionics.SVG.NS, "path");
                    this.selectedHeadingBug.setAttribute("id", "selectedHeadingBug");
                    this.selectedHeadingBug.setAttribute("d", "M50 " + (50 + circleRadius) + " h 22 v 22 h -7 l -15 -22 l -15 22 h -7 v -22 z");
                    this.selectedHeadingBug.setAttribute("stroke", "#ff00e0");
                    this.selectedHeadingBug.setAttribute("fill", "none");
                    this.selectedHeadingGroup.appendChild(this.selectedHeadingBug);
                }
                this.rotatingCircle.appendChild(this.selectedHeadingGroup);
                this.selectedTrackGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.selectedTrackGroup.setAttribute("id", "selectedTrackGroup");
                {
                    this.selectedTrackLine = Avionics.SVG.computeDashLine(50, 70, (circleRadius - 5), 15, 3, "#ff00e0");
                    this.selectedTrackLine.setAttribute("id", "selectedTrackLine");
                    this.selectedTrackGroup.appendChild(this.selectedTrackLine);
                    this.selectedTrackBug = document.createElementNS(Avionics.SVG.NS, "path");
                    this.selectedTrackBug.setAttribute("id", "selectedTrackBug");
                    this.selectedTrackBug.setAttribute("d", "M50 " + (50 + circleRadius) + " h -30 v -15 l 30 -15 l 30 15 v 15 z");
                    this.selectedTrackBug.setAttribute("stroke", "#ff00e0");
                    this.selectedTrackBug.setAttribute("stroke-width", "2");
                    this.selectedTrackGroup.appendChild(this.selectedTrackBug);
                }
                this.rotatingCircle.appendChild(this.selectedTrackGroup);
                this.ilsGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.ilsGroup.setAttribute("id", "ILSGroup");
                {
                    const ilsBug = document.createElementNS(Avionics.SVG.NS, "path");
                    ilsBug.setAttribute("id", "ilsBug");
                    ilsBug.setAttribute("d", "M50 " + (50 + circleRadius) + " l0 40 M35 " + (50 + circleRadius + 10) + " l30 0");
                    ilsBug.setAttribute("fill", "transparent");
                    ilsBug.setAttribute("stroke", "#FF0CE2");
                    ilsBug.setAttribute("stroke-width", "3");
                    this.ilsGroup.appendChild(ilsBug);
                }
                this.rotatingCircle.appendChild(this.ilsGroup);
            }
            {
                this.currentRefGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.currentRefGroup.setAttribute("id", "currentRefGroup");
                {
                    const centerX = 50;
                    const centerY = -442;
                    const rectWidth = 65;
                    const rectHeight = 40;
                    const textOffset = 5;
                    this.currentRefMode = document.createElementNS(Avionics.SVG.NS, "text");
                    this.currentRefMode.textContent = "HDG";
                    this.currentRefMode.setAttribute("x", (centerX - rectWidth * 0.5 - textOffset).toString());
                    this.currentRefMode.setAttribute("y", centerY.toString());
                    this.currentRefMode.setAttribute("fill", "green");
                    this.currentRefMode.setAttribute("font-size", "23");
                    this.currentRefMode.setAttribute("font-family", "Roboto-Bold");
                    this.currentRefMode.setAttribute("text-anchor", "end");
                    this.currentRefMode.setAttribute("alignment-baseline", "central");
                    this.currentRefGroup.appendChild(this.currentRefMode);
                    const rect = document.createElementNS(Avionics.SVG.NS, "rect");
                    rect.setAttribute("x", (centerX - rectWidth * 0.5).toString());
                    rect.setAttribute("y", (centerY - rectHeight * 0.5).toString());
                    rect.setAttribute("width", rectWidth.toString());
                    rect.setAttribute("height", rectHeight.toString());
                    rect.setAttribute("fill", "black");
                    this.currentRefGroup.appendChild(rect);
                    const path = document.createElementNS(Avionics.SVG.NS, "path");
                    path.setAttribute("d", "M" + (centerX - (rectWidth * 0.5)) + " " + (centerY - (rectHeight * 0.5)) + " l0 " + rectHeight + " l" + rectWidth + " 0 l0 " + (-rectHeight));
                    path.setAttribute("fill", "none");
                    path.setAttribute("stroke", "white");
                    path.setAttribute("stroke-width", "1");
                    this.currentRefGroup.appendChild(path);
                    this.currentRefValue = document.createElementNS(Avionics.SVG.NS, "text");
                    this.currentRefValue.textContent = "266";
                    this.currentRefValue.setAttribute("x", centerX.toString());
                    this.currentRefValue.setAttribute("y", centerY.toString());
                    this.currentRefValue.setAttribute("fill", "white");
                    this.currentRefValue.setAttribute("font-size", "28");
                    this.currentRefValue.setAttribute("font-family", "Roboto-Bold");
                    this.currentRefValue.setAttribute("text-anchor", "middle");
                    this.currentRefValue.setAttribute("alignment-baseline", "central");
                    this.currentRefGroup.appendChild(this.currentRefValue);
                    this.currentRefType = document.createElementNS(Avionics.SVG.NS, "text");
                    this.currentRefType.textContent = "MAG";
                    this.currentRefType.setAttribute("x", (centerX + rectWidth * 0.5 + textOffset).toString());
                    this.currentRefType.setAttribute("y", centerY.toString());
                    this.currentRefType.setAttribute("fill", "green");
                    this.currentRefType.setAttribute("font-size", "23");
                    this.currentRefType.setAttribute("font-family", "Roboto-Bold");
                    this.currentRefType.setAttribute("text-anchor", "start");
                    this.currentRefType.setAttribute("alignment-baseline", "central");
                    this.currentRefGroup.appendChild(this.currentRefType);
                }
                viewBox.appendChild(this.currentRefGroup);
                const rangeGroup = document.createElementNS(Avionics.SVG.NS, "g");
                rangeGroup.setAttribute("id", "RangeGroup");
                rangeGroup.setAttribute("transform", "scale(0.8)");
                {
                    const centerX = -95;
                    const centerY = -540;
                    const textBg = document.createElementNS(Avionics.SVG.NS, "rect");
                    textBg.setAttribute("x", (centerX - 40).toString());
                    textBg.setAttribute("y", (centerY - 32).toString());
                    textBg.setAttribute("width", "80");
                    textBg.setAttribute("height", "64");
                    textBg.setAttribute("fill", "black");
                    textBg.setAttribute("stroke", "white");
                    textBg.setAttribute("stroke-width", "1");
                    rangeGroup.appendChild(textBg);
                    const textTitle = document.createElementNS(Avionics.SVG.NS, "text");
                    textTitle.textContent = "RANGE";
                    textTitle.setAttribute("x", centerX.toString());
                    textTitle.setAttribute("y", (centerY - 15).toString());
                    textTitle.setAttribute("fill", "white");
                    textTitle.setAttribute("font-size", "25");
                    textTitle.setAttribute("font-family", "Roboto-Light");
                    textTitle.setAttribute("text-anchor", "middle");
                    textTitle.setAttribute("alignment-baseline", "central");
                    rangeGroup.appendChild(textTitle);
                    this.addMapRange(rangeGroup, centerX, (centerY + 15), "white", "25", false, 1.0, false);
                }
                viewBox.appendChild(rangeGroup);
            }
        }
    }
    constructArc_AS01B() {
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "0 0 1000 710");
        this.appendChild(this.root);
        const trsGroup = document.createElementNS(Avionics.SVG.NS, "g");
        trsGroup.setAttribute("transform", "translate(-45, -100) scale(1.09)");
        this.root.appendChild(trsGroup);
        {
            let circleRadius;
            const viewBox = document.createElementNS(Avionics.SVG.NS, "svg");
            if (this._fullscreen) {
                viewBox.setAttribute("viewBox", "-250 -550 600 650");
                circleRadius = 419;
            } else {
                viewBox.setAttribute("viewBox", "-750 -1200 1400 1400");
                circleRadius = 1100;
            }
            trsGroup.appendChild(viewBox);
            this.arcMaskGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.arcMaskGroup.setAttribute("id", "MaskGroup");
            viewBox.appendChild(this.arcMaskGroup);
            {
                const maskMargin = 10;
                const maskHeight = 200;
                const topMask = document.createElementNS(Avionics.SVG.NS, "path");
                topMask.setAttribute("id", "MaskGroup");
                topMask.setAttribute("d", "M" + (-maskMargin) + " " + -maskHeight + ", L" + (circleRadius * 2 + maskMargin) + " " + -maskHeight + ", L" + (circleRadius * 2 + maskMargin) + " " + circleRadius + ", L" + (circleRadius * 2) + " " + circleRadius + ", A 25 25 0 1 0 0, " + circleRadius + ", L" + (-maskMargin) + " " + circleRadius + " Z");
                topMask.setAttribute("transform", "translate(" + (50 - circleRadius) + ", " + (50 - circleRadius) + ")");
                topMask.setAttribute("fill", "black");
                this.arcMaskGroup.appendChild(topMask);
            }
            this.arcRangeGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.arcRangeGroup.setAttribute("id", "ArcRangeGroup");
            viewBox.appendChild(this.arcRangeGroup);
            {
                const rads = [0.25, 0.50, 0.75];
                for (let r = 0; r < rads.length; r++) {
                    const rad = circleRadius * rads[r];
                    const path = document.createElementNS(Avionics.SVG.NS, "path");
                    path.setAttribute("d", "M" + (50 - rad) + ",50 a1,1 0 0 1 " + (rad * 2) + ",0");
                    path.setAttribute("fill", "none");
                    path.setAttribute("stroke", "white");
                    path.setAttribute("stroke-width", "2");
                    this.arcRangeGroup.appendChild(path);
                }
            }
            this.rotatingCircle = document.createElementNS(Avionics.SVG.NS, "g");
            this.rotatingCircle.setAttribute("id", "RotatingCircle");
            viewBox.appendChild(this.rotatingCircle);
            {
                const circleGroup = document.createElementNS(Avionics.SVG.NS, "g");
                circleGroup.setAttribute("id", "circleGroup");
                {
                    const circle = document.createElementNS(Avionics.SVG.NS, "circle");
                    circle.setAttribute("cx", "50");
                    circle.setAttribute("cy", "50");
                    circle.setAttribute("r", circleRadius.toString());
                    circle.setAttribute("fill-opacity", "0");
                    circle.setAttribute("stroke", "white");
                    circle.setAttribute("stroke-width", "2");
                    circleGroup.appendChild(circle);
                    let radians = 0;
                    const dashSpacing = 72;
                    for (let i = 0; i < dashSpacing; i++) {
                        const line = document.createElementNS(Avionics.SVG.NS, "line");
                        const bIsBig = (i % 2 == 0) ? true : false;
                        const length = (bIsBig) ? 16 : 8.5;
                        const lineStart = 50 + circleRadius;
                        const lineEnd = lineStart - length;
                        const degrees = (radians / Math.PI) * 180;
                        line.setAttribute("x1", "50");
                        line.setAttribute("y1", lineStart.toString());
                        line.setAttribute("x2", "50");
                        line.setAttribute("y2", lineEnd.toString());
                        line.setAttribute("transform", "rotate(" + (-degrees + 180) + " 50 50)");
                        line.setAttribute("stroke", "white");
                        line.setAttribute("stroke-width", "3");
                        if (bIsBig) {
                            const text = document.createElementNS(Avionics.SVG.NS, "text");
                            text.textContent = (i % 3 == 0) ? fastToFixed(degrees / 10, 0) : "";
                            text.setAttribute("x", "50");
                            text.setAttribute("y", (-(circleRadius - 50 - length - 18)).toString());
                            text.setAttribute("fill", "white");
                            text.setAttribute("font-size", (i % 3 == 0) ? "28" : "20");
                            text.setAttribute("font-family", "Roboto-Bold");
                            text.setAttribute("text-anchor", "middle");
                            text.setAttribute("alignment-baseline", "central");
                            text.setAttribute("transform", "rotate(" + degrees + " 50 50)");
                            circleGroup.appendChild(text);
                        }
                        radians += (2 * Math.PI) / dashSpacing;
                        circleGroup.appendChild(line);
                    }
                }
                this.rotatingCircle.appendChild(circleGroup);
                this.trackingGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.trackingGroup.setAttribute("id", "trackingGroup");
                {
                    this.trackingLine = document.createElementNS(Avionics.SVG.NS, "path");
                    this.trackingLine.setAttribute("id", "trackingLine");
                    this.trackingLine.setAttribute("d", "M50 70 v " + (circleRadius - 20));
                    this.trackingLine.setAttribute("fill", "transparent");
                    this.trackingLine.setAttribute("stroke", "white");
                    this.trackingLine.setAttribute("stroke-width", "3");
                    this.trackingGroup.appendChild(this.trackingLine);
                }
                this.rotatingCircle.appendChild(this.trackingGroup);
                this.headingGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.headingGroup.setAttribute("id", "headingGroup");
                {
                    this.headingBug = document.createElementNS(Avionics.SVG.NS, "path");
                    this.headingBug.setAttribute("id", "headingBug");
                    this.headingBug.setAttribute("d", "M50 " + (50 + circleRadius) + " l -11 20 l 22 0 z");
                    this.headingBug.setAttribute("fill", "none");
                    this.headingBug.setAttribute("stroke", "white");
                    this.headingGroup.appendChild(this.headingBug);
                }
                this.rotatingCircle.appendChild(this.headingGroup);
                this.courseGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.courseGroup.setAttribute("id", "CourseInfo");
                this.rotatingCircle.appendChild(this.courseGroup);
                {
                    let scale;
                    if (this._fullscreen) {
                        scale = 0.8;
                        this.courseGroup.setAttribute("transform", "translate(10 10) scale(0.8)");
                    } else {
                        scale = 1.5;
                        this.courseGroup.setAttribute("transform", "translate(-24 -24) scale(1.5)");
                    }
                    this.course = document.createElementNS(Avionics.SVG.NS, "g");
                    this.course.setAttribute("id", "course");
                    this.courseGroup.appendChild(this.course);
                    {
                        this.courseColor = "";
                        if (this.navigationMode == Jet_NDCompass_Navigation.ILS) {
                            this.courseColor = "#ff00ff";
                        } else if (this.navigationMode == Jet_NDCompass_Navigation.VOR) {
                            this.courseColor = "#00ffff";
                        }
                        this.courseTO = document.createElementNS(Avionics.SVG.NS, "path");
                        this.courseTO.setAttribute("d", "M46 110 l8 0 l0 25 l-4 5 l-4 -5 l0 -25 Z");
                        this.courseTO.setAttribute("fill", "none");
                        this.courseTO.setAttribute("transform", "rotate(180 50 50)");
                        this.courseTO.setAttribute("stroke", this.courseColor.toString());
                        this.courseTO.setAttribute("stroke-width", "1");
                        this.course.appendChild(this.courseTO);
                        this.courseTOLine = document.createElementNS(Avionics.SVG.NS, "path");
                        this.courseTOLine.setAttribute("d", "M50 140 l0 " + ((circleRadius / scale) - 90) + " Z");
                        this.courseTOLine.setAttribute("transform", "rotate(180 50 50)");
                        this.courseTOLine.setAttribute("stroke", this.courseColor.toString());
                        this.courseTOLine.setAttribute("stroke-width", "1");
                        this.course.appendChild(this.courseTOLine);
                        this.courseDeviation = document.createElementNS(Avionics.SVG.NS, "rect");
                        this.courseDeviation.setAttribute("x", "45");
                        this.courseDeviation.setAttribute("y", "-10");
                        this.courseDeviation.setAttribute("width", "10");
                        this.courseDeviation.setAttribute("height", "125");
                        this.courseDeviation.setAttribute("fill", this.courseColor.toString());
                        this.course.appendChild(this.courseDeviation);
                        this.courseFROM = document.createElementNS(Avionics.SVG.NS, "path");
                        this.courseFROM.setAttribute("d", "M46 -15 l8 0 l0 -20 l-8 0 l0 20 Z");
                        this.courseFROM.setAttribute("fill", "none");
                        this.courseFROM.setAttribute("transform", "rotate(180 50 50)");
                        this.courseFROM.setAttribute("stroke", this.courseColor.toString());
                        this.courseFROM.setAttribute("stroke-width", "1");
                        this.course.appendChild(this.courseFROM);
                        this.courseFROMLine = document.createElementNS(Avionics.SVG.NS, "path");
                        this.courseFROMLine.setAttribute("d", "M50 -35 l0 " + (-(circleRadius / scale) + 85) + " Z");
                        this.courseFROMLine.setAttribute("fill", "none");
                        this.courseFROMLine.setAttribute("transform", "rotate(180 50 50)");
                        this.courseFROMLine.setAttribute("stroke", this.courseColor.toString());
                        this.courseFROMLine.setAttribute("stroke-width", "1");
                        this.course.appendChild(this.courseFROMLine);
                        const circlePosition = [-80, -40, 40, 80];
                        for (let i = 0; i < circlePosition.length; i++) {
                            const CDICircle = document.createElementNS(Avionics.SVG.NS, "circle");
                            CDICircle.setAttribute("cx", (50 + circlePosition[i]).toString());
                            CDICircle.setAttribute("cy", "50");
                            CDICircle.setAttribute("r", "5");
                            CDICircle.setAttribute("fill", "none");
                            CDICircle.setAttribute("stroke", "white");
                            CDICircle.setAttribute("stroke-width", "2");
                            this.course.appendChild(CDICircle);
                        }
                    }
                }
                this.selectedHeadingGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.selectedHeadingGroup.setAttribute("id", "selectedHeadingGroup");
                {
                    this.selectedHeadingLine = Avionics.SVG.computeDashLine(50, 70, (circleRadius - 5), 15, 3, "#ff00e0");
                    this.selectedHeadingLine.setAttribute("id", "selectedHeadingLine");
                    this.selectedHeadingGroup.appendChild(this.selectedHeadingLine);
                    this.selectedHeadingBug = document.createElementNS(Avionics.SVG.NS, "path");
                    this.selectedHeadingBug.setAttribute("id", "selectedHeadingBug");
                    this.selectedHeadingBug.setAttribute("d", "M50 " + (50 + circleRadius) + " h 22 v 22 h -7 l -15 -22 l -15 22 h -7 v -22 z");
                    this.selectedHeadingBug.setAttribute("stroke", "#ff00e0");
                    this.selectedHeadingBug.setAttribute("fill", "none");
                    this.selectedHeadingGroup.appendChild(this.selectedHeadingBug);
                }
                this.rotatingCircle.appendChild(this.selectedHeadingGroup);
                this.selectedTrackGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.selectedTrackGroup.setAttribute("id", "selectedTrackGroup");
                {
                    this.selectedTrackLine = Avionics.SVG.computeDashLine(50, 70, (circleRadius - 5), 15, 3, "#ff00e0");
                    this.selectedTrackLine.setAttribute("id", "selectedTrackLine");
                    this.selectedTrackGroup.appendChild(this.selectedTrackLine);
                    this.selectedTrackBug = document.createElementNS(Avionics.SVG.NS, "path");
                    this.selectedTrackBug.setAttribute("id", "selectedTrackBug");
                    this.selectedTrackBug.setAttribute("d", "M50 " + (50 + circleRadius) + " h -30 v -15 l 30 -15 l 30 15 v 15 z");
                    this.selectedTrackBug.setAttribute("stroke", "#ff00e0");
                    this.selectedTrackBug.setAttribute("stroke-width", "2");
                    this.selectedTrackGroup.appendChild(this.selectedTrackBug);
                }
                this.rotatingCircle.appendChild(this.selectedTrackGroup);
                this.ilsGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.ilsGroup.setAttribute("id", "ILSGroup");
                {
                    const ilsBug = document.createElementNS(Avionics.SVG.NS, "path");
                    ilsBug.setAttribute("id", "ilsBug");
                    ilsBug.setAttribute("d", "M50 " + (50 + circleRadius) + " l0 40 M35 " + (50 + circleRadius + 10) + " l30 0");
                    ilsBug.setAttribute("fill", "transparent");
                    ilsBug.setAttribute("stroke", "#FF0CE2");
                    ilsBug.setAttribute("stroke-width", "3");
                    this.ilsGroup.appendChild(ilsBug);
                }
                this.rotatingCircle.appendChild(this.ilsGroup);
            }
            {
                this.currentRefGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.currentRefGroup.setAttribute("id", "currentRefGroup");
                {
                    if (!this._fullscreen) {
                        this.currentRefGroup.setAttribute("transform", "translate(-10 212) scale(1.2)");
                    }
                    const centerX = 50;
                    const centerY = 50 - circleRadius - 40;
                    const rectWidth = 65;
                    const rectHeight = 40;
                    const textOffset = 5;
                    this.currentRefMode = document.createElementNS(Avionics.SVG.NS, "text");
                    this.currentRefMode.textContent = "HDG";
                    this.currentRefMode.setAttribute("x", (centerX - rectWidth * 0.5 - textOffset).toString());
                    this.currentRefMode.setAttribute("y", centerY.toString());
                    this.currentRefMode.setAttribute("fill", "green");
                    this.currentRefMode.setAttribute("font-size", "23");
                    this.currentRefMode.setAttribute("font-family", "Roboto-Bold");
                    this.currentRefMode.setAttribute("text-anchor", "end");
                    this.currentRefMode.setAttribute("alignment-baseline", "central");
                    this.currentRefGroup.appendChild(this.currentRefMode);
                    const rect = document.createElementNS(Avionics.SVG.NS, "rect");
                    rect.setAttribute("x", (centerX - rectWidth * 0.5).toString());
                    rect.setAttribute("y", (centerY - rectHeight * 0.5).toString());
                    rect.setAttribute("width", rectWidth.toString());
                    rect.setAttribute("height", rectHeight.toString());
                    rect.setAttribute("fill", "black");
                    this.currentRefGroup.appendChild(rect);
                    const path = document.createElementNS(Avionics.SVG.NS, "path");
                    path.setAttribute("d", "M" + (centerX - (rectWidth * 0.5)) + " " + (centerY - (rectHeight * 0.5)) + " l0 " + rectHeight + " l" + rectWidth + " 0 l0 " + (-rectHeight));
                    path.setAttribute("fill", "none");
                    path.setAttribute("stroke", "white");
                    path.setAttribute("stroke-width", "1");
                    this.currentRefGroup.appendChild(path);
                    this.currentRefValue = document.createElementNS(Avionics.SVG.NS, "text");
                    this.currentRefValue.textContent = "266";
                    this.currentRefValue.setAttribute("x", centerX.toString());
                    this.currentRefValue.setAttribute("y", centerY.toString());
                    this.currentRefValue.setAttribute("fill", "white");
                    this.currentRefValue.setAttribute("font-size", "28");
                    this.currentRefValue.setAttribute("font-family", "Roboto-Bold");
                    this.currentRefValue.setAttribute("text-anchor", "middle");
                    this.currentRefValue.setAttribute("alignment-baseline", "central");
                    this.currentRefGroup.appendChild(this.currentRefValue);
                    this.currentRefType = document.createElementNS(Avionics.SVG.NS, "text");
                    this.currentRefType.textContent = "MAG";
                    this.currentRefType.setAttribute("x", (centerX + rectWidth * 0.5 + textOffset).toString());
                    this.currentRefType.setAttribute("y", centerY.toString());
                    this.currentRefType.setAttribute("fill", "green");
                    this.currentRefType.setAttribute("font-size", "23");
                    this.currentRefType.setAttribute("font-family", "Roboto-Bold");
                    this.currentRefType.setAttribute("text-anchor", "start");
                    this.currentRefType.setAttribute("alignment-baseline", "central");
                    this.currentRefGroup.appendChild(this.currentRefType);
                }
                viewBox.appendChild(this.currentRefGroup);
                const rangeGroup = document.createElementNS(Avionics.SVG.NS, "g");
                rangeGroup.setAttribute("id", "RangeGroup");
                {
                    let centerX = -185;
                    let centerY = 50 - circleRadius;
                    if (this._fullscreen) {
                        rangeGroup.setAttribute("transform", "scale(0.8)");
                        centerX += 2;
                        centerY -= 141;
                    } else {
                        centerY -= 40;
                    }
                    const textBg = document.createElementNS(Avionics.SVG.NS, "rect");
                    textBg.setAttribute("x", (centerX - 40).toString());
                    textBg.setAttribute("y", (centerY - 32).toString());
                    textBg.setAttribute("width", "80");
                    textBg.setAttribute("height", "64");
                    textBg.setAttribute("fill", "black");
                    textBg.setAttribute("stroke", "white");
                    textBg.setAttribute("stroke-width", "2");
                    rangeGroup.appendChild(textBg);
                    const textTitle = document.createElementNS(Avionics.SVG.NS, "text");
                    textTitle.textContent = "RANGE";
                    textTitle.setAttribute("x", centerX.toString());
                    textTitle.setAttribute("y", (centerY - 15).toString());
                    textTitle.setAttribute("fill", "white");
                    textTitle.setAttribute("font-size", "25");
                    textTitle.setAttribute("font-family", "Roboto-Light");
                    textTitle.setAttribute("text-anchor", "middle");
                    textTitle.setAttribute("alignment-baseline", "central");
                    rangeGroup.appendChild(textTitle);
                    this.addMapRange(rangeGroup, centerX, (centerY + 15), "white", "25", false, 1.0, false);
                }
                viewBox.appendChild(rangeGroup);
            }
        }
    }
    constructPlan() {
        super.constructPlan();
        if (this.aircraft == Aircraft.B747_8) {
            this.constructPlan_B747_8();
        } else if (this.aircraft == Aircraft.AS01B) {
            this.constructPlan_AS01B();
        } else if (this.aircraft == Aircraft.CJ4) {
            this.constructPlan_CJ4();
        } else {
            this.constructPlan_A320_Neo();
        }
    }
    constructPlan_B747_8() {
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "0 0 1000 1000");
        this.appendChild(this.root);
        {
            const circleRadius = 333;
            const outerCircleGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.root.appendChild(outerCircleGroup);
            {
                const texts = ["N", "E", "S", "W"];
                for (let i = 0; i < 4; i++) {
                    const textGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    textGroup.setAttribute("transform", "rotate(" + fastToFixed(i * 90, 0) + " 500 500)");
                    {
                        const text = document.createElementNS(Avionics.SVG.NS, "text");
                        text.textContent = texts[i];
                        text.setAttribute("x", "500");
                        text.setAttribute("y", "115");
                        text.setAttribute("fill", "white");
                        text.setAttribute("font-size", "50");
                        text.setAttribute("font-family", "Roboto-Light");
                        text.setAttribute("text-anchor", "middle");
                        text.setAttribute("alignment-baseline", "central");
                        text.setAttribute("transform", "rotate(" + -fastToFixed(i * 90, 0) + " 500 115)");
                        textGroup.appendChild(text);
                        outerCircleGroup.appendChild(textGroup);
                    }
                }
                const outerCircle = document.createElementNS(Avionics.SVG.NS, "circle");
                outerCircle.setAttribute("cx", "500");
                outerCircle.setAttribute("cy", "500");
                outerCircle.setAttribute("r", circleRadius.toString());
                outerCircle.setAttribute("fill", "none");
                outerCircle.setAttribute("stroke", "white");
                outerCircle.setAttribute("stroke-width", "4");
                outerCircleGroup.appendChild(outerCircle);
                this.addMapRange(outerCircleGroup, 500, 167, "white", "30", true, 0.5, true);
                this.addMapRange(outerCircleGroup, 500, 833, "white", "30", true, 0.5, true);
            }
            const innerCircleGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.root.appendChild(innerCircleGroup);
            {
                const innerCircle = document.createElementNS(Avionics.SVG.NS, "circle");
                innerCircle.setAttribute("cx", "500");
                innerCircle.setAttribute("cy", "500");
                innerCircle.setAttribute("r", "166");
                innerCircle.setAttribute("fill", "none");
                innerCircle.setAttribute("stroke", "white");
                innerCircle.setAttribute("stroke-width", "4");
                innerCircleGroup.appendChild(innerCircle);
                this.addMapRange(innerCircleGroup, 500, 334, "white", "30", true, 0.25, true);
                this.addMapRange(innerCircleGroup, 500, 666, "white", "30", true, 0.25, true);
            }
            const rangeGroup = document.createElementNS(Avionics.SVG.NS, "g");
            rangeGroup.setAttribute("id", "RangeGroup");
            rangeGroup.setAttribute("transform", "scale(1.25)");
            {
                const centerX = 245;
                const centerY = 48;
                const textBg = document.createElementNS(Avionics.SVG.NS, "rect");
                textBg.setAttribute("x", (centerX - 40).toString());
                textBg.setAttribute("y", (centerY - 32).toString());
                textBg.setAttribute("width", "80");
                textBg.setAttribute("height", "64");
                textBg.setAttribute("fill", "black");
                textBg.setAttribute("stroke", "white");
                textBg.setAttribute("stroke-width", "1");
                rangeGroup.appendChild(textBg);
                const textTitle = document.createElementNS(Avionics.SVG.NS, "text");
                textTitle.textContent = "RANGE";
                textTitle.setAttribute("x", centerX.toString());
                textTitle.setAttribute("y", (centerY - 15).toString());
                textTitle.setAttribute("fill", "white");
                textTitle.setAttribute("font-size", "25");
                textTitle.setAttribute("font-family", "Roboto-Light");
                textTitle.setAttribute("text-anchor", "middle");
                textTitle.setAttribute("alignment-baseline", "central");
                rangeGroup.appendChild(textTitle);
                this.addMapRange(rangeGroup, centerX, (centerY + 15), "white", "25", false, 1.0, false);
            }
            this.root.appendChild(rangeGroup);
        }
    }
    constructPlan_AS01B() {
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "0 0 1000 1000");
        this.appendChild(this.root);
        {
            const circleRadius = 333;
            const outerCircleGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.root.appendChild(outerCircleGroup);
            {
                const texts = ["N", "E", "S", "W"];
                for (let i = 0; i < 4; i++) {
                    const textGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    textGroup.setAttribute("transform", "rotate(" + fastToFixed(i * 90, 0) + " 500 500)");
                    {
                        const text = document.createElementNS(Avionics.SVG.NS, "text");
                        text.textContent = texts[i];
                        text.setAttribute("x", "500");
                        text.setAttribute("y", "115");
                        text.setAttribute("fill", "white");
                        text.setAttribute("font-size", "50");
                        text.setAttribute("font-family", "Roboto-Light");
                        text.setAttribute("text-anchor", "middle");
                        text.setAttribute("alignment-baseline", "central");
                        text.setAttribute("transform", "rotate(" + -fastToFixed(i * 90, 0) + " 500 115)");
                        textGroup.appendChild(text);
                        outerCircleGroup.appendChild(textGroup);
                    }
                }
                const outerCircle = document.createElementNS(Avionics.SVG.NS, "circle");
                outerCircle.setAttribute("cx", "500");
                outerCircle.setAttribute("cy", "500");
                outerCircle.setAttribute("r", circleRadius.toString());
                outerCircle.setAttribute("fill", "none");
                outerCircle.setAttribute("stroke", "white");
                outerCircle.setAttribute("stroke-width", "4");
                outerCircleGroup.appendChild(outerCircle);
                this.addMapRange(outerCircleGroup, 500, 167, "white", "30", true, 0.5, true);
                this.addMapRange(outerCircleGroup, 500, 833, "white", "30", true, 0.5, true);
            }
            const innerCircleGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.root.appendChild(innerCircleGroup);
            {
                const innerCircle = document.createElementNS(Avionics.SVG.NS, "circle");
                innerCircle.setAttribute("cx", "500");
                innerCircle.setAttribute("cy", "500");
                innerCircle.setAttribute("r", "166");
                innerCircle.setAttribute("fill", "none");
                innerCircle.setAttribute("stroke", "white");
                innerCircle.setAttribute("stroke-width", "4");
                innerCircleGroup.appendChild(innerCircle);
                this.addMapRange(innerCircleGroup, 500, 334, "white", "30", true, 0.25, true);
                this.addMapRange(innerCircleGroup, 500, 666, "white", "30", true, 0.25, true);
            }
            const rangeGroup = document.createElementNS(Avionics.SVG.NS, "g");
            rangeGroup.setAttribute("id", "RangeGroup");
            {
                let centerX = 145;
                let centerY = 67;
                if (this._fullscreen) {
                    rangeGroup.setAttribute("transform", "scale(1.27)");
                } else {
                    centerX = 266;
                    centerY = 98;
                }
                const textBg = document.createElementNS(Avionics.SVG.NS, "rect");
                textBg.setAttribute("x", (centerX - 40).toString());
                textBg.setAttribute("y", (centerY - 32).toString());
                textBg.setAttribute("width", "80");
                textBg.setAttribute("height", "64");
                textBg.setAttribute("fill", "black");
                textBg.setAttribute("stroke", "white");
                textBg.setAttribute("stroke-width", "2");
                rangeGroup.appendChild(textBg);
                const textTitle = document.createElementNS(Avionics.SVG.NS, "text");
                textTitle.textContent = "RANGE";
                textTitle.setAttribute("x", (centerX - 0.5).toString());
                textTitle.setAttribute("y", (centerY - 14).toString());
                textTitle.setAttribute("fill", "white");
                textTitle.setAttribute("font-size", "25");
                textTitle.setAttribute("font-family", "Roboto-Light");
                textTitle.setAttribute("text-anchor", "middle");
                textTitle.setAttribute("alignment-baseline", "central");
                rangeGroup.appendChild(textTitle);
                this.addMapRange(rangeGroup, (centerX - 0.5), (centerY + 15.5), "white", "25", false, 1.0, false);
            }
            this.root.appendChild(rangeGroup);
        }
    }
    constructPlan_A320_Neo() {
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "0 0 1000 1000");
        this.appendChild(this.root);
        {
            const circleRadius = 333;
            const circleGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.root.appendChild(circleGroup);
            {
                const texts = ["N", "E", "S", "W"];
                for (let i = 0; i < 4; i++) {
                    const triangle = document.createElementNS(Avionics.SVG.NS, "path");
                    triangle.setAttribute("fill", "white");
                    triangle.setAttribute("d", "M500 176 L516 199 L484 199 Z");
                    triangle.setAttribute("transform", "rotate(" + fastToFixed(i * 90, 0) + " 500 500)");
                    circleGroup.appendChild(triangle);
                    const textGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    textGroup.setAttribute("transform", "rotate(" + fastToFixed(i * 90, 0) + " 500 500)");
                    {
                        const text = document.createElementNS(Avionics.SVG.NS, "text");
                        text.textContent = texts[i];
                        text.setAttribute("x", "500");
                        text.setAttribute("y", "230");
                        text.setAttribute("fill", "white");
                        text.setAttribute("font-size", "50");
                        text.setAttribute("font-family", "Roboto-Light");
                        text.setAttribute("text-anchor", "middle");
                        text.setAttribute("alignment-baseline", "central");
                        text.setAttribute("transform", "rotate(" + -fastToFixed(i * 90, 0) + " 500 230)");
                        textGroup.appendChild(text);
                        circleGroup.appendChild(textGroup);
                    }
                }
                {
                    const innerCircle = document.createElementNS(Avionics.SVG.NS, "circle");
                    innerCircle.setAttribute("cx", "500");
                    innerCircle.setAttribute("cy", "500");
                    innerCircle.setAttribute("r", (circleRadius * 0.5).toString());
                    innerCircle.setAttribute("fill", "none");
                    innerCircle.setAttribute("stroke", "white");
                    innerCircle.setAttribute("stroke-width", "4");
                    circleGroup.appendChild(innerCircle);
                    const outerCircle = document.createElementNS(Avionics.SVG.NS, "circle");
                    outerCircle.setAttribute("cx", "500");
                    outerCircle.setAttribute("cy", "500");
                    outerCircle.setAttribute("r", circleRadius.toString());
                    outerCircle.setAttribute("fill", "none");
                    outerCircle.setAttribute("stroke", "white");
                    outerCircle.setAttribute("stroke-width", "4");
                    circleGroup.appendChild(outerCircle);
                    const vec = new Vec2(1, 1);
                    vec.SetNorm(333 - 45);
                    this.addMapRange(circleGroup, 500 - vec.x, 500 + vec.y, "#00F2FF", "32", false, 1.0, true);
                }
            }
        }
    }
    constructPlan_CJ4() {
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "0 0 1000 1000");
        this.appendChild(this.root);
        {
            const circleRadius = 333;
            const circleGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.root.appendChild(circleGroup);
            {
                const outerCircle = document.createElementNS(Avionics.SVG.NS, "circle");
                outerCircle.setAttribute("cx", "500");
                outerCircle.setAttribute("cy", "500");
                outerCircle.setAttribute("r", circleRadius.toString());
                outerCircle.setAttribute("fill", "none");
                outerCircle.setAttribute("stroke", "white");
                outerCircle.setAttribute("stroke-width", "4");
                circleGroup.appendChild(outerCircle);
                const vec = new Vec2(1, 0.45);
                vec.SetNorm(circleRadius * 0.87);
                this.addMapRange(circleGroup, 500 - vec.x, 500 - vec.y, "white", "28", false, 1.0, false);
            }
            this.currentRefGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.currentRefGroup.setAttribute("id", "currentRefGroup");
            this.currentRefGroup.setAttribute("transform", "scale(1.5)");
            {
                const centerX = 332;
                const centerY = 75;
                const rectWidth = 65;
                const rectHeight = 40;
                const rectArrowFactor = 0.35;
                const rect = document.createElementNS(Avionics.SVG.NS, "rect");
                rect.setAttribute("x", (centerX - rectWidth * 0.5).toString());
                rect.setAttribute("y", (centerY - rectHeight * 0.5).toString());
                rect.setAttribute("width", rectWidth.toString());
                rect.setAttribute("height", rectHeight.toString());
                rect.setAttribute("fill", "black");
                this.currentRefGroup.appendChild(rect);
                let d = "M" + (centerX - (rectWidth * 0.5)) + " " + (centerY - (rectHeight * 0.5));
                d += " l0 " + rectHeight;
                d += " l" + (rectWidth * rectArrowFactor) + " 0";
                d += " l" + (rectWidth * 0.5 - rectWidth * rectArrowFactor) + " 9";
                d += " l" + (rectWidth * 0.5 - rectWidth * rectArrowFactor) + " -9";
                d += " l" + (rectWidth * rectArrowFactor) + " 0";
                d += " l0 " + (-rectHeight);
                const path = document.createElementNS(Avionics.SVG.NS, "path");
                path.setAttribute("d", d);
                path.setAttribute("fill", "none");
                path.setAttribute("stroke", "white");
                path.setAttribute("stroke-width", "2");
                this.currentRefGroup.appendChild(path);
                this.currentRefValue = document.createElementNS(Avionics.SVG.NS, "text");
                this.currentRefValue.textContent = "";
                this.currentRefValue.setAttribute("x", centerX.toString());
                this.currentRefValue.setAttribute("y", centerY.toString());
                this.currentRefValue.setAttribute("fill", "green");
                this.currentRefValue.setAttribute("font-size", "28");
                this.currentRefValue.setAttribute("font-family", "Roboto-Bold");
                this.currentRefValue.setAttribute("text-anchor", "middle");
                this.currentRefValue.setAttribute("alignment-baseline", "central");
                this.currentRefGroup.appendChild(this.currentRefValue);
            }
            this.root.appendChild(this.currentRefGroup);
            this.selectedRefGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.selectedRefGroup.setAttribute("id", "selectedRefGroup");
            this.selectedRefGroup.setAttribute("transform", "scale(1.5)");
            {
                const centerX = 180;
                const centerY = 62;
                const spaceX = 5;
                this.selectedRefMode = document.createElementNS(Avionics.SVG.NS, "text");
                this.selectedRefMode.textContent = "HDG";
                this.selectedRefMode.setAttribute("x", (centerX - spaceX).toString());
                this.selectedRefMode.setAttribute("y", centerY.toString());
                this.selectedRefMode.setAttribute("fill", "#00F2FF");
                this.selectedRefMode.setAttribute("font-size", "18");
                this.selectedRefMode.setAttribute("font-family", "Roboto-Bold");
                this.selectedRefMode.setAttribute("text-anchor", "end");
                this.selectedRefMode.setAttribute("alignment-baseline", "central");
                this.selectedRefGroup.appendChild(this.selectedRefMode);
                this.selectedRefValue = document.createElementNS(Avionics.SVG.NS, "text");
                this.selectedRefValue.textContent = "";
                this.selectedRefValue.setAttribute("x", (centerX + spaceX).toString());
                this.selectedRefValue.setAttribute("y", centerY.toString());
                this.selectedRefValue.setAttribute("fill", "#00F2FF");
                this.selectedRefValue.setAttribute("font-size", "23");
                this.selectedRefValue.setAttribute("font-family", "Roboto-Bold");
                this.selectedRefValue.setAttribute("text-anchor", "start");
                this.selectedRefValue.setAttribute("alignment-baseline", "central");
                this.selectedRefGroup.appendChild(this.selectedRefValue);
            }
            this.root.appendChild(this.selectedRefGroup);
        }
    }
    constructRose() {
        super.constructRose();
        if (this.aircraft == Aircraft.CJ4) {
            this.constructRose_CJ4();
        } else if (this.aircraft == Aircraft.B747_8) {
            this.constructRose_B747_8();
        } else if (this.aircraft == Aircraft.AS01B) {
            this.constructRose_AS01B();
        } else {
            this.constructRose_A320_Neo();
        }
    }
    constructRose_A320_Neo() {
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "0 0 1000 1000");
        this.appendChild(this.root);
        const circleRadius = 333;
        {
            this.rotatingCircle = document.createElementNS(Avionics.SVG.NS, "g");
            this.rotatingCircle.setAttribute("id", "RotatingCircle");
            this.root.appendChild(this.rotatingCircle);
            const outerGroup = document.createElementNS(Avionics.SVG.NS, "g");
            outerGroup.setAttribute("id", "outerCircle");
            this.rotatingCircle.appendChild(outerGroup);
            {
                for (let i = 0; i < 72; i++) {
                    const line = document.createElementNS(Avionics.SVG.NS, "rect");
                    const length = i % 2 == 0 ? 26 : 13;
                    line.setAttribute("x", "498");
                    line.setAttribute("y", fastToFixed(833, 0));
                    line.setAttribute("width", "4");
                    line.setAttribute("height", length.toString());
                    line.setAttribute("transform", "rotate(" + fastToFixed(i * 5, 0) + " 500 500)");
                    line.setAttribute("fill", "white");
                    outerGroup.appendChild(line);
                }
                for (let i = 0; i < 36; i += 3) {
                    const text = document.createElementNS(Avionics.SVG.NS, "text");
                    text.textContent = fastToFixed(i, 0);
                    text.setAttribute("x", "500");
                    text.setAttribute("y", "115");
                    text.setAttribute("fill", "white");
                    text.setAttribute("font-size", "40");
                    text.setAttribute("font-family", "Roboto-Light");
                    text.setAttribute("text-anchor", "middle");
                    text.setAttribute("alignment-baseline", "central");
                    text.setAttribute("transform", "rotate(" + fastToFixed(i * 10, 0) + " 500 500)");
                    outerGroup.appendChild(text);
                }
                const outerCircle = document.createElementNS(Avionics.SVG.NS, "circle");
                outerCircle.setAttribute("cx", "500");
                outerCircle.setAttribute("cy", "500");
                outerCircle.setAttribute("r", circleRadius.toString());
                outerCircle.setAttribute("fill", "none");
                outerCircle.setAttribute("stroke", "white");
                outerCircle.setAttribute("stroke-width", "4");
                outerGroup.appendChild(outerCircle);
                const vec = new Vec2(1, 1);
                vec.SetNorm(circleRadius - 45);
                this.addMapRange(this.root, 500 - vec.x, 500 + vec.y, "#00F2FF", "32", false, 1.0, true);
            }
            const innerGroup = document.createElementNS(Avionics.SVG.NS, "g");
            innerGroup.setAttribute("id", "innerCircle");
            this.rotatingCircle.appendChild(innerGroup);
            {
                for (let i = 0; i < 8; i++) {
                    const line = document.createElementNS(Avionics.SVG.NS, "rect");
                    line.setAttribute("x", "497");
                    line.setAttribute("y", fastToFixed(583, 0));
                    line.setAttribute("width", "6");
                    line.setAttribute("height", "26");
                    line.setAttribute("transform", "rotate(" + fastToFixed(i * 45, 0) + " 500 500)");
                    line.setAttribute("fill", "white");
                    innerGroup.appendChild(line);
                }
                const innerCircle = document.createElementNS(Avionics.SVG.NS, "circle");
                innerCircle.setAttribute("cx", "500");
                innerCircle.setAttribute("cy", "500");
                innerCircle.setAttribute("r", "166");
                innerCircle.setAttribute("fill", "none");
                innerCircle.setAttribute("stroke", "white");
                innerCircle.setAttribute("stroke-width", "4");
                innerGroup.appendChild(innerCircle);
            }
            this.courseGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.courseGroup.setAttribute("id", "CourseInfo");
            this.rotatingCircle.appendChild(this.courseGroup);
            {
                this.bearing1 = document.createElementNS(Avionics.SVG.NS, "g");
                this.bearing1.setAttribute("id", "bearing1");
                this.bearing1.setAttribute("visibility", "hidden");
                this.courseGroup.appendChild(this.bearing1);
                let arrow = document.createElementNS(Avionics.SVG.NS, "path");
                arrow.setAttribute("d", "M500 960 L500 800 M500 40 L500 200 M500 80 L570 150 M500 80 L430 150");
                arrow.setAttribute("stroke", "#36c8d2");
                arrow.setAttribute("stroke-width", "10");
                arrow.setAttribute("fill", "none");
                this.bearing1.appendChild(arrow);
                this.bearing2 = document.createElementNS(Avionics.SVG.NS, "g");
                this.bearing2.setAttribute("id", "bearing2");
                this.bearing2.setAttribute("visibility", "hidden");
                this.courseGroup.appendChild(this.bearing2);
                arrow = document.createElementNS(Avionics.SVG.NS, "path");
                arrow.setAttribute("d", "M500 960 L500 920 M470 800 L470 900 Q500 960 530 900 L530 800 M500 40 L500 80 L570 150 M500 80 L430 150 M470 110 L470 200 M530 110 L530 200");
                arrow.setAttribute("stroke", "#36c8d2");
                arrow.setAttribute("stroke-width", "10");
                arrow.setAttribute("fill", "none");
                this.bearing2.appendChild(arrow);
                this.course = document.createElementNS(Avionics.SVG.NS, "g");
                this.course.setAttribute("id", "course");
                this.courseGroup.appendChild(this.course);
                {
                    this.courseColor = "";
                    if (this.navigationMode == Jet_NDCompass_Navigation.ILS) {
                        this.courseColor = "#ff00ff";
                    } else if (this.navigationMode == Jet_NDCompass_Navigation.VOR) {
                        this.courseColor = "#00ffff";
                    }
                    this.courseTO = document.createElementNS(Avionics.SVG.NS, "path");
                    this.courseTO.setAttribute("d", "M497 666 L503 666 L503 696 L523 696 L523 702 L503 702 L503 826 L497 826 L497 702 L477 702 L477 696 L497 696 L497 666 Z");
                    this.courseTO.setAttribute("fill", "none");
                    this.courseTO.setAttribute("transform", "rotate(180 500 500)");
                    this.courseTO.setAttribute("stroke", this.courseColor.toString());
                    this.courseTO.setAttribute("stroke-width", "1");
                    this.course.appendChild(this.courseTO);
                    if (this.navigationMode === Jet_NDCompass_Navigation.ILS) {
                        this.courseDeviation = document.createElementNS(Avionics.SVG.NS, "rect");
                        this.courseDeviation.setAttribute("x", "495");
                        this.courseDeviation.setAttribute("y", "333");
                        this.courseDeviation.setAttribute("width", "10");
                        this.courseDeviation.setAttribute("height", "333");
                        this.courseDeviation.setAttribute("fill", this.courseColor.toString());
                        this.course.appendChild(this.courseDeviation);
                    } else if (this.navigationMode === Jet_NDCompass_Navigation.VOR) {
                        this.courseDeviation = document.createElementNS(Avionics.SVG.NS, "path");
                        this.courseDeviation.setAttribute("d", "M500 666 L500 333 L470 363 L500 333 L530 363 L500 333 Z");
                        this.courseDeviation.setAttribute("stroke", this.courseColor.toString());
                        this.courseDeviation.setAttribute("stroke-width", "5");
                        this.course.appendChild(this.courseDeviation);
                    }
                    this.courseFROM = document.createElementNS(Avionics.SVG.NS, "rect");
                    this.courseFROM.setAttribute("x", "497");
                    this.courseFROM.setAttribute("y", "166");
                    this.courseFROM.setAttribute("width", "6");
                    this.courseFROM.setAttribute("height", "166");
                    this.courseFROM.setAttribute("fill", "none");
                    this.courseFROM.setAttribute("transform", "rotate(180 500 500)");
                    this.courseFROM.setAttribute("stroke", this.courseColor.toString());
                    this.courseFROM.setAttribute("stroke-width", "1");
                    this.course.appendChild(this.courseFROM);
                    const circlePosition = [-166, -55, 55, 166];
                    for (let i = 0; i < circlePosition.length; i++) {
                        const CDICircle = document.createElementNS(Avionics.SVG.NS, "circle");
                        CDICircle.setAttribute("cx", (500 + circlePosition[i]).toString());
                        CDICircle.setAttribute("cy", "500");
                        CDICircle.setAttribute("r", "10");
                        CDICircle.setAttribute("stroke", "white");
                        CDICircle.setAttribute("stroke-width", "2");
                        this.course.appendChild(CDICircle);
                    }
                }
                this.bearingCircle = document.createElementNS(Avionics.SVG.NS, "circle");
                this.bearingCircle.setAttribute("cx", "500");
                this.bearingCircle.setAttribute("cy", "500");
                this.bearingCircle.setAttribute("r", "30");
                this.bearingCircle.setAttribute("stroke", "white");
                this.bearingCircle.setAttribute("stroke-width", "0.8");
                this.bearingCircle.setAttribute("fill-opacity", "0");
                this.bearingCircle.setAttribute("visibility", "hidden");
                this.courseGroup.appendChild(this.bearingCircle);
            }
            this.trackingGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.trackingGroup.setAttribute("id", "trackingGroup");
            {
                const halfw = 13;
                const halfh = 20;
                const p1 = (500) + ", " + (500 - circleRadius);
                const p2 = (500 + halfw) + ", " + (500 - circleRadius + halfh);
                const p3 = (500) + ", " + (500 - circleRadius + halfh * 2);
                const p4 = (500 - halfw) + ", " + (500 - circleRadius + halfh);
                this.trackingBug = document.createElementNS(Avionics.SVG.NS, "polygon");
                this.trackingBug.setAttribute("id", "trackingBug");
                this.trackingBug.setAttribute("points", p1 + " " + p2 + " " + p3 + " " + p4);
                this.trackingBug.setAttribute("stroke", "#00FF21");
                this.trackingBug.setAttribute("stroke-width", "2");
                this.trackingGroup.appendChild(this.trackingBug);
            }
            this.rotatingCircle.appendChild(this.trackingGroup);
            this.headingGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.headingGroup.setAttribute("id", "headingGroup");
            {
            }
            this.rotatingCircle.appendChild(this.headingGroup);
            this.selectedHeadingGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.selectedHeadingGroup.setAttribute("id", "selectedHeadingGroup");
            {
                this.selectedHeadingBug = document.createElementNS(Avionics.SVG.NS, "path");
                this.selectedHeadingBug.setAttribute("id", "selectedHeadingBug");
                this.selectedHeadingBug.setAttribute("d", "M500 " + (500 - circleRadius) + " l -11 -25 l 22 0 z");
                this.selectedHeadingBug.setAttribute("stroke", "#00F2FF");
                this.selectedHeadingBug.setAttribute("stroke-width", "2");
                this.selectedHeadingBug.setAttribute("fill", "none");
                this.selectedHeadingGroup.appendChild(this.selectedHeadingBug);
            }
            this.rotatingCircle.appendChild(this.selectedHeadingGroup);
            if (this.navigationMode == Jet_NDCompass_Navigation.NAV || this.navigationMode == Jet_NDCompass_Navigation.ILS) {
                this.ilsGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.ilsGroup.setAttribute("id", "ILSGroup");
                {
                    const ilsBug = document.createElementNS(Avionics.SVG.NS, "path");
                    ilsBug.setAttribute("id", "ilsBug");
                    ilsBug.setAttribute("d", "M500 " + (500 - circleRadius) + " l0 -40 M485 " + (500 - circleRadius - 10) + " l30 0");
                    ilsBug.setAttribute("fill", "transparent");
                    ilsBug.setAttribute("stroke", "#FF0CE2");
                    ilsBug.setAttribute("stroke-width", "3");
                    this.ilsGroup.appendChild(ilsBug);
                }
                this.rotatingCircle.appendChild(this.ilsGroup);
            }
            if (this.navigationMode == Jet_NDCompass_Navigation.NAV) {
                this.selectedTrackGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.selectedTrackGroup.setAttribute("id", "selectedTrackGroup");
                {
                    this.selectedTrackLine = Avionics.SVG.computeDashLine(500, 500, -circleRadius, 15, 3, "#00F2FF");
                    this.selectedTrackLine.setAttribute("id", "selectedTrackLine");
                    this.selectedTrackGroup.appendChild(this.selectedTrackLine);
                    this.selectedTrackBug = document.createElementNS(Avionics.SVG.NS, "path");
                    this.selectedTrackBug.setAttribute("id", "selectedTrackBug");
                    this.selectedTrackBug.setAttribute("d", "M500 " + (500 - circleRadius) + " h -30 v -15 l 30 -15 l 30 15 v 15 z");
                    this.selectedTrackBug.setAttribute("stroke", "#00F2FF");
                    this.selectedTrackBug.setAttribute("stroke-width", "2");
                    this.selectedTrackGroup.appendChild(this.selectedTrackBug);
                }
                this.rotatingCircle.appendChild(this.selectedTrackGroup);
            }
        }
        this.glideSlopeGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.glideSlopeGroup.setAttribute("id", "GlideSlopeGroup");
        this.root.appendChild(this.glideSlopeGroup);
        if (this.navigationMode === Jet_NDCompass_Navigation.ILS) {
            for (let i = 0; i < 5; i++) {
                if (i != 2) {
                    const glideSlopeDot = document.createElementNS(Avionics.SVG.NS, "circle");
                    glideSlopeDot.setAttribute("cx", "950");
                    glideSlopeDot.setAttribute("cy", (250 + i * 125).toFixed(0));
                    glideSlopeDot.setAttribute("r", "10");
                    glideSlopeDot.setAttribute("stroke", "white");
                    glideSlopeDot.setAttribute("stroke-width", "2");
                    this.glideSlopeGroup.appendChild(glideSlopeDot);
                }
            }
            const glideSlopeDash = document.createElementNS(Avionics.SVG.NS, "rect");
            glideSlopeDash.setAttribute("x", "935");
            glideSlopeDash.setAttribute("y", "498");
            glideSlopeDash.setAttribute("width", "30");
            glideSlopeDash.setAttribute("height", "4");
            glideSlopeDash.setAttribute("fill", "yellow");
            this.glideSlopeGroup.appendChild(glideSlopeDash);
            this.glideSlopeCursor = document.createElementNS(Avionics.SVG.NS, "path");
            this.glideSlopeCursor.setAttribute("id", "GlideSlopeCursor");
            this.glideSlopeCursor.setAttribute("transform", "translate(" + 950 + " " + 500 + ")");
            this.glideSlopeCursor.setAttribute("d", "M-15 0 L0 -20 L15 0 M-15 0 L0 20 L15 0");
            this.glideSlopeCursor.setAttribute("stroke", "#ff00ff");
            this.glideSlopeCursor.setAttribute("stroke-width", "2");
            this.glideSlopeCursor.setAttribute("fill", "none");
            this.glideSlopeGroup.appendChild(this.glideSlopeCursor);
        }
        {
            const lineStart = 500 - circleRadius - 22;
            const lineEnd = 500 - circleRadius + 22;
            const neutralLine = document.createElementNS(Avionics.SVG.NS, "line");
            neutralLine.setAttribute("id", "NeutralLine");
            neutralLine.setAttribute("x1", "500");
            neutralLine.setAttribute("y1", lineStart.toString());
            neutralLine.setAttribute("x2", "500");
            neutralLine.setAttribute("y2", lineEnd.toString());
            neutralLine.setAttribute("stroke", "yellow");
            neutralLine.setAttribute("stroke-width", "6");
            this.root.appendChild(neutralLine);
        }
    }
    constructRose_B747_8() {
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "0 0 1000 1000");
        this.appendChild(this.root);
        const circleRadius = 360;
        {
            this.rotatingCircle = document.createElementNS(Avionics.SVG.NS, "g");
            this.rotatingCircle.setAttribute("id", "RotatingCircle");
            this.root.appendChild(this.rotatingCircle);
            const outerGroup = document.createElementNS(Avionics.SVG.NS, "g");
            outerGroup.setAttribute("id", "outerCircle");
            this.rotatingCircle.appendChild(outerGroup);
            {
                for (let i = 0; i < 72; i++) {
                    const line = document.createElementNS(Avionics.SVG.NS, "rect");
                    let startY = 500 - circleRadius;
                    let length = 30;
                    if (i % 2 != 0) {
                        if (this.navigationMode == Jet_NDCompass_Navigation.NONE || this.navigationMode == Jet_NDCompass_Navigation.NAV) {
                            continue;
                        }
                        length = 13;
                    }
                    if (i % 9 == 0) {
                        if (this.navigationMode != Jet_NDCompass_Navigation.NONE && this.navigationMode != Jet_NDCompass_Navigation.NAV) {
                            startY -= 30;
                            length += 30;
                        }
                    }
                    line.setAttribute("x", "498");
                    line.setAttribute("y", startY.toString());
                    line.setAttribute("width", "4");
                    line.setAttribute("height", length.toString());
                    line.setAttribute("transform", "rotate(" + fastToFixed(i * 5, 0) + " 500 500)");
                    line.setAttribute("fill", "white");
                    outerGroup.appendChild(line);
                }
                for (let i = 0; i < 36; i += 3) {
                    const text = document.createElementNS(Avionics.SVG.NS, "text");
                    text.textContent = fastToFixed(i, 0);
                    text.setAttribute("x", "500");
                    text.setAttribute("y", (500 - circleRadius + 52).toString());
                    text.setAttribute("fill", "white");
                    text.setAttribute("font-size", "40");
                    text.setAttribute("font-family", "Roboto-Light");
                    text.setAttribute("text-anchor", "middle");
                    text.setAttribute("alignment-baseline", "central");
                    text.setAttribute("transform", "rotate(" + fastToFixed(i * 10, 0) + " 500 500)");
                    outerGroup.appendChild(text);
                }
            }
            this.courseGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.courseGroup.setAttribute("id", "CourseInfo");
            this.rotatingCircle.appendChild(this.courseGroup);
            {
                this.bearing1 = document.createElementNS(Avionics.SVG.NS, "g");
                this.bearing1.setAttribute("id", "bearing1");
                this.bearing1.setAttribute("visibility", "hidden");
                this.courseGroup.appendChild(this.bearing1);
                let arrow = document.createElementNS(Avionics.SVG.NS, "path");
                arrow.setAttribute("d", "M500 960 L500 800 M500 40 L500 200 M500 80 L570 150 M500 80 L430 150");
                arrow.setAttribute("stroke", "#36c8d2");
                arrow.setAttribute("stroke-width", "10");
                arrow.setAttribute("fill", "none");
                this.bearing1.appendChild(arrow);
                this.bearing2 = document.createElementNS(Avionics.SVG.NS, "g");
                this.bearing2.setAttribute("id", "bearing2");
                this.bearing2.setAttribute("visibility", "hidden");
                this.courseGroup.appendChild(this.bearing2);
                arrow = document.createElementNS(Avionics.SVG.NS, "path");
                arrow.setAttribute("d", "M500 960 L500 920 M470 800 L470 900 Q500 960 530 900 L530 800 M500 40 L500 80 L570 150 M500 80 L430 150 M470 110 L470 200 M530 110 L530 200");
                arrow.setAttribute("stroke", "#36c8d2");
                arrow.setAttribute("stroke-width", "10");
                arrow.setAttribute("fill", "none");
                this.bearing2.appendChild(arrow);
                this.course = document.createElementNS(Avionics.SVG.NS, "g");
                this.course.setAttribute("id", "course");
                this.courseGroup.appendChild(this.course);
                {
                    this.courseColor = "";
                    if (this.navigationMode == Jet_NDCompass_Navigation.ILS) {
                        this.courseColor = "#ff00ff";
                    } else if (this.navigationMode == Jet_NDCompass_Navigation.VOR) {
                        this.courseColor = "#00ffff";
                    }
                    this.courseTO = document.createElementNS(Avionics.SVG.NS, "path");
                    this.courseTO.setAttribute("d", "M497 666 L503 666 L503 696 L523 696 L523 702 L503 702 L503 826 L497 826 L497 702 L477 702 L477 696 L497 696 L497 666 Z");
                    this.courseTO.setAttribute("fill", "none");
                    this.courseTO.setAttribute("transform", "rotate(180 500 500)");
                    this.courseTO.setAttribute("stroke", this.courseColor.toString());
                    this.courseTO.setAttribute("stroke-width", "1");
                    this.course.appendChild(this.courseTO);
                    this.courseDeviation = document.createElementNS(Avionics.SVG.NS, "rect");
                    this.courseDeviation.setAttribute("x", "495");
                    this.courseDeviation.setAttribute("y", "333");
                    this.courseDeviation.setAttribute("width", "10");
                    this.courseDeviation.setAttribute("height", "333");
                    this.courseDeviation.setAttribute("fill", this.courseColor.toString());
                    this.course.appendChild(this.courseDeviation);
                    this.courseFROM = document.createElementNS(Avionics.SVG.NS, "rect");
                    this.courseFROM.setAttribute("x", "497");
                    this.courseFROM.setAttribute("y", "166");
                    this.courseFROM.setAttribute("width", "6");
                    this.courseFROM.setAttribute("height", "166");
                    this.courseFROM.setAttribute("fill", "none");
                    this.courseFROM.setAttribute("transform", "rotate(180 500 500)");
                    this.courseFROM.setAttribute("stroke", this.courseColor.toString());
                    this.courseFROM.setAttribute("stroke-width", "1");
                    this.course.appendChild(this.courseFROM);
                    const circlePosition = [-166, -55, 55, 166];
                    for (let i = 0; i < circlePosition.length; i++) {
                        const CDICircle = document.createElementNS(Avionics.SVG.NS, "circle");
                        CDICircle.setAttribute("cx", (500 + circlePosition[i]).toString());
                        CDICircle.setAttribute("cy", "500");
                        CDICircle.setAttribute("r", "10");
                        CDICircle.setAttribute("stroke", "white");
                        CDICircle.setAttribute("stroke-width", "2");
                        this.course.appendChild(CDICircle);
                    }
                }
                this.bearingCircle = document.createElementNS(Avionics.SVG.NS, "circle");
                this.bearingCircle.setAttribute("cx", "500");
                this.bearingCircle.setAttribute("cy", "500");
                this.bearingCircle.setAttribute("r", "30");
                this.bearingCircle.setAttribute("stroke", "white");
                this.bearingCircle.setAttribute("stroke-width", "0.8");
                this.bearingCircle.setAttribute("fill-opacity", "0");
                this.bearingCircle.setAttribute("visibility", "hidden");
                this.courseGroup.appendChild(this.bearingCircle);
            }
            this.headingGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.headingGroup.setAttribute("id", "headingGroup");
            {
                this.headingBug = document.createElementNS(Avionics.SVG.NS, "path");
                this.headingBug.setAttribute("id", "headingBug");
                this.headingBug.setAttribute("d", "M500 " + (500 - circleRadius) + " l -11 -20 l 22 0 z");
                this.headingBug.setAttribute("fill", "none");
                this.headingBug.setAttribute("stroke", "white");
                this.headingGroup.appendChild(this.headingBug);
            }
            this.rotatingCircle.appendChild(this.headingGroup);
            this.selectedHeadingGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.selectedHeadingGroup.setAttribute("id", "selectedHeadingGroup");
            {
                this.selectedHeadingLine = Avionics.SVG.computeDashLine(500, 450, -(circleRadius - 50), 15, 3, "#ff00e0");
                this.selectedHeadingLine.setAttribute("id", "selectedHeadingLine");
                this.selectedHeadingGroup.appendChild(this.selectedHeadingLine);
                this.selectedHeadingBug = document.createElementNS(Avionics.SVG.NS, "path");
                this.selectedHeadingBug.setAttribute("id", "selectedHeadingBug");
                this.selectedHeadingBug.setAttribute("d", "M500 " + (500 - circleRadius) + " h 22 v -22 h -7 l -15 22 l -15 -22 h -7 v 22 z");
                this.selectedHeadingBug.setAttribute("stroke", "#ff00e0");
                this.selectedHeadingBug.setAttribute("fill", "none");
                this.selectedHeadingGroup.appendChild(this.selectedHeadingBug);
            }
            this.rotatingCircle.appendChild(this.selectedHeadingGroup);
            if (this.navigationMode == Jet_NDCompass_Navigation.NAV || this.navigationMode == Jet_NDCompass_Navigation.ILS) {
                this.ilsGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.ilsGroup.setAttribute("id", "ILSGroup");
                {
                    const ilsBug = document.createElementNS(Avionics.SVG.NS, "path");
                    ilsBug.setAttribute("id", "ilsBug");
                    ilsBug.setAttribute("d", "M500 " + (500 - circleRadius) + " l0 -40 M485 " + (500 - circleRadius - 10) + " l30 0");
                    ilsBug.setAttribute("fill", "transparent");
                    ilsBug.setAttribute("stroke", "#FF0CE2");
                    ilsBug.setAttribute("stroke-width", "3");
                    this.ilsGroup.appendChild(ilsBug);
                }
                this.rotatingCircle.appendChild(this.ilsGroup);
            }
            if (this.navigationMode == Jet_NDCompass_Navigation.NAV) {
                this.selectedTrackGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.selectedTrackGroup.setAttribute("id", "selectedTrackGroup");
                {
                    this.selectedTrackLine = Avionics.SVG.computeDashLine(500, 450, -(circleRadius - 50), 15, 3, "#ff00e0");
                    this.selectedTrackLine.setAttribute("id", "selectedTrackLine");
                    this.selectedTrackGroup.appendChild(this.selectedTrackLine);
                    this.selectedTrackBug = document.createElementNS(Avionics.SVG.NS, "path");
                    this.selectedTrackBug.setAttribute("id", "selectedTrackBug");
                    this.selectedTrackBug.setAttribute("d", "M500 " + (500 - circleRadius) + " h -30 v 15 l 30 15 l 30 -15 v -15 z");
                    this.selectedTrackBug.setAttribute("stroke", "#ff00e0");
                    this.selectedTrackBug.setAttribute("stroke-width", "2");
                    this.selectedTrackGroup.appendChild(this.selectedTrackBug);
                }
                this.rotatingCircle.appendChild(this.selectedTrackGroup);
            }
            this.trackingGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.trackingGroup.setAttribute("id", "trackingGroup");
            {
                this.trackingLine = document.createElementNS(Avionics.SVG.NS, "path");
                this.trackingLine.setAttribute("id", "trackingLine");
                this.trackingLine.setAttribute("d", "M500 400 v " + (-circleRadius + 100) + "M500 600 v " + (circleRadius - 100));
                this.trackingLine.setAttribute("fill", "transparent");
                this.trackingLine.setAttribute("stroke", "white");
                this.trackingLine.setAttribute("stroke-width", "3");
                this.trackingGroup.appendChild(this.trackingLine);
            }
            this.rotatingCircle.appendChild(this.trackingGroup);
        }
        this.glideSlopeGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.glideSlopeGroup.setAttribute("id", "GlideSlopeGroup");
        this.glideSlopeGroup.setAttribute("transform", "translate(-20, 0)");
        this.root.appendChild(this.glideSlopeGroup);
        if (this.navigationMode === Jet_NDCompass_Navigation.ILS) {
            for (let i = 0; i < 5; i++) {
                if (i != 2) {
                    const glideSlopeDot = document.createElementNS(Avionics.SVG.NS, "circle");
                    glideSlopeDot.setAttribute("cx", "950");
                    glideSlopeDot.setAttribute("cy", (250 + i * 125).toFixed(0));
                    glideSlopeDot.setAttribute("r", "10");
                    glideSlopeDot.setAttribute("stroke", "white");
                    glideSlopeDot.setAttribute("stroke-width", "2");
                    this.glideSlopeGroup.appendChild(glideSlopeDot);
                }
            }
            const glideSlopeDash = document.createElementNS(Avionics.SVG.NS, "rect");
            glideSlopeDash.setAttribute("x", "935");
            glideSlopeDash.setAttribute("y", "498");
            glideSlopeDash.setAttribute("width", "30");
            glideSlopeDash.setAttribute("height", "4");
            glideSlopeDash.setAttribute("fill", "yellow");
            this.glideSlopeGroup.appendChild(glideSlopeDash);
            this.glideSlopeCursor = document.createElementNS(Avionics.SVG.NS, "path");
            this.glideSlopeCursor.setAttribute("id", "GlideSlopeCursor");
            this.glideSlopeCursor.setAttribute("transform", "translate(" + 950 + " " + 500 + ")");
            this.glideSlopeCursor.setAttribute("d", "M-15 0 L0 -20 L15 0 M-15 0 L0 20 L15 0");
            this.glideSlopeCursor.setAttribute("stroke", "#ff00ff");
            this.glideSlopeCursor.setAttribute("stroke-width", "2");
            this.glideSlopeCursor.setAttribute("fill", "none");
            this.glideSlopeGroup.appendChild(this.glideSlopeCursor);
        }
        this.currentRefGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.currentRefGroup.setAttribute("id", "currentRefGroup");
        {
            const centerX = 500;
            const centerY = (500 - circleRadius - 50);
            const rectWidth = 100;
            const rectHeight = 55;
            const textOffset = 10;
            this.currentRefMode = document.createElementNS(Avionics.SVG.NS, "text");
            this.currentRefMode.textContent = "HDG";
            this.currentRefMode.setAttribute("x", (centerX - rectWidth * 0.5 - textOffset).toString());
            this.currentRefMode.setAttribute("y", centerY.toString());
            this.currentRefMode.setAttribute("fill", "green");
            this.currentRefMode.setAttribute("font-size", "35");
            this.currentRefMode.setAttribute("font-family", "Roboto-Bold");
            this.currentRefMode.setAttribute("text-anchor", "end");
            this.currentRefMode.setAttribute("alignment-baseline", "central");
            this.currentRefGroup.appendChild(this.currentRefMode);
            const rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", (centerX - rectWidth * 0.5).toString());
            rect.setAttribute("y", (centerY - rectHeight * 0.5).toString());
            rect.setAttribute("width", rectWidth.toString());
            rect.setAttribute("height", rectHeight.toString());
            rect.setAttribute("fill", "black");
            this.currentRefGroup.appendChild(rect);
            const path = document.createElementNS(Avionics.SVG.NS, "path");
            path.setAttribute("d", "M" + (centerX - (rectWidth * 0.5)) + " " + (centerY - (rectHeight * 0.5)) + " l0 " + rectHeight + " l" + rectWidth + " 0 l0 " + (-rectHeight));
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", "white");
            path.setAttribute("stroke-width", "1");
            this.currentRefGroup.appendChild(path);
            this.currentRefValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.currentRefValue.textContent = "266";
            this.currentRefValue.setAttribute("x", centerX.toString());
            this.currentRefValue.setAttribute("y", centerY.toString());
            this.currentRefValue.setAttribute("fill", "white");
            this.currentRefValue.setAttribute("font-size", "35");
            this.currentRefValue.setAttribute("font-family", "Roboto-Bold");
            this.currentRefValue.setAttribute("text-anchor", "middle");
            this.currentRefValue.setAttribute("alignment-baseline", "central");
            this.currentRefGroup.appendChild(this.currentRefValue);
            this.currentRefType = document.createElementNS(Avionics.SVG.NS, "text");
            this.currentRefType.textContent = "MAG";
            this.currentRefType.setAttribute("x", (centerX + rectWidth * 0.5 + textOffset).toString());
            this.currentRefType.setAttribute("y", centerY.toString());
            this.currentRefType.setAttribute("fill", "green");
            this.currentRefType.setAttribute("font-size", "35");
            this.currentRefType.setAttribute("font-family", "Roboto-Bold");
            this.currentRefType.setAttribute("text-anchor", "start");
            this.currentRefType.setAttribute("alignment-baseline", "central");
            this.currentRefGroup.appendChild(this.currentRefType);
        }
        this.root.appendChild(this.currentRefGroup);
        const rangeGroup = document.createElementNS(Avionics.SVG.NS, "g");
        rangeGroup.setAttribute("id", "RangeGroup");
        rangeGroup.setAttribute("transform", "scale(1.25)");
        {
            const centerX = 245;
            const centerY = 35;
            const textBg = document.createElementNS(Avionics.SVG.NS, "rect");
            textBg.setAttribute("x", (centerX - 40).toString());
            textBg.setAttribute("y", (centerY - 32).toString());
            textBg.setAttribute("width", "80");
            textBg.setAttribute("height", "64");
            textBg.setAttribute("fill", "black");
            textBg.setAttribute("stroke", "white");
            textBg.setAttribute("stroke-width", "1");
            rangeGroup.appendChild(textBg);
            const textTitle = document.createElementNS(Avionics.SVG.NS, "text");
            textTitle.textContent = "RANGE";
            textTitle.setAttribute("x", centerX.toString());
            textTitle.setAttribute("y", (centerY - 15).toString());
            textTitle.setAttribute("fill", "white");
            textTitle.setAttribute("font-size", "25");
            textTitle.setAttribute("font-family", "Roboto-Light");
            textTitle.setAttribute("text-anchor", "middle");
            textTitle.setAttribute("alignment-baseline", "central");
            rangeGroup.appendChild(textTitle);
            this.addMapRange(rangeGroup, centerX, (centerY + 15), "white", "25", false, 1.0, false);
        }
        this.root.appendChild(rangeGroup);
    }
    constructRose_AS01B() {
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "0 0 1000 1000");
        this.appendChild(this.root);
        const circleRadius = 400;
        {
            this.rotatingCircle = document.createElementNS(Avionics.SVG.NS, "g");
            this.rotatingCircle.setAttribute("id", "RotatingCircle");
            this.root.appendChild(this.rotatingCircle);
            const outerGroup = document.createElementNS(Avionics.SVG.NS, "g");
            outerGroup.setAttribute("id", "outerCircle");
            this.rotatingCircle.appendChild(outerGroup);
            {
                for (let i = 0; i < 72; i++) {
                    const line = document.createElementNS(Avionics.SVG.NS, "rect");
                    let startY = 500 - circleRadius;
                    let length = 30;
                    if (i % 2 != 0) {
                        if (this.navigationMode == Jet_NDCompass_Navigation.NONE || this.navigationMode == Jet_NDCompass_Navigation.NAV) {
                            continue;
                        }
                        length = 13;
                    }
                    if (i % 9 == 0) {
                        if (this.navigationMode != Jet_NDCompass_Navigation.NONE && this.navigationMode != Jet_NDCompass_Navigation.NAV) {
                            startY -= 30;
                            length += 30;
                        }
                    }
                    line.setAttribute("x", "498");
                    line.setAttribute("y", startY.toString());
                    line.setAttribute("width", "4");
                    line.setAttribute("height", length.toString());
                    line.setAttribute("transform", "rotate(" + fastToFixed(i * 5, 0) + " 500 500)");
                    line.setAttribute("fill", "white");
                    outerGroup.appendChild(line);
                }
                for (let i = 0; i < 36; i += 3) {
                    const text = document.createElementNS(Avionics.SVG.NS, "text");
                    text.textContent = fastToFixed(i, 0);
                    text.setAttribute("x", "500");
                    text.setAttribute("y", (500 - circleRadius + 52).toString());
                    text.setAttribute("fill", "white");
                    text.setAttribute("font-size", "40");
                    text.setAttribute("font-family", "Roboto-Light");
                    text.setAttribute("text-anchor", "middle");
                    text.setAttribute("alignment-baseline", "central");
                    text.setAttribute("transform", "rotate(" + fastToFixed(i * 10, 0) + " 500 500)");
                    outerGroup.appendChild(text);
                }
            }
            this.courseGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.courseGroup.setAttribute("id", "CourseInfo");
            this.rotatingCircle.appendChild(this.courseGroup);
            {
                this.bearing1 = document.createElementNS(Avionics.SVG.NS, "g");
                this.bearing1.setAttribute("id", "bearing1");
                this.bearing1.setAttribute("visibility", "hidden");
                this.courseGroup.appendChild(this.bearing1);
                let arrow = document.createElementNS(Avionics.SVG.NS, "path");
                arrow.setAttribute("d", "M500 960 L500 800 M500 40 L500 200 M500 80 L570 150 M500 80 L430 150");
                arrow.setAttribute("stroke", "#36c8d2");
                arrow.setAttribute("stroke-width", "10");
                arrow.setAttribute("fill", "none");
                this.bearing1.appendChild(arrow);
                this.bearing2 = document.createElementNS(Avionics.SVG.NS, "g");
                this.bearing2.setAttribute("id", "bearing2");
                this.bearing2.setAttribute("visibility", "hidden");
                this.courseGroup.appendChild(this.bearing2);
                arrow = document.createElementNS(Avionics.SVG.NS, "path");
                arrow.setAttribute("d", "M500 960 L500 920 M470 800 L470 900 Q500 960 530 900 L530 800 M500 40 L500 80 L570 150 M500 80 L430 150 M470 110 L470 200 M530 110 L530 200");
                arrow.setAttribute("stroke", "#36c8d2");
                arrow.setAttribute("stroke-width", "10");
                arrow.setAttribute("fill", "none");
                this.bearing2.appendChild(arrow);
                this.course = document.createElementNS(Avionics.SVG.NS, "g");
                this.course.setAttribute("id", "course");
                this.courseGroup.appendChild(this.course);
                {
                    this.courseColor = "";
                    if (this.navigationMode == Jet_NDCompass_Navigation.ILS) {
                        this.courseColor = "#ff00ff";
                    } else if (this.navigationMode == Jet_NDCompass_Navigation.VOR) {
                        this.courseColor = "#00ffff";
                    }
                    this.courseTO = document.createElementNS(Avionics.SVG.NS, "path");
                    this.courseTO.setAttribute("d", "M497 666 L503 666 L503 696 L523 696 L523 702 L503 702 L503 826 L497 826 L497 702 L477 702 L477 696 L497 696 L497 666 Z");
                    this.courseTO.setAttribute("fill", "none");
                    this.courseTO.setAttribute("transform", "rotate(180 500 500)");
                    this.courseTO.setAttribute("stroke", this.courseColor.toString());
                    this.courseTO.setAttribute("stroke-width", "1");
                    this.course.appendChild(this.courseTO);
                    this.courseDeviation = document.createElementNS(Avionics.SVG.NS, "rect");
                    this.courseDeviation.setAttribute("x", "495");
                    this.courseDeviation.setAttribute("y", "333");
                    this.courseDeviation.setAttribute("width", "10");
                    this.courseDeviation.setAttribute("height", "333");
                    this.courseDeviation.setAttribute("fill", this.courseColor.toString());
                    this.course.appendChild(this.courseDeviation);
                    this.courseFROM = document.createElementNS(Avionics.SVG.NS, "rect");
                    this.courseFROM.setAttribute("x", "497");
                    this.courseFROM.setAttribute("y", "166");
                    this.courseFROM.setAttribute("width", "6");
                    this.courseFROM.setAttribute("height", "166");
                    this.courseFROM.setAttribute("fill", "none");
                    this.courseFROM.setAttribute("transform", "rotate(180 500 500)");
                    this.courseFROM.setAttribute("stroke", this.courseColor.toString());
                    this.courseFROM.setAttribute("stroke-width", "1");
                    this.course.appendChild(this.courseFROM);
                    const circlePosition = [-166, -55, 55, 166];
                    for (let i = 0; i < circlePosition.length; i++) {
                        const CDICircle = document.createElementNS(Avionics.SVG.NS, "circle");
                        CDICircle.setAttribute("cx", (500 + circlePosition[i]).toString());
                        CDICircle.setAttribute("cy", "500");
                        CDICircle.setAttribute("r", "10");
                        CDICircle.setAttribute("stroke", "white");
                        CDICircle.setAttribute("stroke-width", "2");
                        this.course.appendChild(CDICircle);
                    }
                }
                this.bearingCircle = document.createElementNS(Avionics.SVG.NS, "circle");
                this.bearingCircle.setAttribute("cx", "500");
                this.bearingCircle.setAttribute("cy", "500");
                this.bearingCircle.setAttribute("r", "30");
                this.bearingCircle.setAttribute("stroke", "white");
                this.bearingCircle.setAttribute("stroke-width", "0.8");
                this.bearingCircle.setAttribute("fill-opacity", "0");
                this.bearingCircle.setAttribute("visibility", "hidden");
                this.courseGroup.appendChild(this.bearingCircle);
            }
            this.trackingGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.trackingGroup.setAttribute("id", "trackingGroup");
            {
                this.trackingLine = document.createElementNS(Avionics.SVG.NS, "path");
                this.trackingLine.setAttribute("id", "trackingLine");
                this.trackingLine.setAttribute("d", "M500 450 v " + (-circleRadius + 50));
                this.trackingLine.setAttribute("fill", "transparent");
                this.trackingLine.setAttribute("stroke", "white");
                this.trackingLine.setAttribute("stroke-width", "3");
                this.trackingGroup.appendChild(this.trackingLine);
            }
            this.rotatingCircle.appendChild(this.trackingGroup);
            this.headingGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.headingGroup.setAttribute("id", "headingGroup");
            {
                this.headingBug = document.createElementNS(Avionics.SVG.NS, "path");
                this.headingBug.setAttribute("id", "headingBug");
                this.headingBug.setAttribute("d", "M500 " + (500 - circleRadius) + " l -11 -20 l 22 0 z");
                this.headingBug.setAttribute("fill", "none");
                this.headingBug.setAttribute("stroke", "white");
                this.headingGroup.appendChild(this.headingBug);
            }
            this.rotatingCircle.appendChild(this.headingGroup);
            this.selectedHeadingGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.selectedHeadingGroup.setAttribute("id", "selectedHeadingGroup");
            {
                this.selectedHeadingLine = Avionics.SVG.computeDashLine(500, 450, -(circleRadius - 50), 15, 3, "#ff00e0");
                this.selectedHeadingLine.setAttribute("id", "selectedHeadingLine");
                this.selectedHeadingGroup.appendChild(this.selectedHeadingLine);
                this.selectedHeadingBug = document.createElementNS(Avionics.SVG.NS, "path");
                this.selectedHeadingBug.setAttribute("id", "selectedHeadingBug");
                this.selectedHeadingBug.setAttribute("d", "M500 " + (500 - circleRadius) + " h 22 v -22 h -7 l -15 22 l -15 -22 h -7 v 22 z");
                this.selectedHeadingBug.setAttribute("stroke", "#ff00e0");
                this.selectedHeadingBug.setAttribute("fill", "none");
                this.selectedHeadingGroup.appendChild(this.selectedHeadingBug);
            }
            this.rotatingCircle.appendChild(this.selectedHeadingGroup);
            if (this.navigationMode == Jet_NDCompass_Navigation.NAV || this.navigationMode == Jet_NDCompass_Navigation.ILS) {
                this.ilsGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.ilsGroup.setAttribute("id", "ILSGroup");
                {
                    const ilsBug = document.createElementNS(Avionics.SVG.NS, "path");
                    ilsBug.setAttribute("id", "ilsBug");
                    ilsBug.setAttribute("d", "M500 " + (500 - circleRadius) + " l0 -40 M485 " + (500 - circleRadius - 10) + " l30 0");
                    ilsBug.setAttribute("fill", "transparent");
                    ilsBug.setAttribute("stroke", "#FF0CE2");
                    ilsBug.setAttribute("stroke-width", "3");
                    this.ilsGroup.appendChild(ilsBug);
                }
                this.rotatingCircle.appendChild(this.ilsGroup);
            }
            if (this.navigationMode == Jet_NDCompass_Navigation.NAV) {
                this.selectedTrackGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.selectedTrackGroup.setAttribute("id", "selectedTrackGroup");
                {
                    this.selectedTrackLine = Avionics.SVG.computeDashLine(500, 450, -(circleRadius - 50), 15, 3, "#ff00e0");
                    this.selectedTrackLine.setAttribute("id", "selectedTrackLine");
                    this.selectedTrackGroup.appendChild(this.selectedTrackLine);
                    this.selectedTrackBug = document.createElementNS(Avionics.SVG.NS, "path");
                    this.selectedTrackBug.setAttribute("id", "selectedTrackBug");
                    this.selectedTrackBug.setAttribute("d", "M500 " + (500 - circleRadius) + " h -30 v 15 l 30 15 l 30 -15 v -15 z");
                    this.selectedTrackBug.setAttribute("stroke", "#ff00e0");
                    this.selectedTrackBug.setAttribute("stroke-width", "2");
                    this.selectedTrackGroup.appendChild(this.selectedTrackBug);
                }
                this.rotatingCircle.appendChild(this.selectedTrackGroup);
            }
        }
        this.glideSlopeGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.glideSlopeGroup.setAttribute("id", "GlideSlopeGroup");
        this.root.appendChild(this.glideSlopeGroup);
        if (this._fullscreen) {
            this.glideSlopeGroup.setAttribute("transform", "translate(-20, 0)");
        } else {
            this.glideSlopeGroup.setAttribute("transform", "translate(20, 20)");
        }
        if (this.navigationMode === Jet_NDCompass_Navigation.ILS) {
            for (let i = 0; i < 5; i++) {
                if (i != 2) {
                    const glideSlopeDot = document.createElementNS(Avionics.SVG.NS, "circle");
                    glideSlopeDot.setAttribute("cx", "950");
                    glideSlopeDot.setAttribute("cy", (250 + i * 125).toFixed(0));
                    glideSlopeDot.setAttribute("r", "10");
                    glideSlopeDot.setAttribute("stroke", "white");
                    glideSlopeDot.setAttribute("stroke-width", "2");
                    this.glideSlopeGroup.appendChild(glideSlopeDot);
                }
            }
            const glideSlopeDash = document.createElementNS(Avionics.SVG.NS, "rect");
            glideSlopeDash.setAttribute("x", "935");
            glideSlopeDash.setAttribute("y", "498");
            glideSlopeDash.setAttribute("width", "30");
            glideSlopeDash.setAttribute("height", "4");
            glideSlopeDash.setAttribute("fill", "yellow");
            this.glideSlopeGroup.appendChild(glideSlopeDash);
            this.glideSlopeCursor = document.createElementNS(Avionics.SVG.NS, "path");
            this.glideSlopeCursor.setAttribute("id", "GlideSlopeCursor");
            this.glideSlopeCursor.setAttribute("transform", "translate(" + 950 + " " + 500 + ")");
            this.glideSlopeCursor.setAttribute("d", "M-15 0 L0 -20 L15 0 M-15 0 L0 20 L15 0");
            this.glideSlopeCursor.setAttribute("stroke", "#ff00ff");
            this.glideSlopeCursor.setAttribute("stroke-width", "2");
            this.glideSlopeCursor.setAttribute("fill", "none");
            this.glideSlopeGroup.appendChild(this.glideSlopeCursor);
        }
        this.currentRefGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.currentRefGroup.setAttribute("id", "currentRefGroup");
        {
            const centerX = 500;
            const centerY = (500 - circleRadius - 50);
            const rectWidth = 100;
            const rectHeight = 55;
            const textOffset = 10;
            this.currentRefMode = document.createElementNS(Avionics.SVG.NS, "text");
            this.currentRefMode.textContent = "HDG";
            this.currentRefMode.setAttribute("x", (centerX - rectWidth * 0.5 - textOffset).toString());
            this.currentRefMode.setAttribute("y", centerY.toString());
            this.currentRefMode.setAttribute("fill", "green");
            this.currentRefMode.setAttribute("font-size", "35");
            this.currentRefMode.setAttribute("font-family", "Roboto-Bold");
            this.currentRefMode.setAttribute("text-anchor", "end");
            this.currentRefMode.setAttribute("alignment-baseline", "central");
            this.currentRefGroup.appendChild(this.currentRefMode);
            const rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", (centerX - rectWidth * 0.5).toString());
            rect.setAttribute("y", (centerY - rectHeight * 0.5).toString());
            rect.setAttribute("width", rectWidth.toString());
            rect.setAttribute("height", rectHeight.toString());
            rect.setAttribute("fill", "black");
            this.currentRefGroup.appendChild(rect);
            const path = document.createElementNS(Avionics.SVG.NS, "path");
            path.setAttribute("d", "M" + (centerX - (rectWidth * 0.5)) + " " + (centerY - (rectHeight * 0.5)) + " l0 " + rectHeight + " l" + rectWidth + " 0 l0 " + (-rectHeight));
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", "white");
            path.setAttribute("stroke-width", "1");
            this.currentRefGroup.appendChild(path);
            this.currentRefValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.currentRefValue.textContent = "266";
            this.currentRefValue.setAttribute("x", centerX.toString());
            this.currentRefValue.setAttribute("y", centerY.toString());
            this.currentRefValue.setAttribute("fill", "white");
            this.currentRefValue.setAttribute("font-size", "35");
            this.currentRefValue.setAttribute("font-family", "Roboto-Bold");
            this.currentRefValue.setAttribute("text-anchor", "middle");
            this.currentRefValue.setAttribute("alignment-baseline", "central");
            this.currentRefGroup.appendChild(this.currentRefValue);
            this.currentRefType = document.createElementNS(Avionics.SVG.NS, "text");
            this.currentRefType.textContent = "MAG";
            this.currentRefType.setAttribute("x", (centerX + rectWidth * 0.5 + textOffset).toString());
            this.currentRefType.setAttribute("y", centerY.toString());
            this.currentRefType.setAttribute("fill", "green");
            this.currentRefType.setAttribute("font-size", "35");
            this.currentRefType.setAttribute("font-family", "Roboto-Bold");
            this.currentRefType.setAttribute("text-anchor", "start");
            this.currentRefType.setAttribute("alignment-baseline", "central");
            this.currentRefGroup.appendChild(this.currentRefType);
        }
        this.root.appendChild(this.currentRefGroup);
        const rangeGroup = document.createElementNS(Avionics.SVG.NS, "g");
        rangeGroup.setAttribute("id", "RangeGroup");
        {
            let centerX = 146;
            let centerY = 43;
            if (this._fullscreen) {
                rangeGroup.setAttribute("transform", "scale(1.27)");
            } else {
                centerX = 266;
                centerY = 53;
            }
            const textBg = document.createElementNS(Avionics.SVG.NS, "rect");
            textBg.setAttribute("x", (centerX - 40).toString());
            textBg.setAttribute("y", (centerY - 32).toString());
            textBg.setAttribute("width", "80");
            textBg.setAttribute("height", "64");
            textBg.setAttribute("fill", "black");
            textBg.setAttribute("stroke", "white");
            textBg.setAttribute("stroke-width", "2");
            rangeGroup.appendChild(textBg);
            const textTitle = document.createElementNS(Avionics.SVG.NS, "text");
            textTitle.textContent = "RANGE";
            textTitle.setAttribute("x", (centerX - 0.5).toString());
            textTitle.setAttribute("y", (centerY - 14).toString());
            textTitle.setAttribute("fill", "white");
            textTitle.setAttribute("font-size", "25");
            textTitle.setAttribute("font-family", "Roboto-Light");
            textTitle.setAttribute("text-anchor", "middle");
            textTitle.setAttribute("alignment-baseline", "central");
            rangeGroup.appendChild(textTitle);
            this.addMapRange(rangeGroup, (centerX - 0.5), (centerY + 15.5), "white", "25", false, 1.0, false);
        }
        this.root.appendChild(rangeGroup);
    }
    constructRose_CJ4() {
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "0 0 1000 1000");
        this.appendChild(this.root);
        const circleRadius = 333;
        {
            this.rotatingCircle = document.createElementNS(Avionics.SVG.NS, "g");
            this.rotatingCircle.setAttribute("id", "RotatingCircle");
            this.root.appendChild(this.rotatingCircle);
            const outerGroup = document.createElementNS(Avionics.SVG.NS, "g");
            outerGroup.setAttribute("id", "outerCircle");
            this.rotatingCircle.appendChild(outerGroup);
            {
                const texts = ["N", "E", "S", "W"];
                for (let i = 0; i < 72; i++) {
                    const line = document.createElementNS(Avionics.SVG.NS, "rect");
                    const startY = 500 - circleRadius;
                    const length = (i % 2 == 0) ? 20 : 13;
                    line.setAttribute("x", "498");
                    line.setAttribute("y", startY.toString());
                    line.setAttribute("width", "4");
                    line.setAttribute("height", length.toString());
                    line.setAttribute("transform", "rotate(" + fastToFixed(i * 5, 0) + " 500 500)");
                    line.setAttribute("fill", "white");
                    outerGroup.appendChild(line);
                }
                for (let i = 0; i < 36; i += 3) {
                    const text = document.createElementNS(Avionics.SVG.NS, "text");
                    if (i % 9 == 0) {
                        const id = i / 9;
                        text.textContent = texts[id];
                    } else {
                        text.textContent = fastToFixed(i, 0);
                    }
                    text.setAttribute("x", "500");
                    text.setAttribute("y", (500 - circleRadius + 52).toString());
                    text.setAttribute("fill", "white");
                    text.setAttribute("font-size", "40");
                    text.setAttribute("font-family", "Roboto-Light");
                    text.setAttribute("text-anchor", "middle");
                    text.setAttribute("alignment-baseline", "central");
                    text.setAttribute("transform", "rotate(" + fastToFixed(i * 10, 0) + " 500 500)");
                    outerGroup.appendChild(text);
                }
            }
            this.courseGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.courseGroup.setAttribute("id", "CourseInfo");
            this.rotatingCircle.appendChild(this.courseGroup);
            {
                this.bearing1 = document.createElementNS(Avionics.SVG.NS, "g");
                this.bearing1.setAttribute("id", "bearing1");
                this.bearing1.setAttribute("visibility", "hidden");
                this.courseGroup.appendChild(this.bearing1);
                let arrow = document.createElementNS(Avionics.SVG.NS, "path");
                arrow.setAttribute("d", "M500 960 L500 800 M500 40 L500 200 M500 80 L570 150 M500 80 L430 150");
                arrow.setAttribute("stroke", "#36c8d2");
                arrow.setAttribute("stroke-width", "10");
                arrow.setAttribute("fill", "none");
                this.bearing1.appendChild(arrow);
                this.bearing2 = document.createElementNS(Avionics.SVG.NS, "g");
                this.bearing2.setAttribute("id", "bearing2");
                this.bearing2.setAttribute("visibility", "hidden");
                this.courseGroup.appendChild(this.bearing2);
                arrow = document.createElementNS(Avionics.SVG.NS, "path");
                arrow.setAttribute("d", "M500 960 L500 920 M470 800 L470 900 Q500 960 530 900 L530 800 M500 40 L500 80 L570 150 M500 80 L430 150 M470 110 L470 200 M530 110 L530 200");
                arrow.setAttribute("stroke", "#36c8d2");
                arrow.setAttribute("stroke-width", "10");
                arrow.setAttribute("fill", "none");
                this.bearing2.appendChild(arrow);
                this.course = document.createElementNS(Avionics.SVG.NS, "g");
                this.course.setAttribute("id", "course");
                this.courseGroup.appendChild(this.course);
                {
                    this.courseColor = "";
                    if (this.navigationMode == Jet_NDCompass_Navigation.ILS) {
                        this.courseColor = "#ff00ff";
                    } else if (this.navigationMode == Jet_NDCompass_Navigation.VOR) {
                        this.courseColor = "#00ffff";
                    }
                    this.courseTO = document.createElementNS(Avionics.SVG.NS, "path");
                    this.courseTO.setAttribute("d", "M497 666 L503 666 L503 696 L523 696 L523 702 L503 702 L503 826 L497 826 L497 702 L477 702 L477 696 L497 696 L497 666 Z");
                    this.courseTO.setAttribute("fill", "none");
                    this.courseTO.setAttribute("transform", "rotate(180 500 500)");
                    this.courseTO.setAttribute("stroke", this.courseColor.toString());
                    this.courseTO.setAttribute("stroke-width", "1");
                    this.course.appendChild(this.courseTO);
                    this.courseDeviation = document.createElementNS(Avionics.SVG.NS, "rect");
                    this.courseDeviation.setAttribute("x", "495");
                    this.courseDeviation.setAttribute("y", "333");
                    this.courseDeviation.setAttribute("width", "10");
                    this.courseDeviation.setAttribute("height", "333");
                    this.courseDeviation.setAttribute("fill", this.courseColor.toString());
                    this.course.appendChild(this.courseDeviation);
                    this.courseFROM = document.createElementNS(Avionics.SVG.NS, "rect");
                    this.courseFROM.setAttribute("x", "497");
                    this.courseFROM.setAttribute("y", "166");
                    this.courseFROM.setAttribute("width", "6");
                    this.courseFROM.setAttribute("height", "166");
                    this.courseFROM.setAttribute("fill", "none");
                    this.courseFROM.setAttribute("transform", "rotate(180 500 500)");
                    this.courseFROM.setAttribute("stroke", this.courseColor.toString());
                    this.courseFROM.setAttribute("stroke-width", "1");
                    this.course.appendChild(this.courseFROM);
                    const circlePosition = [-166, -55, 55, 166];
                    for (let i = 0; i < circlePosition.length; i++) {
                        const CDICircle = document.createElementNS(Avionics.SVG.NS, "circle");
                        CDICircle.setAttribute("cx", (500 + circlePosition[i]).toString());
                        CDICircle.setAttribute("cy", "500");
                        CDICircle.setAttribute("r", "10");
                        CDICircle.setAttribute("stroke", "white");
                        CDICircle.setAttribute("stroke-width", "2");
                        this.course.appendChild(CDICircle);
                    }
                }
                this.bearingCircle = document.createElementNS(Avionics.SVG.NS, "circle");
                this.bearingCircle.setAttribute("cx", "500");
                this.bearingCircle.setAttribute("cy", "500");
                this.bearingCircle.setAttribute("r", "30");
                this.bearingCircle.setAttribute("stroke", "white");
                this.bearingCircle.setAttribute("stroke-width", "0.8");
                this.bearingCircle.setAttribute("fill-opacity", "0");
                this.bearingCircle.setAttribute("visibility", "hidden");
                this.courseGroup.appendChild(this.bearingCircle);
            }
            this.trackingGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.trackingGroup.setAttribute("id", "trackingGroup");
            {
                const rad = 5;
                this.trackingBug = document.createElementNS(Avionics.SVG.NS, "circle");
                this.trackingBug.setAttribute("id", "trackingBug");
                this.trackingBug.setAttribute("cx", "500");
                this.trackingBug.setAttribute("cy", (500 - circleRadius - rad).toString());
                this.trackingBug.setAttribute("r", rad.toString());
                this.trackingBug.setAttribute("fill", "none");
                this.trackingBug.setAttribute("stroke", "#ff00e0");
                this.trackingBug.setAttribute("stroke-width", "2");
                this.trackingGroup.appendChild(this.trackingBug);
            }
            this.rotatingCircle.appendChild(this.trackingGroup);
            this.headingGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.headingGroup.setAttribute("id", "headingGroup");
            {
            }
            this.rotatingCircle.appendChild(this.headingGroup);
            this.selectedHeadingGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.selectedHeadingGroup.setAttribute("id", "selectedHeadingGroup");
            {
                this.selectedHeadingBug = document.createElementNS(Avionics.SVG.NS, "path");
                this.selectedHeadingBug.setAttribute("id", "selectedHeadingBug");
                this.selectedHeadingBug.setAttribute("d", "M500 " + (500 - circleRadius) + " h 22 v -18 h -7 l -15 18l -15 -18h -7 v 18 Z");
                this.selectedHeadingBug.setAttribute("fill", "#00F2FF");
                this.selectedHeadingGroup.appendChild(this.selectedHeadingBug);
            }
            this.rotatingCircle.appendChild(this.selectedHeadingGroup);
            if (this.navigationMode == Jet_NDCompass_Navigation.NAV || this.navigationMode == Jet_NDCompass_Navigation.ILS) {
                this.ilsGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.ilsGroup.setAttribute("id", "ILSGroup");
                {
                    const ilsBug = document.createElementNS(Avionics.SVG.NS, "path");
                    ilsBug.setAttribute("id", "ilsBug");
                    ilsBug.setAttribute("d", "M500 " + (500 - circleRadius) + " l0 -40 M485 " + (500 - circleRadius - 10) + " l30 0");
                    ilsBug.setAttribute("fill", "transparent");
                    ilsBug.setAttribute("stroke", "#FF0CE2");
                    ilsBug.setAttribute("stroke-width", "3");
                    this.ilsGroup.appendChild(ilsBug);
                }
                this.rotatingCircle.appendChild(this.ilsGroup);
            }
        }
        const innerCircleGroup = document.createElementNS(Avionics.SVG.NS, "g");
        innerCircleGroup.setAttribute("id", "innerCircle");
        this.root.appendChild(innerCircleGroup);
        {
            const smallCircleRadius = 170;
            const circle = document.createElementNS(Avionics.SVG.NS, "circle");
            circle.setAttribute("cx", "500");
            circle.setAttribute("cy", "500");
            circle.setAttribute("r", smallCircleRadius.toString());
            circle.setAttribute("fill-opacity", "0");
            circle.setAttribute("stroke", "white");
            circle.setAttribute("stroke-width", "2");
            circle.setAttribute("stroke-opacity", "1");
            innerCircleGroup.appendChild(circle);
            const dashSpacing = 12;
            let radians = 0;
            for (let i = 0; i < dashSpacing; i++) {
                const line = document.createElementNS(Avionics.SVG.NS, "line");
                const length = 15;
                const lineStart = 500 + smallCircleRadius - length * 0.5;
                const lineEnd = 500 + smallCircleRadius + length * 0.5;
                const degrees = (radians / Math.PI) * 180;
                line.setAttribute("x1", "500");
                line.setAttribute("y1", lineStart.toString());
                line.setAttribute("x2", "500");
                line.setAttribute("y2", lineEnd.toString());
                line.setAttribute("transform", "rotate(" + (-degrees + 180) + " 500 500)");
                line.setAttribute("stroke", "white");
                line.setAttribute("stroke-width", "4");
                line.setAttribute("stroke-opacity", "0.8");
                innerCircleGroup.appendChild(line);
                radians += (2 * Math.PI) / dashSpacing;
            }
            const vec = new Vec2(1, 0.45);
            vec.SetNorm(smallCircleRadius * 0.82);
            this.addMapRange(innerCircleGroup, 500 - vec.x, 500 - vec.y, "white", "28", false, 0.5, false);
        }
        this.currentRefGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.currentRefGroup.setAttribute("id", "currentRefGroup");
        this.currentRefGroup.setAttribute("transform", "scale(1.5)");
        {
            const centerX = 332;
            const centerY = 75;
            const rectWidth = 65;
            const rectHeight = 40;
            const rectArrowFactor = 0.35;
            const rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", (centerX - rectWidth * 0.5).toString());
            rect.setAttribute("y", (centerY - rectHeight * 0.5).toString());
            rect.setAttribute("width", rectWidth.toString());
            rect.setAttribute("height", rectHeight.toString());
            rect.setAttribute("fill", "black");
            this.currentRefGroup.appendChild(rect);
            let d = "M" + (centerX - (rectWidth * 0.5)) + " " + (centerY - (rectHeight * 0.5));
            d += " l0 " + rectHeight;
            d += " l" + (rectWidth * rectArrowFactor) + " 0";
            d += " l" + (rectWidth * 0.5 - rectWidth * rectArrowFactor) + " 9";
            d += " l" + (rectWidth * 0.5 - rectWidth * rectArrowFactor) + " -9";
            d += " l" + (rectWidth * rectArrowFactor) + " 0";
            d += " l0 " + (-rectHeight);
            const path = document.createElementNS(Avionics.SVG.NS, "path");
            path.setAttribute("d", d);
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", "white");
            path.setAttribute("stroke-width", "2");
            this.currentRefGroup.appendChild(path);
            this.currentRefValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.currentRefValue.textContent = "";
            this.currentRefValue.setAttribute("x", centerX.toString());
            this.currentRefValue.setAttribute("y", centerY.toString());
            this.currentRefValue.setAttribute("fill", "green");
            this.currentRefValue.setAttribute("font-size", "28");
            this.currentRefValue.setAttribute("font-family", "Roboto-Bold");
            this.currentRefValue.setAttribute("text-anchor", "middle");
            this.currentRefValue.setAttribute("alignment-baseline", "central");
            this.currentRefGroup.appendChild(this.currentRefValue);
        }
        this.root.appendChild(this.currentRefGroup);
        this.selectedRefGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.selectedRefGroup.setAttribute("id", "selectedRefGroup");
        this.selectedRefGroup.setAttribute("transform", "scale(1.5)");
        {
            const centerX = 180;
            const centerY = 62;
            const spaceX = 5;
            this.selectedRefMode = document.createElementNS(Avionics.SVG.NS, "text");
            this.selectedRefMode.textContent = "HDG";
            this.selectedRefMode.setAttribute("x", (centerX - spaceX).toString());
            this.selectedRefMode.setAttribute("y", centerY.toString());
            this.selectedRefMode.setAttribute("fill", "#00F2FF");
            this.selectedRefMode.setAttribute("font-size", "18");
            this.selectedRefMode.setAttribute("font-family", "Roboto-Bold");
            this.selectedRefMode.setAttribute("text-anchor", "end");
            this.selectedRefMode.setAttribute("alignment-baseline", "central");
            this.selectedRefGroup.appendChild(this.selectedRefMode);
            this.selectedRefValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.selectedRefValue.textContent = "";
            this.selectedRefValue.setAttribute("x", (centerX + spaceX).toString());
            this.selectedRefValue.setAttribute("y", centerY.toString());
            this.selectedRefValue.setAttribute("fill", "#00F2FF");
            this.selectedRefValue.setAttribute("font-size", "23");
            this.selectedRefValue.setAttribute("font-family", "Roboto-Bold");
            this.selectedRefValue.setAttribute("text-anchor", "start");
            this.selectedRefValue.setAttribute("alignment-baseline", "central");
            this.selectedRefGroup.appendChild(this.selectedRefValue);
        }
        this.root.appendChild(this.selectedRefGroup);
    }
}
customElements.define("jet-mfd-nd-compass", Jet_MFD_NDCompass);
//# sourceMappingURL=NDCompass.js.map