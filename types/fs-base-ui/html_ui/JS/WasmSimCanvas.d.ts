declare global {
    class WasmSimCanvas extends HTMLElement {
        connectedCallback(): void;
        disconnectedCallback(): void;
        onListenerRegistered(): void;
        onWasmModuleLoaded(uid: any, liveViewName: string): void;
    }
}

export {};