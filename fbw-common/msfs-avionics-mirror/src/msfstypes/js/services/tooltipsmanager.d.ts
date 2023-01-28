declare class TooltipData {
    __Type: string;
    text: string;
    posX: number;
    posY: number;
    maxWidth: number;
    sideMargin: number;
}
declare class ActionTooltipData {
    __Type: string;
    tree: TreeDataValue;
    posX: number;
    posY: number;
    maxWidth: number;
    sideMargin: number;
}
declare class TooltipsListener extends ViewListener.ViewListener {
    onSetTooltip(callback: (data: TooltipData) => void): void;
    onHideTooltip(callback: () => void): void;
    onSetActionsTooltips(callback: (data: ActionTooltipData) => void): void;
    onHideActionsTooltip(callback: (tooltipId: number) => void): void;
}
declare function RegisterTooltipsListener(callback?: any): TooltipsListener;
