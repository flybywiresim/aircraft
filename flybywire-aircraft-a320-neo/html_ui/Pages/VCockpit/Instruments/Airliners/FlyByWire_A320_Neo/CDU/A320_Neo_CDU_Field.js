class CDU_Field {
    constructor(mcdu, selectedCallback) {
        this.mcdu = mcdu;
        this.selectedCallback = selectedCallback;
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
     * @param {string|number|null} value
     */
    onSelect(value) {
        this.selectedCallback(this.currentValue);
    }
}

/**
 * @description Placeholder field that shows "NOT YET IMPLEMENTED" message when selected
 */
class CDU_InopField extends CDU_Field {
    /**
     * @param {A320_Neo_CDU_MainDisplay} mcdu
     * @param {string} value
     * @param {boolean} [inopColor=true] whether to append "[color]inop" to the value
     */
    constructor(mcdu, value, inopColor = true) {
        super(mcdu, () => {});
        this.value = inopColor ? `${value}[color]inop` : value;
    }
    getValue() {
        return this.value;
    }

    onSelect() {
        this.mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
        super.onSelect();
    }

}

class CDU_SingleValueField extends CDU_Field {
    /**
     * @param {A320_Neo_CDU_MainDisplay} mcdu
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
     */
    constructor(mcdu, type, value, options, selectedCallback) {
        super(mcdu, selectedCallback);
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
            return [false, NXSystemMessages.formatError];
        }

        switch (this.type) {
            case "string":
                // Check max length
                if (value.length > this.maxLength) {
                    return [false, NXSystemMessages.formatError];
                }
                break;
            case "int":
                // Make sure value is an integer and is within the min/max
                const valueAsInt = Number.parseInt(value, 10);
                if (!isFinite(valueAsInt) || value.includes(".")) {
                    return [false, NXSystemMessages.formatError];
                }
                if (valueAsInt > this.maxValue || valueAsInt < this.minValue) {
                    return [false, NXSystemMessages.entryOutOfRange];
                }
                value = valueAsInt;
                break;
            case "number":
                // Make sure value is a valid number and is within the min/max
                const valueAsFloat = Number.parseFloat(value);
                if (!isFinite(valueAsFloat)) {
                    return [false, NXSystemMessages.formatError];
                }
                if (valueAsFloat > this.maxValue || valueAsFloat < this.minValue) {
                    return [false, NXSystemMessages.entryOutOfRange];
                }
                value = valueAsFloat;
                break;
        }
        // Update the value
        this.currentValue = value;
        return [true, null];
    }
    clearValue() {
        if (this.clearable) {
            if (this.type === "string") {
                this.currentValue = "";
            } else {
                this.currentValue = null;
            }

            return [true, null];
        } else {
            return [false, NXSystemMessages.notAllowed];
        }
    }
    onSelect(value) {
        if (value === FMCMainDisplay.clrValue) {
            const [success, badInputMessage] = this.clearValue();
            if (!success) {
                this.mcdu.scratchpadCallback(value, badInputMessage);
            }
        } else {
            const [success, badInputMessage] = this.setValue(value);
            if (!success) {
                this.mcdu.scratchpadCallback(value, badInputMessage);
            }
        }
        super.onSelect();
    }
}

// TODO: Create classes for multi value fields
