import './Text.scss';

export const Text = (props) => {
    const {
        x, y,
        unit, bigValue, value, title, warning,
        alignEnd, alignStart,
        children,
    } = props;

    let textAnchor = 'middle';
    if (alignEnd) {
        textAnchor = 'end';
    } else if (alignStart) {
        textAnchor = 'start';
    }
    const produceTextWithClass = (className) => <text x={x} y={y} textAnchor={textAnchor} className={`text-${className}`}>{children}</text>;

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

    if (warning) {
        return produceTextWithClass('warning');
    }

    return produceTextWithClass('value');
};
