export interface Writer {
    /**
     * Writes the given value.
     * @param value the value to write to the SimVar.
     * @returns a Promise which resolves once the value was written and consumed.
     */
    write(value: number): Promise<void>;
}
