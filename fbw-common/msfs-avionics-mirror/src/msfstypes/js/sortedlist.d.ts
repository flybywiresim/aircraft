interface IComparable {
    compare(a: IComparable): number;
    clone(): IComparable;
}
declare class SortedList<T extends IComparable> {
    private _list;
    get length(): number;
    clear(): void;
    add(e: T, from?: number, to?: number): T;
    get(i: number): T;
}
