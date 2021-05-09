import React, { useEffect, useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { MathUtils } from '@shared/MathUtils';
import { FlightPath } from './FlightPath';
import { MapParameters } from './utils/MapParameters';

export const ArcMode: React.FC = () => {
    const [lat] = useSimVar('PLANE LATITUDE', 'degree latitude');
    const [long] = useSimVar('PLANE LONGITUDE', 'degree longitude');
    const [heading] = useSimVar('PLANE HEADING DEGREES MAGNETIC', 'degrees');

    const [mapParams] = useState(() => {
        const params = new MapParameters();
        params.compute({ lat, long }, 100, heading);

        return params;
    });

    useEffect(() => {
        console.log('params update!');
        mapParams.compute({ lat, long }, 100, heading);
    }, [lat, long, heading].map((n) => MathUtils.fastToFixed(n, 3)));

    return (
        <FlightPath mapParams={mapParams} />
    );
};
