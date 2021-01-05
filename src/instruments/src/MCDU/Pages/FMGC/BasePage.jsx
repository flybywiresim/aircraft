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
import PropTypes from 'prop-types';

const FieldObject = (props) => {
    const {
        objectText,
        objectClass,
        objectColor,
    } = props;
    return (
        <text className={objectClass}>
            <text className={objectColor}>
                {objectText}
            </text>
        </text>
    );
};

FieldObject.propTypes = {
    objectText: PropTypes.string.isRequired,
    objectClass: PropTypes.string.isRequired,
    objectColor: PropTypes.string.isRequired,
};

const LineObject = (props) => {
    const {
        leftLabel,
        rightLabel,
        leftField,
        rightField,
    } = props;
    return (
        <view>
            <view>
                <FieldObject
                    objectText={leftLabel.text}
                    objectClass={leftLabel.class}
                    objectColor={leftLabel.color}
                />
                <FieldObject
                    objectText={rightLabel.text}
                    objectClass={rightLabel.class}
                    objectColor={rightLabel.color}
                />
            </view>
            <view>
                <FieldObject
                    objectText={leftField.text}
                    objectClass={leftField.class}
                    objectColor={leftField.color}
                />
                <FieldObject
                  objectText={rightField.text}
                  objectClass={rightField.class}
                  objectColor={rightField.color}
                />
            </view>
        </view>
    );
};

LineObject.propTypes = {
    leftLabel: PropTypes.shape({
        text: PropTypes.string,
        class: PropTypes.string,
        color: PropTypes.string,
    }).isRequired,
    rightLabel: PropTypes.shape({
        text: PropTypes.string,
        class: PropTypes.string,
        color: PropTypes.string,
    }).isRequired,
    leftField: PropTypes.shape({
        text: PropTypes.string,
        class: PropTypes.string,
        color: PropTypes.string,
    }).isRequired,
    rightField: PropTypes.shape({
        text: PropTypes.string,
        class: PropTypes.string,
        color: PropTypes.string,
    }).isRequired,

};

const BasePage = (props) => {
    const {
        labels,
        data,
    } = props;
    return (
        <view className="bg">
            <LineObject
                leftLabel={labels.L0}
                rightLabel={labels.R0}
                leftField={data.L0}
                rightField={data.R0}
            />
            <LineObject
                leftLabel={labels.L1}
                rightLabel={labels.R1}
                leftField={data.L1}
                rightField={data.R1}
            />
            <LineObject
                leftLabel={labels.L2}
                rightLabel={labels.R2}
                leftField={data.L2}
                rightField={data.R2}
            />
            <LineObject
                leftLabel={labels.L3}
                rightLabel={labels.R3}
                leftField={data.L3}
                rightField={data.R3}
            />
            <LineObject
                leftLabel={labels.L4}
                rightLabel={labels.R4}
                leftField={data.L4}
                rightField={data.R4}
            />
            <LineObject
                leftLabel={labels.L5}
                rightLabel={labels.R5}
                leftField={data.L5}
                rightField={data.R5}
            />
        </view>
    );
};

BasePage.propTypes = {
    labels: PropTypes.oneOfType(LineObject).isRequired,
    data: PropTypes.oneOfType(LineObject).isRequired,
};

export default BasePage;
