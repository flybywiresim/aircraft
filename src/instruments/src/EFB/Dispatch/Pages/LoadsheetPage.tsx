import React from 'react';

type LoadsheetPageProps = {
    loadsheet: string
};

const WeightWidget = (props: LoadsheetPageProps) => {

    return (
        <div className="px-6">
            <div className="w-full">
                <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-y-scroll">
                    <iframe className="w-full h-128" src="" />
                </div>
            </div>
        </div>
    );
};

export default WeightWidget;