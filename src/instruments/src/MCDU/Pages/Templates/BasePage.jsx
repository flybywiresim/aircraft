/*
 * A32NX
 * Copyright (C) 2020 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import './styles.scss';

const McduLabels = {
    L0: {
        text: 'label1',
        class: 'big',
        color: 'white',
    },
    L1: {
        text: 'label2',
        class: 'big',
        color: 'white',
    },
    L2: {
        text: 'label3',
        class: 'big',
        color: 'white',
    },
    L3: {
        text: 'label4',
        class: 'big',
        color: 'white',
    },
    L4: {
        text: 'label5',
        class: 'big',
        color: 'white',
    },
    L5: {
        text: 'label6',
        class: 'big',
        color: 'white',
    },
    R0: {
        text: 'label1',
        class: 'big',
        color: 'white',
    },
    R1: {
        text: 'label2',
        class: 'big',
        color: 'white',
    },
    R2: {
        text: 'label3',
        class: 'big',
        color: 'white',
    },
    R3: {
        text: 'label4',
        class: 'big',
        color: 'white',
    },
    R4: {
        text: 'label5',
        class: 'big',
        color: 'white',
    },
    R5: {
        text: 'label6',
        class: 'big',
        color: 'white',
    },
};

const McduText = {
    L0: {
        text: 'LEFT DATA 1',
        class: 'small',
        color: 'green',
    },
    L1: {
        text: 'LEFT DATA 2',
        class: 'small',
        color: 'green',
    },
    L2: {
        text: 'LEFT DATA 3',
        class: 'small',
        color: 'green',
    },
    L3: {
        text: 'LEFT DATA 4',
        class: 'small',
        color: 'green',
    },
    L4: {
        text: 'LEFT DATA 5',
        class: 'small',
        color: 'green',
    },
    L5: {
        text: 'LEFT DATA 6',
        class: 'small',
        color: 'green',
    },
    R0: {
        text: 'RIGHT DATA 1',
        class: 'small',
        color: 'green',
    },
    R1: {
        text: 'RIGHT DATA 2',
        class: 'small',
        color: 'green',
    },
    R2: {
        text: 'RIGHT DATA 3',
        class: 'small',
        color: 'green',
    },
    R3: {
        text: 'RIGHT DATA 4',
        class: 'small',
        color: 'green',
    },
    R4: {
        text: 'RIGHT DATA 5',
        class: 'small',
        color: 'green',
    },
    R5: {
        text: 'RIGHT DATA 6',
        class: 'small',
        color: 'green',
    },
};

const Label = ({
    side, text, color, size,
}) => {
    const textClass = `${side}__${size}`;
    return (
        <text y="-6%" className={textClass}><tspan className={color}>{text}</tspan></text>
    );
};

const Field = ({
    side, text, color, size,
}) => {
    const textClass = `${side}__${size}`;
    return (
        <text className={textClass}><tspan className={color}>{text}</tspan></text>
    );
};

const LeftSide = ({ labels, data }) => {
    const side = 'left';
    return (
        <g id="left_side">
            <g transform="translate(0 256)">
                <Label side={side} color={labels.L0.color} text={labels.L0.text} size={labels.L0.class} />
                <Field side={side} color={data.L0.color} text={data.L0.text} size={data.L0.class} />
            </g>
            <g transform="translate(0 384)">
                <Label side={side} color={labels.L1.color} text={labels.L1.text} size={labels.L1.class} />
                <Field side={side} color={data.L1.color} text={data.L1.text} size={data.L1.class} />
            </g>
            <g transform="translate(0 512)">
                <Label side={side} color={labels.L2.color} text={labels.L2.text} size={labels.L2.class} />
                <Field side={side} color={data.L2.color} text={data.L2.text} size={data.L2.class} />
            </g>
            <g transform="translate(0 640)">
                <Label side={side} color={labels.L3.color} text={labels.L3.text} size={labels.L3.class} />
                <Field side={side} color={data.L3.color} text={data.L3.text} size={data.L3.class} />
            </g>
            <g transform="translate(0 768)">
                <Label side={side} color={labels.L4.color} text={labels.L4.text} size={labels.L4.class} />
                <Field side={side} color={data.L4.color} text={data.L4.text} size={data.L4.class} />
            </g>
            <g transform="translate(0 896)">
                <Label side={side} color={labels.L5.color} text={labels.L5.text} size={labels.L5.class} />
                <Field side={side} color={data.L5.color} text={data.L5.text} size={data.L5.class} />
            </g>
        </g>
    );
};

const RightSide = ({ labels, data }) => {
    const side = 'right';
    return (
        <g id="right_side">
            <g transform="translate(1024 256)">
                <Label side={side} color={labels.R0.color} text={labels.R0.text} size={labels.R0.class} />
                <Field side={side} color={data.R0.color} text={data.R0.text} size={data.R0.class} />
            </g>
            <g transform="translate(1024 384)">
                <Label side={side} color={labels.R1.color} text={labels.R1.text} size={labels.R1.class} />
                <Field side={side} color={data.R1.color} text={data.R1.text} size={data.R1.class} />
            </g>
            <g transform="translate(1024 512)">
                <Label side={side} color={labels.R2.color} text={labels.R2.text} size={labels.R2.class} />
                <Field side={side} color={data.R2.color} text={data.R2.text} size={data.R2.class} />
            </g>
            <g transform="translate(1024 640)">
                <Label side={side} color={labels.R3.color} text={labels.R3.text} size={labels.R3.class} />
                <Field side={side} color={data.R3.color} text={data.R3.text} size={data.R3.class} />
            </g>
            <g transform="translate(1024 768)">
                <Label side={side} color={labels.R4.color} text={labels.R4.text} size={labels.R4.class} />
                <Field side={side} color={data.R4.color} text={data.R4.text} size={data.R4.class} />
            </g>
            <g transform="translate(1024 896)">
                <Label side={side} color={labels.R5.color} text={labels.R5.text} size={labels.R5.class} />
                <Field side={side} color={data.R5.color} text={data.R5.text} size={data.R5.class} />
            </g>
        </g>
    );
};

const BasePage = (props) => {
    const {
        labels,
        data,
    } = props;
    return (
        <g id="page">
            <LeftSide labels={labels} data={data} />
            <RightSide labels={labels} data={data} />
        </g>
    );
};

export { BasePage, McduLabels, McduText };
