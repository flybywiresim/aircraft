import './Text.scss';

export const Text = (props) => {
    const {
        x, y,
        unit, bigValue, value, title,
        alignEnd, alignStart,
        children,
    } = props;

    // eslint-disable-next-line no-nested-ternary
    const produceTextWithClass = (className) => <text x={x} y={y} textAnchor={alignEnd ? 'end' : (alignStart ? 'start' : 'middle')} className={`text-${className}`}>{children}</text>;

    if (unit) {
        return produceTextWithClass('unit');
    }

    if (value) {
        return produceTextWithClass('value');
    }

    if (bigValue) {
        return produceTextWithClass('big-value');
    }

    if (title) {
        return produceTextWithClass('title');
    }

    return produceTextWithClass('value');
};
