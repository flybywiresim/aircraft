import React, { FunctionComponent } from 'react';

export const PageTitle: FunctionComponent<{ showMore: boolean, x: number, y: number }> = (props) => {
    const x = props.children === 'WHEEL' ? props.x + 20 : props.x;

    return (
        <>
            <text x={props.x} y={props.y} className="EcamPageTitle">{props.children}</text>

            {/* "MORE" label if showMore prop exists */}
            {props.showMore ? (
                <>
                    <text x={x + 105} y={props.y} className="EcamPageMore LS-8">...</text>
                    <text x={x + 125} y={props.y} className="EcamPageMore">
                        MORE
                    </text>
                </>
            ) : null}
        </>
    );
};
