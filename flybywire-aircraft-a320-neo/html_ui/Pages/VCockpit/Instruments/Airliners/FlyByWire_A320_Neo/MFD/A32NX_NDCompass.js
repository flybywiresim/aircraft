class Jet_MFD_NDCompass extends Jet_NDCompass {
    constructor() {
        super();
        this._lastNavAid1State = NAV_AID_STATE.OFF;
        this._lastNavAid2State = NAV_AID_STATE.OFF;
    }
    connectedCallback() {
        super.connectedCallback();
        const url = document.getElementsByTagName("a320-neo-mfd-element")[0].getAttribute("url");
        this.mfdIndex = parseInt(url.substring(url.length - 1));
    }
    init() {
        super.init();
    }
    constructArc() {
        super.constructArc();
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
                topMask.setAttribute("fill", "url(#Backlight)");
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
                this.arcs = [];
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
                        this.arcs.push(line);
                        this.arcRangeGroup.appendChild(line);
                        radians += cone[r] / (count[r] + 0.5);
                    }
                    const vec = new Vec2(1, 0.6);
                    vec.SetNorm(rad - 25);
                    if (r > 0) {
                        this.addMapRange(this.arcRangeGroup, 50 + vec.x, 50 - vec.y, "#00FFFF", "18", false, rads[r], true);
                        this.addMapRange(this.arcRangeGroup, 50 - vec.x, 50 - vec.y, "#00FFFF", "18", false, rads[r], true);
                    }
                }
                const vec = new Vec2(1, 0.6);
                vec.SetNorm(circleRadius - 25);
                this.addMapRange(this.arcRangeGroup, 50 + vec.x, 50 - vec.y, "#00FFFF", "18", false, 1.0, true);
                this.addMapRange(this.arcRangeGroup, 50 - vec.x, 50 - vec.y, "#00FFFF", "18", false, 1.0, true);
            }
            this.rotatingCircle = document.createElementNS(Avionics.SVG.NS, "g");
            this.rotatingCircle.setAttribute("id", "RotatingCircle");
            viewBox.appendChild(this.rotatingCircle);
            {
                this.failCircle = document.createElementNS(Avionics.SVG.NS, "g");
                this.failCircle.setAttribute("id", "FailCircle");
                viewBox.appendChild(this.failCircle);
                const circle = document.createElementNS(Avionics.SVG.NS, "circle");
                circle.setAttribute("cx", "50");
                circle.setAttribute("cy", "50");
                circle.setAttribute("r", circleRadius.toString());
                circle.setAttribute("fill-opacity", "0");
                circle.setAttribute("stroke", "red");
                circle.setAttribute("stroke-width", "4");
                this.failCircle.appendChild(circle);
                const scircle = document.createElementNS(Avionics.SVG.NS, "circle");
                scircle.setAttribute("cx", "50");
                scircle.setAttribute("cy", "50");
                scircle.setAttribute("r", "10");
                scircle.setAttribute("fill-opacity", "0");
                scircle.setAttribute("stroke", "red");
                scircle.setAttribute("stroke-width", "4");
                this.failCircle.appendChild(scircle);
            }
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
                        const length = (bIsBig) ? 17 : 8.5;
                        const lineStart = 50 + circleRadius;
                        const lineEnd = 55 + circleRadius + length;
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
                            text.setAttribute("font-size", (i % 3 == 0) ? "32" : "20");
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
                this.courseGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.courseGroup.setAttribute("id", "CourseInfo");
                this.rotatingCircle.appendChild(this.courseGroup);
                {
                    const bearing = document.createElementNS(Avionics.SVG.NS, "g");
                    bearing.setAttribute("id", "bearing");
                    this.courseGroup.appendChild(bearing);
                    {
                        this.bearing1 = document.createElementNS(Avionics.SVG.NS, "g");
                        this.bearing1.setAttribute("id", "bearing1");
                        this.bearing1.setAttribute("visibility", "hidden");
                        bearing.appendChild(this.bearing1);

                        const arrow1 = document.createElementNS(Avionics.SVG.NS, "path");
                        arrow1.setAttribute("d", "M50 475 L50 460 M50 440 L50 370    M63 460 L50 440 L37 460 Z     M50 -375 L50 -360 M50 -340 L50 -270     M63 -340 L50 -360 L37 -340 Z");
                        if (Simplane.getAutoPilotNavAidState(this.aircraft, this.mfdIndex, 1) === NAV_AID_STATE.ADF) {
                            arrow1.setAttribute("stroke", "lime");
                        } else {
                            arrow1.setAttribute("stroke", "white");
                        }
                        arrow1.setAttribute("stroke-width", "4");
                        arrow1.setAttribute("fill", "none");
                        arrow1.setAttribute("id", "bearing1");
                        this.bearing1.appendChild(arrow1);

                        this.bearing2 = document.createElementNS(Avionics.SVG.NS, "g");
                        this.bearing2.setAttribute("id", "bearing2");
                        this.bearing2.setAttribute("visibility", "hidden");
                        bearing.appendChild(this.bearing2);

                        const arrow2 = document.createElementNS(Avionics.SVG.NS, "path");
                        arrow2.setAttribute("d", "M50 475 L50 420 M58 420 L42 420    M58 420 L58 370 M42 420 L42 370     M50 -375 L50 -320   M58 -270 L58 -300 L63 -300 L50 -320 L37 -300 L42 -300 L42 -270");
                        if (Simplane.getAutoPilotNavAidState(this.aircraft, this.mfdIndex, 2) === NAV_AID_STATE.ADF) {
                            arrow2.setAttribute("stroke", "lime");
                        } else {
                            arrow2.setAttribute("stroke", "white");
                        }
                        arrow2.setAttribute("stroke-width", "4");
                        arrow2.setAttribute("fill", "none");
                        arrow2.setAttribute("id", "bearing2");
                        this.bearing2.appendChild(arrow2);
                    }
                }
                this.rotatingCircle.appendChild(graduationGroup);
                this.trackingGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.trackingGroup.setAttribute("id", "trackingGroup");
                {
                    const halfw = 7;
                    const halfh = 12;
                    const p1 = (50) + ", " + (50 + circleRadius);
                    const p2 = (50 + halfw) + ", " + (50 + circleRadius - halfh);
                    const p3 = (50) + ", " + (50 + circleRadius - halfh * 2);
                    const p4 = (50 - halfw) + ", " + (50 + circleRadius - halfh);
                    this.trackingBug = document.createElementNS(Avionics.SVG.NS, "polygon");
                    this.trackingBug.setAttribute("id", "trackingBug");
                    this.trackingBug.setAttribute("points", p1 + " " + p2 + " " + p3 + " " + p4);
                    this.trackingBug.setAttribute("stroke", "#00FF00");
                    this.trackingBug.setAttribute("stroke-width", "2");
                    this.trackingBug.setAttribute("fill", "transparent");
                    this.trackingGroup.appendChild(this.trackingBug);

                    this.trackingLine = document.createElementNS(Avionics.SVG.NS, "line");
                    this.trackingLine.setAttribute("id", "trackingLine");
                    this.trackingLine.setAttribute("stroke", "#00FF00");
                    this.trackingLine.setAttribute("x1", "50");
                    this.trackingLine.setAttribute("y1", (27 + circleRadius).toString());
                    this.trackingLine.setAttribute("x2", "50");
                    this.trackingLine.setAttribute("y2", (-344 + circleRadius - halfh * 2).toString());
                    this.trackingLine.setAttribute("stroke-width", "2");
                    this.trackingGroup.appendChild(this.trackingLine);
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
                    this.selectedHeadingBug.setAttribute("stroke", "#00FFFF");
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
                    ilsBug.setAttribute("stroke", "#FF94FF");
                    ilsBug.setAttribute("stroke-width", "3");
                    this.ilsGroup.appendChild(ilsBug);
                }
                this.rotatingCircle.appendChild(this.ilsGroup);
            }
            {
                const lineStart = 50 - circleRadius - 18;
                const lineEnd = 50 - circleRadius + 18;
                const neutralLine = document.createElementNS(Avionics.SVG.NS, "line");
                this.neutralLine = neutralLine;
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
    constructPlan() {
        super.constructPlan();
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
                        text.setAttribute("font-size", "42");
                        text.setAttribute("font-family", "ECAMFontRegular");
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
                    this.addMapRange(circleGroup, 500 - vec.x, 500 + vec.y, "#00FFFF", "32", false, 1.0, true);
                }
            }
        }
    }
    constructRose() {
        super.constructRose();
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
                    text.setAttribute("font-size", "38");
                    text.setAttribute("font-family", "ECAMFontRegular");
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
                this.addMapRange(this.root, 500 - vec.x, 500 + vec.y, "#00FFFF", "32", false, 1.0, true);
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
            {
                this.failCircle2 = document.createElementNS(Avionics.SVG.NS, "g");
                this.failCircle2.setAttribute("id", "FailCircle2");
                this.root.appendChild(this.failCircle2);
                this.fInnerGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.failCircle2.appendChild(this.fInnerGroup);
                const fInnerCircle = document.createElementNS(Avionics.SVG.NS, "circle");
                fInnerCircle.setAttribute("cx", "500");
                fInnerCircle.setAttribute("cy", "500");
                fInnerCircle.setAttribute("r", "166");
                fInnerCircle.setAttribute("fill", "none");
                fInnerCircle.setAttribute("stroke", "red");
                fInnerCircle.setAttribute("stroke-width", "4");
                this.fInnerGroup.appendChild(fInnerCircle);

                const fOuterCircle = document.createElementNS(Avionics.SVG.NS, "circle");
                fOuterCircle.setAttribute("cx", "500");
                fOuterCircle.setAttribute("cy", "500");
                fOuterCircle.setAttribute("r", "333");
                fOuterCircle.setAttribute("fill", "none");
                fOuterCircle.setAttribute("stroke", "red");
                fOuterCircle.setAttribute("stroke-width", "4");
                this.fInnerGroup.appendChild(fOuterCircle);
            }
            this.courseGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.courseGroup.setAttribute("id", "CourseInfo");
            this.rotatingCircle.appendChild(this.courseGroup);
            {
                // VOR/ADF Bearing 1
                this.bearing1 = document.createElementNS(Avionics.SVG.NS, "g");
                this.bearing1.setAttribute("id", "bearing1");
                this.bearing1.setAttribute("visibility", "hidden");
                this.courseGroup.appendChild(this.bearing1);
                let arrow = document.createElementNS(Avionics.SVG.NS, "path");
                arrow.setAttribute("d", "M 500 835 L 499 785 H 530 L 500 736 V 665 V 736 L 470 785 H 499 M 500 246 L 500 335 M 500 194 L 530 246 H 500 M 500 194 V 168 V 194 L 470 246 H 500"); // Arrow modified

                // Fix ADF arrows turns white when changing ND mode
                if (Simplane.getAutoPilotNavAidState(this.aircraft, this.mfdIndex, 1) === NAV_AID_STATE.ADF) {
                    arrow.setAttribute("stroke", "lime");
                } else {
                    arrow.setAttribute("stroke", "white");
                }

                arrow.setAttribute("stroke-width", "5");
                arrow.setAttribute("fill", "none");
                this.bearing1.appendChild(arrow);

                // VOR/ADF Bearing 2
                this.bearing2 = document.createElementNS(Avionics.SVG.NS, "g");
                this.bearing2.setAttribute("id", "bearing2");
                this.bearing2.setAttribute("visibility", "hidden");
                this.courseGroup.appendChild(this.bearing2);
                arrow = document.createElementNS(Avionics.SVG.NS, "path");
                arrow.setAttribute("d", "M 500 832 L 500 736 M 485 665 L 485 736 H 515 L 515 665 M 500 168 L 500 246 L 531 293 H 515 M 500 246 L 469 293 H 485 M 485 292 L 485 335 M 515 292 L 515 335"); // Arrow modified

                // Fix ADF arrows turns white when changing ND mode
                if (Simplane.getAutoPilotNavAidState(this.aircraft, this.mfdIndex, 2) === NAV_AID_STATE.ADF) {
                    arrow.setAttribute("stroke", "lime");
                } else {
                    arrow.setAttribute("stroke", "white");
                }

                arrow.setAttribute("stroke-width", "5");
                arrow.setAttribute("fill", "none");
                this.bearing2.appendChild(arrow);

                this.course = document.createElementNS(Avionics.SVG.NS, "g");
                this.course.setAttribute("id", "course");
                this.courseGroup.appendChild(this.course);
                {
                    this.courseColor = "";
                    if (this.navigationMode == Jet_NDCompass_Navigation.ILS) {
                        this.courseColor = "#FF94FF";
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
                        CDICircle.setAttribute("fill", "url(#Backlight)");
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

                // Set visibility depending on selected NavAid
                if (this.isBearing1Displayed || this.isBearing2Displayed) {
                    this.bearingCircle.setAttribute("visibility", "visible");
                } else {
                    this.bearingCircle.setAttribute("visibility", "hidden");
                }

                this.courseGroup.appendChild(this.bearingCircle);
            }
            this.trackingGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.trackingGroup.setAttribute("id", "trackingGroup");
            {
                const halfw = 9;
                const halfh = 17;
                const p1 = (500) + ", " + (500 - circleRadius);
                const p2 = (500 + halfw) + ", " + (500 - circleRadius + halfh);
                const p3 = (500) + ", " + (500 - circleRadius + halfh * 2);
                const p4 = (500 - halfw) + ", " + (500 - circleRadius + halfh);
                this.trackingBug = document.createElementNS(Avionics.SVG.NS, "polygon");
                this.trackingBug.setAttribute("id", "trackingBug");
                this.trackingBug.setAttribute("points", p1 + " " + p2 + " " + p3 + " " + p4);
                this.trackingBug.setAttribute("stroke", "#00FF00");
                this.trackingBug.setAttribute("stroke-width", "3");
                this.trackingBug.setAttribute("fill", "transparent");

                if (this.navigationMode === Jet_NDCompass_Navigation.NAV) {
                    this.trackingLine = document.createElementNS(Avionics.SVG.NS, "line");
                    this.trackingLine.setAttribute("id", "trackingLine");
                    this.trackingLine.setAttribute("stroke", "#00FF00");
                    this.trackingLine.setAttribute("x1", "500");
                    this.trackingLine.setAttribute("y1", (170 + circleRadius).toString());
                    this.trackingLine.setAttribute("x2", "500");
                    this.trackingLine.setAttribute("y2", (-100 + circleRadius - halfh * 2).toString());
                    this.trackingLine.setAttribute("stroke-width", "3");

                    this.trackingGroup.appendChild(this.trackingLine);
                }

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
                this.selectedHeadingBug.setAttribute("stroke", "#00FFFF");
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
                    ilsBug.setAttribute("stroke", "#FF94FF");
                    ilsBug.setAttribute("stroke-width", "3");
                    this.ilsGroup.appendChild(ilsBug);
                }
                this.rotatingCircle.appendChild(this.ilsGroup);
            }
            if (this.navigationMode == Jet_NDCompass_Navigation.NAV) {
                this.selectedTrackGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.selectedTrackGroup.setAttribute("id", "selectedTrackGroup");
                {
                    this.selectedTrackLine = Avionics.SVG.computeDashLine(500, 500, -circleRadius, 15, 3, "#00FFFF");
                    this.selectedTrackLine.setAttribute("id", "selectedTrackLine");
                    this.selectedTrackGroup.appendChild(this.selectedTrackLine);
                    this.selectedTrackBug = document.createElementNS(Avionics.SVG.NS, "path");
                    this.selectedTrackBug.setAttribute("id", "selectedTrackBug");
                    this.selectedTrackBug.setAttribute("d", "M500 " + (500 - circleRadius) + " h -30 v -15 l 30 -15 l 30 15 v 15 z");
                    this.selectedTrackBug.setAttribute("stroke", "#00FFFF");
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
                    glideSlopeDot.setAttribute("fill", "transparent");
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
            this.glideSlopeCursor.setAttribute("stroke", "#FF94FF");
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
    updateFail(failed) {
        if (this.arcs) {
            for (const arc of this.arcs) {
                arc.setAttribute("fill", failed ? "red" : "white");
            }
        }
        if (this.rotatingCircle) {
            this.rotatingCircle.setAttribute("visibility", failed ? "hidden" : "visible");
        }
        if (this.failCircle) {
            this.failCircle.setAttribute("visibility", failed ? "visible" : "hidden");
        }
        if (this.failCircle2) {
            this.failCircle2.setAttribute("visibility", failed ? "visible" : "hidden");
        }
        if (this.headingGroup) {
            this.headingGroup.setAttribute("visibility", failed ? "hidden" : "visible");
        }
        if (this.selectedHeadingGroup) {
            this.selectedHeadingGroup.setAttribute("visibility", failed ? "hidden" : "visible");
        }
        if (this.neutralLine) {
            this.neutralLine.setAttribute("visibility", failed ? "hidden" : "visible");
        }
    }

    /**
     * Updates navigation aid arrows such as VOR or ADF bearings
     */
    updateNavAid(failed) {
        if (failed) {
            this.setAttribute("show_bearing1", "false");
            this.setAttribute("show_bearing2", "false");
            this._lastNavAid1State = NAV_AID_STATE.OFF;
            this._lastNavAid2State = NAV_AID_STATE.OFF;
            return;
        }

        // Navigation 1
        const navAid1State = Simplane.getAutoPilotNavAidState(this.aircraft, this.mfdIndex, 1);
        if (this._lastNavAid1State != navAid1State) {
            switch (navAid1State) {
                case NAV_AID_STATE.OFF:
                    this.logic_brg1Source = 0;
                    this.setAttribute("show_bearing1", "false");

                    // Workaround bearing arrow displayed incorrectly
                    this.setAttribute("bearing1_bearing", "1");
                    this.setAttribute("bearing1_bearing", "");
                    break;
                case NAV_AID_STATE.VOR:
                    this.logic_brg1Source = 1;
                    if (this.bearing1) {
                        this.bearing1.querySelectorAll('path')[0].setAttribute("stroke", "white");
                    }
                    document.getElementById('Arrow-Left').setAttribute("stroke", "white");
                    this.setAttribute("show_bearing1", "true");

                    // Workaround bearing arrow displayed incorrectly
                    this.setAttribute("bearing1_bearing", "1");
                    this.setAttribute("bearing1_bearing", "");
                    break;
                case NAV_AID_STATE.ADF:
                    this.logic_brg1Source = 4;
                    if (this.bearing1) {
                        this.bearing1.querySelectorAll('path')[0].setAttribute("stroke", "lime");
                    }
                    document.getElementById('Arrow-Left').setAttribute("stroke", "lime");
                    this.setAttribute("show_bearing1", "true");

                    // Workaround bearing arrow displayed incorrectly
                    if (!SimVar.GetSimVarValue("ADF SIGNAL:1", "number")) {
                        this.setAttribute("bearing1_bearing", "1");
                        this.setAttribute("bearing1_bearing", "");
                    }
                    break;
            }
            this._lastNavAid1State = navAid1State;
        }

        // Navigation 2
        const navAid2State = Simplane.getAutoPilotNavAidState(this.aircraft, this.mfdIndex, 2);
        if (this._lastNavAid2State != navAid2State) {
            switch (navAid2State) {
                case NAV_AID_STATE.OFF:
                    this.logic_brg2Source = 0;
                    this.setAttribute("show_bearing2", "false");

                    // Workaround bearing arrow displayed incorrectly
                    this.setAttribute("bearing2_bearing", "1");
                    this.setAttribute("bearing2_bearing", "");
                    break;
                case NAV_AID_STATE.VOR:
                    this.logic_brg2Source = 2;
                    if (this.bearing2) {
                        this.bearing2.querySelectorAll('path')[0].setAttribute("stroke", "white");
                    }
                    document.getElementById('Arrow-Right').setAttribute("stroke", "white");
                    this.setAttribute("show_bearing2", "true");

                    // Workaround bearing arrow displayed incorrectly
                    this.setAttribute("bearing2_bearing", "1");
                    this.setAttribute("bearing2_bearing", "");
                    break;
                case NAV_AID_STATE.ADF:
                    this.logic_brg2Source = 4;
                    if (this.bearing2) {
                        this.bearing2.querySelectorAll('path')[0].setAttribute("stroke", "lime");
                    }
                    document.getElementById('Arrow-Right').setAttribute("stroke", "lime");
                    this.setAttribute("show_bearing2", "true");

                    // Workaround bearing arrow displayed incorrectly
                    if (!SimVar.GetSimVarValue("ADF SIGNAL:2", "number")) {
                        this.setAttribute("bearing2_bearing", "1");
                        this.setAttribute("bearing2_bearing", "");
                    }
                    break;
            }
            this._lastNavAid2State = navAid2State;
        }
    }

    /**
     * Override `Jet_NDCompass.update` to add additonal update operations
     *
     * @param {number} _deltaTime the time passed between current and previous frame
     */
    update(_deltaTime) {
        // Update parent class state
        super.update(_deltaTime, this.mfdIndex);

        const failed = ADIRS.mapNotAvailable(this.mfdIndex);

        this.updateNavAid(failed);

        // Update fail last to overwrite every other updates
        this.updateFail(failed);
    }
}
customElements.define("jet-mfd-nd-compass", Jet_MFD_NDCompass);
