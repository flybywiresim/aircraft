import React, { useContext, useEffect } from 'react';
import { RootContext } from '../../../RootContext';
import { LineHolder } from '../../../Components/Lines/LineHolder';
import { Label } from '../../../Components/Lines/Label';
import { Line, lineColors, lineSides, lineSizes } from '../../../Components/Lines/Line';
import { lineSelectKeys } from '../../../Components/Buttons';
import { EmptyLine } from '../../../Components/Lines/EmptyLine';
import { Content } from '../../../Components/Content';
import { RowHolder } from '../../../Components/RowHolder';
import { StringField } from '../../../Components/Field/StringField';
import { NumberField } from '../../../Components/Field/NumberField';

// TODO when FMGS is in place then event and color management to these components

const CoRouteLine: React.FC = () => (
    <LineHolder>
        <Line value={<Label value="CO RTE" side={lineSides.left} />} />
        <Line value={(
            <StringField
                isInput
                value=""
                nullValue="__________"
                side={lineSides.left}
                color={lineColors.amber}
            />
        )}
        />
    </LineHolder>
);

// This is specifically not a split field line because of the operations of FROM/TO
const FromToLine: React.FC = () => (
    <LineHolder>
        <Line value={<Label value="FROM/TO" side={lineSides.right} />} />
        <Line value={(
            <StringField
                isInput
                value=""
                nullValue="____|____"
                side={lineSides.right}
                color={lineColors.amber}
                size={lineSizes.regular}
                lsk={lineSelectKeys.R1}
            />
        )}
        />
    </LineHolder>
);

// Should this be split field?
const AltDestLine: React.FC = () => (
    <LineHolder>
        <Line value={<Label value="ALTN/CO RTE" side={lineSides.left} />} />
        <Line value={(
            <StringField
                isInput
                value=""
                nullValue="----|----------"
                side={lineSides.left}
            />
        )}
        />
    </LineHolder>
);

const FlightNoLine: React.FC = () => (
    <LineHolder>
        <Line value={<Label value="FLT NBR" side={lineSides.left} />} />
        <Line value={(
            <StringField
                isInput
                value=""
                nullValue="________"
                side={lineSides.left}
                color={lineColors.amber}
            />
        )}
        />
    </LineHolder>
);

const WindTempLine: React.FC = () => (
    <LineHolder>
        <EmptyLine />
        <Line value={(
            <StringField
                value="WIND/TEMP>"
                nullValue=""
                side={lineSides.right}
            />
        )}
        />
    </LineHolder>
);

const CostIndexLine: React.FC = () => (
    <LineHolder>
        <Line value={<Label value="COST INDEX" side={lineSides.left} />} />
        <Line value={(
            <NumberField
                value={0}
                nullValue="___"
                min={100}
                max={999}
                side={lineSides.left}
                color={lineColors.amber}
                lsk={lineSelectKeys.L5}
            />
        )}
        />
    </LineHolder>
);

// TODO Parse the scratchpad input and do validation for split fields or find a way to do it in Line Component
const CruiseFLTemp: React.FC = () => (
    <LineHolder>
        <Line value={<Label value="CRZ FL/TEMP" side={lineSides.left} />} />
        <Line
            LeftSide={(
                <StringField
                    value=""
                    nullValue="-----"
                    side={lineSides.left}
                />
            )}
            RightSide={(
                <NumberField
                    value={0}
                    nullValue="___°"
                    min={100}
                    max={999}
                    side={lineSides.left}
                    color={lineColors.amber}
                />
            )}
        />
    </LineHolder>
);

// TODO finish this
const AlignOptionLine: React.FC = () => (
    <LineHolder>
        <EmptyLine />
        <EmptyLine />
    </LineHolder>
);

const TropoLine: React.FC = () => (
    <LineHolder>
        <Line value={<Label value="TROPO" side={lineSides.right} />} />
        <Line value={(
            <NumberField
                value={0}
                nullValue="36090"
                side={lineSides.right}
                max={60000}
                min={0}
            />
        )}
        />
    </LineHolder>
);

const GndTempLine: React.FC = () => (
    <LineHolder>
        <Line value={<Label value="GND TEMP" side={lineSides.right} />} />
        <Line value={(
            <NumberField
                value={0}
                nullValue="---°"
                side={lineSides.right}
                max={50}
                min={0}
                color={lineColors.inop}
            />
        )}
        />
    </LineHolder>
);

const RequestLine: React.FC = () => (
    <LineHolder>
        <Line value={<Label value="REQUEST*" side={lineSides.right} color={lineColors.amber} />} />
        <Line value={(
            <StringField
                value=""
                nullValue="INIT "
                side={lineSides.right}
                color={lineColors.amber}
            />
        )}
        />
    </LineHolder>
);

export const InitAPage: React.FC = () => {
    const [, , , setTitle] = useContext(RootContext);

    useEffect(() => {
        setTitle('INIT');
    }, []);

    return (
        <Content>
            <RowHolder index={1}>
                <CoRouteLine />
                <FromToLine />
            </RowHolder>
            <RowHolder index={2}>
                <AltDestLine />
                <RequestLine />
            </RowHolder>
            <RowHolder index={3}>
                <FlightNoLine />
                <AlignOptionLine />
            </RowHolder>
            <RowHolder index={4}>
                <WindTempLine />
            </RowHolder>
            <RowHolder index={5}>
                <CostIndexLine />
                <TropoLine />
            </RowHolder>
            <RowHolder index={6}>
                <CruiseFLTemp />
                <GndTempLine />
            </RowHolder>
        </Content>
    );
};
