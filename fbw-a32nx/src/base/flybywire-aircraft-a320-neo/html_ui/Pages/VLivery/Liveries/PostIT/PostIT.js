const DEFAULT_TEXT = "\nCLICK TO ADD!";

class PostIT extends TemplateElement {
    constructor() {
        super();
    }

    get templateID() {
        return "postitstatic";
    }

    connectedCallback() {
        super.connectedCallback();
        this.postit = this.querySelector("#postitarea");
        this.mainframe = document.body;


        if (this.postit) {
            NXDataStore.getAndSubscribe('POSTIT_CONTENT', (_, text) => {
                this.updateText(text);
            }, DEFAULT_TEXT);

            NXDataStore.getAndSubscribe('POSTIT_FONT', (_, font) => {
                this.postit.style.fontFamily = font;
            }, 'Caveat');

            NXDataStore.getAndSubscribe('POSTIT_PAGE_COLOR', (_, color) => {
                this.postit.style.backgroundColor = color;
                this.mainframe.style.backgroundColor = color;
            }, 'yellow');

            NXDataStore.getAndSubscribe('POSTIT_PEN_COLOR', (_, color) => {
                this.postit.style.color = color;
            }, 'black');
        }
    }

    updateText(text) {
        this.postit.innerHTML = text;
    }
}

registerLivery("livery-postit-element", PostIT);
