import React from 'react';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';

export const LightPresets = () => (
    <div className="w-full">
        <div className="flex flex-row items-end space-x-4">
            <h1 className="font-bold">Light Presets</h1>
        </div>
        <div className="p-4 mt-4 rounded-lg border-2 border-theme-accent">
            <ScrollableContainer height={52}>
                <div className="grid grid-cols-4 grid-rows-4 grid-flow-row gap-4">
                    TEST
                </div>
            </ScrollableContainer>
        </div>
    </div>
);
