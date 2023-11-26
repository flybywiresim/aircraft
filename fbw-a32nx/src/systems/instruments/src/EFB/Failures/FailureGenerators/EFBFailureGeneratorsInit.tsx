import { getGeneratorFailurePool } from 'instruments/src/EFB/Failures/FailureGenerators/EFBFailureSelectionFunctions';
import { sendFailurePool, sendSettings, useFailureGeneratorsSettings } from 'instruments/src/EFB/Failures/FailureGenerators/EFBRandomFailureGen';
import { useEventBus } from 'instruments/src/EFB/event-bus-provider';
import { useFailuresOrchestrator } from 'instruments/src/EFB/failures-orchestrator-provider';
import { useEffect } from 'react';

export const FailureGeneratorsInit = () => {
    const bus = useEventBus();
    const { allFailures } = useFailuresOrchestrator();

    const settings = useFailureGeneratorsSettings();

    useEffect(() => {
        // console.info('Broadcasting all Failure Gen data once');
        for (const gen of settings.allGenSettings.values()) {
            sendSettings(gen.uniqueGenPrefix, gen.setting, bus);
            const nbGenerator = Math.floor(gen.settings.length / gen.numberOfSettingsPerGenerator);
            for (let i = 0; i < nbGenerator; i++) {
                sendFailurePool(gen.uniqueGenPrefix, i, getGeneratorFailurePool(gen.uniqueGenPrefix + i.toString(), Array.from(allFailures)), bus);
            }
        }
    },
    []);
    return (null);
};
