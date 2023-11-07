import { useInteractionEvent } from '@instruments/common/hooks';
import React from 'react';
import { Redirect, Route, Switch, useHistory } from 'react-router-dom';
import { Layer } from '../../Components/Layer';

export const MenuPage = () => {
    const history = useHistory();
    useInteractionEvent(`A380X_RMPL_LSK2_PRESSED`, () => history.push('/nav'));
    return (
        <Layer>
            <text x={832} y={75} fontSize={80} textAnchor="middle" dominantBaseline="middle" fontFamily="RMP-11" fill="white">MENU</text>
            <text x={1600} y={450} fontSize={80} fontFamily="RMP-11" textAnchor="end" fill="white">{"DATALINK STATUS >"}</text>
        </Layer>
    )
};
