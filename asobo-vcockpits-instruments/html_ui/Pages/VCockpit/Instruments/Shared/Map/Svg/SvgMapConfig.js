class SvgMapConfig {
    constructor() {
        this.waypointLabelFontSize = 10;
        this.waypointLabelFontFamily = "Consolas";
        this.waypointLabelColor = "white";
        this.waypointLabelStrokeColor = "black";
        this.waypointLabelStrokeWidth = 0;
        this.waypointLabelUseBackground = false;
        this.waypointLabelBackgroundColor = "white";
        this.waypointLabelBackgroundStrokeColor = "black";
        this.waypointLabelBackgroundStrokeWidth = 0;
        this.waypointLabelBackgroundPadding = "1 1 1 1";
        this.waypointLabelBackgroundPaddingTop = 1;
        this.waypointLabelBackgroundPaddingRight = 1;
        this.waypointLabelBackgroundPaddingBottom = 1;
        this.waypointLabelBackgroundPaddingLeft = 1;
        this.waypointLabelDistanceX = 0;
        this.waypointLabelDistance = 0;
        this.waypointIconSize = 10;
        this.intersectionLabelColor = "white";
        this.vorLabelColor = "white";
        this.ndbLabelColor = "white";
        this.airportLabelColor = "white";
        this.preventLabelOverlap = true;
        this.cityLabelFontSize = 10;
        this.cityLabelFontFamily = "Consolas";
        this.cityLabelColor = "white";
        this.cityLabelStrokeColor = "black";
        this.cityLabelStrokeWidth = 0;
        this.cityLabelUseBackground = false;
        this.cityLabelBackgroundColor = "white";
        this.cityLabelBackgroundStrokeColor = "black";
        this.cityLabelBackgroundStrokeWidth = 0;
        this.cityLabelBackgroundPadding = "1 1 1 1";
        this.cityLabelBackgroundPaddingTop = 1;
        this.cityLabelBackgroundPaddingRight = 1;
        this.cityLabelBackgroundPaddingBottom = 1;
        this.cityLabelBackgroundPaddingLeft = 1;
        this.cityLabelDistance = 0.25;
        this.cityIconSize = 10;
        this.airplaneIconSize = 32;
        this.airplaneIcon1 = "ICON_MAP_PLANE";
        this.airplaneIcon2 = "ICON_MAP_PLANE";
        this.airplaneIcon3 = "ICON_MAP_PLANE";
        this.imagesDir = "./";
        this.delay = 0;
        this.runwayFillColor = "#ffffff";
        this.runwayStrokeColor = "#ffffff";
        this.runwayStrokeWidth = 0;
        this.runwayCornerRadius = 1;
        this.runwayMinimalWidth = 10;
        this.latLonStrokeColor = "gray";
        this.latLonStrokeWidth = 2;
        this.latLonDashWidth = 10;
        this.latLonLabelFontFamily = "Consolas";
        this.latLonLabelFontSize = 9;
        this.latLonLabelColor = "gray";
        this.latLonLabelStrokeColor = "black";
        this.latLonLabelStrokeWidth = 2;
        this.railwayStrokeColor = "gray";
        this.railwayWidth = 2;
        this.railwayDashLength = 6;
        this.flightPlanActiveLegColor = "MediumOrchid";
        this.flightPlanActiveLegWidth = 3;
        this.flightPlanActiveLegStrokeColor = "black";
        this.flightPlanActiveLegStrokeWidth = 3;
        this.flightPlanNonActiveLegColor = "LightGray";
        this.flightPlanNonActiveLegWidth = 2;
        this.flightPlanNonActiveLegStrokeColor = "black";
        this.flightPlanNonActiveLegStrokeWidth = 2;
        this.flightPlanDirectLegColor = "MediumOrchid";
        this.flightPlanDirectLegWidth = 3;
        this.flightPlanDirectLegStrokeColor = "black";
        this.flightPlanDirectLegStrokeWidth = 3;
        this.roadMotorWayColor = "gray";
        this.roadMotorWayWidth = 6;
        this.roadTrunkColor = "gray";
        this.roadTrunkWidth = 4;
        this.roadPrimaryColor = "gray";
        this.roadPrimaryWidth = 2;
        this.netBingTextureResolution = 1024;
        this.netBingAltitudeColors1 = [
            "26c944",
            "26c944",
            "26c944",
            "26c944",
            "26c944",
            "26c944",
            "26c944",
            "26c944",
            "26c944",
            "26c944",
            "9bc926",
            "9bc926",
            "9bc926",
            "9bc926",
            "9bc926",
            "9bc926",
            "9bc926",
            "9bc926",
            "9bc926",
            "9bc926",
            "c9a026",
            "c9a026",
            "c9a026",
            "c9a026",
            "c9a026",
            "c9a026",
            "c9a026",
            "c9a026",
            "c9a026",
            "c9a026"
        ];
        this.netBingWaterColor1 = "#0000ff";
        this.netBingHeightColor1 = [];
        this.netBingSkyColor1 = "#000000";
        this.netBingAltitudeColors2 = [];
        this.netBingWaterColor2 = "#0000ff";
        this.netBingHeightColor2 = [];
        this.netBingSkyColor2 = "#000000";
        this.netBingAltitudeColors3 = [];
        this.netBingWaterColor3 = "#0000ff";
        this.netBingHeightColor3 = [];
        this.netBingSkyColor3 = "#000000";
    }
    load(path, callback) {
        let request = new XMLHttpRequest();
        request.overrideMimeType("application/json");
        request.onreadystatechange = () => {
            if (request.readyState === 4) {
                if (request.status === 200) {
                    let config = JSON.parse(request.responseText);
                    for (let property in config) {
                        this[property] = config[property];
                    }
                    this.waypointLabelBackgroundPaddingTop = parseFloat(this.waypointLabelBackgroundPadding.split(" ")[0]);
                    this.waypointLabelBackgroundPaddingRight = parseFloat(this.waypointLabelBackgroundPadding.split(" ")[1]);
                    this.waypointLabelBackgroundPaddingBottom = parseFloat(this.waypointLabelBackgroundPadding.split(" ")[2]);
                    this.waypointLabelBackgroundPaddingLeft = parseFloat(this.waypointLabelBackgroundPadding.split(" ")[3]);
                    this.cityLabelBackgroundPaddingTop = parseFloat(this.cityLabelBackgroundPadding.split(" ")[0]);
                    this.cityLabelBackgroundPaddingRight = parseFloat(this.cityLabelBackgroundPadding.split(" ")[1]);
                    this.cityLabelBackgroundPaddingBottom = parseFloat(this.cityLabelBackgroundPadding.split(" ")[2]);
                    this.cityLabelBackgroundPaddingLeft = parseFloat(this.cityLabelBackgroundPadding.split(" ")[3]);
                    if (this.netBingHeightColor1 && this.netBingHeightColor1.length > 0) {
                        this.netBingAltitudeColors1[0] = this.netBingWaterColor1;
                        let curve = new Avionics.Curve();
                        curve.interpolationFunction = Avionics.CurveTool.StringColorRGBInterpolation;
                        for (let i = 0; i < this.netBingHeightColor1.length; i++) {
                            let color = this.netBingHeightColor1[i].color;
                            color = this.convertColor(color);
                            curve.add(this.netBingHeightColor1[i].alt, color);
                        }
                        for (let i = 0; i < 60; i++) {
                            let color = curve.evaluate(i * 30000 / 60);
                            this.netBingAltitudeColors1[i + 1] = color;
                        }
                    }
                    if (this.netBingHeightColor2 && this.netBingHeightColor2.length > 0) {
                        this.netBingAltitudeColors2[0] = this.netBingWaterColor2;
                        let curve = new Avionics.Curve();
                        curve.interpolationFunction = Avionics.CurveTool.StringColorRGBInterpolation;
                        for (let i = 0; i < this.netBingHeightColor2.length; i++) {
                            let color = this.netBingHeightColor2[i].color;
                            color = this.convertColor(color);
                            curve.add(this.netBingHeightColor2[i].alt, color);
                        }
                        for (let i = 0; i < 60; i++) {
                            let color = curve.evaluate(i * 30000 / 60);
                            this.netBingAltitudeColors2[i + 1] = color;
                        }
                    }
                    if (this.netBingHeightColor3 && this.netBingHeightColor3.length > 0) {
                        this.netBingAltitudeColors3[0] = this.netBingWaterColor3;
                        let curve = new Avionics.Curve();
                        curve.interpolationFunction = Avionics.CurveTool.StringColorRGBInterpolation;
                        for (let i = 0; i < this.netBingHeightColor3.length; i++) {
                            let color = this.netBingHeightColor3[i].color;
                            color = this.convertColor(color);
                            curve.add(this.netBingHeightColor3[i].alt, color);
                        }
                        for (let i = 0; i < 60; i++) {
                            let color = curve.evaluate(i * 30000 / 60);
                            this.netBingAltitudeColors3[i + 1] = color;
                        }
                    }
                }
                if (callback) {
                    callback();
                }
            }
        };
        request.open("GET", path + "mapConfig.json");
        request.send();
    }
    convertColor(_color) {
        let r = parseInt(_color.substr(1, 2), 16) / 255;
        let g = parseInt(_color.substr(3, 2), 16) / 255;
        let b = parseInt(_color.substr(5, 2), 16) / 255;
        let max = Math.max(r, g, b);
        let min = Math.min(r, g, b);
        let t = 0;
        if (max !== min) {
            if (max === r) {
                t = 60 * (g - b) / (max - min) + 360;
            }
            else if (max === g) {
                t = 60 * (b - r) / (max - min) + 120;
            }
            else if (max === b) {
                t = 60 * (r - g) / (max - min) + 240;
            }
            while (t < 0) {
                t += 360;
            }
            while (t >= 360) {
                t -= 360;
            }
        }
        let s = 0;
        if (max !== 0) {
            s = 1 - min / max;
        }
        let v = max;
        s = Math.min(1, s * 1.2);
        v = Math.min(1, v * 1.2);
        let ti = Math.floor(t / 60);
        let f = t / 60 - ti;
        let l = v * (1 - s);
        let m = v * (1 - f * s);
        let n = v * (1 - (1 - f) * s);
        let newR = 0;
        let newG = 0;
        let newB = 0;
        if (ti === 0) {
            newR = v;
            newG = n;
            newB = l;
        }
        else if (ti === 1) {
            newR = m;
            newG = v;
            newB = l;
        }
        else if (ti === 2) {
            newR = l;
            newG = v;
            newB = n;
        }
        else if (ti === 3) {
            newR = l;
            newG = m;
            newB = v;
        }
        else if (ti === 4) {
            newR = n;
            newG = l;
            newB = v;
        }
        else if (ti === 5) {
            newR = v;
            newG = l;
            newB = m;
        }
        newR = Math.floor(newR * 255);
        newG = Math.floor(newG * 255);
        newB = Math.floor(newB * 255);
        let color = "#";
        color += newR.toString(16).padStart(2, "0");
        color += newG.toString(16).padStart(2, "0");
        color += newB.toString(16).padStart(2, "0");
        return color;
    }
    static hexaToRGB(_hexa) {
        let hexStringColor = _hexa;
        let offset = 0;
        if (hexStringColor[0] === "#") {
            offset = 1;
        }
        let r = parseInt(hexStringColor.substr(0 + offset, 2), 16);
        let g = parseInt(hexStringColor.substr(2 + offset, 2), 16);
        let b = parseInt(hexStringColor.substr(4 + offset, 2), 16);
        var rgb = 256 * 256 * b + 256 * g + r;
        return rgb;
    }
}
//# sourceMappingURL=SvgMapConfig.js.map