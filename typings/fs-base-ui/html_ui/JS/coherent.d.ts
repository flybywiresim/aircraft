declare global {
    // The functions of Coherent are found in coherent.js.
    // The namespace is assigned in fs-base-ui/html_ui/JS/common.js by CoherentSetup.
    // The vast majority of jsdoc comments in this namespace are copied from coherent.js.
    namespace Coherent {
        /**
         * Indicates whether the script is currently running inside Coherent GT.
         */
        const isAttached: boolean;
        /**
         * @deprecated Please use isAttached (with camelCase).
         * Indicates whether the script is currently running inside Coherent GT.
         */
        const IsAttached: boolean;
        /**
         * Indicates whether mocking should be enabled despite running inside Coherent GT
         */
        let forceEnableMocking: boolean;
        let onEventsReplayed: () => void | null;

        function SendMessage(name: string, id: string, ...args: any[]): void;
        function TriggerEvent(...args: any[]): void;
        function BindingsReady(): void;

        /**
         * Begins recording all events triggered using View::TriggerEvent from the game.
         */
        function beginEventRecording(): void;

        /**
         * Ends event recording.
         */
        function endEventRecording(): void;

        /**
         * Saves the events recorded in between the last calls to beginEventRecording
         * and engine.endEventRecording to a file.
         * @param path The path to the file where to save the recorded events. Defaults to "eventRecord.json".
         */
        function saveEventRecord(path?: string): void;

        /**
         * Replays the events previously recorded and stored in path. If you need to be notified when all events
         * are replayed, assign a callback to onEventsReplayed.
         * @param timeScale The speed at which to replay the events (e.g. pass 2 to double the speed). Defaults to 1.
         * @param path The path to the file the recorded events are stored. Defaults to "eventRecord.json".
         */
        function replayEvents(timeScale?: number, path?: string): void;

        /**
         * Mocks a C++ function call with the specified function.
         * Will also work in Coherent GT only if engineForceEnableMocking is set to true.
         * @param name Name of the event.
         * @param mock A function to be called in-place of your native binding.
         * @param isEvent Whether you are mocking an event or function call.
         */
        function mock(name: string, mock: () => any, isEvent: boolean): void;

        /**
         * Translates the given text by invoking the system's localization manager if one exists.
         * @param text The text to translate.
         * @return undefined if no localization manager is set or no translation exists,
         * else returns the translated string.
         */
        function translate(text: string): string | undefined;

        /**
         * Updates the text on all elements with the data-l10n-id attribute by calling translate.
         */
        function reloadLocalization(): void;

        const events: {
            [key: string]: { code: () => void; context: any };
        }
        /**
         * Add a handler for an event.
         * @param name The event name.
         * @param callback Function to be called when the event is triggered.
         * @param context This binding for executing the handler, defaults to the Emitter.
         * @return An object with a clear function to remove the handler for the event.
         */
        function on(name: string, callback: () => void, context: any): { clear: () => void };
        /**
         * Remove a handler for an event.
         * @param name The event name.
         * @param callback Function to be called when the event is triggered.
         * @param context This binding for executing the handler, defaults to the Emitter.
         */
        function off(name: string, callback: () => void, context: any): void;
        /**
         * Trigger an event. This function will trigger any C++ handler registered for
         * this event with `Coherent::UI::View::RegisterForEvent`.
         * @param name name of the event.
         * @param args any extra arguments to be passed to the event handlers.
         */
        function trigger(name: string, ...args: any[]): void;
        /**
         * Shows the debugging overlay in the browser.
         * Will also work in Coherent GT only if engineForceEnableMocking is set to true.
         */
        function showOverlay(): void;
        /**
         * Hides the debugging overlay in the browser.
         * Will also work in Coherent GT only if engineForceEnableMocking is set to true.
         */
        function hideOverlay(): void;
        /**
         * Call asynchronously a C++ handler and retrieve the result.
         * The C++ handler must have been registered with `Coherent::UI::View::BindCall`.
         * @param name name of the C++ handler to be called.
         * @param args any extra parameters to be passed to the C++ handler.
         * @return ECMAScript 6 promise.
         */
        function call<T>(name: string, ...args: any[]): Promise<T>;
    }
}

export {};
