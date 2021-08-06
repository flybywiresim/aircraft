import React from 'react';

export const EcamPage: React.FC<{name: string}> = ({ name, children }) => (
    <svg id={name} viewBox="0 0 600 600" style={{ marginTop: '-60px' }} xmlns="http://www.w3.org/2000/svg">
        {children}
    </svg>
);
