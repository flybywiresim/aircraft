/** Used to displayed data on a mcdu page when using the formatting helper */
class Column {
    /**
     * @param {number} index - valid range from 0 to 23
     * @param {string} text - text to be displayed
     * @param {...({ color: string } | { size: string } | { align: bool })} att - attributes of the text, e.g. text size, color and/or alignment
     */
    constructor(index, text, ...att) {
        this.raw = text;
        this.color = (att.find(e => e.color) || Column.white).color;
        this.length = text.length;
        this.anchorPos = !!att.find(e => e.align) ? index - this.length + 1 : index;
        const size = att.find(e => e.size);
        this.size = !!size ? [`{${size["size"]}}`, "{end}"] : ["", ""];
    }

    get text() {
        return `${this.size[0]}{${this.color}}${this.raw}{end}${this.size[1]}`;
    }
}

Column.right = { "align": true };
Column.small = { "size": "small" };
Column.big = { "size": "big" };
Column.amber = { "color": "amber" };
Column.red = { "color": "red" };
Column.green = { "color": "green" };
Column.cyan = { "color": "cyan" };
Column.white = { "color": "white" };
Column.magenta = { "color": "magenta" };
Column.yellow = { "color": "yellow" };
Column.inop = { "color": "inop" };

/**
 * Returns a formatted mcdu page template
 * @param {Column[][]} lines - mcdu lines
 * @returns {string[][]} mcdu template
 */
const FormatTemplate = lines => lines.map(line => FormatLine(...line));

/**
 * Returns a formatted mcdu line
 * @param {...Column} columns
 * @returns {string[]}
 */
function FormatLine(...columns) {
    columns.sort((a, b) => a.anchorPos - b.anchorPos);

    let line = "".padStart(24);
    let pos = -1; // refers to an imaginary index on the 24 char limited mcdu line
    let index = 0; // points at the "cursor" of the actual line

    for (const column of columns) {
        /* --------> populating text from left to right --------> */
        const newStart = column.anchorPos;
        const newEnd = newStart + column.length;

        // prevent adding empty or invalid stuff
        if (column.length === 0 || newEnd < 0 || newStart > 23 || newEnd <= pos) {
            continue;
        }

        if (pos === -1) {
            pos = 0;
        }

        // removes text overlap
        column.raw = column.raw.slice(Math.max(0, pos - newStart), Math.min(column.length, Math.max(1, column.length + 24 - newEnd)));

        const limMin = Math.max(0, newStart - pos);
        const limMax = Math.min(24, newEnd - pos);

        line = line.slice(0, index + limMin) + column.text + line.slice(index + limMax);
        index += limMin + column.text.length;
        pos = newEnd;
    }

    return [line.replace(/\s/g, '{sp}')];
}
