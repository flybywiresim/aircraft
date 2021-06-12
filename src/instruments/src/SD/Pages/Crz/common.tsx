export const splitDecimals = (value, type) => {
    if (type === 'oil') {
        value = value * 0.01 * 25;
    } else if (type === 'vib') {
        value = value < 0 ? 0.0 : value;
    }
    const decimalSplit = value.toFixed(1).split('.', 2);
    return (decimalSplit);
};

export const valueRadianAngleConverter = (value, min, max, endAngle, startAngle) => {
    const valuePercentage = (value - min) / (max - min);
    let angle = (startAngle + 90 + (valuePercentage * (endAngle - startAngle)));
    angle *= (Math.PI / 180.0);
    return ({
        x: Math.cos(angle),
        y: Math.sin(angle),
    });
};

export const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180.0);
    return ({
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians)),
    });
};
