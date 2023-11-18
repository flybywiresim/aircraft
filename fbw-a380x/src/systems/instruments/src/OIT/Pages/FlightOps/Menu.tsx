import React, { FC } from 'react';
import { useHistory } from 'react-router-dom';

export const MenuPage: FC = () => {
    const history = useHistory();
    return (
        <>
            <text x={512} y={384} fontSize={22} fill="#fff" textAnchor="middle">FLT OPS MENU</text>
        </>
    );
};
