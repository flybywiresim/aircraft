/* global Avionics */
import React, { useEffect, useState } from 'react';
import { FlightPlanManager } from '@fmgc/flightplanning/FlightPlanManager';
import { useSimVar } from '@instruments/common/simVars';
import { WaypointStats } from '@fmgc/flightplanning/data/flightplan';
import * as Helper from '@fmgc/utils/helpers';
import { LineSelectField } from '../../../Components/Fields/Interactive/LineSelectField';
import { LINESELECT_KEYS } from '../../../Components/Buttons';
import { mcduState } from '../../../redux/reducers/mcduReducer';
import { Field } from '../../../Components/Fields/NonInteractive/Field';
import { LabelField } from '../../../Components/Fields/NonInteractive/LabelField';
import { LineHolder } from '../../../Components/Holders/LineHolder';
import { RowHolder } from '../../../Components/Holders/RowHolder';
import { lineColors, lineSides, lineSizes } from '../../../Components/Lines/LineProps';
import { EmptyLine } from '../../../Components/Lines/EmptyLine';
import { Markers } from './Fplan';

type WaypointInfoProps = {
    fpm: FlightPlanManager
}
// TODO: Finish this
const WaypointInfo: React.FC<WaypointInfoProps> = () => (
    <>
    </>
);

const EmptyFPlan: React.FC = () => (
    <>
        <RowHolder columns={3}>
            <LineHolder columnPosition={1}>
                <EmptyLine />
                <Field lineSide={lineSides.left} value="PPOS" color={lineColors.green} size={lineSizes.regular} />
            </LineHolder>
            <LineHolder columnPosition={2}>
                <LabelField lineSide={lineSides.center} value="TIME" color={lineColors.white} />
                <Field lineSide={lineSides.center} value="----" color={lineColors.white} size={lineSizes.regular} />
            </LineHolder>
            <LineHolder columnPosition={3}>
                <LabelField lineSide={lineSides.left} value="  SPD/ALT" color={lineColors.white} />
                <Field lineSide={lineSides.right} value="---/ -----" color={lineColors.white} size={lineSizes.regular} />
            </LineHolder>
        </RowHolder>
        <RowHolder columns={1}>
            <LineHolder columnPosition={1}>
                <EmptyLine />
                <Field lineSide={lineSides.center} value={Markers.FPLN_DISCONTINUITY} color={lineColors.white} size={lineSizes.regular} />
            </LineHolder>
        </RowHolder>
        <RowHolder columns={1}>
            <LineHolder columnPosition={1}>
                <EmptyLine />
                <Field lineSide={lineSides.center} value={Markers.END_OF_FPLN} color={lineColors.white} size={lineSizes.regular} />
            </LineHolder>
        </RowHolder>
        <RowHolder columns={1}>
            <LineHolder columnPosition={1}>
                <EmptyLine />
                <Field lineSide={lineSides.center} value={Markers.NO_ALTN_FPLN} color={lineColors.white} size={lineSizes.regular} />
            </LineHolder>
        </RowHolder>
        <RowHolder columns={1}>
            <EmptyLine />
        </RowHolder>
    </>
);

