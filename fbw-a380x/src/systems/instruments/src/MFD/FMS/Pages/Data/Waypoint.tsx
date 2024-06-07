import { useNavDatabase } from '@instruments/common/flightplan';
import React, { useState } from 'react';
import { Waypoint } from 'msfs-navdata';
import { MathUtils } from '@shared/MathUtils';
import { Layer } from '../../../Components/Layer';
import { Tab, TabSet } from '../../../Components/tabs';
import { TextBox } from '../../../Components/Textbox';

export const Page = () => {
    const database = useNavDatabase();
    const [currentWaypoint, setCurrentWaypoint] = useState<Waypoint>();

    const findWaypoint = async (ident: string) => {
        setCurrentWaypoint((await database.getWaypoints(ident))[0]);
    };

    return (
        <Layer y={140}>
            <TabSet x={7} y={50} width={748} height={723}>
                <Tab title="DATABASE WPTs" />
                <Tab title="PILOT STORED WPTs" />
            </TabSet>
            <text x={170} y={129} fontSize={22} fill="#fff">WPT IDENT</text>
            <TextBox x={306} y={101} width={154} height={38} maxLength={6} onSubmit={(value) => findWaypoint(value)} />
            <text x={259} y={246} fontSize={22} fill="#fff">LAT</text>
            <text x={439} y={246} fontSize={22} fill="#fff">LONG</text>
            {currentWaypoint && (
                <text
                    x={206}
                    y={289}
                    fontSize={29}
                    fill="lime"
                >
                    {MathUtils.convertDMS(currentWaypoint?.location.lat, currentWaypoint?.location.lon)}
                </text>
            )}
        </Layer>
    );
};
