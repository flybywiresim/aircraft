interface Element {
    moveIntoView(props: any): any;
}
declare function MoveIntoView(target: any, options: any): any;
declare function _move(dir: any, aspect: any): any;
declare function _position(aspectX: any, aspectY: any): {
    x: number;
    y: number;
};
declare function _parentsOf(target: any, isParent: any): {
    parent: any;
    wrapper: any;
};
interface SliderElementCreateFn {
    (childIndex: number, globalIndex: number): HTMLElement;
}
interface SliderElementUpdatepageFn {
    (start: number, end: number, nbTotal: number): void;
}
declare class SliderConfig {
    parentElement: Element;
    querySelector: string;
    leftElement: ButtonElement;
    rightElement: ButtonElement;
    NbElementPerPage: number;
    NbElement: number;
    CurrentElement: number;
    SelectedElement: number;
    CarrouselLoop: boolean;
    CreateFn: SliderElementCreateFn;
    UpdatePageFn: SliderElementUpdatepageFn;
}
declare class slider {
    config: SliderConfig;
    itemsElement: NodeListOf<Element>;
    NbElement: number;
    NbPage: number;
    CurrentPage: number;
    private m_startindex;
    constructor();
    init(config: SliderConfig): void;
    updateItems(nbElements?: number): void;
    private scroll;
    private CreateCurrentView;
    scrollLeft(): void;
    scrollRight(): void;
    setActive(CurrentElement: any): void;
    setSelected(index: any): void;
    movePage(): void;
    moveToActive(): void;
}
