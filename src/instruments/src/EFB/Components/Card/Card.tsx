import React from 'react';
import classNames from 'classnames';

type CardProps = {
    title?: string,
    childrenContainerClassName?: string
};

const Card: React.FC<CardProps> = ({ title, childrenContainerClassName = '', children, ...props }) => (
    <div {...props}>
        {!!title && <h1 className="text-white font-medium mb-4 text-2xl">{title}</h1>}

        <div className={classNames(['bg-navy-lighter rounded-2xl p-6 text-white shadow-lg', childrenContainerClassName])}>
            {children}
        </div>
    </div>
);

export default Card;
