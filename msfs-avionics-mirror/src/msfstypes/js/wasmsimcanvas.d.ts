declare class WasmSimCanvas extends HTMLElement {
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    private onListenerRegistered;
    private onWasmModuleLoaded;
    onClick(_e: MouseEvent): void;
    onDblClick(_e: MouseEvent): void;
    onMouseMove(_e: MouseEvent): void;
    OnMouseDown(_e: MouseEvent): void;
    OnMouseUp(_e: MouseEvent): void;
    OnMouseEnter(_e: MouseEvent): void;
    OnMouseLeave(_e: MouseEvent): void;
    OnMouseOver(_e: MouseEvent): void;
    onMouseWheel(_e: WheelEvent): void;
    m_wasmModuleName: string;
    m_wasmGaugeName: string;
    m_wasmInstrumentGUid: string;
    private m_imgElement;
    private m_listener;
    private m_buttonState;
    private m_mouseX;
    private m_mouseY;
}
