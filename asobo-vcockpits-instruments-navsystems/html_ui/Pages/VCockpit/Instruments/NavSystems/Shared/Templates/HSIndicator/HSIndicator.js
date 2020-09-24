var HSIndicatorDisplayType;
(function (HSIndicatorDisplayType) {
    HSIndicatorDisplayType[HSIndicatorDisplayType["GlassCockpit"] = 0] = "GlassCockpit";
    HSIndicatorDisplayType[HSIndicatorDisplayType["HUD"] = 1] = "HUD";
    HSIndicatorDisplayType[HSIndicatorDisplayType["HUD_Simplified"] = 2] = "HUD_Simplified";
})(HSIndicatorDisplayType || (HSIndicatorDisplayType = {}));
;
class HSIndicator extends HTMLElement {
    constructor() {
        super();
        this.crosstrackFullError = 2;
        this.isDmeDisplayed = false;
        this.isBearing1Displayed = false;
        this.isBearing2Displayed = false;
        this.crossTrackCurrent = 0;
        this.crossTrackGoal = 0;
        this.sourceIsGps = true;
        this.displayStyle = HSIndicatorDisplayType.GlassCockpit;
        this.fmsAlias = "FMS";
        this.logic_dmeDisplayed = false;
        this.logic_dmeSource = 1;
        this.logic_cdiSource = 3;
        this.logic_brg1Source = 0;
        this.logic_brg2Source = 0;
    }
    static get observedAttributes() {
        return [
            "rotation",
            "heading_bug_rotation",
            "course",
            "course_deviation",
            "display_deviation",
            "crosstrack_full_error",
            "turn_rate",
            "nav_source",
            "flight_phase",
            "show_dme",
            "show_bearing1",
            "show_bearing2",
            "toggle_dme",
            "toggle_bearing1",
            "toggle_bearing2",
            "bearing1_source",
            "bearing1_ident",
            "bearing1_distance",
            "bearing1_bearing",
            "bearing2_source",
            "bearing2_ident",
            "bearing2_distance",
            "bearing2_bearing",
            "dme_source",
            "dme_ident",
            "dme_distance",
            "to_from",
            "current_track",
            "displaystyle"
        ];
    }
    connectedCallback() {
        let fmsAlias = this.getAttribute("fmsAlias");
        if (fmsAlias && fmsAlias != "") {
            this.fmsAlias = fmsAlias;
        }
        this.createSVG();
    }
    createSVG() {
        Utils.RemoveAllChildren(this);
        if (this.hasAttribute("displaystyle")) {
            var style = this.getAttribute("displaystyle").toLowerCase();
            if (style == "hud") {
                this.displayStyle = HSIndicatorDisplayType.HUD;
            }
            else if (style == "hud_simplified") {
                this.displayStyle = HSIndicatorDisplayType.HUD_Simplified;
            }
        }
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "-28 -15 156 116");
        this.appendChild(this.root);
        {
            let lines = [-135, -90, -45, 45, 90, 135];
            for (let i = 0; i < lines.length; i++) {
                let line = document.createElementNS(Avionics.SVG.NS, "rect");
                line.setAttribute("x", "49.5");
                line.setAttribute("y", "-7");
                line.setAttribute("width", "1");
                line.setAttribute("height", "6");
                line.setAttribute("transform", "rotate(" + lines[i] + " 50 50)");
                line.setAttribute("fill", "white");
                this.root.appendChild(line);
            }
        }
        {
            {
                let arcSize = 45;
                let arcRadius = 53;
                let arcWidth = 5;
                let beginPointHalfUnitSize = (arcSize / 2) / arcRadius;
                let beginPointTopX = 50 - Math.sin(beginPointHalfUnitSize) * (arcRadius + arcWidth / 2);
                let beginPointBotX = 50 - Math.sin(beginPointHalfUnitSize) * (arcRadius - arcWidth / 2);
                let endPointTopX = 50 + Math.sin(beginPointHalfUnitSize) * (arcRadius + arcWidth / 2);
                let endPointBotX = 50 + Math.sin(beginPointHalfUnitSize) * (arcRadius - arcWidth / 2);
                let pointTopY = 50 - Math.cos(beginPointHalfUnitSize) * (arcRadius + arcWidth / 2);
                let pointBotY = 50 - Math.cos(beginPointHalfUnitSize) * (arcRadius - arcWidth / 2);
                let turnRateBackground = document.createElementNS(Avionics.SVG.NS, "path");
                let path = "M" + beginPointBotX + " " + pointBotY + "A " + (arcRadius - arcWidth / 2) + " " + (arcRadius - arcWidth / 2) + " 0 0 1 " + endPointBotX + " " + pointBotY;
                path += "L" + endPointTopX + " " + pointTopY + "A " + (arcRadius + arcWidth / 2) + " " + (arcRadius + arcWidth / 2) + " 0 0 0 " + beginPointTopX + " " + pointTopY;
                turnRateBackground.setAttribute("d", path);
                turnRateBackground.setAttribute("fill", "#1a1d21");
                turnRateBackground.setAttribute("fill-opacity", "0.25");
                this.root.appendChild(turnRateBackground);
                let lines = [-18, -9, 9, 18];
                for (let i = 0; i < lines.length; i++) {
                    let line = document.createElementNS(Avionics.SVG.NS, "rect");
                    line.setAttribute("x", "49.5");
                    line.setAttribute("y", (-arcWidth).toString());
                    line.setAttribute("width", "1");
                    line.setAttribute("height", arcWidth.toString());
                    line.setAttribute("transform", "rotate(" + lines[i] + " 50 50)");
                    line.setAttribute("fill", "white");
                    this.root.appendChild(line);
                }
            }
            {
                let turnRateArc = document.createElementNS(Avionics.SVG.NS, "path");
                this.turnRateArc = turnRateArc;
                turnRateArc.setAttribute("fill", "#d12bc7");
                this.root.appendChild(turnRateArc);
            }
        }
        {
            this.backgroundCircle = document.createElementNS(Avionics.SVG.NS, "g");
            this.root.appendChild(this.backgroundCircle);
            {
                let circle = document.createElementNS(Avionics.SVG.NS, "circle");
                circle.setAttribute("cx", "50");
                circle.setAttribute("cy", "50");
                circle.setAttribute("r", "50");
                circle.setAttribute("fill", "#1a1d21");
                circle.setAttribute("fill-opacity", "0.25");
                this.backgroundCircle.appendChild(circle);
            }
            {
                let angle = 0;
                for (let i = 0; i < 72; i++) {
                    let line = document.createElementNS(Avionics.SVG.NS, "rect");
                    let length = i % 2 == 0 ? 4 : 2;
                    line.setAttribute("x", "49.5");
                    line.setAttribute("y", (100 - length).toString());
                    line.setAttribute("width", "1");
                    line.setAttribute("height", length.toString());
                    line.setAttribute("transform", "rotate(" + ((-angle / Math.PI) * 180 + 180) + " 50 50)");
                    line.setAttribute("fill", "white");
                    angle += (2 * Math.PI) / 72;
                    this.backgroundCircle.appendChild(line);
                }
            }
            {
                let texts = ["N", "3", "6", "E", "12", "15", "S", "21", "24", "W", "30", "33"];
                let angle = 0;
                for (let i = 0; i < texts.length; i++) {
                    let text = document.createElementNS(Avionics.SVG.NS, "text");
                    text.textContent = texts[i];
                    text.setAttribute("x", "50");
                    text.setAttribute("y", (i % 3) == 0 ? "12" : "9");
                    text.setAttribute("fill", "white");
                    text.setAttribute("font-size", (i % 3) == 0 ? "15" : "8");
                    text.setAttribute("font-family", "Roboto-Bold");
                    text.setAttribute("text-anchor", "middle");
                    text.setAttribute("alignment-baseline", "central");
                    text.setAttribute("transform", "rotate(" + angle + " 50 50)");
                    angle += 360 / texts.length;
                    this.backgroundCircle.appendChild(text);
                }
            }
            {
                this.headingBug = document.createElementNS(Avionics.SVG.NS, "polygon");
                this.headingBug.setAttribute("points", "46,0 47,0 50,4 53,0 54,0 54,5 46,5");
                this.headingBug.setAttribute("fill", "aqua");
                this.backgroundCircle.appendChild(this.headingBug);
            }
            {
                this.innerCircle = document.createElementNS(Avionics.SVG.NS, "circle");
                this.innerCircle.setAttribute("cx", "50");
                this.innerCircle.setAttribute("cy", "50");
                this.innerCircle.setAttribute("r", "30");
                this.innerCircle.setAttribute("stroke", "white");
                this.innerCircle.setAttribute("stroke-width", "0.8");
                this.innerCircle.setAttribute("fill-opacity", "0");
                this.innerCircle.setAttribute("display", "none");
                this.backgroundCircle.appendChild(this.innerCircle);
            }
            if (this.displayStyle != HSIndicatorDisplayType.HUD_Simplified) {
                {
                    this.currentTrackIndicator = document.createElementNS(Avionics.SVG.NS, "polygon");
                    this.currentTrackIndicator.setAttribute("points", "50,-4 52,0 50,4 48,0");
                    this.currentTrackIndicator.setAttribute("fill", "#d12bc7");
                    this.backgroundCircle.appendChild(this.currentTrackIndicator);
                }
                {
                    this.bearing1 = document.createElementNS(Avionics.SVG.NS, "g");
                    this.bearing1.setAttribute("display", "none");
                    this.backgroundCircle.appendChild(this.bearing1);
                    let arrow = document.createElementNS(Avionics.SVG.NS, "path");
                    arrow.setAttribute("d", "M50 96 L50 80 M50 4 L50 20 M50 8 L57 15 M50 8 L43 15");
                    arrow.setAttribute("stroke", "#36c8d2");
                    arrow.setAttribute("stroke-width", "1");
                    arrow.setAttribute("fill-opacity", "0");
                    this.bearing1.appendChild(arrow);
                }
                {
                    this.bearing2 = document.createElementNS(Avionics.SVG.NS, "g");
                    this.bearing2.setAttribute("display", "none");
                    this.backgroundCircle.appendChild(this.bearing2);
                    let arrow = document.createElementNS(Avionics.SVG.NS, "path");
                    arrow.setAttribute("d", "M50 96 L50 92 M47 80 L47 90 Q50 96 53 90 L53 80 M50 4 L50 8 L57 15 M50 8 L43 15 M47 11 L47 20 M53 11 L53 20");
                    arrow.setAttribute("stroke", "#36c8d2");
                    arrow.setAttribute("stroke-width", "1");
                    arrow.setAttribute("fill-opacity", "0");
                    this.bearing2.appendChild(arrow);
                }
                {
                    this.course = document.createElementNS(Avionics.SVG.NS, "g");
                    this.backgroundCircle.appendChild(this.course);
                    {
                        this.beginArrow = document.createElementNS(Avionics.SVG.NS, "polygon");
                        this.beginArrow.setAttribute("points", "51,96 49,96 49,75 51,75");
                        this.beginArrow.setAttribute("fill", "#d12bc7");
                        this.course.appendChild(this.beginArrow);
                        this.fromIndicator = document.createElementNS(Avionics.SVG.NS, "polygon");
                        this.fromIndicator.setAttribute("points", "46,75 54,75 50,80");
                        this.fromIndicator.setAttribute("fill", "#d12bc7");
                        this.fromIndicator.setAttribute("stroke", "black");
                        this.fromIndicator.setAttribute("stroke-width", "0.2");
                        this.fromIndicator.setAttribute("display", "none");
                        this.course.appendChild(this.fromIndicator);
                    }
                    {
                        this.CDI = document.createElementNS(Avionics.SVG.NS, "polygon");
                        this.CDI.setAttribute("points", "49,74.5 51,74.5 51,25.5 49,25.5");
                        this.CDI.setAttribute("fill", "#d12bc7");
                        this.course.appendChild(this.CDI);
                    }
                    {
                        this.endArrow = document.createElementNS(Avionics.SVG.NS, "polygon");
                        this.endArrow.setAttribute("points", "51,25 49,25 49,15 45,15 50,4 55,15 51,15");
                        this.endArrow.setAttribute("fill", "#d12bc7");
                        this.course.appendChild(this.endArrow);
                        this.toIndicator = document.createElementNS(Avionics.SVG.NS, "polygon");
                        this.toIndicator.setAttribute("points", "46,25 54,25 50,20");
                        this.toIndicator.setAttribute("fill", "#d12bc7");
                        this.toIndicator.setAttribute("stroke", "black");
                        this.toIndicator.setAttribute("stroke-width", "0.2");
                        this.toIndicator.setAttribute("display", "none");
                        this.course.appendChild(this.toIndicator);
                    }
                    let circlePosition = [-20, -10, 10, 20];
                    for (let i = 0; i < circlePosition.length; i++) {
                        let CDICircle = document.createElementNS(Avionics.SVG.NS, "circle");
                        CDICircle.setAttribute("cx", (50 + circlePosition[i]).toString());
                        CDICircle.setAttribute("cy", "50");
                        CDICircle.setAttribute("r", "2");
                        CDICircle.setAttribute("stroke", "white");
                        CDICircle.setAttribute("stroke-width", "1");
                        CDICircle.setAttribute("fill-opacity", "0");
                        this.course.appendChild(CDICircle);
                    }
                }
            }
        }
        {
            let topTriangle = document.createElementNS(Avionics.SVG.NS, "polygon");
            topTriangle.setAttribute("points", "46,-3 54,-3 50,3");
            topTriangle.setAttribute("fill", "white");
            topTriangle.setAttribute("stroke", "black");
            this.root.appendChild(topTriangle);
        }
        {
            let plane = document.createElementNS(Avionics.SVG.NS, "path");
            plane.setAttribute("d", "M44 50 L49 50 L49 53 L48 54 L48 55 L52 55 L52 54 L51 53 L51 50 L56 50 L56 49 L51 48 L51 46 Q50 44 49 46 L49 48 L44 49 Z");
            plane.setAttribute("fill", "white");
            this.root.appendChild(plane);
        }
        {
            let bearingRectangle = document.createElementNS(Avionics.SVG.NS, "rect");
            bearingRectangle.setAttribute("x", "35");
            bearingRectangle.setAttribute("y", "-15");
            bearingRectangle.setAttribute("height", "12");
            bearingRectangle.setAttribute("width", "30");
            bearingRectangle.setAttribute("fill", "#1a1d21");
            this.root.appendChild(bearingRectangle);
            if (this.displayStyle == HSIndicatorDisplayType.HUD)
                this.applyHUDStyle(bearingRectangle);
            let bearingText = document.createElementNS(Avionics.SVG.NS, "text");
            bearingText.setAttribute("fill", "white");
            bearingText.setAttribute("text-anchor", "middle");
            bearingText.setAttribute("x", "50");
            bearingText.setAttribute("y", "-5");
            bearingText.setAttribute("font-size", "11");
            bearingText.setAttribute("font-family", "Roboto-Bold");
            this.bearingText = bearingText;
            this.root.appendChild(bearingText);
        }
        if (this.displayStyle == HSIndicatorDisplayType.HUD_Simplified)
            return;
        {
            let headingRectangle = document.createElementNS(Avionics.SVG.NS, "rect");
            headingRectangle.setAttribute("x", "-13");
            headingRectangle.setAttribute("y", "-7");
            headingRectangle.setAttribute("height", "8");
            headingRectangle.setAttribute("width", "36");
            headingRectangle.setAttribute("fill", "#1a1d21");
            headingRectangle.setAttribute("fill-opacity", "1");
            this.root.appendChild(headingRectangle);
            if (this.displayStyle == HSIndicatorDisplayType.HUD)
                this.applyHUDStyle(headingRectangle);
            let headingLeftText = document.createElementNS(Avionics.SVG.NS, "text");
            headingLeftText.textContent = "HDG";
            headingLeftText.setAttribute("fill", "white");
            headingLeftText.setAttribute("x", "-11");
            headingLeftText.setAttribute("y", "-0.6");
            headingLeftText.setAttribute("font-size", "7");
            headingLeftText.setAttribute("font-family", "Roboto");
            this.root.appendChild(headingLeftText);
            let headingValue = document.createElementNS(Avionics.SVG.NS, "text");
            headingValue.setAttribute("fill", "#36c8d2");
            headingValue.setAttribute("x", "5");
            headingValue.setAttribute("y", "-0.6");
            headingValue.setAttribute("font-size", "7");
            headingValue.setAttribute("font-family", "Roboto");
            this.headingText = headingValue;
            this.root.appendChild(headingValue);
        }
        {
            let courseRectangle = document.createElementNS(Avionics.SVG.NS, "rect");
            courseRectangle.setAttribute("x", "77");
            courseRectangle.setAttribute("y", "-7");
            courseRectangle.setAttribute("height", "8");
            courseRectangle.setAttribute("width", "36");
            courseRectangle.setAttribute("fill", "#1a1d21");
            this.root.appendChild(courseRectangle);
            if (this.displayStyle == HSIndicatorDisplayType.HUD)
                this.applyHUDStyle(courseRectangle);
            let courseLeftText = document.createElementNS(Avionics.SVG.NS, "text");
            courseLeftText.textContent = "CRS";
            courseLeftText.setAttribute("fill", "white");
            courseLeftText.setAttribute("x", "79");
            courseLeftText.setAttribute("y", "-0.6");
            courseLeftText.setAttribute("font-size", "7");
            courseLeftText.setAttribute("font-family", "Roboto");
            this.root.appendChild(courseLeftText);
            let courseValue = document.createElementNS(Avionics.SVG.NS, "text");
            courseValue.setAttribute("fill", "#d12bc7");
            courseValue.setAttribute("x", "95");
            courseValue.setAttribute("y", "-0.6");
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
            this.navSourceBg.setAttribute("y", "34.5");
            this.navSourceBg.setAttribute("height", "7");
            this.navSourceBg.setAttribute("width", "14");
            this.root.appendChild(this.navSourceBg);
            this.navSource = document.createElementNS(Avionics.SVG.NS, "text");
            this.navSource.textContent = "GPS";
            this.navSource.setAttribute("fill", "#d12bc7");
            this.navSource.setAttribute("x", "35");
            this.navSource.setAttribute("y", "40");
            this.navSource.setAttribute("font-size", "6");
            this.navSource.setAttribute("font-family", "Roboto-Bold");
            this.navSource.setAttribute("text-anchor", "middle");
            this.root.appendChild(this.navSource);
            this.flightPhaseBg = document.createElementNS(Avionics.SVG.NS, "rect");
            this.flightPhaseBg.setAttribute("fill", "#1a1d21");
            this.flightPhaseBg.setAttribute("fill-opacity", "1");
            this.flightPhaseBg.setAttribute("x", "57");
            this.flightPhaseBg.setAttribute("y", "34.5");
            this.flightPhaseBg.setAttribute("height", "7");
            this.flightPhaseBg.setAttribute("width", "16");
            this.root.appendChild(this.flightPhaseBg);
            let flightPhase = document.createElementNS(Avionics.SVG.NS, "text");
            flightPhase.textContent = "TERM";
            flightPhase.setAttribute("fill", "#d12bc7");
            flightPhase.setAttribute("x", "65");
            flightPhase.setAttribute("y", "40");
            flightPhase.setAttribute("font-size", "6");
            flightPhase.setAttribute("font-family", "Roboto-Bold");
            flightPhase.setAttribute("text-anchor", "middle");
            this.flightPhase = flightPhase;
            this.root.appendChild(flightPhase);
            this.crossTrackErrorBg = document.createElementNS(Avionics.SVG.NS, "rect");
            this.crossTrackErrorBg.setAttribute("fill", "#1a1d21");
            this.crossTrackErrorBg.setAttribute("fill-opacity", "1");
            this.crossTrackErrorBg.setAttribute("x", "30");
            this.crossTrackErrorBg.setAttribute("y", "60.5");
            this.crossTrackErrorBg.setAttribute("height", "7");
            this.crossTrackErrorBg.setAttribute("width", "38");
            this.root.appendChild(this.crossTrackErrorBg);
            let crossTrackError = document.createElementNS(Avionics.SVG.NS, "text");
            crossTrackError.textContent = "XTK 3.15NM";
            crossTrackError.setAttribute("fill", "#d12bc7");
            crossTrackError.setAttribute("x", "50");
            crossTrackError.setAttribute("y", "66");
            crossTrackError.setAttribute("font-size", "6");
            crossTrackError.setAttribute("font-family", "Roboto-Bold");
            crossTrackError.setAttribute("text-anchor", "middle");
            this.crossTrackError = crossTrackError;
            this.root.appendChild(crossTrackError);
        }
        {
            {
                this.dme = document.createElementNS(Avionics.SVG.NS, "g");
                this.dme.setAttribute("display", "none");
                this.root.appendChild(this.dme);
                let topLeftZone = document.createElementNS(Avionics.SVG.NS, "path");
                topLeftZone.setAttribute("d", this.getExternalTextZonePath(57, 0, -0.58, -28));
                topLeftZone.setAttribute("fill", "#1a1d21");
                this.dme.appendChild(topLeftZone);
                let dme1 = document.createElementNS(Avionics.SVG.NS, "text");
                dme1.textContent = "DME";
                dme1.setAttribute("fill", "white");
                dme1.setAttribute("x", "-27");
                dme1.setAttribute("y", "57");
                dme1.setAttribute("font-size", "6");
                dme1.setAttribute("font-family", "Roboto-Bold");
                dme1.setAttribute("text-anchor", "start");
                this.dme.appendChild(dme1);
                this.dmeSource = document.createElementNS(Avionics.SVG.NS, "text");
                this.dmeSource.textContent = "NAV1";
                this.dmeSource.setAttribute("fill", "#36c8d2");
                this.dmeSource.setAttribute("x", "-27");
                this.dmeSource.setAttribute("y", "64");
                this.dmeSource.setAttribute("font-size", "6");
                this.dmeSource.setAttribute("font-family", "Roboto-Bold");
                this.dmeSource.setAttribute("text-anchor", "start");
                this.dme.appendChild(this.dmeSource);
                this.dmeIdent = document.createElementNS(Avionics.SVG.NS, "text");
                this.dmeIdent.textContent = "117.80";
                this.dmeIdent.setAttribute("fill", "#36c8d2");
                this.dmeIdent.setAttribute("x", "-27");
                this.dmeIdent.setAttribute("y", "71");
                this.dmeIdent.setAttribute("font-size", "6");
                this.dmeIdent.setAttribute("font-family", "Roboto-Bold");
                this.dmeIdent.setAttribute("text-anchor", "start");
                this.dme.appendChild(this.dmeIdent);
                this.dmeDistance = document.createElementNS(Avionics.SVG.NS, "text");
                this.dmeDistance.textContent = "97.7NM";
                this.dmeDistance.setAttribute("fill", "white");
                this.dmeDistance.setAttribute("x", "-27");
                this.dmeDistance.setAttribute("y", "78");
                this.dmeDistance.setAttribute("font-size", "6");
                this.dmeDistance.setAttribute("font-family", "Roboto-Bold");
                this.dmeDistance.setAttribute("text-anchor", "start");
                this.dme.appendChild(this.dmeDistance);
            }
            {
                this.bearing1FixedGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.bearing1FixedGroup.setAttribute("display", "none");
                this.root.appendChild(this.bearing1FixedGroup);
                let botLeftZone = document.createElementNS(Avionics.SVG.NS, "path");
                botLeftZone.setAttribute("d", this.getExternalTextZonePath(57, -0.6, -1.1, -28));
                botLeftZone.setAttribute("fill", "#1a1d21");
                this.bearing1FixedGroup.appendChild(botLeftZone);
                this.bearing1Distance = document.createElementNS(Avionics.SVG.NS, "text");
                this.bearing1Distance.textContent = "16.2 NM";
                this.bearing1Distance.setAttribute("fill", "white");
                this.bearing1Distance.setAttribute("x", "-27");
                this.bearing1Distance.setAttribute("y", "88");
                this.bearing1Distance.setAttribute("font-size", "6");
                this.bearing1Distance.setAttribute("font-family", "Roboto-Bold");
                this.bearing1Distance.setAttribute("text-anchor", "start");
                this.bearing1FixedGroup.appendChild(this.bearing1Distance);
                this.bearing1Ident = document.createElementNS(Avionics.SVG.NS, "text");
                this.bearing1Ident.textContent = "ATL";
                this.bearing1Ident.setAttribute("fill", "#36c8d2");
                this.bearing1Ident.setAttribute("x", "-27");
                this.bearing1Ident.setAttribute("y", "94");
                this.bearing1Ident.setAttribute("font-size", "6");
                this.bearing1Ident.setAttribute("font-family", "Roboto-Bold");
                this.bearing1Ident.setAttribute("text-anchor", "start");
                this.bearing1FixedGroup.appendChild(this.bearing1Ident);
                this.bearing1Source = document.createElementNS(Avionics.SVG.NS, "text");
                this.bearing1Source.textContent = "NAV1";
                this.bearing1Source.setAttribute("fill", "white");
                this.bearing1Source.setAttribute("x", "-27");
                this.bearing1Source.setAttribute("y", "100");
                this.bearing1Source.setAttribute("font-size", "6");
                this.bearing1Source.setAttribute("font-family", "Roboto-Bold");
                this.bearing1Source.setAttribute("text-anchor", "left");
                this.bearing1FixedGroup.appendChild(this.bearing1Source);
                {
                    let pointer1Main = document.createElementNS(Avionics.SVG.NS, "rect");
                    pointer1Main.setAttribute("x", "-5");
                    pointer1Main.setAttribute("y", "96.875");
                    pointer1Main.setAttribute("width", "15");
                    pointer1Main.setAttribute("height", "0.25");
                    pointer1Main.setAttribute("fill", "#36c8d2");
                    this.bearing1FixedGroup.appendChild(pointer1Main);
                    let pointer1Top = document.createElementNS(Avionics.SVG.NS, "rect");
                    pointer1Top.setAttribute("x", "-3");
                    pointer1Top.setAttribute("y", "96.875");
                    pointer1Top.setAttribute("width", "4");
                    pointer1Top.setAttribute("height", "0.25");
                    pointer1Top.setAttribute("transform", "rotate(-45 -3 97)");
                    pointer1Top.setAttribute("fill", "#36c8d2");
                    this.bearing1FixedGroup.appendChild(pointer1Top);
                    let pointer1Bot = document.createElementNS(Avionics.SVG.NS, "rect");
                    pointer1Bot.setAttribute("x", "-3");
                    pointer1Bot.setAttribute("y", "96.875");
                    pointer1Bot.setAttribute("width", "4");
                    pointer1Bot.setAttribute("height", "0.25");
                    pointer1Bot.setAttribute("transform", "rotate(45 -3 97)");
                    pointer1Bot.setAttribute("fill", "#36c8d2");
                    this.bearing1FixedGroup.appendChild(pointer1Bot);
                }
            }
            {
                this.bearing2FixedGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.bearing2FixedGroup.setAttribute("display", "none");
                this.root.appendChild(this.bearing2FixedGroup);
                let botRightZone = document.createElementNS(Avionics.SVG.NS, "path");
                botRightZone.setAttribute("d", this.getExternalTextZonePath(57, Math.PI + 0.6, Math.PI + 1.1, 128, true));
                botRightZone.setAttribute("fill", "#1a1d21");
                this.bearing2FixedGroup.appendChild(botRightZone);
                this.bearing2Distance = document.createElementNS(Avionics.SVG.NS, "text");
                this.bearing2Distance.textContent = "16.2 NM";
                this.bearing2Distance.setAttribute("fill", "white");
                this.bearing2Distance.setAttribute("x", "127");
                this.bearing2Distance.setAttribute("y", "88");
                this.bearing2Distance.setAttribute("font-size", "6");
                this.bearing2Distance.setAttribute("font-family", "Roboto-Bold");
                this.bearing2Distance.setAttribute("text-anchor", "end");
                this.bearing2FixedGroup.appendChild(this.bearing2Distance);
                this.bearing2Ident = document.createElementNS(Avionics.SVG.NS, "text");
                this.bearing2Ident.textContent = "ATL";
                this.bearing2Ident.setAttribute("fill", "#36c8d2");
                this.bearing2Ident.setAttribute("x", "127");
                this.bearing2Ident.setAttribute("y", "94");
                this.bearing2Ident.setAttribute("font-size", "6");
                this.bearing2Ident.setAttribute("font-family", "Roboto-Bold");
                this.bearing2Ident.setAttribute("text-anchor", "end");
                this.bearing2FixedGroup.appendChild(this.bearing2Ident);
                this.bearing2Source = document.createElementNS(Avionics.SVG.NS, "text");
                this.bearing2Source.textContent = "NAV1";
                this.bearing2Source.setAttribute("fill", "white");
                this.bearing2Source.setAttribute("x", "127");
                this.bearing2Source.setAttribute("y", "100");
                this.bearing2Source.setAttribute("font-size", "6");
                this.bearing2Source.setAttribute("font-family", "Roboto-Bold");
                this.bearing2Source.setAttribute("text-anchor", "end");
                this.bearing2FixedGroup.appendChild(this.bearing2Source);
                let pointer2 = document.createElementNS(Avionics.SVG.NS, "path");
                pointer2.setAttribute("d", "M90 97 L92 97 M105 97 L103 97 L100 100 M103 97 L100 94 M101.5 98.5 L93 98.5 Q90 97 93 95.5 L101.5 95.5");
                pointer2.setAttribute("stroke", "#36c8d2");
                pointer2.setAttribute("stroke-width", "0.5");
                pointer2.setAttribute("fill-opacity", "0");
                this.bearing2FixedGroup.appendChild(pointer2);
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
                    }
                    else {
                        this.dme.setAttribute("display", "none");
                    }
                }
                break;
            case "toggle_bearing1":
                this.isBearing1Displayed = !this.isBearing1Displayed;
                if (this.bearing1) {
                    if (this.isBearing1Displayed || this.isBearing2Displayed) {
                        this.innerCircle.setAttribute("display", "inherit");
                    }
                    else {
                        this.innerCircle.setAttribute("display", "none");
                    }
                    if (this.isBearing1Displayed) {
                        this.bearing1.setAttribute("display", "inherit");
                        this.bearing1FixedGroup.setAttribute("display", "inherit");
                    }
                    else {
                        this.bearing1.setAttribute("display", "none");
                        this.bearing1FixedGroup.setAttribute("display", "none");
                    }
                }
                break;
            case "toggle_bearing2":
                this.isBearing2Displayed = !this.isBearing2Displayed;
                if (this.bearing2) {
                    if (this.isBearing1Displayed || this.isBearing2Displayed) {
                        this.innerCircle.setAttribute("display", "inherit");
                    }
                    else {
                        this.innerCircle.setAttribute("display", "none");
                    }
                    if (this.isBearing2Displayed) {
                        this.bearing2.setAttribute("display", "inherit");
                        this.bearing2FixedGroup.setAttribute("display", "inherit");
                    }
                    else {
                        this.bearing2.setAttribute("display", "none");
                        this.bearing2FixedGroup.setAttribute("display", "none");
                    }
                }
                break;
        }
        if (oldValue == newValue)
            return;
        switch (name) {
            case "rotation":
                this.backgroundCircle.setAttribute("transform", "rotate(" + (-newValue) + " 50 50)");
                if (this.bearingText) {
                    let brg = Math.round(parseFloat(newValue));
                    brg = (brg == 0) ? 360 : brg;
                    this.bearingText.textContent = "000".slice(brg.toString().length) + brg + "°";
                }
                break;
            case "heading_bug_rotation":
                this.headingBug.setAttribute("transform", "rotate(" + (newValue) + ", 50, 50)");
                if (this.headingText) {
                    let headingValue = parseFloat(newValue);
                    if (headingValue == 0) {
                        headingValue = 360;
                    }
                    let hdg = fastToFixed(headingValue, 0);
                    this.headingText.textContent = "000".slice(hdg.length) + hdg + "°";
                }
                break;
            case "course":
                if (this.course) {
                    this.course.setAttribute("transform", "rotate(" + (newValue) + ", 50, 50)");
                    if (this.courseText) {
                        let crs = fastToFixed(parseFloat(newValue), 0);
                        this.courseText.textContent = "000".slice(crs.length) + crs + "°";
                    }
                }
                break;
            case "course_deviation":
                if (this.CDI) {
                    let deviation = parseFloat(newValue);
                    if (this.sourceIsGps) {
                        this.crossTrackGoal = (Math.min(Math.max(deviation, -this.crosstrackFullError), this.crosstrackFullError) * (20 / this.crosstrackFullError));
                        if (Math.abs(deviation) < this.crosstrackFullError) {
                            this.crossTrackError.setAttribute("visibility", "hidden");
                            this.crossTrackErrorBg.setAttribute("visibility", "hidden");
                        }
                        else {
                            this.crossTrackError.setAttribute("visibility", "visible");
                            this.crossTrackErrorBg.setAttribute("visibility", "visible");
                            this.crossTrackError.textContent = "XTK " + fastToFixed(deviation, 2) + "NM";
                            let courseDevRect = this.crossTrackError.getBBox();
                            this.crossTrackErrorBg.setAttribute("width", (courseDevRect.width + 2).toString());
                            this.crossTrackErrorBg.setAttribute("x", (courseDevRect.x - 1).toString());
                        }
                    }
                    else {
                        this.crossTrackGoal = (Math.min(Math.max(deviation, -1), 1) * 20);
                    }
                }
                break;
            case "display_deviation":
                if (newValue == "True") {
                    this.CDI.setAttribute("display", "");
                }
                else {
                    this.CDI.setAttribute("display", "none");
                }
                break;
            case "turn_rate":
                {
                    if (this.turnRateArc) {
                        let value = Math.max(Math.min(parseFloat(newValue), 4), -4);
                        let arcAngle = 6 * value * Math.PI / 180;
                        let arcRadius = 53;
                        let arcWidth = 2;
                        let arrowWidth = 6;
                        let beginPointTopX = 50;
                        let beginPointBotX = 50;
                        let beginPointTopY = 50 - arcRadius - (arcWidth / 2);
                        let beginPointBotY = 50 - arcRadius + (arcWidth / 2);
                        let endPointTopX = 50 + Math.sin(arcAngle) * (arcRadius + arcWidth / 2);
                        let endPointBotX = 50 + Math.sin(arcAngle) * (arcRadius - arcWidth / 2);
                        let endPointTopY = 50 - Math.cos(arcAngle) * (arcRadius + arcWidth / 2);
                        let endPointBotY = 50 - Math.cos(arcAngle) * (arcRadius - arcWidth / 2);
                        let path;
                        if (value == 4 || value == -4) {
                            let endPointArrowTopX = 50 + Math.sin(arcAngle) * (arcRadius + arrowWidth / 2);
                            let endPointArrowBotX = 50 + Math.sin(arcAngle) * (arcRadius - arrowWidth / 2);
                            let endPointArrowTopY = 50 - Math.cos(arcAngle) * (arcRadius + arrowWidth / 2);
                            let endPointArrowBotY = 50 - Math.cos(arcAngle) * (arcRadius - arrowWidth / 2);
                            let endPointArrowEndX = 50 + Math.sin(arcAngle + (value > 0 ? 0.1 : -0.1)) * (arcRadius);
                            let endPointArrowEndY = 50 - Math.cos(arcAngle + (value > 0 ? 0.1 : -0.1)) * (arcRadius);
                            path = "M" + beginPointBotX + " " + beginPointBotY + "A " + (arcRadius - arcWidth / 2) + " " + (arcRadius - arcWidth / 2) + " 0 0 " + (arcAngle > 0 ? "1" : "0") + " " + endPointBotX + " " + endPointBotY;
                            path += "L" + endPointArrowBotX + " " + endPointArrowBotY + " L" + endPointArrowEndX + " " + endPointArrowEndY + " L" + endPointArrowTopX + " " + endPointArrowTopY;
                            path += "L" + endPointTopX + " " + endPointTopY + "A " + (arcRadius + arcWidth / 2) + " " + (arcRadius + arcWidth / 2) + " 0 0 " + (arcAngle > 0 ? "0" : "1") + " " + beginPointTopX + " " + beginPointTopY;
                        }
                        else {
                            path = "M" + beginPointBotX + " " + beginPointBotY + "A " + (arcRadius - arcWidth / 2) + " " + (arcRadius - arcWidth / 2) + " 0 0 " + (arcAngle > 0 ? "1" : "0") + " " + endPointBotX + " " + endPointBotY;
                            path += "L" + endPointTopX + " " + endPointTopY + "A " + (arcRadius + arcWidth / 2) + " " + (arcRadius + arcWidth / 2) + " 0 0 " + (arcAngle > 0 ? "0" : "1") + " " + beginPointTopX + " " + beginPointTopY;
                        }
                        this.turnRateArc.setAttribute("d", path);
                    }
                }
                break;
            case "nav_source":
                if (this.navSource) {
                    this.navSource.textContent = newValue == "FMS" ? this.fmsAlias : newValue;
                    let rect = this.navSource.getBBox();
                    this.navSourceBg.setAttribute("width", (rect.width + 2).toString());
                    this.navSourceBg.setAttribute("x", (rect.x - 1).toString());
                    switch (newValue) {
                        case "FMS":
                            this.sourceIsGps = true;
                            this.beginArrow.setAttribute("fill", "#d12bc7");
                            this.CDI.setAttribute("fill", "#d12bc7");
                            this.endArrow.setAttribute("fill", "#d12bc7");
                            this.beginArrow.setAttribute("fill-opacity", "1");
                            this.CDI.setAttribute("fill-opacity", "1");
                            this.endArrow.setAttribute("fill-opacity", "1");
                            this.beginArrow.setAttribute("stroke", "");
                            this.CDI.setAttribute("stroke", "");
                            this.endArrow.setAttribute("stroke", "");
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
                            this.CDI.setAttribute("fill", "#10c210");
                            this.endArrow.setAttribute("fill", "#10c210");
                            this.beginArrow.setAttribute("fill-opacity", "1");
                            this.CDI.setAttribute("fill-opacity", "1");
                            this.endArrow.setAttribute("fill-opacity", "1");
                            this.beginArrow.setAttribute("stroke", "");
                            this.CDI.setAttribute("stroke", "");
                            this.endArrow.setAttribute("stroke", "");
                            this.navSource.setAttribute("fill", "#10c210");
                            this.flightPhase.setAttribute("visibility", "hidden");
                            this.flightPhaseBg.setAttribute("visibility", "hidden");
                            this.crossTrackError.setAttribute("visibility", "hidden");
                            this.crossTrackErrorBg.setAttribute("visibility", "hidden");
                            this.toIndicator.setAttribute("fill", "#10c210");
                            this.fromIndicator.setAttribute("fill", "#10c210");
                            break;
                        case "VOR2":
                        case "LOC2":
                            this.sourceIsGps = false;
                            this.beginArrow.setAttribute("fill-opacity", "0");
                            this.CDI.setAttribute("fill-opacity", "0");
                            this.endArrow.setAttribute("fill-opacity", "0");
                            this.beginArrow.setAttribute("stroke", "#10c210");
                            this.CDI.setAttribute("stroke", "#10c210");
                            this.endArrow.setAttribute("stroke", "#10c210");
                            this.navSource.setAttribute("fill", "#10c210");
                            this.flightPhase.setAttribute("visibility", "hidden");
                            this.flightPhaseBg.setAttribute("visibility", "hidden");
                            this.crossTrackError.setAttribute("visibility", "hidden");
                            this.crossTrackErrorBg.setAttribute("visibility", "hidden");
                            this.toIndicator.setAttribute("fill", "#10c210");
                            this.fromIndicator.setAttribute("fill", "#10c210");
                            break;
                    }
                }
                break;
            case "flight_phase":
                if (this.flightPhase) {
                    this.flightPhase.textContent = newValue;
                    let flightPhaseRect = this.flightPhase.getBBox();
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
                    }
                    else {
                        this.dme.setAttribute("display", "none");
                    }
                }
                break;
            case "show_bearing1":
                this.isBearing1Displayed = newValue == "true";
                if (this.bearing1) {
                    if (this.isBearing1Displayed || this.isBearing2Displayed) {
                        this.innerCircle.setAttribute("display", "inherit");
                    }
                    else {
                        this.innerCircle.setAttribute("display", "none");
                    }
                    if (this.isBearing1Displayed) {
                        this.bearing1.setAttribute("display", "inherit");
                        this.bearing1FixedGroup.setAttribute("display", "inherit");
                    }
                    else {
                        this.bearing1.setAttribute("display", "none");
                        this.bearing1FixedGroup.setAttribute("display", "none");
                    }
                }
                break;
            case "show_bearing2":
                this.isBearing2Displayed = newValue == "true";
                if (this.bearing2) {
                    if (this.isBearing1Displayed || this.isBearing2Displayed) {
                        this.innerCircle.setAttribute("display", "inherit");
                    }
                    else {
                        this.innerCircle.setAttribute("display", "none");
                    }
                    if (this.isBearing2Displayed) {
                        this.bearing2.setAttribute("display", "inherit");
                        this.bearing2FixedGroup.setAttribute("display", "inherit");
                    }
                    else {
                        this.bearing2.setAttribute("display", "none");
                        this.bearing2FixedGroup.setAttribute("display", "none");
                    }
                }
                break;
            case "bearing1_source":
                if (this.bearing1Source)
                    this.bearing1Source.textContent = newValue;
                break;
            case "bearing1_ident":
                if (this.bearing1Ident)
                    this.bearing1Ident.textContent = newValue;
                break;
            case "bearing1_distance":
                if (this.bearing1Distance)
                    this.bearing1Distance.textContent = (newValue == "" ? "" : fastToFixed(parseFloat(newValue), 1) + " NM");
                break;
            case "bearing1_bearing":
                if (this.bearing1) {
                    if (newValue != "") {
                        this.bearing1.setAttribute("transform", "rotate(" + newValue + ", 50, 50)");
                        this.bearing1.setAttribute("visibility", "visible");
                    }
                    else {
                        this.bearing1.setAttribute("visibility", "hidden");
                    }
                }
                break;
            case "bearing2_source":
                if (this.bearing2Source)
                    this.bearing2Source.textContent = newValue;
                break;
            case "bearing2_ident":
                if (this.bearing2Ident)
                    this.bearing2Ident.textContent = newValue;
                break;
            case "bearing2_distance":
                if (this.bearing2Distance)
                    this.bearing2Distance.textContent = (newValue == "" ? "" : fastToFixed(parseFloat(newValue), 1) + " NM");
                break;
            case "bearing2_bearing":
                if (this.bearing2) {
                    if (newValue != "") {
                        this.bearing2.setAttribute("transform", "rotate(" + newValue + ", 50, 50)");
                        this.bearing2.setAttribute("visibility", "visible");
                    }
                    else {
                        this.bearing2.setAttribute("visibility", "hidden");
                    }
                }
                break;
            case "dme_source":
                if (this.dmeSource)
                    this.dmeSource.textContent = newValue;
                break;
            case "dme_ident":
                if (this.dmeIdent)
                    this.dmeIdent.textContent = newValue;
                break;
            case "dme_distance":
                if (this.dmeDistance)
                    this.dmeDistance.textContent = (newValue == "" ? "" : fastToFixed(parseFloat(newValue), 1) + " NM");
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
                if (this.currentTrackIndicator)
                    this.currentTrackIndicator.setAttribute("transform", "rotate(" + (newValue) + ", 50, 50)");
                break;
            case "displaystyle":
                this.createSVG();
                break;
        }
    }
    getExternalTextZonePath(radius, beginAngle, endAngle, xEnd, reverse = false) {
        let beginX = 50 - (radius * Math.cos(beginAngle));
        let beginY = 50 - (radius * Math.sin(beginAngle));
        let endX = 50 - (radius * Math.cos(endAngle));
        let endY = 50 - (radius * Math.sin(endAngle));
        let path = "M" + beginX + " " + beginY + "L" + xEnd + " " + beginY + "L" + xEnd + " " + endY + "L" + endX + " " + endY;
        path += "A " + radius + " " + radius + " 0 0 " + (reverse ? 0 : 1) + " " + beginX + " " + beginY;
        return path;
    }
    applyHUDStyle(_elem) {
        _elem.setAttribute("fill", "rgb(26,29,33)");
        _elem.setAttribute("fill-opacity", "0.5");
        _elem.setAttribute("stroke", "rgb(255, 255, 255)");
        _elem.setAttribute("stroke-width", "0.75");
        _elem.setAttribute("stroke-opacity", "0.2");
    }
    init() {
    }
    update(_deltaTime) {
        var compass = SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree");
        var roundedCompass = fastToFixed(compass, 3);
        this.setAttribute("rotation", roundedCompass);
        var turnRate = SimVar.GetSimVarValue("TURN INDICATOR RATE", "degree per second");
        var roundedTurnRate = fastToFixed(turnRate, 3);
        this.setAttribute("turn_rate", roundedTurnRate);
        var heading = SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK DIR", "degree");
        var roundedHeading = fastToFixed(heading, 3);
        this.setAttribute("heading_bug_rotation", roundedHeading);
        this.setAttribute("current_track", SimVar.GetSimVarValue("GPS GROUND MAGNETIC TRACK", "degrees"));
        this.logic_cdiSource = SimVar.GetSimVarValue("GPS DRIVES NAV1", "Bool") ? 3 : SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "Number");
        switch (this.logic_cdiSource) {
            case 1:
                this.setAttribute("display_deviation", SimVar.GetSimVarValue("NAV HAS NAV:1", "boolean") != 0 ? "True" : "False");
                if (SimVar.GetSimVarValue("NAV HAS LOCALIZER:1", "Bool")) {
                    this.setAttribute("nav_source", "LOC1");
                    this.setAttribute("course", SimVar.GetSimVarValue("NAV LOCALIZER:1", "degree").toString());
                }
                else {
                    this.setAttribute("nav_source", "VOR1");
                    this.setAttribute("course", SimVar.GetSimVarValue("NAV OBS:1", "degree").toString());
                }
                this.setAttribute("course_deviation", (SimVar.GetSimVarValue("NAV CDI:1", "number") / 127).toString());
                this.setAttribute("to_from", SimVar.GetSimVarValue("NAV TOFROM:1", "Enum").toString());
                break;
            case 2:
                this.setAttribute("display_deviation", SimVar.GetSimVarValue("NAV HAS NAV:2", "boolean") != 0 ? "True" : "False");
                if (SimVar.GetSimVarValue("NAV HAS LOCALIZER:2", "Bool")) {
                    this.setAttribute("nav_source", "LOC2");
                    this.setAttribute("course", SimVar.GetSimVarValue("NAV LOCALIZER:2", "degree").toString());
                }
                else {
                    this.setAttribute("nav_source", "VOR2");
                    this.setAttribute("course", SimVar.GetSimVarValue("NAV OBS:2", "degree").toString());
                }
                this.setAttribute("course_deviation", (SimVar.GetSimVarValue("NAV CDI:2", "number") / 127).toString());
                this.setAttribute("to_from", SimVar.GetSimVarValue("NAV TOFROM:2", "Enum").toString());
                break;
            case 3:
                this.setAttribute("nav_source", "FMS");
                this.setAttribute("display_deviation", SimVar.GetSimVarValue("GPS WP NEXT ID", "string") != "" ? "True" : "False");
                this.setAttribute("course", SimVar.GetSimVarValue("GPS WP DESIRED TRACK", "degree"));
                this.setAttribute("course_deviation", SimVar.GetSimVarValue("GPS WP CROSS TRK", "nautical mile"));
                this.setAttribute("to_from", "1");
                let curPhase = SimVar.GetSimVarValue("L:GPS_Current_Phase", "number");
                switch (curPhase) {
                    case 1:
                        this.setAttribute("flight_phase", "DPRT");
                        this.setAttribute("crosstrack_full_error", "0.3");
                        break;
                    case 2:
                        this.setAttribute("flight_phase", "TERM");
                        this.setAttribute("crosstrack_full_error", "1.0");
                        break;
                    case 4:
                        this.setAttribute("flight_phase", "OCN");
                        this.setAttribute("crosstrack_full_error", "4.0");
                        break;
                    default:
                        this.setAttribute("flight_phase", "ENR");
                        this.setAttribute("crosstrack_full_error", "2.0");
                        break;
                }
                break;
        }
        this.logic_brg1Source = SimVar.GetSimVarValue("L:PFD_BRG1_Source", "Number");
        switch (this.logic_brg1Source) {
            case 1:
                this.setAttribute("bearing1_source", "NAV1");
                if (SimVar.GetSimVarValue("NAV HAS NAV:1", "Bool")) {
                    this.setAttribute("bearing1_ident", SimVar.GetSimVarValue("NAV IDENT:1", "string"));
                    this.setAttribute("bearing1_distance", SimVar.GetSimVarValue("NAV HAS DME:1", "Bool") ? SimVar.GetSimVarValue("NAV DME:1", "nautical miles") : "");
                    this.setAttribute("bearing1_bearing", ((180 + SimVar.GetSimVarValue("NAV RADIAL:1", "degree")) % 360).toString());
                }
                else {
                    this.setAttribute("bearing1_ident", "NO DATA");
                    this.setAttribute("bearing1_distance", "");
                    this.setAttribute("bearing1_bearing", "");
                }
                break;
            case 2:
                this.setAttribute("bearing1_source", "NAV2");
                if (SimVar.GetSimVarValue("NAV HAS NAV:2", "Bool")) {
                    this.setAttribute("bearing1_ident", SimVar.GetSimVarValue("NAV IDENT:2", "string"));
                    this.setAttribute("bearing1_distance", SimVar.GetSimVarValue("NAV HAS DME:2", "Bool") ? SimVar.GetSimVarValue("NAV DME:2", "nautical miles") : "");
                    this.setAttribute("bearing1_bearing", ((180 + SimVar.GetSimVarValue("NAV RADIAL:2", "degree")) % 360).toString());
                }
                else {
                    this.setAttribute("bearing1_ident", "NO DATA");
                    this.setAttribute("bearing1_distance", "");
                    this.setAttribute("bearing1_bearing", "");
                }
                break;
            case 3:
                this.setAttribute("bearing1_source", "GPS");
                this.setAttribute("bearing1_ident", SimVar.GetSimVarValue("GPS WP NEXT ID", "string"));
                this.setAttribute("bearing1_distance", SimVar.GetSimVarValue("GPS WP DISTANCE", "nautical miles"));
                this.setAttribute("bearing1_bearing", SimVar.GetSimVarValue("GPS WP BEARING", "degree"));
                break;
            case 4:
                this.setAttribute("bearing1_source", "ADF");
                this.setAttribute("bearing1_distance", "");
                if (SimVar.GetSimVarValue("ADF SIGNAL:1", "number")) {
                    this.setAttribute("bearing1_ident", fastToFixed(SimVar.GetSimVarValue("ADF ACTIVE FREQUENCY:1", "KHz"), 1));
                    this.setAttribute("bearing1_bearing", ((SimVar.GetSimVarValue("ADF RADIAL:1", "degree") + compass) % 360).toString());
                }
                else {
                    this.setAttribute("bearing1_ident", "NO DATA");
                    this.setAttribute("bearing1_bearing", "");
                }
                break;
        }
        this.logic_brg2Source = SimVar.GetSimVarValue("L:PFD_BRG2_Source", "Number");
        switch (this.logic_brg2Source) {
            case 1:
                this.setAttribute("bearing2_source", "NAV1");
                if (SimVar.GetSimVarValue("NAV HAS NAV:1", "Bool")) {
                    this.setAttribute("bearing2_ident", SimVar.GetSimVarValue("NAV IDENT:1", "string"));
                    this.setAttribute("bearing2_distance", SimVar.GetSimVarValue("NAV HAS DME:1", "Bool") ? SimVar.GetSimVarValue("NAV DME:1", "nautical miles") : "");
                    this.setAttribute("bearing2_bearing", ((180 + SimVar.GetSimVarValue("NAV RADIAL:1", "degree")) % 360).toString());
                }
                else {
                    this.setAttribute("bearing2_ident", "NO DATA");
                    this.setAttribute("bearing2_distance", "");
                    this.setAttribute("bearing2_bearing", "");
                }
                break;
            case 2:
                this.setAttribute("bearing2_source", "NAV2");
                if (SimVar.GetSimVarValue("NAV HAS NAV:2", "Bool")) {
                    this.setAttribute("bearing2_ident", SimVar.GetSimVarValue("NAV IDENT:2", "string"));
                    this.setAttribute("bearing2_distance", SimVar.GetSimVarValue("NAV HAS DME:2", "Bool") ? SimVar.GetSimVarValue("NAV DME:2", "nautical miles") : "");
                    this.setAttribute("bearing2_bearing", ((180 + SimVar.GetSimVarValue("NAV RADIAL:2", "degree")) % 360).toString());
                }
                else {
                    this.setAttribute("bearing2_ident", "NO DATA");
                    this.setAttribute("bearing2_distance", "");
                    this.setAttribute("bearing2_bearing", "");
                }
                break;
            case 3:
                this.setAttribute("bearing2_source", "GPS");
                this.setAttribute("bearing2_ident", SimVar.GetSimVarValue("GPS WP NEXT ID", "string"));
                this.setAttribute("bearing2_distance", SimVar.GetSimVarValue("GPS WP DISTANCE", "nautical miles"));
                this.setAttribute("bearing2_bearing", SimVar.GetSimVarValue("GPS WP BEARING", "degree"));
                break;
            case 4:
                this.setAttribute("bearing2_source", "ADF");
                this.setAttribute("bearing2_distance", "");
                if (SimVar.GetSimVarValue("ADF SIGNAL:1", "number")) {
                    this.setAttribute("bearing2_ident", fastToFixed(SimVar.GetSimVarValue("ADF ACTIVE FREQUENCY:1", "KHz"), 1));
                    this.setAttribute("bearing2_bearing", ((SimVar.GetSimVarValue("ADF RADIAL:1", "degree") + compass) % 360).toString());
                }
                else {
                    this.setAttribute("bearing2_ident", "NO DATA");
                    this.setAttribute("bearing2_bearing", "");
                }
                break;
        }
        this.logic_dmeSource = SimVar.GetSimVarValue("L:Glasscockpit_DmeSource", "Number");
        switch (this.logic_dmeSource) {
            case 0:
                SimVar.SetSimVarValue("L:Glasscockpit_DmeSource", "Number", 1);
            case 1:
                this.setAttribute("dme_source", "NAV1");
                if (SimVar.GetSimVarValue("NAV HAS DME:1", "Bool")) {
                    this.setAttribute("dme_ident", fastToFixed(SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:1", "MHz"), 2));
                    this.setAttribute("dme_distance", SimVar.GetSimVarValue("NAV DME:1", "nautical miles"));
                }
                else {
                    this.setAttribute("dme_ident", "");
                    this.setAttribute("dme_distance", "");
                }
                break;
            case 2:
                this.setAttribute("dme_source", "NAV2");
                if (SimVar.GetSimVarValue("NAV HAS DME:2", "Bool")) {
                    this.setAttribute("dme_ident", fastToFixed(SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:2", "MHz"), 2));
                    this.setAttribute("dme_distance", SimVar.GetSimVarValue("NAV DME:2", "nautical miles"));
                }
                else {
                    this.setAttribute("dme_ident", "");
                    this.setAttribute("dme_distance", "");
                }
                break;
        }
        let diff = this.crossTrackGoal - this.crossTrackCurrent;
        let toAdd = (_deltaTime / 1000) * diff * 7.5;
        if (Math.abs(toAdd) < 0.75) {
            toAdd = toAdd > 0 ? 0.75 : -0.75;
        }
        if (Math.abs(diff) < 0.1 || Math.abs(toAdd) > Math.abs(diff)) {
            this.crossTrackCurrent = this.crossTrackGoal;
        }
        else {
            this.crossTrackCurrent += toAdd;
        }
        Avionics.Utils.diffAndSetAttribute(this.CDI, "transform", "translate(" + this.crossTrackCurrent + " 0)");
    }
    onExit() {
    }
    onEvent(_event) {
        switch (_event) {
            case "CRS_INC":
                if (this.logic_cdiSource == 1) {
                    SimVar.SetSimVarValue("K:VOR1_OBI_INC", "number", 0);
                }
                else if (this.logic_cdiSource == 2) {
                    SimVar.SetSimVarValue("K:VOR2_OBI_INC", "number", 0);
                }
                break;
            case "CRS_DEC":
                if (this.logic_cdiSource == 1) {
                    SimVar.SetSimVarValue("K:VOR1_OBI_DEC", "number", 0);
                }
                else if (this.logic_cdiSource == 2) {
                    SimVar.SetSimVarValue("K:VOR2_OBI_DEC", "number", 0);
                }
                break;
            case "CRS_PUSH":
                if (this.logic_cdiSource == 1) {
                    SimVar.SetSimVarValue("K:VOR1_SET", "number", ((180 + SimVar.GetSimVarValue("NAV RADIAL:1", "degree")) % 360));
                }
                else if (this.logic_cdiSource == 2) {
                    SimVar.SetSimVarValue("K:VOR2_SET", "number", ((180 + SimVar.GetSimVarValue("NAV RADIAL:2", "degree")) % 360));
                }
                break;
            case "SoftKeys_PFD_DME":
                this.logic_dmeDisplayed = !this.logic_dmeDisplayed;
                SimVar.SetSimVarValue("L:PFD_DME_Displayed", "number", this.logic_dmeDisplayed ? 1 : 0);
                if (this.logic_dmeDisplayed) {
                    this.setAttribute("show_dme", "true");
                }
                else {
                    this.setAttribute("show_dme", "false");
                }
                break;
            case "SoftKeys_PFD_BRG1":
            case "BRG1Switch":
                this.logic_brg1Source = (this.logic_brg1Source + 1) % 5;
                SimVar.SetSimVarValue("L:PFD_BRG1_Source", "number", this.logic_brg1Source);
                if (this.logic_brg1Source == 0) {
                    this.setAttribute("show_bearing1", "false");
                }
                else {
                    this.setAttribute("show_bearing1", "true");
                }
                break;
            case "SoftKeys_PFD_BRG2":
            case "BRG2Switch":
                this.logic_brg2Source = (this.logic_brg2Source + 1) % 5;
                SimVar.SetSimVarValue("L:PFD_BRG2_Source", "number", this.logic_brg2Source);
                if (this.logic_brg2Source == 0) {
                    this.setAttribute("show_bearing2", "false");
                }
                else {
                    this.setAttribute("show_bearing2", "true");
                }
                break;
            case "SoftKey_CDI":
            case "NavSourceSwitch":
                this.logic_cdiSource = (this.logic_cdiSource % 3) + 1;
                let isGPSDrived = SimVar.GetSimVarValue("GPS DRIVES NAV1", "Bool");
                if (this.logic_cdiSource == 2 && !SimVar.GetSimVarValue("NAV AVAILABLE:2", "Bool")) {
                    this.logic_cdiSource = 3;
                }
                if (this.logic_cdiSource == 3 != isGPSDrived) {
                    SimVar.SetSimVarValue("K:TOGGLE_GPS_DRIVES_NAV1", "Bool", 0);
                }
                if (this.logic_cdiSource != 3) {
                    SimVar.SetSimVarValue("K:AP_NAV_SELECT_SET", "number", this.logic_cdiSource);
                }
                break;
        }
    }
}
function getSize(_elementPercent, _canvasSize) {
    return _elementPercent * _canvasSize / 100;
}
customElements.define('glasscockpit-hsi', HSIndicator);
//# sourceMappingURL=HSIndicator.js.map