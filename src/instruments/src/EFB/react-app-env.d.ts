declare module '*.svg' {
  const content: any;
  export default content;
}

declare module '*.png' {
  const content: any;
  export default content;
}

declare global {
    // The functions of Coherent are found in coherent.js.
    // The namespace is assigned in fs-base-ui/html_ui/JS/common.js by CoherentSetup.
    // The vast majority of jsdoc comments in this namespace are copied from coherent.js.
    namespace Coherent {
        /**
         * Trigger an event. This function will trigger any C++ handler registered for
         * this event with `Coherent::UI::View::RegisterForEvent`.
         * @param name name of the event.
         * @param args any extra arguments to be passed to the event handlers.
         */
        function trigger(name: string, ...args: any[]): void;
    }
}

export {};
