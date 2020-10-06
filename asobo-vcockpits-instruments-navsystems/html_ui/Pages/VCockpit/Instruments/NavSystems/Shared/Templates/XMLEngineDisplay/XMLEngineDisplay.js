class XMLEngineDisplay extends HTMLElement {
    constructor() {
        super(...arguments);
        this.context = new LogicXMLContext();
        this.CAS = null;
    }
    setConfiguration(_gps, _config) {
        this.gps = _gps;
        this.configuration = _config;
        this.gauges = [];
        this.texts = [];
        this.parseElement(this.configuration, this);
    }
    parseElement(_configElement, _element) {
        const gauges = _configElement.children;
        for (let i = 0; i < gauges.length; i++) {
            if (gauges[i].tagName == "Gauge") {
                const typeElem = gauges[i].getElementsByTagName("Type");
                if (typeElem.length > 0) {
                    let gauge;
                    switch (typeElem[0].textContent) {
                        case "Circular":
                            gauge = document.createElement("glasscockpit-xmlcirculargauge");
                            _element.appendChild(gauge);
                            break;
                        case "Horizontal":
                            gauge = document.createElement("glasscockpit-xmlhorizontalgauge");
                            _element.appendChild(gauge);
                            break;
                        case "DoubleHorizontal":
                            gauge = document.createElement("glasscockpit-xmlhorizontaldoublegauge");
                            _element.appendChild(gauge);
                            break;
                        case "Vertical":
                            gauge = document.createElement("glasscockpit-xmlverticalgauge");
                            _element.appendChild(gauge);
                            break;
                        case "DoubleVertical":
                            gauge = document.createElement("glasscockpit-xmlverticaldoublegauge");
                            _element.appendChild(gauge);
                            break;
                        case "Flaps":
                            const flapGauge = document.createElement("glasscockpit-xmlflapsgauge");
                            const toElement = gauges[i].getElementsByTagName("TakeOff");
                            if (toElement.length > 0) {
                                flapGauge.setTakeOffValue(parseFloat(toElement[0].textContent));
                            }
                            _element.appendChild(flapGauge);
                            gauge = flapGauge;
                            break;
                        case "FlapsSpeedbrakes":
                            gauge = document.createElement("glasscockpit-xmlflapsspeedbrakesgauge");
                            _element.appendChild(gauge);
                            break;
                        case "LongitudeFuel":
                            gauge = document.createElement("glasscockpit-xmllongitudefuelgauge");
                            _element.appendChild(gauge);
                            break;
                    }
                    if (gauge) {
                        const styleElem = gauges[i].getElementsByTagName("Style");
                        if (styleElem.length > 0) {
                            const sizePercentElem = styleElem[0].getElementsByTagName("SizePercent");
                            if (sizePercentElem.length > 0) {
                                gauge.sizePercent = parseFloat(sizePercentElem[0].textContent);
                            }
                        }
                        gauge.setStyle(styleElem.length > 0 ? styleElem[0] : null);
                        gauge.drawBase();
                        const minElem = gauges[i].getElementsByTagName("Minimum");
                        const maxElem = gauges[i].getElementsByTagName("Maximum");
                        if (minElem.length > 0 && maxElem.length > 0) {
                            gauge.setLimitCallbacks(new CompositeLogicXMLElement(this.gps, minElem[0]), new CompositeLogicXMLElement(this.gps, maxElem[0]), this.context);
                        }
                        const colorZones = gauges[i].getElementsByTagName("ColorZone");
                        for (let j = 0; j < colorZones.length; j++) {
                            const colorElem = colorZones[j].getElementsByTagName("Color");
                            const beginElem = colorZones[j].getElementsByTagName("Begin");
                            const endElem = colorZones[j].getElementsByTagName("End");
                            const color = colorElem.length > 0 ? colorElem[0].textContent : "white";
                            if (beginElem.length > 0 && endElem.length > 0) {
                                gauge.addColorZone(new CompositeLogicXMLElement(this.gps, beginElem[0]), new CompositeLogicXMLElement(this.gps, endElem[0]), color, this.context);
                            }
                        }
                        const colorLines = gauges[i].getElementsByTagName("ColorLine");
                        for (let j = 0; j < colorLines.length; j++) {
                            const colorElem = colorLines[j].getElementsByTagName("Color");
                            const posElem = colorLines[j].getElementsByTagName("Position");
                            const color = colorElem.length > 0 ? colorElem[0].textContent : "white";
                            if (posElem.length > 0) {
                                gauge.addColorLine(new CompositeLogicXMLElement(this.gps, posElem[0]), color, this.context);
                            }
                        }
                        const valueElem = gauges[i].getElementsByTagName("Value");
                        if (valueElem.length > 0) {
                            gauge.valueCallback = new CompositeLogicXMLElement(this.gps, valueElem[0]);
                        }
                        const value2Elem = gauges[i].getElementsByTagName("Value2");
                        if (value2Elem.length > 0) {
                            gauge.value2Callback = new CompositeLogicXMLElement(this.gps, value2Elem[0]);
                        }
                        let title = "";
                        let unit = "";
                        const titleElem = gauges[i].getElementsByTagName("Title");
                        if (titleElem.length > 0) {
                            title = titleElem[0].textContent;
                        }
                        const unitElem = gauges[i].getElementsByTagName("Unit");
                        if (unitElem.length > 0) {
                            unit = unitElem[0].textContent;
                        }
                        gauge.setTitleAndUnit(title, unit);
                        const graduationElem = gauges[i].getElementsByTagName("GraduationLength");
                        if (graduationElem.length > 0) {
                            gauge.setGraduations(parseFloat(graduationElem[0].textContent), graduationElem[0].getAttribute("text") == "True" ? true : false);
                        }
                        const beginTextElem = gauges[i].getElementsByTagName("BeginText");
                        if (beginTextElem.length > 0) {
                            gauge.forceBeginText(beginTextElem[0].textContent);
                        }
                        const endTextElem = gauges[i].getElementsByTagName("EndText");
                        if (endTextElem.length > 0) {
                            gauge.forceEndText(endTextElem[0].textContent);
                        }
                        const cursorTextElem = gauges[i].getElementsByTagName("CursorText");
                        const cursorText2Elem = gauges[i].getElementsByTagName("CursorText2");
                        if (cursorTextElem.length > 0 || cursorText2Elem.length > 0) {
                            gauge.setCursorLabel(cursorTextElem.length > 0 ? cursorTextElem[0].textContent : "", cursorText2Elem.length > 0 ? cursorText2Elem[0].textContent : "");
                        }
                        const gaugeIdElem = gauges[i].getElementsByTagName("ID");
                        if (gaugeIdElem.length > 0) {
                            gauge.rootSvg.setAttribute("class", gaugeIdElem[0].textContent);
                        }
                        this.gauges.push(gauge);
                        const redBlinkElem = gauges[i].getElementsByTagName("RedBlink");
                        if (redBlinkElem.length > 0) {
                            gauge.redBlinkCallback = new CompositeLogicXMLElement(this.gps, redBlinkElem[0]);
                        }
                    }
                }
            } else if (gauges[i].tagName == "Text") {
                const textZone = document.createElement("glasscockpit-xmltextzone");
                textZone.setAttribute("class", gauges[i].getAttribute("id"));
                _element.appendChild(textZone);
                this.texts.push(textZone);
                const leftText = gauges[i].getElementsByTagName("Left");
                if (leftText.length > 0) {
                    const contentElem = leftText[0].getElementsByTagName("Content");
                    if (contentElem.length > 0) {
                        if (contentElem[0].children.length > 0) {
                            textZone.leftCallback = new CompositeLogicXMLElement(this.gps, contentElem[0]);
                        } else {
                            textZone.setLeftText(contentElem[0].textContent);
                        }
                    } else {
                        if (leftText[0].children.length > 0) {
                            textZone.leftCallback = new CompositeLogicXMLElement(this.gps, leftText[0]);
                        } else {
                            textZone.setLeftText(leftText[0].textContent);
                        }
                    }
                    const colorElem = leftText[0].getElementsByTagName("Color");
                    if (colorElem.length > 0) {
                        textZone.leftColor = new CompositeLogicXMLElement(this.gps, colorElem[0]);
                    }
                    textZone.setLeftClass(leftText[0].getAttribute("id"));
                    const fontSize = leftText[0].getAttribute("fontsize");
                    if (fontSize != null && fontSize != "") {
                        textZone.setLeftFontSize(fontSize);
                    }
                }
                const centerText = gauges[i].getElementsByTagName("Center");
                if (centerText.length > 0) {
                    const contentElem = centerText[0].getElementsByTagName("Content");
                    if (contentElem.length > 0) {
                        if (contentElem[0].children.length > 0) {
                            textZone.centerCallback = new CompositeLogicXMLElement(this.gps, contentElem[0]);
                        } else {
                            textZone.setCenterText(contentElem[0].textContent);
                        }
                    } else {
                        if (centerText[0].children.length > 0) {
                            textZone.centerCallback = new CompositeLogicXMLElement(this.gps, centerText[0]);
                        } else {
                            textZone.setCenterText(centerText[0].textContent);
                        }
                    }
                    const colorElem = centerText[0].getElementsByTagName("Color");
                    if (colorElem.length > 0) {
                        textZone.centerColor = new CompositeLogicXMLElement(this.gps, colorElem[0]);
                    }
                    textZone.setCenterClass(centerText[0].getAttribute("id"));
                    const fontSize = centerText[0].getAttribute("fontsize");
                    if (fontSize != null && fontSize != "") {
                        textZone.setCenterFontSize(fontSize);
                    }
                }
                const rightText = gauges[i].getElementsByTagName("Right");
                if (rightText.length > 0) {
                    const contentElem = rightText[0].getElementsByTagName("Content");
                    if (contentElem.length > 0) {
                        if (contentElem[0].children.length > 0) {
                            textZone.rightCallback = new CompositeLogicXMLElement(this.gps, contentElem[0]);
                        } else {
                            textZone.setRightText(contentElem[0].textContent);
                        }
                    } else {
                        if (rightText[0].children.length > 0) {
                            textZone.rightCallback = new CompositeLogicXMLElement(this.gps, rightText[0]);
                        } else {
                            textZone.setRightText(rightText[0].textContent);
                        }
                    }
                    const colorElem = rightText[0].getElementsByTagName("Color");
                    if (colorElem.length > 0) {
                        textZone.rightColor = new CompositeLogicXMLElement(this.gps, colorElem[0]);
                    }
                    textZone.setRightClass(rightText[0].getAttribute("id"));
                    const fontSize = rightText[0].getAttribute("fontsize");
                    if (fontSize != null && fontSize != "") {
                        textZone.setRightFontSize(fontSize);
                    }
                }
            } else if (gauges[i].tagName == "ColumnsGroup") {
                const columns = gauges[i].children;
                const mainDiv = document.createElement("div");
                mainDiv.style.width = "100%";
                mainDiv.style.display = "flex";
                mainDiv.setAttribute("class", gauges[i].getAttribute("id"));
                _element.appendChild(mainDiv);
                let unset = 0;
                let setSize = 0;
                for (let j = 0; j < columns.length; j++) {
                    const width = columns[j].getAttribute("width");
                    if (width) {
                        setSize += parseFloat(width);
                    } else {
                        unset++;
                    }
                }
                for (let j = 0; j < columns.length; j++) {
                    const colDiv = document.createElement("div");
                    const width = columns[j].getAttribute("width");
                    if (width) {
                        colDiv.style.width = width + "%";
                    } else {
                        colDiv.style.width = ((99 - setSize) / unset) + "%";
                    }
                    const colId = columns[j].getAttribute("id");
                    colDiv.setAttribute("class", "Column" + ((colId && colId != "") ? (" " + colId) : ""));
                    mainDiv.appendChild(colDiv);
                    this.parseElement(columns[j], colDiv);
                }
            } else if (gauges[i].tagName == "CAS") {
                this.CAS = new Cabin_Annunciations();
                this.CAS.setGPS(this.gps);
                const casDiv = document.createElement("div");
                casDiv.setAttribute("id", "Annunciations");
                _element.appendChild(casDiv);
                this.CAS.init(_element);
            } else if (gauges[i].tagName == "Function") {
                const func = new LogicXMLFunction();
                func.name = gauges[i].getAttribute("Name");
                func.callback = new CompositeLogicXMLElement(this.gps, gauges[i]);
                this.context.addFunction(func);
            }
        }
    }
    onSoundEnd(_eventId) {
        if (this.CAS) {
            this.CAS.onSoundEnd(_eventId);
        }
    }
    update(_deltaTime) {
        for (let i = 0; i < this.gauges.length; i++) {
            this.gauges[i].update(this.context);
        }
        for (let i = 0; i < this.texts.length; i++) {
            this.texts[i].update(this.context);
        }
        if (this.CAS) {
            this.CAS.onUpdate(_deltaTime);
        }
        this.context.update();
    }
    onEvent(_event) {
        if (this.CAS) {
            this.CAS.onEvent(_event);
        }
    }
}
customElements.define('glasscockpit-xmlenginedisplay', XMLEngineDisplay);
class XMLTextZone extends HTMLElement {
    constructor() {
        super(...arguments);
        this.height = 15;
    }
    connectedCallback() {
        this.rootSvg = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSvg.setAttribute("width", "100%");
        this.rootSvg.setAttribute("viewBox", "0 0 100 15");
        this.appendChild(this.rootSvg);
        this.leftText = document.createElementNS(Avionics.SVG.NS, "text");
        this.leftText.setAttribute("y", "12.5");
        this.leftText.setAttribute("x", "10");
        this.leftText.setAttribute("fill", "white");
        this.leftText.setAttribute("font-size", "10");
        this.leftText.setAttribute("font-family", "Roboto-Bold");
        this.leftText.setAttribute("text-anchor", "start");
        this.rootSvg.appendChild(this.leftText);
        this.centerText = document.createElementNS(Avionics.SVG.NS, "text");
        this.centerText.setAttribute("y", "12.5");
        this.centerText.setAttribute("x", "50");
        this.centerText.setAttribute("fill", "white");
        this.centerText.setAttribute("font-size", "10");
        this.centerText.setAttribute("font-family", "Roboto-Bold");
        this.centerText.setAttribute("text-anchor", "middle");
        this.rootSvg.appendChild(this.centerText);
        this.rightText = document.createElementNS(Avionics.SVG.NS, "text");
        this.rightText.setAttribute("y", "12.5");
        this.rightText.setAttribute("x", "90");
        this.rightText.setAttribute("fill", "white");
        this.rightText.setAttribute("font-size", "10");
        this.rightText.setAttribute("font-family", "Roboto-Bold");
        this.rightText.setAttribute("text-anchor", "end");
        this.rootSvg.appendChild(this.rightText);
    }
    setLeftText(_value) {
        if (this.leftText.textContent != _value) {
            this.leftText.textContent = _value;
        }
    }
    setCenterText(_value) {
        if (this.centerText.textContent != _value) {
            this.centerText.textContent = _value;
        }
    }
    setRightText(_value) {
        if (this.rightText.textContent != _value) {
            this.rightText.textContent = _value;
        }
    }
    setLeftFontSize(_value) {
        this.leftText.setAttribute("font-size", _value);
        this.height = Math.max(this.height, parseInt(_value) + 5);
        this.rootSvg.setAttribute("viewBox", "0 0 100 " + this.height);
        this.leftText.setAttribute("y", (parseInt(_value) + 2.5).toString());
    }
    setCenterFontSize(_value) {
        this.centerText.setAttribute("font-size", _value);
        this.height = Math.max(this.height, parseInt(_value) + 5);
        this.rootSvg.setAttribute("viewBox", "0 0 100 " + this.height);
        this.centerText.setAttribute("y", (parseInt(_value) + 2.5).toString());
    }
    setRightFontSize(_value) {
        this.rightText.setAttribute("font-size", _value);
        this.height = Math.max(this.height, parseInt(_value) + 5);
        this.rootSvg.setAttribute("viewBox", "0 0 100 " + this.height);
        this.rightText.setAttribute("y", (parseInt(_value) + 2.5).toString());
    }
    setLeftClass(_value) {
        this.leftText.setAttribute("class", _value);
    }
    setCenterClass(_value) {
        this.centerText.setAttribute("class", _value);
    }
    setRightClass(_value) {
        this.rightText.setAttribute("class", _value);
    }
    update(_context) {
        if (this.leftCallback) {
            this.setLeftText(this.leftCallback.getValueAsString(_context));
        }
        if (this.centerCallback) {
            this.setCenterText(this.centerCallback.getValueAsString(_context));
        }
        if (this.rightCallback) {
            this.setRightText(this.rightCallback.getValueAsString(_context));
        }
        if (this.leftColor) {
            Avionics.Utils.diffAndSetAttribute(this.leftText, "fill", this.leftColor.getValueAsString(_context));
        }
        if (this.centerColor) {
            Avionics.Utils.diffAndSetAttribute(this.centerText, "fill", this.centerColor.getValueAsString(_context));
        }
        if (this.rightColor) {
            Avionics.Utils.diffAndSetAttribute(this.rightText, "fill", this.rightColor.getValueAsString(_context));
        }
    }
}
customElements.define('glasscockpit-xmltextzone', XMLTextZone);
class XMLGauge extends HTMLElement {
    constructor() {
        super(...arguments);
        this.forcedBeginText = null;
        this.forcedEndText = null;
        this.isAlerting = false;
        this.sizePercent = 100;
        this.colorZones = [];
        this.colorLines = [];
    }
    setLimitCallbacks(_begin, _end, _context) {
        this.minValueCallback = _begin;
        this.maxValueCallback = _end;
        this.setLimitValues(_begin.getValueAsNumber(_context), _end.getValueAsNumber(_context));
    }
    setLimitValues(_begin, _end) {
        this.minValue = _begin;
        this.maxValue = _end;
        for (let i = 0; i < this.colorZones.length; i++) {
            this.updateColorZone(this.colorZones[i].element, this.colorZones[i].lastBegin, this.colorZones[i].lastEnd);
        }
        for (let i = 0; i < this.colorLines.length; i++) {
            this.updateColorLine(this.colorLines[i].element, this.colorLines[i].lastPos);
        }
    }
    update(_context) {
        const min = this.minValueCallback.getValueAsNumber(_context);
        const max = this.maxValueCallback.getValueAsNumber(_context);
        if (min != this.minValue || max != this.maxValue) {
            this.setLimitValues(min, max);
        }
        this.updateValue(this.valueCallback.getValueAsNumber(_context), this.value2Callback ? this.value2Callback.getValueAsNumber() : null);
        for (let i = 0; i < this.colorZones.length; i++) {
            const begin = this.colorZones[i].beginXmlCallback.getValueAsNumber(_context);
            const end = this.colorZones[i].endXmlCallback.getValueAsNumber(_context);
            if (begin != this.colorZones[i].lastBegin || end != this.colorZones[i].lastEnd) {
                this.updateColorZone(this.colorZones[i].element, begin, end);
                this.colorZones[i].lastBegin = begin;
                this.colorZones[i].lastEnd = end;
            }
        }
        for (let i = 0; i < this.colorLines.length; i++) {
            const pos = this.colorLines[i].posXmlCallback.getValueAsNumber(_context);
            if (pos != this.colorLines[i].lastPos) {
                this.updateColorLine(this.colorLines[i].element, pos);
                this.colorLines[i].lastPos = pos;
            }
        }
        if (this.redBlinkCallback) {
            const newValue = this.redBlinkCallback.getValue(_context);
            if (newValue != 0 && !this.isAlerting) {
                this.isAlerting = true;
                this.computeAlertBackgrounds();
                this.setAttribute("State", "Alert");
            } else if (this.isAlerting && newValue == 0) {
                this.isAlerting = false;
                this.setAttribute("State", "");
            }
        }
    }
}
class XMLGaugeColorZone {
    constructor(_element, _begin, _end) {
        this.lastBegin = 0;
        this.lastEnd = 0;
        this.element = _element;
        this.beginXmlCallback = _begin;
        this.endXmlCallback = _end;
    }
}
class XMLGaugeColorLine {
    constructor(_element, _pos) {
        this.lastPos = NaN;
        this.element = _element;
        this.posXmlCallback = _pos;
    }
}
class XMLCircularGauge extends XMLGauge {
    constructor() {
        super(...arguments);
        this.startAngle = -15;
        this.endAngle = 195;
        this.cursorType = 0;
        this.valuePos = 0;
        this.height = 63;
        this.textIncrement = 1;
        this.forceTextColor = "";
    }
    setStyle(_styleElem) {
        if (_styleElem) {
            const forceTextColorElem = _styleElem.getElementsByTagName("ForceTextColor");
            if (forceTextColorElem.length > 0) {
                this.forceTextColor = forceTextColorElem[0].textContent;
            }
            const textIncrementElem = _styleElem.getElementsByTagName("TextIncrement");
            if (textIncrementElem.length > 0) {
                this.textIncrement = parseInt(textIncrementElem[0].textContent);
            }
            const startElem = _styleElem.getElementsByTagName("BeginAngle");
            if (startElem.length > 0) {
                this.startAngle = parseFloat(startElem[0].textContent);
            }
            const endElem = _styleElem.getElementsByTagName("EndAngle");
            if (startElem.length > 0) {
                this.endAngle = parseFloat(endElem[0].textContent);
            }
            const cursorElem = _styleElem.getElementsByTagName("CursorType");
            if (cursorElem.length > 0) {
                switch (cursorElem[0].textContent) {
                    case "Triangle":
                        this.cursorType = 1;
                        break;
                }
            }
            const valuePosElem = _styleElem.getElementsByTagName("ValuePos");
            if (valuePosElem.length > 0) {
                switch (valuePosElem[0].textContent) {
                    case "End":
                        this.valuePos = 1;
                        break;
                }
            }
            this.height = Math.max(40 - 40 * Math.sin(this.startAngle * Math.PI / 180), 40 - 40 * Math.sin(this.endAngle * Math.PI / 180) + (this.valuePos == 1 ? 20 : 0), (this.valuePos == 1 ? 50 : 60)) + 3;
        }
    }
    drawBase() {
        this.rootSvg = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSvg.setAttribute("width", this.sizePercent + "%");
        this.rootSvg.setAttribute("viewBox", "0 -2 100 " + this.height);
        this.appendChild(this.rootSvg);
        this.decorationGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.rootSvg.appendChild(this.decorationGroup);
        this.graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.rootSvg.appendChild(this.graduationGroup);
        const mainArc = document.createElementNS(Avionics.SVG.NS, "path");
        mainArc.setAttribute("d", "M" + (50 - 40 * Math.cos(this.startAngle * Math.PI / 180)) + " " + (40 - 40 * Math.sin(this.startAngle * Math.PI / 180)) + "A 40 40 0 " + (this.endAngle - this.startAngle > 180 ? "1" : "0") + " 1" + (50 - 40 * Math.cos(this.endAngle * Math.PI / 180)) + " " + (40 - 40 * Math.sin(this.endAngle * Math.PI / 180)));
        mainArc.setAttribute("stroke", "white");
        mainArc.setAttribute("stroke-width", "2");
        mainArc.setAttribute("fill", "none");
        this.rootSvg.appendChild(mainArc);
        const beginLimit = document.createElementNS(Avionics.SVG.NS, "rect");
        beginLimit.setAttribute("x", "10");
        beginLimit.setAttribute("y", "39");
        beginLimit.setAttribute("width", "10");
        beginLimit.setAttribute("height", "2");
        beginLimit.setAttribute("fill", "white");
        beginLimit.setAttribute("transform", "rotate(" + this.startAngle + " 50 40)");
        this.rootSvg.appendChild(beginLimit);
        const endLimit = document.createElementNS(Avionics.SVG.NS, "rect");
        endLimit.setAttribute("x", "10");
        endLimit.setAttribute("y", "39");
        endLimit.setAttribute("width", "10");
        endLimit.setAttribute("height", "2");
        endLimit.setAttribute("fill", "white");
        endLimit.setAttribute("transform", "rotate(" + this.endAngle + " 50 40)");
        this.rootSvg.appendChild(endLimit);
        this.cursor = document.createElementNS(Avionics.SVG.NS, "polygon");
        switch (this.cursorType) {
            case 0:
                this.cursor.setAttribute("points", "15,40, 22,36 24,38.5 40,38.5 40,41.5 24,41.5 22,44");
                this.cursor.setAttribute("stroke", "#1a1d21");
                this.cursor.setAttribute("stroke_width", "0.1");
                break;
            case 1:
                this.cursor.setAttribute("points", "15,40, 25,35 25,45");
                break;
        }
        this.cursor.setAttribute("fill", "white");
        this.rootSvg.appendChild(this.cursor);
        this.beginText = document.createElementNS(Avionics.SVG.NS, "text");
        this.beginText.setAttribute("x", (50 - 40 * Math.cos((this.startAngle - 15) * Math.PI / 180)).toString());
        this.beginText.setAttribute("y", (40 - 40 * Math.sin((this.startAngle - 15) * Math.PI / 180)).toString());
        this.beginText.setAttribute("fill", "white");
        this.beginText.setAttribute("font-size", "8");
        this.beginText.setAttribute("font-family", "Roboto-Bold");
        this.beginText.setAttribute("text-anchor", "middle");
        this.rootSvg.appendChild(this.beginText);
        this.endText = document.createElementNS(Avionics.SVG.NS, "text");
        this.endText.setAttribute("x", (50 - 40 * Math.cos((this.endAngle + 15) * Math.PI / 180)).toString());
        this.endText.setAttribute("y", (40 - 40 * Math.sin((this.endAngle + 15) * Math.PI / 180)).toString());
        this.endText.setAttribute("fill", "white");
        this.endText.setAttribute("font-size", "8");
        this.endText.setAttribute("font-family", "Roboto-Bold");
        this.endText.setAttribute("text-anchor", "middle");
        this.rootSvg.appendChild(this.endText);
        this.titleText_alertbg = document.createElementNS(Avionics.SVG.NS, "rect");
        this.titleText_alertbg.setAttribute("fill-opacity", "0");
        this.titleText_alertbg.setAttribute("AlertBlink", "Background");
        this.rootSvg.appendChild(this.titleText_alertbg);
        this.unitText_alertbg = document.createElementNS(Avionics.SVG.NS, "rect");
        this.unitText_alertbg.setAttribute("fill-opacity", "0");
        this.unitText_alertbg.setAttribute("AlertBlink", "Background");
        this.rootSvg.appendChild(this.unitText_alertbg);
        this.valueText_alertbg = document.createElementNS(Avionics.SVG.NS, "rect");
        this.valueText_alertbg.setAttribute("fill-opacity", "0");
        this.valueText_alertbg.setAttribute("AlertBlink", "Background");
        this.rootSvg.appendChild(this.valueText_alertbg);
        this.titleText = document.createElementNS(Avionics.SVG.NS, "text");
        this.titleText.setAttribute("x", "50");
        this.titleText.setAttribute("y", "30");
        this.titleText.setAttribute("fill", "white");
        this.titleText.setAttribute("font-size", "10");
        this.titleText.setAttribute("font-family", "Roboto-Bold");
        this.titleText.setAttribute("text-anchor", "middle");
        this.titleText.setAttribute("AlertBlink", "Text");
        this.rootSvg.appendChild(this.titleText);
        this.unitText = document.createElementNS(Avionics.SVG.NS, "text");
        this.unitText.setAttribute("x", "50");
        this.unitText.setAttribute("y", "45");
        this.unitText.setAttribute("fill", "white");
        this.unitText.setAttribute("font-size", "10");
        this.unitText.setAttribute("font-family", "Roboto-Bold");
        this.unitText.setAttribute("text-anchor", "middle");
        this.unitText.setAttribute("AlertBlink", "Text");
        this.rootSvg.appendChild(this.unitText);
        this.valueText = document.createElementNS(Avionics.SVG.NS, "text");
        switch (this.valuePos) {
            case 0:
                this.valueText.setAttribute("x", "50");
                this.valueText.setAttribute("y", "60");
                this.valueText.setAttribute("text-anchor", "middle");
                this.valueText.setAttribute("font-size", "15");
                break;
            case 1:
                this.valueText.setAttribute("x", (60 - 40 * Math.cos((this.endAngle + 25) * Math.PI / 180)).toString());
                this.valueText.setAttribute("y", (40 - 40 * Math.sin((this.endAngle + 25) * Math.PI / 180)).toString());
                this.valueText.setAttribute("text-anchor", "end");
                this.valueText.setAttribute("font-size", "13");
                break;
        }
        this.valueText.setAttribute("fill", "white");
        this.valueText.setAttribute("font-family", "Roboto-Bold");
        this.valueText.setAttribute("AlertBlink", "Text");
        this.rootSvg.appendChild(this.valueText);
    }
    addColorZone(_begin, _end, _color, _context) {
        const colorZone = document.createElementNS(Avionics.SVG.NS, "path");
        colorZone.setAttribute("d", "");
        colorZone.setAttribute("fill", _color);
        this.decorationGroup.appendChild(colorZone);
        this.colorZones.push(new XMLGaugeColorZone(colorZone, _begin, _end));
        this.updateColorZone(colorZone, _begin.getValueAsNumber(_context), _end.getValueAsNumber(_context));
    }
    addColorLine(_position, _color, _context) {
        const colorLine = document.createElementNS(Avionics.SVG.NS, "rect");
        colorLine.setAttribute("x", "10");
        colorLine.setAttribute("y", "39");
        colorLine.setAttribute("height", "2");
        colorLine.setAttribute("width", "10");
        colorLine.setAttribute("fill", _color);
        this.decorationGroup.appendChild(colorLine);
        this.colorLines.push(new XMLGaugeColorLine(colorLine, _position));
        this.updateColorLine(colorLine, _position.getValueAsNumber(_context));
    }
    updateColorZone(_element, _begin, _end) {
        const beginAngle = this.valueToAngle(_begin);
        const endAngle = this.valueToAngle(_end);
        const longPath = endAngle - beginAngle > 180;
        let path = "M" + (50 - 38 * Math.cos(beginAngle * Math.PI / 180)) + " " + (40 - 38 * Math.sin(beginAngle * Math.PI / 180)) + "A 38 38 0 " + (longPath ? "1" : "0") + " 1" + (50 - 38 * Math.cos(endAngle * Math.PI / 180)) + " " + (40 - 38 * Math.sin(endAngle * Math.PI / 180));
        path += "L" + (50 - 34 * Math.cos(endAngle * Math.PI / 180)) + " " + (40 - 34 * Math.sin(endAngle * Math.PI / 180)) + "A 34 34 0 " + (longPath ? "1" : "0") + " 0" + (50 - 34 * Math.cos(beginAngle * Math.PI / 180)) + " " + (40 - 34 * Math.sin(beginAngle * Math.PI / 180));
        _element.setAttribute("d", path);
    }
    updateColorLine(_element, _pos) {
        const angle = this.valueToAngle(_pos);
        if (angle >= this.startAngle && angle <= this.endAngle) {
            _element.setAttribute("transform", "rotate(" + angle + " 50 40)");
            _element.setAttribute("display", "");
        } else {
            _element.setAttribute("display", "none");
        }
    }
    updateValue(_value) {
        if (_value != this.lastValue) {
            this.cursor.setAttribute("transform", "rotate(" + this.valueToAngle(Math.max(Math.min(_value, this.maxValue), this.minValue)) + " 50 40)");
            this.valueText.textContent = this.textIncrement != 1 ? fastToFixed(Math.round(_value / this.textIncrement) * this.textIncrement, 0) : fastToFixed(_value, 0);
            this.lastValue = _value;
            if (this.forceTextColor == "") {
                let colorFound = false;
                for (let i = this.colorZones.length - 1; i >= 0; i--) {
                    if (_value >= this.colorZones[i].lastBegin && _value <= this.colorZones[i].lastEnd) {
                        Avionics.Utils.diffAndSetAttribute(this.valueText, "fill", this.colorZones[i].element.getAttribute("fill"));
                        colorFound = true;
                        break;
                    }
                }
                if (!colorFound) {
                    Avionics.Utils.diffAndSetAttribute(this.valueText, "fill", "white");
                }
            } else {
                Avionics.Utils.diffAndSetAttribute(this.valueText, "fill", this.forceTextColor);
            }
            if (this.valueText) {
                const valueBbox = this.valueText.getBBox();
                this.valueText_alertbg.setAttribute("x", (valueBbox.x - 1).toString());
                this.valueText_alertbg.setAttribute("y", (valueBbox.y - 1).toString());
                this.valueText_alertbg.setAttribute("width", (valueBbox.width + 2).toString());
                this.valueText_alertbg.setAttribute("height", (valueBbox.height + 2).toString());
            }
        }
    }
    valueToAngle(_value) {
        return ((_value - this.minValue) / (this.maxValue - this.minValue)) * (this.endAngle - this.startAngle) + this.startAngle;
    }
    setLimitValues(_begin, _end) {
        super.setLimitValues(_begin, _end);
        if (this.forcedBeginText == null) {
            this.beginText.textContent = _begin.toString();
        }
        if (this.forcedEndText == null) {
            this.endText.textContent = _end.toString();
        }
    }
    setTitleAndUnit(_title, _unit) {
        this.titleText.textContent = _title;
        this.unitText.textContent = _unit;
    }
    computeAlertBackgrounds() {
        const titleBbox = this.titleText.getBBox();
        this.titleText_alertbg.setAttribute("x", (titleBbox.x - 1).toString());
        this.titleText_alertbg.setAttribute("y", (titleBbox.y - 1).toString());
        this.titleText_alertbg.setAttribute("width", (titleBbox.width + 2).toString());
        this.titleText_alertbg.setAttribute("height", (titleBbox.height + 2).toString());
        const unitBbox = this.unitText.getBBox();
        this.unitText_alertbg.setAttribute("x", (unitBbox.x - 1).toString());
        this.unitText_alertbg.setAttribute("y", (unitBbox.y - 1).toString());
        this.unitText_alertbg.setAttribute("width", (unitBbox.width + 2).toString());
        this.unitText_alertbg.setAttribute("height", (unitBbox.height + 2).toString());
    }
    setGraduations(_spaceBetween, _withText = false) {
        for (let i = this.minValue + _spaceBetween; i < this.maxValue; i += _spaceBetween) {
            const grad = document.createElementNS(Avionics.SVG.NS, "rect");
            grad.setAttribute("x", "10");
            grad.setAttribute("y", "39");
            grad.setAttribute("width", "6");
            grad.setAttribute("height", "1");
            grad.setAttribute("fill", "white");
            grad.setAttribute("transform", "rotate(" + this.valueToAngle(i) + " 50 40)");
            this.graduationGroup.appendChild(grad);
        }
    }
    forceBeginText(_text) {
        this.beginText.textContent = _text;
        this.forcedBeginText = _text;
    }
    forceEndText(_text) {
        this.endText.textContent = _text;
        this.forcedEndText = _text;
    }
    setCursorLabel(_label1, _label2) {
    }
}
customElements.define('glasscockpit-xmlcirculargauge', XMLCircularGauge);
class XMLHorizontalGauge extends XMLGauge {
    constructor() {
        super(...arguments);
        this.valuePos = 0;
        this.beginX = 10;
        this.endX = 90;
        this.width = 100;
        this.cursorColor = "white";
        this.isReverseY = false;
        this.textIncrement = 1;
        this.textPrecision = 0;
    }
    setStyle(_styleElem) {
        if (_styleElem) {
            const textIncrementElem = _styleElem.getElementsByTagName("TextIncrement");
            if (textIncrementElem.length > 0) {
                this.textIncrement = parseInt(textIncrementElem[0].textContent);
            }
            const valuePosElem = _styleElem.getElementsByTagName("ValuePos");
            if (valuePosElem.length > 0) {
                switch (valuePosElem[0].textContent) {
                    case "End":
                        this.valuePos = 1;
                        break;
                    case "Right":
                        this.valuePos = 2;
                        this.endX = 70;
                }
            }
            const cursorColorElem = _styleElem.getElementsByTagName("CursorColor");
            if (cursorColorElem.length > 0) {
                this.cursorColor = cursorColorElem[0].textContent;
            }
            const widthElem = _styleElem.getElementsByTagName("Width");
            if (widthElem.length > 0) {
                this.width = parseFloat(widthElem[0].textContent);
                this.beginX = this.beginX / (100 / this.width);
                this.endX = this.endX / (100 / this.width);
            }
            const reverseYElem = _styleElem.getElementsByTagName("ReverseY");
            if (reverseYElem.length > 0) {
                this.isReverseY = reverseYElem[0].textContent == "True";
            }
            const precisionElem = _styleElem.getElementsByTagName("ValuePrecision");
            if (precisionElem.length > 0) {
                this.textPrecision = parseInt(precisionElem[0].textContent);
            }
        }
    }
    drawBase() {
        this.rootSvg = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSvg.setAttribute("width", this.sizePercent + "%");
        if (this.valuePos == 2) {
            this.rootSvg.setAttribute("viewBox", "0 10 " + this.width + " 12");
        } else {
            this.rootSvg.setAttribute("viewBox", "0 0 " + this.width + " 30");
        }
        this.appendChild(this.rootSvg);
        this.decorationGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.rootSvg.appendChild(this.decorationGroup);
        this.graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.rootSvg.appendChild(this.graduationGroup);
        const bottomBar = document.createElementNS(Avionics.SVG.NS, "rect");
        bottomBar.setAttribute("x", this.beginX.toString());
        bottomBar.setAttribute("y", this.isReverseY ? "2" : "20");
        bottomBar.setAttribute("height", "2");
        bottomBar.setAttribute("width", (this.endX - this.beginX).toString());
        bottomBar.setAttribute("fill", "white");
        this.rootSvg.appendChild(bottomBar);
        const beginLimit = document.createElementNS(Avionics.SVG.NS, "rect");
        beginLimit.setAttribute("x", (this.beginX - 1).toString());
        beginLimit.setAttribute("y", this.isReverseY ? "2" : "14");
        beginLimit.setAttribute("height", "8");
        beginLimit.setAttribute("width", "2");
        beginLimit.setAttribute("fill", "white");
        this.rootSvg.appendChild(beginLimit);
        const endLimit = document.createElementNS(Avionics.SVG.NS, "rect");
        endLimit.setAttribute("x", (this.endX - 1).toString());
        endLimit.setAttribute("y", this.isReverseY ? "2" : "14");
        endLimit.setAttribute("height", "8");
        endLimit.setAttribute("width", "2");
        endLimit.setAttribute("fill", "white");
        this.rootSvg.appendChild(endLimit);
        this.cursor = document.createElementNS(Avionics.SVG.NS, "polygon");
        if (this.isReverseY) {
            this.cursor.setAttribute("points", this.beginX + ",2 " + (this.beginX - 3) + ",5 " + (this.beginX - 3) + ",10 " + (this.beginX + 3) + ",10 " + (this.beginX + 3) + ",5");
        } else {
            this.cursor.setAttribute("points", this.beginX + ",20 " + (this.beginX - 3) + ",17 " + (this.beginX - 3) + ",12 " + (this.beginX + 3) + ",12 " + (this.beginX + 3) + ",17");
        }
        this.cursor.setAttribute("fill", this.cursorColor);
        this.cursor.setAttribute("AlertBlink", "Red");
        this.rootSvg.appendChild(this.cursor);
        this.beginText = document.createElementNS(Avionics.SVG.NS, "text");
        this.beginText.setAttribute("x", this.beginX.toString());
        this.beginText.setAttribute("y", this.isReverseY ? "20" : "30");
        this.beginText.setAttribute("fill", "white");
        this.beginText.setAttribute("font-size", "8");
        this.beginText.setAttribute("font-family", "Roboto-Bold");
        this.beginText.setAttribute("text-anchor", "middle");
        this.rootSvg.appendChild(this.beginText);
        this.endText = document.createElementNS(Avionics.SVG.NS, "text");
        this.endText.setAttribute("x", this.endX.toString());
        this.endText.setAttribute("y", this.isReverseY ? "20" : "30");
        this.endText.setAttribute("fill", "white");
        this.endText.setAttribute("font-size", "8");
        this.endText.setAttribute("font-family", "Roboto-Bold");
        this.endText.setAttribute("text-anchor", "middle");
        this.rootSvg.appendChild(this.endText);
        this.titleText_alertbg = document.createElementNS(Avionics.SVG.NS, "rect");
        this.titleText_alertbg.setAttribute("fill-opacity", "0");
        this.titleText_alertbg.setAttribute("AlertBlink", "Background");
        this.rootSvg.appendChild(this.titleText_alertbg);
        this.titleText = document.createElementNS(Avionics.SVG.NS, "text");
        if (this.valuePos == 1) {
            this.titleText.setAttribute("x", this.beginX.toString());
            this.titleText.setAttribute("text-anchor", "start");
        } else {
            this.titleText.setAttribute("x", ((this.endX - this.beginX) / 2 + this.beginX).toString());
            this.titleText.setAttribute("text-anchor", "middle");
        }
        this.titleText.setAttribute("y", this.isReverseY ? "30" : "10");
        this.titleText.setAttribute("fill", "white");
        this.titleText.setAttribute("font-size", "10");
        this.titleText.setAttribute("font-family", "Roboto-Bold");
        this.titleText.setAttribute("AlertBlink", "Text");
        this.rootSvg.appendChild(this.titleText);
        this.valueText_alertbg = document.createElementNS(Avionics.SVG.NS, "rect");
        this.valueText_alertbg.setAttribute("fill-opacity", "0");
        this.valueText_alertbg.setAttribute("AlertBlink", "Background");
        this.rootSvg.appendChild(this.valueText_alertbg);
        switch (this.valuePos) {
            case 1:
                this.valueText = document.createElementNS(Avionics.SVG.NS, "text");
                this.valueText.setAttribute("x", (this.endX + 5).toString());
                this.valueText.setAttribute("y", this.isReverseY ? "20" : "10");
                this.valueText.setAttribute("fill", "white");
                this.valueText.setAttribute("font-size", "12");
                this.valueText.setAttribute("font-family", "Roboto-Bold");
                this.valueText.setAttribute("text-anchor", "end");
                this.valueText.setAttribute("AlertBlink", "Text");
                this.rootSvg.appendChild(this.valueText);
                break;
            case 2:
                this.valueText = document.createElementNS(Avionics.SVG.NS, "text");
                this.valueText.setAttribute("x", (this.endX + 5).toString());
                this.valueText.setAttribute("y", this.isReverseY ? "20" : "20");
                this.valueText.setAttribute("fill", "white");
                this.valueText.setAttribute("font-size", "12");
                this.valueText.setAttribute("font-family", "Roboto-Bold");
                this.valueText.setAttribute("text-anchor", "start");
                this.valueText.setAttribute("AlertBlink", "Text");
                this.rootSvg.appendChild(this.valueText);
                break;
        }
    }
    addColorZone(_begin, _end, _color, _context) {
        const colorZone = document.createElementNS(Avionics.SVG.NS, "rect");
        colorZone.setAttribute("height", "4");
        colorZone.setAttribute("y", this.isReverseY ? "4" : "16");
        colorZone.setAttribute("fill", _color);
        this.decorationGroup.appendChild(colorZone);
        this.colorZones.push(new XMLGaugeColorZone(colorZone, _begin, _end));
        this.updateColorZone(colorZone, _begin.getValueAsNumber(_context), _end.getValueAsNumber(_context));
    }
    updateColorZone(_element, _begin, _end) {
        const begin = ((_begin - this.minValue) / (this.maxValue - this.minValue)) * (this.endX - this.beginX) + this.beginX;
        const end = ((_end - this.minValue) / (this.maxValue - this.minValue)) * (this.endX - this.beginX) + this.beginX;
        _element.setAttribute("x", begin.toString());
        _element.setAttribute("width", (end - begin).toString());
    }
    addColorLine(_position, _color, _context) {
        const colorLine = document.createElementNS(Avionics.SVG.NS, "rect");
        colorLine.setAttribute("x", "9");
        colorLine.setAttribute("y", this.isReverseY ? "4" : "10");
        colorLine.setAttribute("height", "10");
        colorLine.setAttribute("width", "2");
        colorLine.setAttribute("fill", _color);
        this.decorationGroup.appendChild(colorLine);
        this.colorLines.push(new XMLGaugeColorLine(colorLine, _position));
        this.updateColorLine(colorLine, _position.getValueAsNumber(_context));
    }
    updateColorLine(_element, _pos) {
        if (_pos >= this.minValue && _pos <= this.maxValue) {
            _element.setAttribute("transform", "translate(" + (((_pos - this.minValue) / (this.maxValue - this.minValue)) * (this.endX - this.beginX)) + " 0)");
            _element.setAttribute("display", "");
        } else {
            _element.setAttribute("display", "none");
        }
    }
    setGraduations(_spaceBetween, _withText = false) {
        for (let i = this.minValue + _spaceBetween; i < this.maxValue; i += _spaceBetween) {
            const grad = document.createElementNS(Avionics.SVG.NS, "rect");
            grad.setAttribute("x", (((i - this.minValue) / (this.maxValue - this.minValue)) * 80 + 9.5).toString());
            grad.setAttribute("y", this.isReverseY ? "4" : "14");
            grad.setAttribute("height", "6");
            grad.setAttribute("width", "1");
            grad.setAttribute("fill", "white");
            this.graduationGroup.appendChild(grad);
        }
    }
    updateValue(_value, _value2) {
        if (_value != this.lastValue) {
            const translate = (((Math.max(Math.min(_value, this.maxValue), this.minValue) - this.minValue) / (this.maxValue - this.minValue)) * (this.endX - this.beginX));
            this.cursor.setAttribute("transform", "translate(" + translate + " 0)");
            if (this.cursorLabel) {
                this.cursorLabel.setAttribute("transform", "translate(" + translate + " 0)");
            }
            this.lastValue = _value;
            if (this.valueText) {
                this.valueText.textContent = this.textIncrement != 1 ? (Math.round(_value / this.textIncrement) * this.textIncrement).toFixed(this.textPrecision) : _value.toFixed(this.textPrecision);
                let colorFound = false;
                for (let i = this.colorZones.length - 1; i >= 0; i--) {
                    if (_value >= this.colorZones[i].lastBegin && _value <= this.colorZones[i].lastEnd) {
                        this.valueText.setAttribute("fill", this.colorZones[i].element.getAttribute("fill"));
                        colorFound = true;
                        break;
                    }
                }
                if (!colorFound) {
                    this.valueText.setAttribute("fill", "white");
                }
            }
            if (this.valueText) {
                const valueBbox = this.valueText.getBBox();
                this.valueText_alertbg.setAttribute("x", (valueBbox.x - 1).toString());
                this.valueText_alertbg.setAttribute("y", (valueBbox.y - 1).toString());
                this.valueText_alertbg.setAttribute("width", (valueBbox.width + 2).toString());
                this.valueText_alertbg.setAttribute("height", (valueBbox.height + 2).toString());
            }
        }
    }
    setTitleAndUnit(_title, _unit) {
        this.titleText.textContent = _title + " " + _unit;
    }
    computeAlertBackgrounds() {
        const titleBbox = this.titleText.getBBox();
        this.titleText_alertbg.setAttribute("x", (titleBbox.x - 1).toString());
        this.titleText_alertbg.setAttribute("y", (titleBbox.y - 1).toString());
        this.titleText_alertbg.setAttribute("width", (titleBbox.width + 2).toString());
        this.titleText_alertbg.setAttribute("height", (titleBbox.height + 2).toString());
    }
    setLimitValues(_begin, _end) {
        super.setLimitValues(_begin, _end);
        if (this.forcedBeginText == null) {
            this.beginText.textContent = _begin.toString();
        }
        if (this.forcedEndText == null) {
            this.endText.textContent = _end.toString();
        }
    }
    forceBeginText(_text) {
        this.beginText.textContent = _text;
        this.forcedBeginText = _text;
    }
    forceEndText(_text) {
        this.endText.textContent = _text;
        this.forcedEndText = _text;
    }
    setCursorLabel(_label1, _label2) {
        if (!this.cursorLabel) {
            this.cursorLabel = document.createElementNS(Avionics.SVG.NS, "text");
            this.cursorLabel.setAttribute("x", "10");
            this.cursorLabel.setAttribute("y", this.isReverseY ? "9" : "19");
            this.cursorLabel.setAttribute("fill", "black");
            this.cursorLabel.setAttribute("font-size", "8");
            this.cursorLabel.setAttribute("font-family", "Roboto-Bold");
            this.cursorLabel.setAttribute("text-anchor", "middle");
            this.rootSvg.appendChild(this.cursorLabel);
        }
        this.cursorLabel.textContent = _label1;
    }
}
customElements.define('glasscockpit-xmlhorizontalgauge', XMLHorizontalGauge);
class XMLHorizontalDoubleGauge extends XMLGauge {
    constructor() {
        super(...arguments);
        this.beginX = 10;
        this.endX = 90;
        this.valuePos = 0;
        this.textIncrement = 1;
    }
    setStyle(_styleElem) {
        if (_styleElem) {
            const textIncrementElem = _styleElem.getElementsByTagName("TextIncrement");
            if (textIncrementElem.length > 0) {
                this.textIncrement = parseInt(textIncrementElem[0].textContent);
            }
            const valuePosElem = _styleElem.getElementsByTagName("ValuePos");
            if (valuePosElem.length > 0) {
                switch (valuePosElem[0].textContent) {
                    case "Right":
                        this.valuePos = 2;
                        this.endX = 70;
                }
            }
        }
    }
    drawBase() {
        this.rootSvg = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSvg.setAttribute("width", this.sizePercent + "%");
        if (this.valuePos == 2) {
            this.rootSvg.setAttribute("viewBox", "0 10 100 24");
        } else {
            this.rootSvg.setAttribute("viewBox", "0 0 100 40");
        }
        this.appendChild(this.rootSvg);
        const bottomBar = document.createElementNS(Avionics.SVG.NS, "rect");
        bottomBar.setAttribute("x", this.beginX.toString());
        bottomBar.setAttribute("y", "21");
        bottomBar.setAttribute("height", "2");
        bottomBar.setAttribute("width", (this.endX - this.beginX).toString());
        bottomBar.setAttribute("fill", "white");
        this.rootSvg.appendChild(bottomBar);
        this.decorationGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.rootSvg.appendChild(this.decorationGroup);
        this.graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.rootSvg.appendChild(this.graduationGroup);
        const beginLimit = document.createElementNS(Avionics.SVG.NS, "rect");
        beginLimit.setAttribute("x", (this.beginX - 1).toString());
        beginLimit.setAttribute("y", "17");
        beginLimit.setAttribute("height", "10");
        beginLimit.setAttribute("width", "2");
        beginLimit.setAttribute("fill", "white");
        this.rootSvg.appendChild(beginLimit);
        const endLimit = document.createElementNS(Avionics.SVG.NS, "rect");
        endLimit.setAttribute("x", (this.endX - 1).toString());
        endLimit.setAttribute("y", "17");
        endLimit.setAttribute("height", "10");
        endLimit.setAttribute("width", "2");
        endLimit.setAttribute("fill", "white");
        this.rootSvg.appendChild(endLimit);
        this.cursor = document.createElementNS(Avionics.SVG.NS, "polygon");
        this.cursor.setAttribute("points", this.beginX + ",22 " + (this.beginX - 4) + ",12 " + (this.beginX + 4) + ",12");
        this.cursor.setAttribute("fill", "white");
        this.rootSvg.appendChild(this.cursor);
        this.cursor2 = document.createElementNS(Avionics.SVG.NS, "polygon");
        this.cursor2.setAttribute("points", this.beginX + ",22 " + (this.beginX - 4) + ",32 " + (this.beginX + 4) + ",32");
        this.cursor2.setAttribute("fill", "white");
        this.rootSvg.appendChild(this.cursor2);
        this.beginText = document.createElementNS(Avionics.SVG.NS, "text");
        this.beginText.setAttribute("x", this.beginX.toString());
        this.beginText.setAttribute("y", "40");
        this.beginText.setAttribute("fill", "white");
        this.beginText.setAttribute("font-size", "8");
        this.beginText.setAttribute("font-family", "Roboto-Bold");
        this.beginText.setAttribute("text-anchor", "middle");
        this.rootSvg.appendChild(this.beginText);
        this.endText = document.createElementNS(Avionics.SVG.NS, "text");
        this.endText.setAttribute("x", this.endX.toString());
        this.endText.setAttribute("y", "40");
        this.endText.setAttribute("fill", "white");
        this.endText.setAttribute("font-size", "8");
        this.endText.setAttribute("font-family", "Roboto-Bold");
        this.endText.setAttribute("text-anchor", "middle");
        this.rootSvg.appendChild(this.endText);
        this.titleText = document.createElementNS(Avionics.SVG.NS, "text");
        this.titleText.setAttribute("x", ((this.endX - this.beginX) / 2 + this.beginX).toString());
        this.titleText.setAttribute("y", "10");
        this.titleText.setAttribute("fill", "white");
        this.titleText.setAttribute("font-size", "10");
        this.titleText.setAttribute("font-family", "Roboto-Bold");
        this.titleText.setAttribute("text-anchor", "middle");
        this.rootSvg.appendChild(this.titleText);
        this.valueText_alertbg = document.createElementNS(Avionics.SVG.NS, "rect");
        this.valueText_alertbg.setAttribute("fill-opacity", "0");
        this.valueText_alertbg.setAttribute("AlertBlink", "Background");
        this.rootSvg.appendChild(this.valueText_alertbg);
        this.valueText2_alertbg = document.createElementNS(Avionics.SVG.NS, "rect");
        this.valueText2_alertbg.setAttribute("fill-opacity", "0");
        this.valueText2_alertbg.setAttribute("AlertBlink", "Background");
        this.rootSvg.appendChild(this.valueText2_alertbg);
        switch (this.valuePos) {
            case 2:
                this.valueText = document.createElementNS(Avionics.SVG.NS, "text");
                this.valueText.setAttribute("x", (this.endX + 5).toString());
                this.valueText.setAttribute("y", "20");
                this.valueText.setAttribute("fill", "white");
                this.valueText.setAttribute("font-size", "12");
                this.valueText.setAttribute("font-family", "Roboto-Bold");
                this.valueText.setAttribute("text-anchor", "start");
                this.valueText.setAttribute("AlertBlink", "Text");
                this.rootSvg.appendChild(this.valueText);
                this.valueText2 = document.createElementNS(Avionics.SVG.NS, "text");
                this.valueText2.setAttribute("x", (this.endX + 5).toString());
                this.valueText2.setAttribute("y", "32");
                this.valueText2.setAttribute("fill", "white");
                this.valueText2.setAttribute("font-size", "12");
                this.valueText2.setAttribute("font-family", "Roboto-Bold");
                this.valueText2.setAttribute("text-anchor", "start");
                this.valueText2.setAttribute("AlertBlink", "Text");
                this.rootSvg.appendChild(this.valueText2);
        }
    }
    addColorZone(_begin, _end, _color, _context) {
        const colorZone = document.createElementNS(Avionics.SVG.NS, "rect");
        colorZone.setAttribute("height", "4");
        colorZone.setAttribute("y", "20");
        colorZone.setAttribute("fill", _color);
        this.decorationGroup.appendChild(colorZone);
        this.colorZones.push(new XMLGaugeColorZone(colorZone, _begin, _end));
        this.updateColorZone(colorZone, _begin.getValueAsNumber(_context), _end.getValueAsNumber(_context));
    }
    updateColorZone(_element, _begin, _end) {
        const begin = ((_begin - this.minValue) / (this.maxValue - this.minValue)) * (this.endX - this.beginX) + this.beginX;
        const end = ((_end - this.minValue) / (this.maxValue - this.minValue)) * (this.endX - this.beginX) + this.beginX;
        _element.setAttribute("x", begin.toString());
        _element.setAttribute("width", (end - begin).toString());
    }
    addColorLine(_position, _color, _context) {
        const colorLine = document.createElementNS(Avionics.SVG.NS, "rect");
        colorLine.setAttribute("height", "12");
        colorLine.setAttribute("width", "2");
        colorLine.setAttribute("x", (this.beginX - 1).toString());
        colorLine.setAttribute("y", "16");
        colorLine.setAttribute("fill", _color);
        this.decorationGroup.appendChild(colorLine);
        this.colorLines.push(new XMLGaugeColorLine(colorLine, _position));
        this.updateColorLine(colorLine, _position.getValueAsNumber(_context));
    }
    updateColorLine(_element, _pos) {
        if (_pos >= this.minValue && _pos <= this.maxValue) {
            _element.setAttribute("transform", "translate(" + (((_pos - this.minValue) / (this.maxValue - this.minValue)) * (this.endX - this.beginX)) + " 0)");
            _element.setAttribute("display", "");
        } else {
            _element.setAttribute("display", "none");
        }
    }
    setGraduations(_spaceBetween, _withText = false) {
        for (let i = this.minValue + _spaceBetween; i < this.maxValue; i += _spaceBetween) {
            const grad = document.createElementNS(Avionics.SVG.NS, "rect");
            grad.setAttribute("x", (((i - this.minValue) / (this.maxValue - this.minValue)) * (this.endX - this.beginX) + this.beginX - 0.5).toString());
            grad.setAttribute("y", "17");
            grad.setAttribute("height", "10");
            grad.setAttribute("width", "1");
            grad.setAttribute("fill", "white");
            this.graduationGroup.appendChild(grad);
            if (_withText) {
                const gradText = document.createElementNS(Avionics.SVG.NS, "text");
                gradText.setAttribute("x", (((i - this.minValue) / (this.maxValue - this.minValue)) * (this.endX - this.beginX) + this.beginX - 0.5).toString());
                gradText.setAttribute("y", "40");
                gradText.setAttribute("fill", "white");
                gradText.setAttribute("font-size", "8");
                gradText.setAttribute("font-family", "Roboto-Bold");
                gradText.setAttribute("text-anchor", "middle");
                gradText.textContent = i.toString();
                this.graduationGroup.appendChild(gradText);
            }
        }
    }
    updateValue(_value, _value2) {
        if (_value != this.lastValue || _value2 != this.lastValue2) {
            const transform1 = "translate(" + (((Math.max(Math.min(_value, this.maxValue), this.minValue) - this.minValue) / (this.maxValue - this.minValue)) * (this.endX - this.beginX)) + " 0)";
            this.cursor.setAttribute("transform", transform1);
            if (this.cursorLabel) {
                this.cursorLabel.setAttribute("transform", transform1);
            }
            this.lastValue = _value;
            const transform2 = "translate(" + (((Math.max(Math.min(_value2, this.maxValue), this.minValue) - this.minValue) / (this.maxValue - this.minValue)) * (this.endX - this.beginX)) + " 0)";
            this.cursor2.setAttribute("transform", transform2);
            if (this.cursor2Label) {
                this.cursor2Label.setAttribute("transform", transform2);
            }
            this.lastValue2 = _value2;
            if (this.valueText && this.valueText2) {
                this.valueText.textContent = this.textIncrement != 1 ? fastToFixed(Math.round(_value / this.textIncrement) * this.textIncrement, 0) : fastToFixed(_value, 0);
                this.valueText2.textContent = this.textIncrement != 1 ? fastToFixed(Math.round(_value2 / this.textIncrement) * this.textIncrement, 0) : fastToFixed(_value2, 0);
                let val1Set = false;
                let val2Set = false;
                for (let i = this.colorZones.length - 1; i >= 0; i--) {
                    if (_value >= this.colorZones[i].lastBegin && _value <= this.colorZones[i].lastEnd) {
                        this.valueText.setAttribute("fill", this.colorZones[i].element.getAttribute("fill"));
                        val1Set = true;
                    }
                    if (_value2 >= this.colorZones[i].lastBegin && _value2 <= this.colorZones[i].lastEnd) {
                        this.valueText2.setAttribute("fill", this.colorZones[i].element.getAttribute("fill"));
                        val2Set = true;
                    }
                }
                if (!val1Set) {
                    this.valueText.setAttribute("fill", "white");
                }
                if (!val2Set) {
                    this.valueText2.setAttribute("fill", "white");
                }
                const valueBbox = this.valueText.getBBox();
                this.valueText_alertbg.setAttribute("x", (valueBbox.x - 1).toString());
                this.valueText_alertbg.setAttribute("y", (valueBbox.y - 1).toString());
                this.valueText_alertbg.setAttribute("width", (valueBbox.width + 2).toString());
                this.valueText_alertbg.setAttribute("height", (valueBbox.height + 2).toString());
                const value2Bbox = this.valueText2.getBBox();
                this.valueText2_alertbg.setAttribute("x", (value2Bbox.x - 1).toString());
                this.valueText2_alertbg.setAttribute("y", (value2Bbox.y - 1).toString());
                this.valueText2_alertbg.setAttribute("width", (value2Bbox.width + 2).toString());
                this.valueText2_alertbg.setAttribute("height", (value2Bbox.height + 2).toString());
            }
        }
    }
    setTitleAndUnit(_title, _unit) {
        this.titleText.textContent = _title + " " + _unit;
    }
    computeAlertBackgrounds() {
    }
    setLimitValues(_begin, _end) {
        super.setLimitValues(_begin, _end);
        if (this.forcedBeginText == null) {
            this.beginText.textContent = _begin.toString();
        }
        if (this.forcedEndText == null) {
            this.endText.textContent = _end.toString();
        }
    }
    forceBeginText(_text) {
        this.beginText.textContent = _text;
        this.forcedBeginText = _text;
    }
    forceEndText(_text) {
        this.endText.textContent = _text;
        this.forcedEndText = _text;
    }
    setCursorLabel(_label1, _label2) {
        if (!this.cursorLabel) {
            this.cursorLabel = document.createElementNS(Avionics.SVG.NS, "text");
            this.cursorLabel.setAttribute("x", this.beginX.toString());
            this.cursorLabel.setAttribute("y", "18");
            this.cursorLabel.setAttribute("fill", "black");
            this.cursorLabel.setAttribute("font-size", "7");
            this.cursorLabel.setAttribute("font-family", "Roboto-Bold");
            this.cursorLabel.setAttribute("text-anchor", "middle");
            this.rootSvg.appendChild(this.cursorLabel);
        }
        this.cursorLabel.textContent = _label1;
        if (_label2) {
            if (!this.cursor2Label) {
                this.cursor2Label = document.createElementNS(Avionics.SVG.NS, "text");
                this.cursor2Label.setAttribute("x", this.beginX.toString());
                this.cursor2Label.setAttribute("y", "31");
                this.cursor2Label.setAttribute("fill", "black");
                this.cursor2Label.setAttribute("font-size", "7");
                this.cursor2Label.setAttribute("font-family", "Roboto-Bold");
                this.cursor2Label.setAttribute("text-anchor", "middle");
                this.rootSvg.appendChild(this.cursor2Label);
            }
            this.cursor2Label.textContent = _label2;
        }
    }
}
customElements.define('glasscockpit-xmlhorizontaldoublegauge', XMLHorizontalDoubleGauge);
class XMLVerticalGauge extends XMLGauge {
    constructor() {
        super(...arguments);
        this.endY = 15;
        this.beginY = 70;
        this.cursorColor = "white";
        this.number = 0;
        this.textIncrement = 1;
    }
    setStyle(_styleElem) {
        if (_styleElem) {
            const textIncrementElem = _styleElem.getElementsByTagName("TextIncrement");
            if (textIncrementElem.length > 0) {
                this.textIncrement = parseInt(textIncrementElem[0].textContent);
            }
            const cursorColorElem = _styleElem.getElementsByTagName("CursorColor");
            if (cursorColorElem.length > 0) {
                this.cursorColor = cursorColorElem[0].textContent;
            }
            const valuePosElem = _styleElem.getElementsByTagName("ValuePos");
            if (valuePosElem.length > 0) {
                switch (valuePosElem[0].textContent) {
                    case "None":
                        this.valuePos = 1;
                        break;
                }
            }
        }
    }
    drawBase() {
        this.rootSvg = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSvg.setAttribute("width", this.sizePercent + "%");
        if (this.valuePos == 1) {
            this.rootSvg.setAttribute("viewBox", "0 0 50 75");
        } else {
            this.rootSvg.setAttribute("viewBox", "0 0 50 85");
        }
        this.appendChild(this.rootSvg);
        this.decorationGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.rootSvg.appendChild(this.decorationGroup);
        this.graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.rootSvg.appendChild(this.graduationGroup);
        const rightBar = document.createElementNS(Avionics.SVG.NS, "rect");
        rightBar.setAttribute("x", "35");
        rightBar.setAttribute("y", this.endY.toString());
        rightBar.setAttribute("height", (this.beginY - this.endY).toString());
        rightBar.setAttribute("width", "2");
        rightBar.setAttribute("fill", "white");
        this.rootSvg.appendChild(rightBar);
        const beginBar = document.createElementNS(Avionics.SVG.NS, "rect");
        beginBar.setAttribute("x", "25");
        beginBar.setAttribute("y", (this.beginY).toString());
        beginBar.setAttribute("height", "2");
        beginBar.setAttribute("width", "12");
        beginBar.setAttribute("fill", "white");
        this.rootSvg.appendChild(beginBar);
        const endBar = document.createElementNS(Avionics.SVG.NS, "rect");
        endBar.setAttribute("x", "25");
        endBar.setAttribute("y", (this.endY).toString());
        endBar.setAttribute("height", "2");
        endBar.setAttribute("width", "12");
        endBar.setAttribute("fill", "white");
        this.rootSvg.appendChild(endBar);
        this.cursor = document.createElementNS(Avionics.SVG.NS, "polygon");
        this.cursor.setAttribute("points", "35," + this.beginY + " 32," + (this.beginY - 3) + " 27," + (this.beginY - 3) + " 27," + (this.beginY + 3) + " 32," + (this.beginY + 3));
        this.cursor.setAttribute("fill", this.cursorColor);
        this.rootSvg.appendChild(this.cursor);
        this.titleText_alertbg = document.createElementNS(Avionics.SVG.NS, "rect");
        this.titleText_alertbg.setAttribute("fill-opacity", "0");
        this.titleText_alertbg.setAttribute("AlertBlink", "Background");
        this.rootSvg.appendChild(this.titleText_alertbg);
        this.titleText = document.createElementNS(Avionics.SVG.NS, "text");
        this.titleText.setAttribute("x", "25");
        this.titleText.setAttribute("y", (this.endY - 5).toString());
        this.titleText.setAttribute("fill", "white");
        this.titleText.setAttribute("font-size", "9");
        this.titleText.setAttribute("font-family", "Roboto-Bold");
        this.titleText.setAttribute("text-anchor", "middle");
        this.titleText.setAttribute("AlertBlink", "Text");
        this.rootSvg.appendChild(this.titleText);
        this.valueText_alertbg = document.createElementNS(Avionics.SVG.NS, "rect");
        this.valueText_alertbg.setAttribute("fill-opacity", "0");
        this.valueText_alertbg.setAttribute("AlertBlink", "Background");
        this.rootSvg.appendChild(this.valueText_alertbg);
        if (this.valuePos != 1) {
            this.valueText = document.createElementNS(Avionics.SVG.NS, "text");
            this.valueText.setAttribute("x", "25");
            this.valueText.setAttribute("y", (this.beginY + 15).toString());
            this.valueText.setAttribute("fill", "white");
            this.valueText.setAttribute("font-size", "12");
            this.valueText.setAttribute("font-family", "Roboto-Bold");
            this.valueText.setAttribute("text-anchor", "middle");
            this.valueText.setAttribute("AlertBlink", "Text");
            this.rootSvg.appendChild(this.valueText);
        }
        this.beginText = document.createElementNS(Avionics.SVG.NS, "text");
        this.beginText.setAttribute("x", "24");
        this.beginText.setAttribute("y", (this.beginY + 4).toString());
        this.beginText.setAttribute("fill", "white");
        this.beginText.setAttribute("font-size", "8");
        this.beginText.setAttribute("font-family", "Roboto-Bold");
        this.beginText.setAttribute("text-anchor", "end");
        this.rootSvg.appendChild(this.beginText);
        this.endText = document.createElementNS(Avionics.SVG.NS, "text");
        this.endText.setAttribute("x", "24");
        this.endText.setAttribute("y", (this.endY + 4).toString());
        this.endText.setAttribute("fill", "white");
        this.endText.setAttribute("font-size", "8");
        this.endText.setAttribute("font-family", "Roboto-Bold");
        this.endText.setAttribute("text-anchor", "end");
        this.rootSvg.appendChild(this.endText);
    }
    addColorZone(_begin, _end, _color, _context) {
        const colorZone = document.createElementNS(Avionics.SVG.NS, "rect");
        colorZone.setAttribute("width", "4");
        colorZone.setAttribute("x", "31");
        colorZone.setAttribute("fill", _color);
        this.decorationGroup.appendChild(colorZone);
        this.colorZones.push(new XMLGaugeColorZone(colorZone, _begin, _end));
        this.updateColorZone(colorZone, _begin.getValueAsNumber(_context), _end.getValueAsNumber(_context));
    }
    addColorLine(_position, _color, _context) {
        const colorLine = document.createElementNS(Avionics.SVG.NS, "rect");
        colorLine.setAttribute("height", "2");
        colorLine.setAttribute("width", "8");
        colorLine.setAttribute("x", "27");
        colorLine.setAttribute("y", this.beginY.toString());
        colorLine.setAttribute("fill", _color);
        this.decorationGroup.appendChild(colorLine);
        this.colorLines.push(new XMLGaugeColorLine(colorLine, _position));
        this.updateColorLine(colorLine, _position.getValueAsNumber(_context));
    }
    updateColorZone(_element, _begin, _end) {
        const begin = ((_begin - this.minValue) / (this.maxValue - this.minValue)) * (this.endY - this.beginY) + this.beginY;
        const end = ((_end - this.minValue) / (this.maxValue - this.minValue)) * (this.endY - this.beginY) + this.beginY;
        _element.setAttribute("y", end.toString());
        _element.setAttribute("height", (begin - end).toString());
    }
    updateColorLine(_element, _pos) {
        if (_pos > this.minValue && _pos < this.maxValue) {
            _element.setAttribute("transform", "translate(0," + (((_pos - this.minValue) / (this.maxValue - this.minValue)) * (this.endY - this.beginY)) + ")");
            _element.setAttribute("display", "");
        } else {
            _element.setAttribute("display", "none");
        }
    }
    updateValue(_value, _value2) {
        this.cursor.setAttribute("transform", "translate(0," + (((Math.max(Math.min(_value, this.maxValue), this.minValue) - this.minValue) / (this.maxValue - this.minValue)) * (this.endY - this.beginY)) + ")");
        if (this.valueText) {
            this.valueText.textContent = this.textIncrement != 1 ? fastToFixed(Math.round(_value / this.textIncrement) * this.textIncrement, 0) : fastToFixed(_value, 0);
            let colorFound = false;
            for (let i = this.colorZones.length - 1; i >= 0; i--) {
                if (_value >= this.colorZones[i].lastBegin && _value <= this.colorZones[i].lastEnd) {
                    this.valueText.setAttribute("fill", this.colorZones[i].element.getAttribute("fill"));
                    colorFound = true;
                    break;
                }
            }
            if (!colorFound) {
                this.valueText.setAttribute("fill", "white");
            }
            if (this.valueText) {
                const valueBbox = this.valueText.getBBox();
                this.valueText_alertbg.setAttribute("x", (valueBbox.x - 1).toString());
                this.valueText_alertbg.setAttribute("y", (valueBbox.y + 1).toString());
                this.valueText_alertbg.setAttribute("width", (valueBbox.width + 2).toString());
                this.valueText_alertbg.setAttribute("height", (valueBbox.height).toString());
            }
        }
    }
    setTitleAndUnit(_title, _unit) {
        this.titleText.textContent = _title + " " + _unit;
    }
    computeAlertBackgrounds() {
        const titleBbox = this.titleText.getBBox();
        this.titleText_alertbg.setAttribute("x", (titleBbox.x - 1).toString());
        this.titleText_alertbg.setAttribute("y", (titleBbox.y + 1).toString());
        this.titleText_alertbg.setAttribute("width", (titleBbox.width + 2).toString());
        this.titleText_alertbg.setAttribute("height", (titleBbox.height - 0.5).toString());
    }
    setGraduations(_spaceBetween, _withText) {
        for (let i = this.minValue + _spaceBetween; i < this.maxValue; i += _spaceBetween) {
            const grad = document.createElementNS(Avionics.SVG.NS, "rect");
            grad.setAttribute("x", "25");
            grad.setAttribute("y", (((i - this.minValue) / (this.maxValue - this.minValue)) * (this.endY - this.beginY) + this.beginY - 0.5).toString());
            grad.setAttribute("height", "1");
            grad.setAttribute("width", "10");
            grad.setAttribute("fill", "white");
            this.graduationGroup.appendChild(grad);
            if (_withText) {
                const gradText = document.createElementNS(Avionics.SVG.NS, "text");
                gradText.setAttribute("x", "23");
                gradText.setAttribute("y", (((i - this.minValue) / (this.maxValue - this.minValue)) * (this.endY - this.beginY) + this.beginY + 4).toString());
                gradText.setAttribute("fill", "white");
                gradText.setAttribute("font-size", "8");
                gradText.setAttribute("font-family", "Roboto-Bold");
                gradText.setAttribute("text-anchor", "end");
                gradText.textContent = i.toString();
                this.graduationGroup.appendChild(gradText);
            }
        }
    }
    setLimitValues(_begin, _end) {
        super.setLimitValues(_begin, _end);
        if (this.forcedBeginText == null) {
            this.beginText.textContent = _begin.toString();
        }
        if (this.forcedEndText == null) {
            this.endText.textContent = _end.toString();
        }
    }
    forceBeginText(_text) {
        this.beginText.textContent = _text;
        this.forcedBeginText = _text;
    }
    forceEndText(_text) {
        this.endText.textContent = _text;
        this.forcedEndText = _text;
    }
    setCursorLabel(_label1, _label2) {
    }
}
customElements.define('glasscockpit-xmlverticalgauge', XMLVerticalGauge);
class XMLVerticalDoubleGauge extends XMLGauge {
    constructor() {
        super(...arguments);
        this.endY = 15;
        this.beginY = 95;
        this.height = 100;
        this.textIncrement = 1;
    }
    setStyle(_styleElem) {
        if (_styleElem) {
            const textIncrementElem = _styleElem.getElementsByTagName("TextIncrement");
            if (textIncrementElem.length > 0) {
                this.textIncrement = parseInt(textIncrementElem[0].textContent);
            }
            const heightElem = _styleElem.getElementsByTagName("Height");
            if (heightElem.length > 0) {
                this.height = parseFloat(heightElem[0].textContent);
                this.beginY = this.height - 5;
            }
        }
    }
    drawBase() {
        this.rootSvg = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSvg.setAttribute("width", this.sizePercent + "%");
        this.rootSvg.setAttribute("overflow", "hidden");
        this.rootSvg.setAttribute("viewBox", "0 0 100 " + this.height);
        this.appendChild(this.rootSvg);
        this.decorationGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.rootSvg.appendChild(this.decorationGroup);
        this.graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.rootSvg.appendChild(this.graduationGroup);
        const beginBar = document.createElementNS(Avionics.SVG.NS, "rect");
        beginBar.setAttribute("x", "25");
        beginBar.setAttribute("y", (this.beginY).toString());
        beginBar.setAttribute("height", "2");
        beginBar.setAttribute("width", "50");
        beginBar.setAttribute("fill", "white");
        this.rootSvg.appendChild(beginBar);
        const endBar = document.createElementNS(Avionics.SVG.NS, "rect");
        endBar.setAttribute("x", "25");
        endBar.setAttribute("y", (this.endY).toString());
        endBar.setAttribute("height", "2");
        endBar.setAttribute("width", "50");
        endBar.setAttribute("fill", "white");
        this.rootSvg.appendChild(endBar);
        const gradTextBackground = document.createElementNS(Avionics.SVG.NS, "rect");
        gradTextBackground.setAttribute("x", "36");
        gradTextBackground.setAttribute("y", (this.endY - 5).toString());
        gradTextBackground.setAttribute("width", "28");
        gradTextBackground.setAttribute("height", (this.beginY - this.endY + 10).toString());
        gradTextBackground.setAttribute("fill", "#1a1d21");
        this.rootSvg.appendChild(gradTextBackground);
        this.graduationTextGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.rootSvg.appendChild(this.graduationTextGroup);
        const barLeft = document.createElementNS(Avionics.SVG.NS, "rect");
        barLeft.setAttribute("x", "34");
        barLeft.setAttribute("y", this.endY.toString());
        barLeft.setAttribute("height", (this.beginY - this.endY).toString());
        barLeft.setAttribute("width", "2");
        barLeft.setAttribute("fill", "white");
        this.rootSvg.appendChild(barLeft);
        const barRight = document.createElementNS(Avionics.SVG.NS, "rect");
        barRight.setAttribute("x", "64");
        barRight.setAttribute("y", this.endY.toString());
        barRight.setAttribute("height", (this.beginY - this.endY).toString());
        barRight.setAttribute("width", "2");
        barRight.setAttribute("fill", "white");
        this.rootSvg.appendChild(barRight);
        this.cursor = document.createElementNS(Avionics.SVG.NS, "polygon");
        this.cursor.setAttribute("points", "30," + this.beginY + " 20," + this.beginY + " 20," + (this.beginY + this.beginY - this.endY) + " 25," + (this.beginY + this.beginY - this.endY) + " 25," + (this.beginY + 10));
        this.cursor.setAttribute("fill", "white");
        this.rootSvg.appendChild(this.cursor);
        this.cursor2 = document.createElementNS(Avionics.SVG.NS, "polygon");
        this.cursor2.setAttribute("points", "70," + this.beginY + " 80," + this.beginY + " 80," + (this.beginY + this.beginY - this.endY) + " 75," + (this.beginY + this.beginY - this.endY) + " 75," + (this.beginY + 10));
        this.cursor2.setAttribute("fill", "white");
        this.rootSvg.appendChild(this.cursor2);
        this.titleText = document.createElementNS(Avionics.SVG.NS, "text");
        this.titleText.setAttribute("x", "50");
        this.titleText.setAttribute("y", (this.endY - 5).toString());
        this.titleText.setAttribute("fill", "white");
        this.titleText.setAttribute("font-size", "9");
        this.titleText.setAttribute("font-family", "Roboto-Bold");
        this.titleText.setAttribute("text-anchor", "middle");
        this.rootSvg.appendChild(this.titleText);
        this.valueText = document.createElementNS(Avionics.SVG.NS, "text");
        this.valueText.setAttribute("x", "35");
        this.valueText.setAttribute("y", (this.endY - 2).toString());
        this.valueText.setAttribute("fill", "white");
        this.valueText.setAttribute("font-size", "12");
        this.valueText.setAttribute("font-family", "Roboto-Bold");
        this.valueText.setAttribute("text-anchor", "end");
        this.rootSvg.appendChild(this.valueText);
        this.valueText2 = document.createElementNS(Avionics.SVG.NS, "text");
        this.valueText2.setAttribute("x", "65");
        this.valueText2.setAttribute("y", (this.endY - 2).toString());
        this.valueText2.setAttribute("fill", "white");
        this.valueText2.setAttribute("font-size", "12");
        this.valueText2.setAttribute("font-family", "Roboto-Bold");
        this.valueText2.setAttribute("text-anchor", "start");
        this.rootSvg.appendChild(this.valueText2);
        this.beginText = document.createElementNS(Avionics.SVG.NS, "text");
        this.beginText.setAttribute("x", "50");
        this.beginText.setAttribute("y", (this.beginY + 4).toString());
        this.beginText.setAttribute("fill", "white");
        this.beginText.setAttribute("font-size", "8");
        this.beginText.setAttribute("font-family", "Roboto-Bold");
        this.beginText.setAttribute("text-anchor", "middle");
        this.rootSvg.appendChild(this.beginText);
        this.endText = document.createElementNS(Avionics.SVG.NS, "text");
        this.endText.setAttribute("x", "50");
        this.endText.setAttribute("y", (this.endY + 4).toString());
        this.endText.setAttribute("fill", "white");
        this.endText.setAttribute("font-size", "8");
        this.endText.setAttribute("font-family", "Roboto-Bold");
        this.endText.setAttribute("text-anchor", "middle");
        this.rootSvg.appendChild(this.endText);
    }
    addColorZone(_begin, _end, _color, _context) {
        const colorZone = document.createElementNS(Avionics.SVG.NS, "rect");
        colorZone.setAttribute("width", "40");
        colorZone.setAttribute("x", "30");
        colorZone.setAttribute("fill", _color);
        this.decorationGroup.appendChild(colorZone);
        this.colorZones.push(new XMLGaugeColorZone(colorZone, _begin, _end));
        this.updateColorZone(colorZone, _begin.getValueAsNumber(_context), _end.getValueAsNumber(_context));
    }
    addColorLine(_position, _color, _context) {
        const colorLine = document.createElementNS(Avionics.SVG.NS, "rect");
        colorLine.setAttribute("height", "2");
        colorLine.setAttribute("width", "46");
        colorLine.setAttribute("x", "27");
        colorLine.setAttribute("y", this.beginY.toString());
        colorLine.setAttribute("fill", _color);
        this.decorationGroup.appendChild(colorLine);
        this.colorLines.push(new XMLGaugeColorLine(colorLine, _position));
        this.updateColorLine(colorLine, _position.getValueAsNumber(_context));
    }
    updateColorZone(_element, _begin, _end) {
        const begin = ((_begin - this.minValue) / (this.maxValue - this.minValue)) * (this.endY - this.beginY) + this.beginY;
        const end = ((_end - this.minValue) / (this.maxValue - this.minValue)) * (this.endY - this.beginY) + this.beginY;
        _element.setAttribute("y", end.toString());
        _element.setAttribute("height", (begin - end).toString());
    }
    updateColorLine(_element, _pos) {
        if (_pos > this.minValue && _pos < this.maxValue) {
            _element.setAttribute("transform", "translate(0," + (((_pos - this.minValue) / (this.maxValue - this.minValue)) * (this.endY - this.beginY)) + ")");
            _element.setAttribute("display", "");
        } else {
            _element.setAttribute("display", "none");
        }
    }
    updateValue(_value, _value2) {
        this.cursor.setAttribute("transform", "translate(0," + (((Math.max(Math.min(_value, this.maxValue), this.minValue) - this.minValue) / (this.maxValue - this.minValue)) * (this.endY - this.beginY)) + ")");
        this.cursor2.setAttribute("transform", "translate(0," + (((Math.max(Math.min(_value2, this.maxValue), this.minValue) - this.minValue) / (this.maxValue - this.minValue)) * (this.endY - this.beginY)) + ")");
        this.valueText.textContent = this.textIncrement != 1 ? fastToFixed(Math.round(_value / this.textIncrement) * this.textIncrement, 0) : fastToFixed(_value, 0);
        this.valueText2.textContent = this.textIncrement != 1 ? fastToFixed(Math.round(_value2 / this.textIncrement) * this.textIncrement, 0) : fastToFixed(_value2, 0);
        let val1Set = false;
        let val2Set = false;
        for (let i = this.colorZones.length - 1; i >= 0; i--) {
            if (_value >= this.colorZones[i].lastBegin && _value <= this.colorZones[i].lastEnd) {
                this.valueText.setAttribute("fill", this.colorZones[i].element.getAttribute("fill"));
                val1Set = true;
            }
            if (_value2 >= this.colorZones[i].lastBegin && _value <= this.colorZones[i].lastEnd) {
                this.valueText2.setAttribute("fill", this.colorZones[i].element.getAttribute("fill"));
                val2Set = true;
            }
        }
        if (!val1Set) {
            this.valueText.setAttribute("fill", "white");
        }
        if (!val2Set) {
            this.valueText2.setAttribute("fill", "white");
        }
    }
    setTitleAndUnit(_title, _unit) {
        this.titleText.textContent = _title + " " + _unit;
    }
    computeAlertBackgrounds() {
    }
    setGraduations(_spaceBetween, _withText) {
        for (let i = this.minValue + _spaceBetween; i < this.maxValue; i += _spaceBetween) {
            const grad = document.createElementNS(Avionics.SVG.NS, "rect");
            grad.setAttribute("x", "29");
            grad.setAttribute("y", (((i - this.minValue) / (this.maxValue - this.minValue)) * (this.endY - this.beginY) + this.beginY - 0.5).toString());
            grad.setAttribute("height", "1");
            grad.setAttribute("width", "42");
            grad.setAttribute("fill", "white");
            this.graduationGroup.appendChild(grad);
            if (_withText) {
                const gradText = document.createElementNS(Avionics.SVG.NS, "text");
                gradText.setAttribute("x", "50");
                gradText.setAttribute("y", (((i - this.minValue) / (this.maxValue - this.minValue)) * (this.endY - this.beginY) + this.beginY + 4).toString());
                gradText.setAttribute("fill", "white");
                gradText.setAttribute("font-size", "8");
                gradText.setAttribute("font-family", "Roboto-Bold");
                gradText.setAttribute("text-anchor", "middle");
                gradText.textContent = i.toString();
                this.graduationTextGroup.appendChild(gradText);
            }
        }
    }
    setLimitValues(_begin, _end) {
        super.setLimitValues(_begin, _end);
        if (this.forcedBeginText == null) {
            this.beginText.textContent = _begin.toString();
        }
        if (this.forcedEndText == null) {
            this.endText.textContent = _end.toString();
        }
    }
    forceBeginText(_text) {
        this.beginText.textContent = _text;
        this.forcedBeginText = _text;
    }
    forceEndText(_text) {
        this.endText.textContent = _text;
        this.forcedEndText = _text;
    }
    setCursorLabel(_label1, _label2) {
    }
}
customElements.define('glasscockpit-xmlverticaldoublegauge', XMLVerticalDoubleGauge);
class XMLFlapsGauge extends XMLGauge {
    constructor() {
        super(...arguments);
        this.takeOffValue = 10;
    }
    setStyle(_styleElem) {
    }
    drawBase() {
        this.rootSvg = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSvg.setAttribute("width", this.sizePercent + "%");
        this.rootSvg.setAttribute("viewBox", "0 0 100 50");
        this.rootSvg.setAttribute("overflow", "visible");
        this.appendChild(this.rootSvg);
        this.cursor = document.createElementNS(Avionics.SVG.NS, "path");
        this.cursor.setAttribute("d", "M10 10 Q25 0 60 10 Q25 20 10 10");
        this.cursor.setAttribute("fill", "aqua");
        this.rootSvg.appendChild(this.cursor);
        this.titleText = document.createElementNS(Avionics.SVG.NS, "text");
        this.titleText.setAttribute("x", "5");
        this.titleText.setAttribute("y", "45");
        this.titleText.setAttribute("fill", "white");
        this.titleText.setAttribute("font-size", "12");
        this.titleText.textContent = "FLAPS";
        this.rootSvg.appendChild(this.titleText);
    }
    addColorZone(_begin, _end, _color) {
    }
    addColorLine(_position, _color) {
    }
    updateColorZone(_element, _begin, _end) {
    }
    updateColorLine(_element, _pos) {
    }
    updateValue(_value, _value2) {
        this.cursor.setAttribute("transform", "rotate(" + _value + " 10 10)");
    }
    setTitleAndUnit(_title, _unit) {
        this.titleText.textContent = _title;
    }
    computeAlertBackgrounds() {
    }
    setGraduations(_spaceBetween, _withText) {
    }
    forceBeginText(_text) {
    }
    forceEndText(_text) {
    }
    setCursorLabel(_label1, _label2) {
    }
    setTakeOffValue(_value) {
        this.takeOffValue = _value;
    }
    setLimitValues(_begin, _end) {
        super.setLimitValues(_begin, _end);
        const angles = [this.minValue, this.takeOffValue, this.maxValue];
        const texts = ["UP", "T/O", "LDG"];
        for (let i = 0; i < angles.length; i++) {
            const graduation = document.createElementNS(Avionics.SVG.NS, "rect");
            graduation.setAttribute("x", "60");
            graduation.setAttribute("y", "10");
            graduation.setAttribute("height", "1");
            graduation.setAttribute("width", "10");
            graduation.setAttribute("fill", "white");
            graduation.setAttribute("transform", "rotate(" + angles[i] + " 10 10)");
            this.rootSvg.appendChild(graduation);
            const text = document.createElementNS(Avionics.SVG.NS, "text");
            const radAngle = angles[i] * Math.PI / 180;
            text.setAttribute("x", (10 + 65 * Math.cos(radAngle)).toString());
            text.setAttribute("y", (15 + 65 * Math.sin(radAngle)).toString());
            text.setAttribute("fill", "white");
            text.setAttribute("font-size", "10");
            text.textContent = texts[i];
            this.rootSvg.appendChild(text);
        }
    }
}
customElements.define('glasscockpit-xmlflapsgauge', XMLFlapsGauge);
class XMLLongitudeFuelGauge extends XMLGauge {
    setStyle(_styleElem) {
    }
    drawBase() {
        this.rootSvg = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSvg.setAttribute("width", this.sizePercent + "%");
        this.rootSvg.setAttribute("viewBox", "0 0 100 30");
        this.rootSvg.setAttribute("overflow", "visible");
        this.appendChild(this.rootSvg);
        const leftBg = document.createElementNS(Avionics.SVG.NS, "rect");
        leftBg.setAttribute("x", "5");
        leftBg.setAttribute("y", "20");
        leftBg.setAttribute("width", "25");
        leftBg.setAttribute("height", "10");
        leftBg.setAttribute("stroke", "grey");
        leftBg.setAttribute("fill", "none");
        this.rootSvg.appendChild(leftBg);
        const rightBg = document.createElementNS(Avionics.SVG.NS, "rect");
        rightBg.setAttribute("x", "70");
        rightBg.setAttribute("y", "20");
        rightBg.setAttribute("width", "25");
        rightBg.setAttribute("height", "10");
        rightBg.setAttribute("stroke", "grey");
        rightBg.setAttribute("fill", "none");
        this.rootSvg.appendChild(rightBg);
        const totalBg = document.createElementNS(Avionics.SVG.NS, "rect");
        totalBg.setAttribute("x", "35");
        totalBg.setAttribute("y", "10");
        totalBg.setAttribute("width", "30");
        totalBg.setAttribute("height", "10");
        totalBg.setAttribute("stroke", "grey");
        totalBg.setAttribute("fill", "none");
        this.rootSvg.appendChild(totalBg);
        const horizBar = document.createElementNS(Avionics.SVG.NS, "rect");
        horizBar.setAttribute("x", "30");
        horizBar.setAttribute("y", "24.5");
        horizBar.setAttribute("width", "40");
        horizBar.setAttribute("height", "1");
        horizBar.setAttribute("fill", "grey");
        this.rootSvg.appendChild(horizBar);
        const vertBar = document.createElementNS(Avionics.SVG.NS, "rect");
        vertBar.setAttribute("x", "49.5");
        vertBar.setAttribute("y", "20");
        vertBar.setAttribute("width", "1");
        vertBar.setAttribute("height", "5");
        vertBar.setAttribute("fill", "grey");
        this.rootSvg.appendChild(vertBar);
        const leftText = document.createElementNS(Avionics.SVG.NS, "text");
        leftText.setAttribute("x", "30");
        leftText.setAttribute("y", "18");
        leftText.setAttribute("fill", "white");
        leftText.setAttribute("font-size", "7");
        leftText.setAttribute("font-family", "Roboto-Bold");
        leftText.setAttribute("text-anchor", "end");
        this.rootSvg.appendChild(leftText);
        leftText.textContent = "TOT";
        const rightText = document.createElementNS(Avionics.SVG.NS, "text");
        rightText.setAttribute("x", "70");
        rightText.setAttribute("y", "18");
        rightText.setAttribute("fill", "white");
        rightText.setAttribute("font-size", "7");
        rightText.setAttribute("font-family", "Roboto-Bold");
        rightText.setAttribute("text-anchor", "start");
        this.rootSvg.appendChild(rightText);
        rightText.textContent = "GAL";
        this.leftText = document.createElementNS(Avionics.SVG.NS, "text");
        this.leftText.setAttribute("x", "17.5");
        this.leftText.setAttribute("y", "28");
        this.leftText.setAttribute("fill", "green");
        this.leftText.setAttribute("font-size", "7");
        this.leftText.setAttribute("font-family", "Roboto-Bold");
        this.leftText.setAttribute("text-anchor", "middle");
        this.rootSvg.appendChild(this.leftText);
        this.rightText = document.createElementNS(Avionics.SVG.NS, "text");
        this.rightText.setAttribute("x", "82.5");
        this.rightText.setAttribute("y", "28");
        this.rightText.setAttribute("fill", "green");
        this.rightText.setAttribute("font-size", "7");
        this.rightText.setAttribute("font-family", "Roboto-Bold");
        this.rightText.setAttribute("text-anchor", "middle");
        this.rootSvg.appendChild(this.rightText);
        this.totalText = document.createElementNS(Avionics.SVG.NS, "text");
        this.totalText.setAttribute("x", "50");
        this.totalText.setAttribute("y", "18");
        this.totalText.setAttribute("fill", "green");
        this.totalText.setAttribute("font-size", "7");
        this.totalText.setAttribute("font-family", "Roboto-Bold");
        this.totalText.setAttribute("text-anchor", "middle");
        this.rootSvg.appendChild(this.totalText);
    }
    addColorZone(_begin, _end, _color) {
    }
    addColorLine(_position, _color) {
    }
    updateColorZone(_element, _begin, _end) {
    }
    updateColorLine(_element, _pos) {
    }
    updateValue(_value, _value2) {
        this.leftText.textContent = fastToFixed(_value, 0);
        this.rightText.textContent = fastToFixed(_value2, 0);
        this.totalText.textContent = fastToFixed(_value + _value2, 0);
    }
    setTitleAndUnit(_title, _unit) {
    }
    computeAlertBackgrounds() {
    }
    setGraduations(_spaceBetween, _withText) {
    }
    forceBeginText(_text) {
    }
    forceEndText(_text) {
    }
    setCursorLabel(_label1, _label2) {
    }
}
customElements.define('glasscockpit-xmllongitudefuelgauge', XMLLongitudeFuelGauge);
class XMLFlapsSpeedbrakesGauge extends XMLGauge {
    setStyle(_styleElem) {
    }
    drawBase() {
        this.rootSvg = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSvg.setAttribute("width", this.sizePercent + "%");
        this.rootSvg.setAttribute("viewBox", "-10 0 120 40");
        this.rootSvg.setAttribute("overflow", "visible");
        this.appendChild(this.rootSvg);
        const wing = document.createElementNS(Avionics.SVG.NS, "path");
        wing.setAttribute("d", "M45 12 C40 11, 30 10, 22 10 C0 13, 0 24, 23 24 C35 25, 50 25, 70 24 C65 21, 70 15, 71 17 L62 15");
        wing.setAttribute("stroke", "white");
        wing.setAttribute("stroke-width", "0.5");
        wing.setAttribute("fill", "none");
        this.rootSvg.appendChild(wing);
        this.speedbrakes = document.createElementNS(Avionics.SVG.NS, "path");
        this.speedbrakes.setAttribute("d", "M49 14 Q44.75 12, 49 11 Q71.5 15.5, 49 14");
        this.speedbrakes.setAttribute("fill", "white");
        this.rootSvg.appendChild(this.speedbrakes);
        this.flaps = document.createElementNS(Avionics.SVG.NS, "path");
        this.flaps.setAttribute("d", "M75 23.5 Q68 20.5, 75 17.5 Q110 22.5, 75 23.5");
        this.flaps.setAttribute("fill", "white");
        this.rootSvg.appendChild(this.flaps);
    }
    addColorZone(_begin, _end, _color) {
    }
    addColorLine(_position, _color) {
    }
    updateColorZone(_element, _begin, _end) {
    }
    updateColorLine(_element, _pos) {
    }
    updateValue(_value, _value2) {
        this.flaps.setAttribute("transform", "rotate(" + _value + " 72.5 20.5)");
        this.speedbrakes.setAttribute("transform", "rotate(" + _value2 + " 48 12.4)");
    }
    setTitleAndUnit(_title, _unit) {
    }
    computeAlertBackgrounds() {
    }
    setGraduations(_spaceBetween, _withText) {
    }
    forceBeginText(_text) {
    }
    forceEndText(_text) {
    }
    setCursorLabel(_label1, _label2) {
    }
}
customElements.define('glasscockpit-xmlflapsspeedbrakesgauge', XMLFlapsSpeedbrakesGauge);
//# sourceMappingURL=XMLEngineDisplay.js.map