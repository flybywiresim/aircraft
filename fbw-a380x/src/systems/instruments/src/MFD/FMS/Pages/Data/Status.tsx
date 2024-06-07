import React, { useCallback, useEffect, useState } from 'react';
import { NavigationDatabase, NavigationDatabaseBackend } from '@fmgc/NavigationDatabase';
import { NavigationDatabaseService } from '@fmgc/flightplanning/new/NavigationDatabaseService';
import { useActiveNavDatabase } from '@instruments/common/flightplan';
import { Button } from '../../../Components/Button';
import { Tab, TabSet } from '../../../Components/tabs';

enum Months {
    JAN = 1,
    FEB,
    MAR,
    APR,
    MAY,
    JUN,
    JUL,
    AUG,
    SEP,
    OCT,
    NOV,
    DEC
}
const getCycleDates = (fromTo: string): string => `${fromTo.substr(0, 2)}${Months[Number.parseInt(fromTo.substr(2, 2))]}-${fromTo.substr(4, 2)}${Months[Number.parseInt(fromTo.substr(6, 2))]}`;

export const Page = () => {
    const [database, databaseVersion] = useActiveNavDatabase();

    const [navIdent, setNavIdent] = useState({
        provider: 'Navigraph',
        airacCycle: '2107',
        dateFromTo: '1507120821',
        previousFromTo: '1706150721',
    });

    useEffect(() => {
        setNavIdent({
            provider: database.backend === NavigationDatabaseBackend.Navigraph
                ? 'EXTERNAL (NAVIGRAPH)'
                : 'MSFS',
            airacCycle: '2107',
            dateFromTo: '1507120821',
            previousFromTo: '1706150721',
        });
    }, [database, databaseVersion]);

    const handleSwap = useCallback(() => {
        if (database.backend === NavigationDatabaseBackend.Navigraph) {
            NavigationDatabaseService.activeDatabase = new NavigationDatabase(NavigationDatabaseBackend.Msfs);
        } else {
            NavigationDatabaseService.activeDatabase = new NavigationDatabase(NavigationDatabaseBackend.Navigraph);
        }
    }, [database, databaseVersion]);

    return (
        <>
            <TabSet x={11} y={185} width={748} height={718}>
                <Tab title="STATUS" />
                <Tab title="FMS P/N" />
            </TabSet>

            <text x={300} y={235} fontSize={28} fill="#00ff00">A380-800</text>

            <text x={30} y={314} fontSize={22} fill="#ffffff">ENGINE</text>
            <text x={185} y={316} fontSize={27} fill="#00ff00">TRENT 972</text>

            {/* Perf */}
            <path stroke="white" fill="none" strokeWidth={0.35} d="m 550 285 h 193 v 110 h -193 v -110 z" />
            <text x={564} y={323} fontSize={24} fill="#ffffff">IDLE</text>
            <text x={564} y={375} fontSize={24} fill="#ffffff">PERF</text>
            <text x={650} y={325} fontSize={30} fill="#00ff00">+0.0</text>
            <text x={650} y={377} fontSize={30} fill="#00ff00">+0.5</text>

            <Button x={585} y={409} width={127} height={40}>
                MODIFY
            </Button>

            <path stroke="white" strokeWidth={1} d="m 18 470 h 726" />

            {/* Database */}
            <text x={29} y={503} fontSize={22} fill="white">NAV DATABASE</text>
            <text x={230} y={504.5} fontSize={27} fill="#00ff00">{navIdent.provider}</text>

            {/* Active */}
            <path stroke="white" fill="none" strokeWidth={1} d="m 18 537 h 240 v 110 h -240 v -110 z" />
            <text x={94} y={576} fontSize={22} fill="white">ACTIVE</text>
            <text x={30} y={626} fontSize={28} letterSpacing={1} fill="#00ff00">{getCycleDates(navIdent.dateFromTo)}</text>

            {/* Second */}
            <text x={594} y={576} fontSize={22} fill="white">SECOND</text>
            <text x={542} y={626} fontSize={24} letterSpacing={1} fill="#00ff00">{getCycleDates(navIdent.previousFromTo)}</text>

            <Button x={323} y={562} width={130} height={50} onClick={handleSwap}>
                SWAP
                <tspan x={120} fontSize={20} fill="white">*</tspan>
            </Button>

            <path stroke="white" strokeWidth={1} d="m 18 671 h 726" />

            {/* Pilot stored elements */}
            <text x={29} y={719} fontSize={23} fill="white">PILOT STORED ELEMENTS</text>

            <text x={178} y={782} fontSize={23} textAnchor="end" fill="white">WAYPOINTS</text>
            <text x={188} y={783} fontSize={26} fill="#00ff00">00</text>

            <text x={178} y={832} fontSize={23} textAnchor="end" fill="white">NAVAIDS</text>
            <text x={188} y={833} fontSize={26} fill="#00ff00">00</text>

            <text x={375} y={782} fontSize={23} textAnchor="end" fill="white">ROUTES</text>
            <text x={385} y={783} fontSize={26} fill="#00ff00">00</text>

            <text x={375} y={832} fontSize={23} textAnchor="end" fill="white">RUNWAYS</text>
            <text x={385} y={833} fontSize={26} fill="#00ff00">00</text>

            <Button x={538} y={770} width={192} height={56}>
                <tspan dy={7}>DELETE ALL *</tspan>
            </Button>

            <Button x={10} y={905} width={120} height={40}>
                RETURN
            </Button>
        </>
    );
};