type DestinationInfoProps = {
    fpm: FlightPlanManager,
    stats: Map<number, WaypointStats>
    eraseTemporaryFlightPlan: (fpm: FlightPlanManager) => void
    insertTemporaryFlightPlan: (fpm: FlightPlanManager) => void
}
const DestinationInfo: React.FC<DestinationInfoProps> = ({ fpm, stats, insertTemporaryFlightPlan, eraseTemporaryFlightPlan }) => {
    const [destination, setDestination] = useState(['', '----']);
    const [destinationColor, setDestinationColor] = useState([lineColors.white, lineColors.white]);

    const [distEfob, setDistEfob] = useState('---- ----');
    const [distEfobColor, setDistEfobColor] = useState(lineColors.white);

    const [destinationTime, setDestionatiomTime] = useState(['TIME', '----']);
    const [destinationTimeColor, setDestionatiomTimeColor] = useState([lineColors.white, lineColors.white]);

    useEffect(() => {
        if (fpm.isCurrentFlightPlanTemporary()) {
            setDestination(['', '{ERASE']);
            setDestinationColor([destinationColor[0], lineColors.amber]);
            setDistEfob('');
        } else {
            let destCell = '----';
            let destTimeCell = '----';
            let approachRunway: undefined | any = undefined;
            if (fpm.getDestination()) {
                destCell = fpm.getDestination().ident;
                approachRunway = fpm.getApproachRunway();
                if (approachRunway) {
                    destCell += Avionics.Utils.formatRunway(approachRunway.designation);
                }

                const destStats = stats.get(fpm.getCurrentFlightPlan().waypoints.length - 1);
                if (destStats) destTimeCell = Helper.secondsTohhmm(destStats?.timeFromPpos);
            }
            setDestination([' DEST', destCell]);
            setDestinationColor([lineColors.white, lineColors.white]);
            setDestionatiomTime([destinationTime[0], destTimeCell]);
        }
    }, [fpm]);

    const handleRSK = () => {
        if (fpm.isCurrentFlightPlanTemporary()) {
            insertTemporaryFlightPlan(fpm);
        }
    };

    const handleLSK = () => {
        if (fpm.isCurrentFlightPlanTemporary()) {
            eraseTemporaryFlightPlan(fpm);
        } else {
            // TODO: place Lateral Revision Page here
        }
    };

    return (
        <RowHolder columns={3}>
            <LineHolder columnPosition={1}>
                <LabelField lineSide={lineSides.left} value={destination[0]} color={destinationColor[0]} />
                <LineSelectField
                    lineSide={lineSides.left}
                    value={destination[1]}
                    color={destinationColor[1]}
                    size={lineSizes.regular}
                    lsk={LINESELECT_KEYS.L6}
                    selectedCallback={() => handleLSK()}
                />
            </LineHolder>
            <LineHolder columnPosition={2}>
                <LabelField lineSide={lineSides.center} value={destinationTime[0]} color={destinationTimeColor[0]} />
                <Field lineSide={lineSides.center} value={destinationTime[1]} color={destinationTimeColor[1]} size={lineSizes.regular} />
            </LineHolder>
            <LineHolder columnPosition={3}>
                <LabelField lineSide={lineSides.right} value="DIST  EFOB" color={lineColors.white} />
                <LineSelectField
                // TODO: add hooks for this
                    lineSide={lineSides.right}
                    value="----  ----"
                    color={lineColors.white}
                    size={lineSizes.regular}
                    lsk={LINESELECT_KEYS.R6}
                    selectedCallback={() => handleRSK()}
                />
            </LineHolder>
        </RowHolder>
    );
};

const updateWaypointsAndMarkers = (fpm: FlightPlanManager) => {
    const waypointsAndMarkers:any[] = [];
    for (let i = 0; i < fpm.getWaypointsCount(); i++) {
        const wp = fpm.getWaypoint(i);
        waypointsAndMarkers.push({ wp: fpm.getWaypoint(i), fpIndex: i });
        if (wp.endsInDiscontinuity) {
            waypointsAndMarkers.push({ marker: Markers.FPLN_DISCONTINUITY, fpIndex: i });
        }
        if (i === fpm.getWaypointsCount() - 1) {
            waypointsAndMarkers.push({ marker: Markers.END_OF_FPLN, fpIndex: i });
            // TODO: Rewrite once alt fpln exists
            waypointsAndMarkers.push({ marker: Markers.NO_ALTN_FPLN, fpIndex: i });
        }
    }
    return waypointsAndMarkers;
};

type FPlanAPageProps = {
    setTitlebarText: (text: string) => void
    fmgc: mcduState
    eraseTemporaryFlightPlan: (fpm: FlightPlanManager) => void
    insertTemporaryFlightPlan: (fpm: FlightPlanManager) => void
}
const FPlanPage: React.FC<FPlanAPageProps> = ({ setTitlebarText, fmgc, insertTemporaryFlightPlan, eraseTemporaryFlightPlan }) => {
    const fpm = fmgc.flightPlanManager;
    const [waypointsAndMarkers, setWaypointsAndMarkers] = useState<any[]>(updateWaypointsAndMarkers(fpm));
    // FIXME: Can I use simvarGetter instead?
    const [lat] = useSimVar('PLANE LATITUDE', 'degree latitude');
    const [long] = useSimVar('PLANE LONGITUDE', 'degree longitude');
    const ppos = { lat, long };
    const stats = fpm.getCurrentFlightPlan().computeWaypointStatistics(ppos);

    useEffect(() => {
        setTitlebarText('TODOA');
    });

    useEffect(() => {
        setWaypointsAndMarkers(updateWaypointsAndMarkers(fpm));
    }, [fmgc.flightPlanManager]);

    return (
        <>
            {waypointsAndMarkers.length === 0
                ? <EmptyFPlan />
                : <WaypointInfo fpm={fmgc.flightPlanManager} />}
            <DestinationInfo
                fpm={fpm}
                stats={stats}
                eraseTemporaryFlightPlan={eraseTemporaryFlightPlan}
                insertTemporaryFlightPlan={insertTemporaryFlightPlan}
            />
        </>
    );
};

export default FPlanPage;
