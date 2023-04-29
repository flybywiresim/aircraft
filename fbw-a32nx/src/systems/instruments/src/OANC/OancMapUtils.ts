// Code adapted from https://www.jeffreythompson.org/collision-detection/line-rect.php

export function intersectLineWithRectangle(x1: number, y1: number, x2: number, y2: number, rx: number, ry: number, rw: number, rh: number): [number, number][] {
    // check if the line has hit any of the rectangle's sides
    // uses the Line/Line function below
    const left = lineLine(x1, y1, x2, y2, rx, ry, rx, ry + rh);
    const right = lineLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh);
    const top = lineLine(x1, y1, x2, y2, rx, ry, rx + rw, ry);
    const bottom = lineLine(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh);

    const ret = [];

    if (left) {
        ret.push(left);
    }
    if (right) {
        ret.push(right);
    }
    if (top) {
        ret.push(top);
    }
    if (bottom) {
        ret.push(bottom);
    }

    return ret;
}

function lineLine(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): [number, number] | undefined {
    // calculate the direction of the lines
    const uA = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
    const uB = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

    // if uA and uB are between 0-1, lines are colliding
    if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
        // optionally, draw a circle where the lines meet
        const intersectionX = x1 + (uA * (x2 - x1));
        const intersectionY = y1 + (uA * (y2 - y1));

        return [intersectionX, intersectionY];
    }

    return undefined;
}
