import React, { useEffect, useState } from 'react';
import { useActiveOrTemporaryFlightPlan } from '@instruments/common/flightplan';
import { useHistory } from 'react-router-dom';
import { NavigationDatabaseService } from '@fmgc/flightplanning/new/NavigationDatabaseService';
import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { Layer } from '../../../../Components/Layer';
import { TextBox } from '../../../../Components/Textbox';
import { Button } from '../../../../Components/Button';
import { Arrows } from '../../../../Components/Arrows';

const rowSpacing = 59;

export const Page = ({ legIndex }: { legIndex: number }) => {
    const [flightPlan, isTemporary] = useActiveOrTemporaryFlightPlan();
    const [scrollIndex, setScrollIndex] = useState(0);
    const [dctNext, setDctNext] = useState(false);

    const history = useHistory();
    const currentLeg = flightPlan.allLegs[legIndex];

    useEffect(() => {
        FlightPlanService.startAirwayEntry(legIndex);
    }, []);

    const handleSubmitAirway = (ident: string) => {
        if (ident === 'DCT') {
            setDctNext(true);
        }

        NavigationDatabaseService.activeDatabase.searchAirway(ident).then((airways) => {
            if (flightPlan.pendingAirways) {
                for (const airway of airways) {
                    const success = flightPlan.pendingAirways.thenAirway(airway);

                    if (success) {
                        break;
                    }
                }
            }
        });

        return true;
    };

    const handleSubmitTo = (ident: string) => {
        NavigationDatabaseService.activeDatabase.searchFix(ident).then((fixes) => {
            if (flightPlan.pendingAirways) {
                for (const fix of fixes) {
                    const success = flightPlan.pendingAirways.thenTo(fix);

                    if (success) {
                        setDctNext(false);
                        break;
                    }
                }
            }
        });

        return true;
    };

    const handleScrollUp = () => setScrollIndex((old) => Math.max(0, old - 1));

    const handleScrollDown = () => setScrollIndex((old) => {
        if (flightPlan.pendingAirways) {
            const elementCount = flightPlan.pendingAirways.elements.length;

            const elemsLeft = elementCount - old;
            if (elemsLeft < 11) {
                return old;
            }

            if (old + 1 < elementCount) {
                return old + 1;
            }
        }

        return old;
    });

    const viaToTable = () => {
        const elements = flightPlan.pendingAirways?.elements;

        if (elements) {
            const rows: JSX.Element[] = [];

            const elementsLeft = elements.length - scrollIndex;
            const virtualScrollEnd = scrollIndex + Math.min(elementsLeft, 11);

            for (let i = scrollIndex; i < virtualScrollEnd; i++) {
                const element = elements[i];

                const virtualIndex = i - scrollIndex;

                const textColor = (element.airway && element.to) || element.isDct ? 'yellow' : 'cyan';

                rows.push(
                    <>
                        <text x={72} y={96 + virtualIndex * rowSpacing} fontSize={22} fill="#fff">VIA</text>

                        <TextBox
                            x={124}
                            y={67 + virtualIndex * rowSpacing}
                            width={116}
                            height={38}
                            defaultValue={element.airway?.ident ?? 'DCT'}
                            textColor={textColor}
                            maxLength={5}
                        />

                        {element.airway?.turnRadius && (
                            <text className="Yellow" x={72} y={96 + virtualIndex * rowSpacing} fontSize={22}>
                                <tspan>FIXED TURN</tspan>
                                <tspan dx={-5} dy={12}>RADIUS AIRWAY</tspan>
                            </text>
                        )}

                        <text x={499} y={96 + virtualIndex * rowSpacing} fontSize={22} fill="#fff">TO</text>

                        <TextBox
                            x={537}
                            y={67 + virtualIndex * rowSpacing}
                            width={156}
                            height={38}
                            placeholder="-------"
                            defaultValue={element.to?.ident ?? ''}
                            textColor={textColor}
                            autoFilled={element.isAutoConnected}
                            textAnchor="middle"
                            maxLength={7}
                            onSubmit={handleSubmitTo}
                        />
                        {' '}
                        // FIXME
                    </>,
                );
            }

            const spacing = (virtualScrollEnd - scrollIndex) * rowSpacing;

            rows.push(
                <>
                    <text x={72} y={96 + spacing} fontSize={22} fill="#fff">VIA</text>
                    <TextBox x={124} y={67 + spacing} width={116} height={38} placeholder="---" defaultValue={dctNext ? 'DCT' : undefined} textColor="cyan" onSubmit={handleSubmitAirway} maxLength={5} />
                    {' '}

                    {dctNext && (
                        <>
                            <text x={499} y={96 + spacing} fontSize={22} fill="#fff">TO</text>

                            <TextBox
                                x={537}
                                y={67 + spacing}
                                width={156}
                                height={38}
                                placeholder="-------"
                                textColor="cyan"
                                textFontSize={29}
                                maxLength={7}
                                onSubmit={handleSubmitTo}
                            />
                        </>
                    )}
                    // FIXME
                </>,
            );

            rows.length = 11;

            return rows;
        }
    };

    return (
        <Layer x={0} y={140}>
            <text x={20} y={34} fontSize={22} fill="#fff">AIRWAYS FROM</text>
            <text x={221} y={36} fontSize={29} fill="#ff0">{currentLeg.ident}</text>
            <rect x={62} y={52} width={645} height={665} fill="none" stroke="#fff" strokeWidth={2} />

            {viaToTable()}

            <Button x={314} y={724} width={63} height={59} onClick={handleScrollUp}>
                <Arrows x={32} y={30} />
            </Button>
            <Button x={386} y={724} width={63} height={59} onClick={handleScrollDown}>
                <Arrows x={32} y={30} angle={180} />
            </Button>

            {isTemporary && (
                <Button x={601} y={770} width={161} height={43} onClick={() => history.push('/fms/active/f-pln')}>
                    <tspan fill="yellow">TMPY F-PLN</tspan>
                </Button>
            )}
        </Layer>
    );
};
