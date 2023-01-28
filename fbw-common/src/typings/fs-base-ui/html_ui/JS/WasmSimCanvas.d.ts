declare global {
    interface Document {
        createElement(tagName: "wasm-sim-canvas"): WasmSimCanvas;
    }

    class WasmSimCanvas extends HTMLElement {
        connectedCallback(): void;
        disconnectedCallback(): void;
        onListenerRegistered(): void;
        onWasmModuleLoaded(uid: any, liveViewName: string): void;
    }
}

export {};