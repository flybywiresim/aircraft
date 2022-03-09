export namespace TimeUtils {

    /**
     * Formats a time since 00:00 s into an HH:MM format
     *
     * @param a time in seconds since 00:00
     * @param b offset in seconds
     *
     * @private
     */
    export function addSeconds(a: Seconds, b: Seconds): Seconds {
        return (a + b) % (3600 * 24);
    }

    /**
     * Formats a time since 00:00 s into an HH:MM format
     *
     * @param time in seconds since 00:00
     * @param colon whether to include a colon or not
     *
     * @private
     */
    export function formatSeconds(time: Seconds, colon = true): string {
        const hh = Math.floor(time / 3600);
        const mm = Math.floor((time % 3600) / 60);

        return `${hh.toString().padStart(2, '0')}${colon ? ':' : ''}${mm.toString().padStart(2, '0')}`;
    }

}
