declare global {
    interface MoveIntoViewOptions {
        isParent?: (parent: HTMLElement) => boolean;
        noreset?: boolean
    }

    function MoveIntoView(target?: Node, options?: MoveIntoViewOptions): {
        target: any;
        wrapper: any;
        parent: any;
        position: (aspectX: number, aspectY: number) => { x: number, y: number };
        move: {
            x: string;
            y: string;
            both: string;
        };
    }

    interface MoveIntoViewOptionsXY {
        x: number,
        y: number
    }

    interface Element {
        moveIntoView(options?: MoveIntoViewOptions & MoveIntoViewOptionsXY): void;
    }

    class SliderConfig {
        CurrentElement: number;

        SelectedElement: number;

        CarrouselLoop: boolean;

        CreateFn: ((elementIndex: number, index: number) => void) | null;

        UpdatePageFn: ((startIndex: number, arg1: number, arg2: number) => void) | void;

        leftElement?: Element;

        rightElement?: Element;

        parentElement?: ParentNode;

        querySelector?: string;

        NbElementPerPage?: number;
    }

    class slider {
        config: SliderConfig;

        CurrentPage: number;

        init(config: SliderConfig): void;
        updateItems(nbElements: number): void;
        itemsElement: NodeListOf<Element>;

        NbElement: number;

        NbPage: number;
        scroll(direction: 'left' | 'right', onlyMove?: boolean): void;
        CreateCurrentView(activeElement: number, force: boolean): void;
        scrollLeft(): void;
        scrollRight(): void;
        setActive(CurrentElement: number): void;
        setSelected(index: number): void;
        movePage(): void;
        moveToActive(): void;
    }
}

export {};
