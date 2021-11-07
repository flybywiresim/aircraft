class CDU_Field {
    constructor(mcdu, selectedCallback, resolveAction, delay) {
        this.selectedCallback = selectedCallback.bind(mcdu);
        this.resolveAction = resolveAction;
        this.delay = delay;
        this.currentValue = null;
    }
    setOptions(options) {
        for (const option in options) {
            this[option] = options[option];
        }
    }

    getValue() {
        return "";
    }

    /**
     * @param value
     * @param resolve {PromiseFulfilledResult}
     * @param reject {PromiseRejectedResult}
     */
    onSelect(value, resolve, reject) {
        return this.selectedCallback(this.currentValue, resolve, reject);
    }
}

/**
 * @description Placeholder field that shows "NOT YET IMPLEMENTED" message when selected
 */
class CDU_InopField extends CDU_Field {
    /**
     * @param {string} value
     * @param {boolean} [inopColor=true] whether to append "[color]inop" to the value
     */
    constructor(value, inopColor = true) {
        super(() => {});
        this.value = inopColor ? `${value}[color]inop` : value;
    }
    getValue() {
        return this.value;
    }

    onSelect() {
        throw NXFictionalMessages.notYetImplemented;
    }

}

class CDU_SingleValueField extends CDU_Field {
    /**
     * @param mcdu
     * @param {"string"|"int"|"number"} type
     * @param {string|number|null} value
     * @param {object} options
     * @param {boolean} [options.clearable=false]
     * @param {string} [options.emptyValue=""]
     * @param {number} [options.maxLength=Infinity]
     * @param {number} [options.minValue=-Infinity]
     * @param {number} [options.maxValue=Infinity]
     * @param {number} [options.maxDisplayedDecimalPlaces=]
     * @param {string} [options.prefix=""]
     * @param {string} [options.suffix=""]
     * @param {function} [options.isValid=]
     * @param {function(*=): void} selectedCallback
     * @param {function(*=): void} resolveAction
     * @param {function(*=): void} delay
     */
    constructor(mcdu, type, value, options, selectedCallback, resolveAction = undefined, delay = undefined) {
        super(mcdu, selectedCallback, resolveAction, delay);
        this.type = type;
        this.currentValue = value;
        this.clearable = false;
        this.emptyValue = "";
        this.maxLength = Infinity;
        this.minValue = -Infinity;
        this.maxValue = Infinity;
        this.prefix = "";
        this.suffix = "";
        this.setOptions(options);
    }

    /**
     * @returns {string}
     */
    getValue() {
        let value = this.currentValue;
        if (value === "" || value == null) {
            return this.emptyValue;
        }
        if (this.type === "number" && isFinite(this.maxDisplayedDecimalPlaces)) {
            value = value.toFixed(this.maxDisplayedDecimalPlaces);
        }
        return `${this.prefix}${value}${this.suffix}`;
    }

    /**
     * @param {*} value
     */
    setValue(value) {
        // Custom isValid callback
        if (value.length === 0 || (this.isValid && !this.isValid(value))) {
            throw NXSystemMessages.formatError;
        }

        switch (this.type) {
            case "string":
                // Check max length
                if (value.length > this.maxLength) {
                    throw NXSystemMessages.formatError;
                }
                break;
            case "int":
                // Make sure value is an integer and is within the min/max
                const valueAsInt = Number.parseInt(value, 10);
                if (!isFinite(valueAsInt) || value.includes(".")) {
                    throw NXSystemMessages.formatError;
                }
                if (valueAsInt > this.maxValue || valueAsInt < this.minValue) {
                    throw NXSystemMessages.entryOutOfRange;
                }
                value = valueAsInt;
                break;
            case "number":
                // Make sure value is a valid number and is within the min/max
                const valueAsFloat = Number.parseFloat(value);
                if (!isFinite(valueAsFloat)) {
                    throw NXSystemMessages.formatError;
                }
                if (valueAsFloat > this.maxValue || valueAsFloat < this.minValue) {
                    throw NXSystemMessages.entryOutOfRange;
                }
                value = valueAsFloat;
                break;
        }
        // Update the value
        this.currentValue = value;
    }
    clearValue() {
        if (this.clearable) {
            this.currentValue = this.type === "string" ? "" : null;
        } else {
            throw NXSystemMessages.notAllowed;
        }
    }
    onSelect(value, resolve, reject) {
        if (value === FMCMainDisplay.clrValue) {
            this.clearValue();
        } else {
            this.setValue(value);
        }
        super.onSelect(value, resolve, reject);
    }
}

class MCDU_ValueField extends CDU_Field {
    constructor(mcdu, options, resolveAction, delay = undefined) {
        super(mcdu, () => {}, resolveAction, delay);
        // first variable
        this.variable = null;
        this.color = "";
        this.size = "";
        this.emptyValue = "";
        this._sizeSuffix = "";
        this._colorSuffix = "";

        // second variable
        this.devider = "/";
        this.variable2 = null;
        this.color2 = "";
        this.size2 = "";
        this.emptyValue2 = "";
        this._sizeSuffix2 = "";
        this._colorSuffix2 = "";
        this.valueSetEvent = () => {};

        this.setOptions(options);

        if (this.color) {
            this.color = `{${this.color}}`;
            this._colorSuffix = "{end}";
        }

        if (this.size) {
            this.size = `{${this.size}}`;
            this._sizeSuffix = "{end}";
        }
    }

    getValue() {
        const value = this.variable.getDisplayValue();
        const text = this._getText(value, this.size, this.color, this._sizeSuffix, this._colorSuffix, this.emptyValue);

        if (this.variable2) {
            const value2 = this.variable2.getDisplayValue();
            const text2 = this._getText(value2, this.size2, this.color2, this._sizeSuffix2, this._colorSuffix2, this.emptyValue2);

            return text + this.devider + text2;
        }

        return text;
    }

    onSelect(value, resolve, reject) {
        if (this.variable2) {
            const [value1, value2] = value.split(this.devider);

            const res1 = value1 ? this.variable.validateAndSetValue(value1, true) : null;
            const res2 = value2 ? this.variable2.validateAndSetValue(value2, true) : null;

            if (value1) {
                this.variable.setValue(res1);
            }

            if (value2) {
                this.variable2.setValue(res2);
            }

            this.valueSetEvent(res1, res2);
        } else {
            this.variable.validateAndSetValue(value);
        }

        resolve();
    }

    _getText(value, size, color, sizeSuffix, colorSuffix, emptyValue) {
        return value ? `${size}${color}${value}${colorSuffix}${sizeSuffix}` : emptyValue;
    }
}

// TODO: Create classes for multi value fields
