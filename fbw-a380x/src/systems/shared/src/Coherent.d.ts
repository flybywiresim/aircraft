declare global {
  namespace Coherent {
    /**
     * Trigger an event. This function will trigger any C++ handler registered for
     * this event with `Coherent::UI::View::RegisterForEvent`.
     * @param name name of the event.
     * @param args any extra arguments to be passed to the event handlers.
     */
    function trigger(name: string, ...args: any[]): void;

    /**
     * Add a handler for an event.
     * @param name The event name.
     * @param callback Function to be called when the event is triggered.
     * @param context This binding for executing the handler, defaults to the Emitter.
     * @return An object with a clear function to remove the handler for the event.
     */
    function on(name: string, callback: (event: any, ...args: any) => void): { clear: () => void };
    function on(name: string, callback: (event: any, ...args: any) => void, context: any): { clear: () => void };
  }
}

export {};
