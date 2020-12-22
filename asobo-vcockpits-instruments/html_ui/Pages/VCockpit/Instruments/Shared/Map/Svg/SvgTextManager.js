class ManagedText {
    constructor(owner, priority, text, rect) {
        this.owner = owner;
        this.priority = priority;
        this.text = text;
        this.rect = rect;
        this.flagShow = false;
    }
}
class SvgTextManager {
    constructor() {
        this._managedTexts = [];
        this._iterator = 0;
    }
    getManagedTextIndexByOwner(owner) {
        return this._managedTexts.findIndex((t) => {
            return t.owner === owner;
        });
    }
    getManagedTextByOwner(owner) {
        const texts = this._managedTexts.find((t) => {
            return t.owner === owner;
        });
        return texts ? texts[0] : undefined;
    }
    add(managedText) {
        if (!this.getManagedTextByOwner(managedText.owner)) {
            this._managedTexts.push(managedText);
        }
        this._managedTexts.sort((t1, t2) => {
            return t1.priority - t2.priority;
        });
    }
    remove(managedText) {
        const index = this.getManagedTextIndexByOwner(managedText.owner);
        if (index > -1) {
            this._managedTexts.splice(index, 1);
        }
    }
    update(map, elementsWithTextBox) {
        for (let n = 0; n < 30; n++) {
            this._iterator++;
            if (this._iterator >= elementsWithTextBox.length) {
                this._iterator = 0;
            }
            const e = elementsWithTextBox[this._iterator];
            if (!e || !e._label) {
                continue;
            }
            if (!e.minimize) {
                let cross = false;
                for (let j = 0; j < this._iterator; j++) {
                    const other = elementsWithTextBox[j];
                    if (other.showText) {
                        if (!(Math.abs(e.x - other.x) > 60 || Math.abs(e.y - other.y) > 30)) {
                            cross = true;
                            e.showText = false;
                            e._label.setAttribute("display", "none");
                            break;
                        }
                    }
                }
                if (cross === false) {
                    e._label.removeAttribute("display");
                    e.showText = true;
                }
            } else {
                e.showText = false;
                e._label.setAttribute("display", "none");
            }
        }
    }
}
//# sourceMappingURL=SvgTextManager.js.map