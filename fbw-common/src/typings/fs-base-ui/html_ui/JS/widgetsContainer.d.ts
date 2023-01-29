/// <reference path="./common.d.ts" />

declare global {
    interface Document {
        createElement(tagName: "widget-container"): WidgetsContainer;
    }

    class WidgetsContainer {
        gridWidth: number;
        CleanWidgets: () => void;
        RemoveWidget: (i: number, pageId: string) => void;
        ShowWidgetButtons: (idWidget: number, buttons: any[]) => void;
        ShowWidgetButtonsForPage: (idWidget: number, idPage: number) => void;
        HideWidgetButtons: (idWidget: number) => void;
        HideAllWidgetButtons: (except: any) => void;
        OpenPopUp: (data: any) => void;
        ClosePopUp: () => void;
        BackPopUp: () => void;
        OnButtonSelected: (event: CustomEvent<any>) => void;
        ShowAllWidgets: () => void;
        SetIsPaused: (value: boolean) => void;
        HideAllWidgets: () => void;
        ShowWidgetPage: (idWidget: number, idPage: number, pageInfo: any) => void;
        upateWidgetsState: () => void;
        AddWidgetCB: (widgetInfo: {
            iID: number,
            iPageID: number,
            vRect: {
                x: number,
                z: number
            }
        } | null, id: number, page: number, pageW?: number, pageH?: number) => void;
        UpdateWidgetDataCB: (idPage: number, idWidget: number, widgetInfo: any, iCurrentContentPage: number) => void;
        UpdateWidgetTagsCB: (idWidget: number, widgetInfo: { bNew: boolean }) => void;
        ShowPage: (index: number) => void;
        get iCurrentPage(): number;
        onKeyDown(keycode: number): boolean;
        connectedCallback(): void;
        virtualScroll: HTMLElement;
        disconnectedCallback(): void;
        AddWidget(widgetInfo: {
            __Type: string,
            aPages?: {
                sTitle: string
            }[]
        }, parent: any, pageW: any, pageH: any): void;
        getKeyNavigationDirection(): KeyNavigationDirection;
        TestWidgets(): void;
        PreviousPage(): boolean;
        NextPage(): boolean;
    }

}

export {};