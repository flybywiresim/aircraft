class A32NXSvgConstraintElement extends SvgConstraintElement {
    createDraw(map) {
        const fontSize = map.config.waypointLabelFontSize;
        let text = "CSTR";
        let speedText = "";
        if (this.source) {
            if (this.source.legAltitude1 >= 10000) {
                text = "FL" + (this.source.legAltitude1 / 100).toFixed(0);
            } else {
                text = (this.source.legAltitude1 / 10).toFixed(0) + "0";
            }
        }

        if (this.source.speedConstraint > 10) {
            speedText = this.source.speedConstraint.toFixed(0) + "KT";
        }
        const c = document.createElement("canvas");
        const ctx = c.getContext("2d");
        ctx.font = fontSize + "px " + map.config.waypointLabelFontFamily;
        this._textWidth = Math.max(ctx.measureText(text).width, ctx.measureText(speedText).width);
        this._textHeight = fontSize * 0.675;
        this._label = undefined;
        this.needRepaint = true;
        const labelId = this.id(map) + "-text-" + map.index;
        const label = document.getElementById(labelId);
        if (label instanceof SVGForeignObjectElement) {
            this._label = label;
            this.needRepaint = true;
        }
        if (!this._label) {
            this._label = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
            this._label.id = labelId;
            this._label.setAttribute("width", (this._textWidth + map.config.waypointLabelBackgroundPaddingLeft + map.config.waypointLabelBackgroundPaddingRight).toFixed(0) + "px");
            this._label.setAttribute("height", (this._textHeight * (this.source.speedConstraint > 0 ? 2.2 : 1) + map.config.waypointLabelBackgroundPaddingTop + map.config.waypointLabelBackgroundPaddingBottom).toFixed(0) + "px");
            const canvas = document.createElement("canvas");
            canvas.setAttribute("width", (this._textWidth + map.config.waypointLabelBackgroundPaddingLeft + map.config.waypointLabelBackgroundPaddingRight).toFixed(0) + "px");
            canvas.setAttribute("height", (this._textHeight * (this.source.speedConstraint > 0 ? 2.2 : 1) + map.config.waypointLabelBackgroundPaddingTop + map.config.waypointLabelBackgroundPaddingBottom).toFixed(0) + "px");
            this._label.appendChild(canvas);
            const context = canvas.getContext("2d");
            if (map.config.waypointLabelUseBackground) {
                context.fillStyle = "black";
                context.fillRect(0, 0, this._textWidth + map.config.waypointLabelBackgroundPaddingLeft + map.config.waypointLabelBackgroundPaddingRight, this._textHeight + map.config.waypointLabelBackgroundPaddingTop + map.config.waypointLabelBackgroundPaddingBottom);
            }
            context.fillStyle = "magenta";
            context.font = fontSize + "px " + map.config.waypointLabelFontFamily;
            context.fillText(text, map.config.waypointLabelBackgroundPaddingLeft, this._textHeight + map.config.waypointLabelBackgroundPaddingTop);
            if (this.source.speedConstraint > 0) {
                context.fillText(speedText, map.config.waypointLabelBackgroundPaddingLeft, this._textHeight * 2.2 + map.config.waypointLabelBackgroundPaddingTop);
            }
            map.textLayer.appendChild(this._label);
        }
        this.svgElement = document.createElementNS(Avionics.SVG.NS, "image");
        this.svgElement.id = this.id(map);
        this.svgElement.classList.add("constraint-icon");
        this.svgElement.setAttribute("hasTextBox", "true");
        this.svgElement.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + this.imageFileName());
        this.svgElement.setAttribute("width", fastToFixed(map.config.waypointIconSize * 1.3, 0));
        this.svgElement.setAttribute("height", fastToFixed(map.config.waypointIconSize * 1.3, 0));
        return this.svgElement;
    }
}