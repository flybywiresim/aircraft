import React from 'react';
import { NavigraphAuthUIWrapper } from '../../../Apis/Navigraph/Components/Authentication';
import { NavigraphChartUI } from './NavigraphChartUI';

export const NavigraphPage = () => (
    <NavigraphAuthUIWrapper>
        <NavigraphChartUI />
    </NavigraphAuthUIWrapper>
);
