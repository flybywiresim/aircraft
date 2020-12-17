import React, { ReactElement } from 'react';
import './styles.scss';
import { LineHolder } from './Lines/LineHolder';
import { RowHolder } from './RowHolder';

function handleChildInsertion(children: any, value: number) : ReactElement {
    let node = (
        <RowHolder>
            <LineHolder />
        </RowHolder>
    );
    for (const child of React.Children.toArray(children)) {
        if (React.isValidElement(child)) {
            const { index } = child.props;
            if (value === index) {
                node = child;
            }
        }
    }
    return node;
}
const Content: React.FC = ({ children }) => (
    <div className="column-holder">
        {[1, 2, 3, 4, 5, 6].map((value) => (
            <>
                {handleChildInsertion(children, value)}
            </>
        ))}
    </div>
);

export { Content };
