import React, { FC } from 'react';
import { Layer } from '@instruments/common/utils';
import { Mode } from '@shared/NavigationDisplay';
import { useSimVar } from '@instruments/common/simVars';

/*
Messages in priority order, from 1-12 (full set with ATSAW and nice weather radar)
[  TCAS (amber)   | WEATHER AHEAD (amber) ]
[  TCAS (amber)   |     ADS-B (amber)     ]
[  TCAS (amber)   |   ADS-B ONLY (white)  ]
[  TCAS (amber)   |                       ]
[   XX.YNM+NN^    |       XX.YNM+NN^      ]
[   XX.YNM+NN^    |     ADS-B (amber)     ]
[   XX.YNM+NN^    |                       ]
[ TA ONLY (white) | WEATHER AHEAD (amber) ]
[ TA ONLY (white) |     ADS-B (amber)     ]
[ TA ONLY (white) |                       ]
[                 |     ADS-B (amber)     ]
*/

enum TcasPosition {
    Standby = 0,
    Ta = 1,
    TaRa = 2,
}

interface TcasWxrMessage {
    text: string;
    color: 'White' | 'Amber';
}

export const TcasWxrMessages: FC<{ modeIndex: Mode }> = ({ modeIndex }) => {
    // TODO get data and decide what to display

    let leftMessage: TcasWxrMessage | undefined;
    let rightMessage: TcasWxrMessage | undefined;

    // TODO use logic in TCAS when it's implemented
    const [tcasPosition] = useSimVar('L:A32NX_SWITCH_TCAS_Position', 'enum', 500);
    const [radioAlt] = useSimVar('PLANE ALT ABOVE GROUND MINUS CG', 'feet', 500);
    if (tcasPosition === TcasPosition.Ta || (tcasPosition === TcasPosition.TaRa && radioAlt < 1000)) {
        leftMessage = { text: 'TA ONLY', color: 'White' };
    }

    if (modeIndex !== Mode.ARC && modeIndex !== Mode.ROSE_NAV && modeIndex !== Mode.ROSE_VOR && modeIndex !== Mode.ROSE_ILS || (!leftMessage && !rightMessage)) {
        return null;
    }

    const y = (modeIndex === Mode.ROSE_VOR || modeIndex === Mode.ROSE_ILS) ? 713 : 684;

    return (
        <Layer x={164} y={y}>
            { /* we fill/mask the map under both message boxes, per IRL refs */ }
            { (modeIndex === Mode.ARC || modeIndex === Mode.ROSE_NAV) && (
                <rect x={0} y={0} width={440} height={59} className="BackgroundFill" stroke="none" />
            )}

            <rect x={0} y={0} width={440} height={30} className="White BackgroundFill" strokeWidth={1.75} />

            { (leftMessage) && (
                <text
                    x={8}
                    y={25}
                    className={`${leftMessage.color}`}
                    textAnchor="start"
                    fontSize={25}
                >
                    {leftMessage.text}
                </text>
            )}

            { (rightMessage) && (
                <text
                    x={425}
                    y={25}
                    className={`${rightMessage.color}`}
                    textAnchor="end"
                    fontSize={25}
                >
                    {rightMessage.text}
                </text>
            )}
        </Layer>
    );
};
