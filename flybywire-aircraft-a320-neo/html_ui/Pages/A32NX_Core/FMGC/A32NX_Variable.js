class FmgcVariable {
    /**
     * @param {object} attributes
     * @param [attributes.value=null]
     * @param {"string"|"int"|"number"} [attributes.valueType="int"]
     * @param {boolean} [attributes.clearable=true]
     * @param {boolean} [attributes.editable=true]
     * @param {number} [attributes.valueMinOrLengthMin=-Infinity]
     * @param {number} [attributes.valueMaxOrLengthMax=Infinity]
     * @param {function} [attributes.valueSetEvent]
     * @param {boolean} [attributes.setValueOnValidation=true]
     * @param {boolean} [attributes.autoPopulationClearable=false]
     * @param {boolean} [attributes.autoPopulationEnabled=true]
     * @param {function} [attributes.autoPopulateSource=null]
     * @param {function} [attributes.customValidation=null]
     */
    constructor(
        attributes
    ) {
        // fmgc logic
        this._value = null;
        this._valueType = "int";
        this._clearable = true;
        this._editable = true;
        this._valueMinOrLengthMin = -Infinity;
        this._valueMaxOrLengthMax = Infinity;
        this._valueSetEvent = () => {};
        this._customValidation = null;

        // mcdu display cosmetics
        this._setValueOnValidation = true;
        this._autoPopulationClearable = false;
        this._autoPopulationEnabled = true;
        this._autoPopulationDataSource = null;
        this._setAttributes(attributes);

        // save initial value for fmgc reset
        this._initialValue = this._value;
    }

    validateAndSetValue(_value, _validateOnly = false) {
        const setValueOnValidation = _validateOnly ? false : this._setValueOnValidation;

        if (this._customValidation) {
            const [value, message ] = this._customValidation(_value);

            if (message) {
                throw message;
            }

            if (setValueOnValidation) {
                this._setValue(value);
            }

            return value;
        }

        if (!this._editable || _value === FMCMainDisplay.clrValue && !this._isClearable()) {
            throw NXSystemMessages.notAllowed;
        }

        if (_value === FMCMainDisplay.clrValue) {
            if (!!this._autoPopulationDataSource && !this._value) {
                this._autoPopulationEnabled = false;
            }

            if (setValueOnValidation) {
                this._setValue(null);
            }

            return null;
        }

        if (this._valueType === "string") {
            if (_value.length < this._valueMinOrLengthMin || _value.length > this._valueMaxOrLengthMax) {
                throw NXSystemMessages.formatError;
            }

            if (setValueOnValidation) {
                this._setValue(_value);
            }

            return _value;
        }

        const value = this._valueType === "number" ? Number.parseFloat(_value) : Number.parseInt(_value, 10);

        if (!isFinite(value) || this._valueType === "int" && _value.includes(".")) {
            throw NXSystemMessages.formatError;
        }

        if (value < this._valueMinOrLengthMin || value > this._valueMaxOrLengthMax) {
            throw NXSystemMessages.entryOutOfRange;
        }

        if (setValueOnValidation) {
            this._setValue(_value);
        }

        return value;
    }

    setValue(value) {
        this._setValue(value);
    }

    getValue() {
        if (!this._value && this._autoPopulationDataSource && this._autoPopulationEnabled) {
            return this._autoPopulationDataSource();
        }

        return this._value;
    }

    getRawValue() {
        return this._value;
    }

    getDisplayValue() {
        return !this._value && this._autoPopulationDataSource && this._autoPopulationEnabled ? "{small}" + this._autoPopulationDataSource + "{end}" : this._value;
    }

    enableAutoPopulation() {
        this._autoPopulationEnabled = true;
    }

    disableAutoPopulation() {
        this._autoPopulationEnabled = false;
    }

    reset() {
        this._setValue(null);
    }

    _isClearable() {
        if (!!this._autoPopulationDataSource) {
            return this._clearable && this._autoPopulationClearable && this._value;
        }
        return this._clearable && this._value;
    }

    _setValue(value) {
        if (!this._autoPopulationEnabled) {
            this._autoPopulationEnabled = true;
        }
        this._value = value;
        this._valueSetEvent(value);
    }

    _setAttributes(attributes) {
        for (const attribute in attributes) {
            this["_" + attribute] = attributes[attribute];
        }
    }
}
