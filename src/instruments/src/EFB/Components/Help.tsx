import { IconHelp } from '@tabler/icons';
import React, { useState } from 'react';

type HelpProps = {
    title: string
};

export const Help: React.FC<HelpProps> = ({ title, children }) => {
    const [isModalShown, setIsModalShown] = useState(false);

    return (
        <>
            <a onClick={() => setIsModalShown(true)}>
                <IconHelp className="text-gray-500 hover:text-blue-light" size={25} stroke={1.5} />
            </a>
            {isModalShown
            && (
                <div className="fixed bg-gray-600 rounded-lg flex flex-col top-1/2 left-1/2 w-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                    <a onClick={() => setIsModalShown(false)} className="absolute text-2xl top-3 right-5 cursor-pointer">X</a>
                    <div className="text-center p-5 text-3xl">
                        {title}
                    </div>
                    <div className="py-5 px-10 flex flex-col justify-center items-center">
                        {children}
                    </div>
                </div>
            )}
        </>
    );
};
