import React from 'react';
import { Content } from '../../../Components/Content';
import { LineHolder } from '../../../Components/Lines/LineHolder';
import { EmptyLine } from '../../../Components/Lines/EmptyLine';
import { Line, lineColors, lineSides, lineSizes } from '../../../Components/Lines/Line';
import { Field } from '../../../Components/Fields/NonInteractive/Field';

export const InitBPage: React.FC = () => (
    <Content>
        <LineHolder>
            <EmptyLine />
            <Line side={lineSides.center} value={<Field value="WIP" color={lineColors.white} size={lineSizes.regular} />} />
        </LineHolder>
    </Content>
);
