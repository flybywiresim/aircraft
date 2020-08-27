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
        if (this.aircraft == Aircraft.CJ4)
            this.constructArc_CJ4();
        else if (this.aircraft == Aircraft.B747_8)
            this.constructArc_B747_8();
        else if (this.aircraft == Aircraft.AS01B)
            this.constructArc_AS01B();
        else
            this.constructArc_A320_Neo();
    }
    constructArc_CJ4() { }
    constructArc_A320_Neo() {
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "-225 -215 550 516");
        this.appendChild(this.root);
        var trsGroup = document.createElementNS(Avionics.SVG.NS, "g");
        trsGroup.setAttribute("transform", "translate(0, 200)");
        this.root.appendChild(trsGroup);
        {
            let viewBox = document.createElementNS(Avionics.SVG.NS, "svg");
            viewBox.setAttribute("x", "-225");
            viewBox.setAttribute("y", "-475");
            viewBox.setAttribute("viewBox", "-225 -550 550 600");
            trsGroup.appendChild(viewBox);
            var circleRadius = 425;
            var dashSpacing = 72;
            var maskHeight = 200;
            this.arcMaskGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.arcMaskGroup.setAttribute("id", "MaskGroup");
            viewBox.appendChild(this.arcMaskGroup);
            {
                let topMask = document.createElementNS(Avionics.SVG.NS, "path");
                topMask.setAttribute("d", "M0 " + -maskHeight + ", L" + circleRadius * 2 + " " + -maskHeight + ", L" + circleRadius * 2 + " " + circleRadius + ", A 25 25 0 1 0 0, " + circleRadius + "Z");
                topMask.setAttribute("transform", "translate(" + (50 - circleRadius) + ", " + (50 - circleRadius) + ")");
                topMask.setAttribute("fill", "black");
                this.arcMaskGroup.appendChild(topMask);
            }
            this.arcRangeGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.arcRangeGroup.setAttribute("id", "ArcRangeGroup");
            viewBox.appendChild(this.arcRangeGroup);
            {
                let rads = [0.25, 0.50, 0.75];
                let cone = [Math.PI, 0.92 * Math.PI, 0.88 * Math.PI];
                let count = [10, 22, 34];
                let width = 14;
                this.arcs = [];
                for (let r = 0; r < rads.length; r++) {
                    let rad = circleRadius * rads[r];
                    let radians = (Math.PI - cone[r]) * 0.5;
                    for (let i = 0; i <= count[r]; i++) {
                        let line = document.createElementNS(Avionics.SVG.NS, "rect");
                        let degrees = (radians / Math.PI) * 180;
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
                    let vec = new Vec2(1, 0.6);
                    vec.SetNorm(rad - 25);
                    this.addMapRange(this.arcRangeGroup, 50 + vec.x, 50 - vec.y, "#00F2FF", "18", false, rads[r], true);
                    this.addMapRange(this.arcRangeGroup, 50 - vec.x, 50 - vec.y, "#00F2FF", "18", false, rads[r], true);
                }
                let vec = new Vec2(1, 0.6);
                vec.SetNorm(circleRadius - 25);
                this.addMapRange(this.arcRangeGroup, 50 + vec.x, 50 - vec.y, "#00F2FF", "18", false, 1.0, true);
                this.addMapRange(this.arcRangeGroup, 50 - vec.x, 50 - vec.y, "#00F2FF", "18", false, 1.0, true);
            }
            this.rotatingCircle = document.createElementNS(Avionics.SVG.NS, "g");
            this.rotatingCircle.setAttribute("id", "RotatingCircle");
            viewBox.appendChild(this.rotatingCircle);
            {
                this.failCircle = document.createElementNS(Avionics.SVG.NS, "g");
                this.failCircle.setAttribute("id", "FailCircle");
                viewBox.appendChild(this.failCircle);
                let circle = document.createElementNS(Avionics.SVG.NS, "circle");
                circle.setAttribute("cx", "50");
                circle.setAttribute("cy", "50");
                circle.setAttribute("r", circleRadius.toString());
                circle.setAttribute("fill-opacity", "0");
                circle.setAttribute("stroke", "red");
                circle.setAttribute("stroke-width", "4");
                this.failCircle.appendChild(circle);
                let scircle = document.createElementNS(Avionics.SVG.NS, "circle");
                scircle.setAttribute("cx", "50");
                scircle.setAttribute("cy", "50");
                scircle.setAttribute("r", "10");
                scircle.setAttribute("fill-opacity", "0");
                scircle.setAttribute("stroke", "red");
                scircle.setAttribute("stroke-width", "4");
                this.failCircle.appendChild(scircle);
            }
            {
                let circle = document.createElementNS(Avionics.SVG.NS, "circle");
                circle.setAttribute("cx", "50");
                circle.setAttribute("cy", "50");
                circle.setAttribute("r", circleRadius.toString());
                circle.setAttribute("fill-opacity", "0");
                circle.setAttribute("stroke", "white");
                circle.setAttribute("stroke-width", "2");
                this.rotatingCircle.appendChild(circle);
                let graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
                graduationGroup.setAttribute("id", "graduationGroup");
                {
                    let radians = 0;
                    for (let i = 0; i < dashSpacing; i++) {
                        let line = document.createElementNS(Avionics.SVG.NS, "line");
                        let bIsBig = (i % 2 == 0) ? true : false;
                        let length = (bIsBig) ? 16 : 8.5;
                        let lineStart = 50 + circleRadius;
                        let lineEnd = 50 + circleRadius + length;
                        let degrees = (radians / Math.PI) * 180;
                        line.setAttribute("x1", "50");
                        line.setAttribute("y1", lineStart.toString());
                        line.setAttribute("x2", "50");
                        line.setAttribute("y2", lineEnd.toString());
                        line.setAttribute("transform", "rotate(" + (-degrees + 180) + " 50 50)");
                        line.setAttribute("stroke", "white");
                        line.setAttribute("stroke-width", "3");
                        if (bIsBig) {
                            let text = document.createElementNS(Avionics.SVG.NS, "text");
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
                    var halfw = 7;
                    var halfh = 10;
                    this.trackingLine = document.createElementNS(Avionics.SVG.NS, "path");
                    this.trackingLine.setAttribute("id", "trackingLine");
                    this.trackingLine.setAttribute("d", "M50 50 v " + (circleRadius - halfh * 2));
                    this.trackingLine.setAttribute("fill", "transparent");
                    this.trackingLine.setAttribute("stroke", "#00FF21");
                    this.trackingLine.setAttribute("stroke-width", "3");
                    this.trackingGroup.appendChild(this.trackingLine);
                    var p1 = (50) + ", " + (50 + circleRadius);
                    var p2 = (50 + halfw) + ", " + (50 + circleRadius - halfh);
                    var p3 = (50) + ", " + (50 + circleRadius - halfh * 2);
                    var p4 = (50 - halfw) + ", " + (50 + circleRadius - halfh);
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
                    let ilsBug = document.createElementNS(Avionics.SVG.NS, "path");
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
                let lineStart = 50 - circleRadius - 18;
                let lineEnd = 50 - circleRadius + 18;
                let neutralLine = document.createElementNS(Avionics.SVG.NS, "line");
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
    constructArc_B747_8() { }
    constructArc_AS01B() {
    }
    constructPlan() {
        super.constructPlan();
        if (this.aircraft == Aircraft.B747_8)
            this.constructPlan_B747_8();
        else if (this.aircraft == Aircraft.AS01B)
            this.constructPlan_AS01B();
        else if (this.aircraft == Aircraft.CJ4)
            this.constructPlan_CJ4();
        else
            this.constructPlan_A320_Neo();
    }
    constructPlan_B747_8() { }
    constructPlan_AS01B() { }
    constructPlan_A320_Neo() {
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "0 0 1000 1000");
        this.appendChild(this.root);
        {
            let circleRadius = 333;
            let circleGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.root.appendChild(circleGroup);
            {
                let texts = ["N", "E", "S", "W"];
                for (let i = 0; i < 4; i++) {
                    let triangle = document.createElementNS(Avionics.SVG.NS, "path");
                    triangle.setAttribute("fill", "white");
                    triangle.setAttribute("d", "M500 176 L516 199 L484 199 Z");
                    triangle.setAttribute("transform", "rotate(" + fastToFixed(i * 90, 0) + " 500 500)");
                    circleGroup.appendChild(triangle);
                    let textGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    textGroup.setAttribute("transform", "rotate(" + fastToFixed(i * 90, 0) + " 500 500)");
                    {
                        let text = document.createElementNS(Avionics.SVG.NS, "text");
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
                    let innerCircle = document.createElementNS(Avionics.SVG.NS, "circle");
                    innerCircle.setAttribute("cx", "500");
                    innerCircle.setAttribute("cy", "500");
                    innerCircle.setAttribute("r", (circleRadius * 0.5).toString());
                    innerCircle.setAttribute("fill", "none");
                    innerCircle.setAttribute("stroke", "white");
                    innerCircle.setAttribute("stroke-width", "4");
                    circleGroup.appendChild(innerCircle);
                    let outerCircle = document.createElementNS(Avionics.SVG.NS, "circle");
                    outerCircle.setAttribute("cx", "500");
                    outerCircle.setAttribute("cy", "500");
                    outerCircle.setAttribute("r", circleRadius.toString());
                    outerCircle.setAttribute("fill", "none");
                    outerCircle.setAttribute("stroke", "white");
                    outerCircle.setAttribute("stroke-width", "4");
                    circleGroup.appendChild(outerCircle);
                    let vec = new Vec2(1, 1);
                    vec.SetNorm(333 - 45);
                    this.addMapRange(circleGroup, 500 - vec.x, 500 + vec.y, "#00F2FF", "32", false, 1.0, true);
                }
            }
        }
    }
    constructPlan_CJ4() { }
    constructRose() {
        super.constructRose();
        if (this.aircraft == Aircraft.CJ4)
            this.constructRose_CJ4();
        else if (this.aircraft == Aircraft.B747_8)
            this.constructRose_B747_8();
        else if (this.aircraft == Aircraft.AS01B)
            this.constructRose_AS01B();
        else
            this.constructRose_A320_Neo();
    }
    constructRose_A320_Neo() {
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "0 0 1000 1000");
        this.appendChild(this.root);
        let circleRadius = 333;
        {
            this.rotatingCircle = document.createElementNS(Avionics.SVG.NS, "g");
            this.rotatingCircle.setAttribute("id", "RotatingCircle");
            this.root.appendChild(this.rotatingCircle);
            let outerGroup = document.createElementNS(Avionics.SVG.NS, "g");
            outerGroup.setAttribute("id", "outerCircle");
            this.rotatingCircle.appendChild(outerGroup);
            {
                for (let i = 0; i < 72; i++) {
                    let line = document.createElementNS(Avionics.SVG.NS, "rect");
                    let length = i % 2 == 0 ? 26 : 13;
                    line.setAttribute("x", "498");
                    line.setAttribute("y", fastToFixed(833, 0));
                    line.setAttribute("width", "4");
                    line.setAttribute("height", length.toString());
                    line.setAttribute("transform", "rotate(" + fastToFixed(i * 5, 0) + " 500 500)");
                    line.setAttribute("fill", "white");
                    outerGroup.appendChild(line);
                }
                for (let i = 0; i < 36; i += 3) {
                    let text = document.createElementNS(Avionics.SVG.NS, "text");
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
                let outerCircle = document.createElementNS(Avionics.SVG.NS, "circle");
                outerCircle.setAttribute("cx", "500");
                outerCircle.setAttribute("cy", "500");
                outerCircle.setAttribute("r", circleRadius.toString());
                outerCircle.setAttribute("fill", "none");
                outerCircle.setAttribute("stroke", "white");
                outerCircle.setAttribute("stroke-width", "4");
                outerGroup.appendChild(outerCircle);
                let vec = new Vec2(1, 1);
                vec.SetNorm(circleRadius - 45);
                this.addMapRange(this.root, 500 - vec.x, 500 + vec.y, "#00F2FF", "32", false, 1.0, true);
            }
            let innerGroup = document.createElementNS(Avionics.SVG.NS, "g");
            innerGroup.setAttribute("id", "innerCircle");
            this.rotatingCircle.appendChild(innerGroup);
            {
                for (let i = 0; i < 8; i++) {
                    let line = document.createElementNS(Avionics.SVG.NS, "rect");
                    line.setAttribute("x", "497");
                    line.setAttribute("y", fastToFixed(583, 0));
                    line.setAttribute("width", "6");
                    line.setAttribute("height", "26");
                    line.setAttribute("transform", "rotate(" + fastToFixed(i * 45, 0) + " 500 500)");
                    line.setAttribute("fill", "white");
                    innerGroup.appendChild(line);
                }
                let innerCircle = document.createElementNS(Avionics.SVG.NS, "circle");
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
                let fInnerCircle = document.createElementNS(Avionics.SVG.NS, "circle");
                fInnerCircle.setAttribute("cx", "500");
                fInnerCircle.setAttribute("cy", "500");
                fInnerCircle.setAttribute("r", "166");
                fInnerCircle.setAttribute("fill", "none");
                fInnerCircle.setAttribute("stroke", "red");
                fInnerCircle.setAttribute("stroke-width", "4");
                this.fInnerGroup.appendChild(fInnerCircle);

                let fOuterCircle = document.createElementNS(Avionics.SVG.NS, "circle");
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
                    }
                    else if (this.navigationMode == Jet_NDCompass_Navigation.VOR) {
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
                    }
                    else if (this.navigationMode === Jet_NDCompass_Navigation.VOR) {
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
                    let circlePosition = [-166, -55, 55, 166];
                    for (let i = 0; i < circlePosition.length; i++) {
                        let CDICircle = document.createElementNS(Avionics.SVG.NS, "circle");
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
                var halfw = 13;
                var halfh = 20;
                var p1 = (500) + ", " + (500 - circleRadius);
                var p2 = (500 + halfw) + ", " + (500 - circleRadius + halfh);
                var p3 = (500) + ", " + (500 - circleRadius + halfh * 2);
                var p4 = (500 - halfw) + ", " + (500 - circleRadius + halfh);
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
                    let ilsBug = document.createElementNS(Avionics.SVG.NS, "path");
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
                    let glideSlopeDot = document.createElementNS(Avionics.SVG.NS, "circle");
                    glideSlopeDot.setAttribute("cx", "950");
                    glideSlopeDot.setAttribute("cy", (250 + i * 125).toFixed(0));
                    glideSlopeDot.setAttribute("r", "10");
                    glideSlopeDot.setAttribute("stroke", "white");
                    glideSlopeDot.setAttribute("stroke-width", "2");
                    this.glideSlopeGroup.appendChild(glideSlopeDot);
                }
            }
            let glideSlopeDash = document.createElementNS(Avionics.SVG.NS, "rect");
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
            let lineStart = 500 - circleRadius - 22;
            let lineEnd = 500 - circleRadius + 22;
            let neutralLine = document.createElementNS(Avionics.SVG.NS, "line");
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
    constructRose_B747_8() { }
    constructRose_AS01B() { }
    constructRose_CJ4() { }
    updateFail() {
        var failed = SimVar.GetSimVarValue("L:A320_Neo_ADIRS_STATE", "Enum") != 2;
        if (this.arcs) {
            for (let arc of this.arcs) {
                arc.setAttribute("fill", failed ? "red" : "white");
            }
        }
        if (this.rotatingCircle) this.rotatingCircle.setAttribute("visibility", failed ? "hidden" : "visible");
        if (this.failCircle) this.failCircle.setAttribute("visibility", failed ? "visible" : "hidden");
        if (this.failCircle2) this.failCircle2.setAttribute("visibility", failed ? "visible" : "hidden");
        if (this.headingGroup) this.headingGroup.setAttribute("visibility", failed ? "hidden" : "visible");
        if (this.selectedHeadingGroup) this.selectedHeadingGroup.setAttribute("visibility", failed ? "hidden" : "visible");
        if (this.neutralLine) this.neutralLine.setAttribute("visibility", failed ? "hidden" : "visible");
    }
}
customElements.define("jet-mfd-nd-compass", Jet_MFD_NDCompass);
//# sourceMappingURL=NDCompass.js.map