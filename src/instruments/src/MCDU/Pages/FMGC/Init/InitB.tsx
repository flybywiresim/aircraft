import React from 'react';
import { Content } from '../../../Components/Content';
import { LineHolder } from '../../../Components/Lines/LineHolder';
import { EmptyLine } from '../../../Components/Lines/EmptyLine';
import { Line, lineSides } from '../../../Components/Lines/Line';
import { StringField } from '../../../Components/Field/StringField';

export const InitBPage: React.FC = () => (
    <Content>
        <LineHolder>
            <EmptyLine />
            <Line value={<StringField value="WIP" nullValue="" side={lineSides.center} />} />
        </LineHolder>
    </Content>
);
