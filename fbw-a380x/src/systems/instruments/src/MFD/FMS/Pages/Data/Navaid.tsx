import React, { useState } from 'react';
import { useNavDatabase } from '@instruments/common/flightplan';
import { VhfNavaid, VhfNavaidType } from 'msfs-navdata';
import { MathUtils } from '@shared/MathUtils';
import { Layer } from '../../../Components/Layer';
import { Tab, TabSet } from '../../../Components/tabs';
import { Button } from '../../../Components/Button';
import { TextBox } from '../../../Components/Textbox';

export const Page = () => {
    const database = useNavDatabase();
    const [currentNavaid, setCurrentNavaid] = useState<VhfNavaid>();

    const hanldeNavaidSelection = async (ident: string) => {
        setCurrentNavaid((await database.getNavaids(ident))[0]);
    };

    return (
        <Layer y={140}>
            <TabSet x={8} y={50} width={750} height={710}>
                <Tab title="DATABASE NAVAIDS" />
                <Tab title="PILOT STORED NAVAIDS" />
            </TabSet>

            <text x={130} y={137} fontSize={22} fill="#fff">NAVAID IDENT</text>
            <TextBox x={334} y={109} width={96} height={38} maxLength={3} onSubmit={hanldeNavaidSelection} />

            <text x={171} y={210} fontSize={22} fill="#fff">CLASS</text>
            <text x={267} y={213} fontSize={29} fill="lime">{currentNavaid?.type && VhfNavaidType[currentNavaid?.type]}</text>

            <text x={128} y={269} fontSize={22} fill="#fff">LAT/LONG</text>
            <text x={267} y={272} fontSize={29} fill="lime">
                {currentNavaid?.vorLocation && MathUtils.convertDMS(currentNavaid?.vorLocation.lat ?? 0, currentNavaid?.vorLocation.lon ?? 0)}
            </text>

            <text x={113} y={331} fontSize={22} fill="#fff">ELEVATION</text>
            {(currentNavaid?.vorLocation?.alt ?? currentNavaid?.dmeLocation?.alt) && (
                <text x={307} y={334} fontSize={29} fill="lime">
                    {currentNavaid?.vorLocation?.alt ?? currentNavaid?.dmeLocation?.alt}
                    <tspan dx={5} dy={-5} fill="blue" fontSize={22}>FT</tspan>
                </text>
            )}

            <text x={113} y={390} fontSize={22} fill="#fff">RWY IDENT</text>
            <text x={267} y={393} fontSize={29} fill="lime">{}</text>

            <text x={185} y={471} fontSize={22} fill="#fff">FREQ</text>
            <text x={266} y={473} fontSize={29} fill="lime">{currentNavaid?.frequency}</text>

            <text x={199} y={532} fontSize={22} fill="#fff">CAT</text>
            <text x={265} y={534} fontSize={29} fill="lime">{}</text>

            <text x={200} y={591} fontSize={22} fill="#fff">CRS</text>
            {currentNavaid
                && (
                    <text x={293} y={593} fontSize={29} fill="lime">
                        {/* Add bearing here when available */}
                        <tspan dx={5} dy={-5} fill="blue" fontSize={22}>°</tspan>
                    </text>
                )}

            <text x={70} y={641} fontSize={22} fill="#fff">FIG OF MERIT</text>
            <text x={272} y={644} fontSize={29} fill="lime">{currentNavaid?.figureOfMerit}</text>

            <Button x={4} y={766} width={127} height={40}>
                RETURN
            </Button>
        </Layer>
    );
};
