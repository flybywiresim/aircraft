declare global {
    class SortedList {
        get length(): number;
        clear(): void;
        add<T>(e: T, from?: number, to?: number): T;
        get(index: number): any;
    }
}

export {};
