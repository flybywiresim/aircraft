import { useRef, useEffect } from 'react';

type UseIntervalOptions = Partial<{
    runOnStart: boolean,
    additionalDeps: any[],
}>

function useInterval(callback: () => void, delay: number | null, options?: UseIntervalOptions): void {
    const savedCallback = useRef<() => void | null>();

    const deps = [delay];
    if (options?.additionalDeps) {
        deps.push(...options.additionalDeps);
    }

    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback;
    });

    // Set up the interval.
    // eslint-disable-next-line consistent-return
    useEffect(() => {
        function tick() {
            if (savedCallback && typeof savedCallback.current !== 'undefined') {
                savedCallback.current();
            }
        }

        if (options?.runOnStart) {
            tick();
        }

        if (delay !== null) {
            const id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, deps); /* eslint-disable-line react-hooks/exhaustive-deps */
}
export default useInterval;
