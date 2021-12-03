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
    const [greenPress] = useSimVar('L:A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE', 'number', 1000);
    const [yellowPress] = useSimVar('L:A32NX_HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE', 'number', 1000);
    const [bluePress] = useSimVar('L:A32NX_HYD_BLUE_SYSTEM_1_SECTION_PRESSURE', 'number', 1000);

    const hydraulicContext: HydraulicsContext = {
        G: { available: greenPress > 1450 },
        Y: { available: yellowPress > 1450 },
        B: { available: bluePress > 1450 },
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
