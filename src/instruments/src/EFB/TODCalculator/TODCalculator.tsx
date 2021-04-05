import React from 'react';
import GroundSpeed from './GroundSpeed/GroundSpeed';
import Data from './Data/Data';
import Result from './Result/Result';

const TODCalculator = () => (
    <div className="flex p-6 w-full">
        <div className="w-4/12 mr-4">
            <GroundSpeed className="h-full flex flex-col" />
        </div>

        <div className="w-4/12 mr-4">
            <Data className="h-full flex flex-col" />
        </div>

        <div className="w-4/12">
            <Result className="h-full flex flex-col" />
        </div>
    </div>
);

export default TODCalculator;
