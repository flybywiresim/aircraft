export class SimVarCache {
    private simVarCache: { [key: string] : number | null};

    constructor() {
        this.simVarCache = {};
    }

    getCachedSimVar(_simvar: string, _unit, force: boolean = false): number {
        const key: string = `${_simvar}:${_unit}`;
        if (this.simVarCache[key] !== null && !force) {
            return this.simVarCache[key];
        }
        const value = SimVar.GetSimVarValue(_simvar, _unit);
        this.simVarCache[key] = value;
        return value;
    }

    resetCache(): void {
        Object.entries(this.simVarCache).forEach(
            ([key]) => {
                this.simVarCache[key] = null;
            },
        );
    }
}

export class LocalSimVar<T> {
    private localVar: T | number;

    constructor(public simvar: string, public unit) {
        this.localVar = SimVar.GetSimVarValue(this.simvar, this.unit);
    }

    setVar(value: T| number): void {
        // Assume we are the only setter
        if (this.localVar !== value) {
            this.localVar = value;
            SimVar.SetSimVarValue(this.simvar, this.unit, +value);
        }
    }

    getVar(): T | number {
        return this.localVar;
    }
}
