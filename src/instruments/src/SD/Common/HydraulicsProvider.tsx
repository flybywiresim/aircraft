import { useSimVar } from '@instruments/common/simVars';
import React from 'react';

interface HydraulicSystemAvailable {
    available: boolean
}

interface HydraulicsContext {
    G: HydraulicSystemAvailable;
    Y: HydraulicSystemAvailable;
    B: HydraulicSystemAvailable;
}
const HydraulicContext = React.createContext<HydraulicsContext>({
    G: { available: false },
    Y: { available: false },
    B: { available: false },
});

export const HydraulicsProvider: React.FC = ({ children }) => {
    const [greenPressAvailable] = useSimVar('L:A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE_SWITCH', 'boolean', 1000);
    const [yellowPressAvailable] = useSimVar('L:A32NX_HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE_SWITCH', 'boolean', 1000);
    const [bluePressAvailable] = useSimVar('L:A32NX_HYD_BLUE_SYSTEM_1_SECTION_PRESSURE_SWITCH', 'boolean', 1000);

    const hydraulicContext: HydraulicsContext = {
        G: { available: greenPressAvailable },
        Y: { available: yellowPressAvailable },
        B: { available: bluePressAvailable },
    };

    return <HydraulicContext.Provider value={hydraulicContext}>{children}</HydraulicContext.Provider>;
};

export function useHydraulics() {
    const context = React.useContext(HydraulicContext);
    if (context === undefined) {
        throw new Error('useHydraulics must be used within a HydraulicsProvider');
    }

    return context;
}
