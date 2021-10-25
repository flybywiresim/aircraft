import React from 'react';
import classNames from 'classnames';

type CardProps = {
    title?: string,
    childrenContainerClassName?: string,
    className?: string,
};

const Card: React.FC<CardProps> = ({ title, childrenContainerClassName = '', children, className }) => (
    <div className={className}>
        {!!title && <h1 className="text-white font-medium mb-4 text-2xl">{title}</h1>}

        <div className={classNames(['bg-navy-lighter rounded-md p-6 text-white', childrenContainerClassName])}>
            {children}
        </div>
    </div>
);

export default Card;
