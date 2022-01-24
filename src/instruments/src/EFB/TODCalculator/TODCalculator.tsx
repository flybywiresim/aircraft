import React from 'react';
import GroundSpeed from './GroundSpeed/GroundSpeed';
import Data from './Data/Data';
import Result from './Result/Result';

export const TODCalculator = () => (
    <div className="flex mt-6 w-full">
        <div className="mr-4 w-4/12">
            <GroundSpeed className="flex flex-col h-full" />
        </div>

        <div className="mr-4 w-4/12">
            <Data className="flex flex-col h-full" />
        </div>

        <div className="w-4/12">
            <Result className="flex flex-col h-full" />
        </div>
    </div>
);
