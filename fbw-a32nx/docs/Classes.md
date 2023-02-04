# Classes

- createMainLoop
    - this.systemsHandlers[i].update();
- this.systemsHandlers
    - handlers get added by calling onScriptReady(_className)
        - onScriptReady i called from onXMLConfigLoaded

## Class Inheritance

- HTMLElement (built in browser API class)
    - UIElement (Start of Asobo classes) (MSFS Install Folder) (fs-base-ui/.../common.js)
        - TemplateElement (MSFS Install Folder) (fs-base-ui/.../common.js)
            - BaseInstrument
                - NavSystem
                    - BaseAirliners
                        - A320_Neo_BAT.Display <a320-neo-bat>
                        - A320_Neo_BRK.Display
                        - A320_Neo_Clock <a320-neo-clock-element>
                        - A320_Neo_FCU
                        - A320_Neo_FDW
                        - A320_Neo_MFD
                        - A320_Neo_PFD <a320-neo-pfd-element>
                        - A320_Neo_RTPI <a320-neo-rtpi>
                        - A320_Neo_SAI <a320-neo-sai>
                        - Airliners.BaseEICAS
                            - A320_Neo_EICAS <a320-neo-eicas-element>
                        - Airliners.BaseATC
                            - A320_Neo_ATC <a320-neo-atc>
                        - FMCMainDisplay
                            - A320_Neo_CDU_MainDisplay <a320-neo-cdu-main-display>
            - Airliners.EICASTemplateElement
                - A320_Neo_LowerECAM_APU.Page <a320-neo-lower-ecam-apu>
                - A320_Neo_LowerECAM_Engine.Page <a320-neo-lower-ecam-engine>
                - A320_Neo_LowerECAM_Fuel.Page <a320-neo-lower-ecam-fuel>
                - A320_Neo_UpperECAM.Display <a320-neo-upper-ecam>
                - EICASCommonDisplay <eicas-common-display>

- NavSystemElementContainer
    - NavSystemPage
        - A320_Neo_FCU_MainPage
        - A320_Neo_MFD_MainPage
        - A320_Neo_PFD_MainPage
    - Airliners.EICASScreen

## VCockpit.js

- registerInstrument(_instrumentName, _instrumentClass) (global)
    - gets #panel element from document
    - is #panel an instance of VCockpitPanel?
    - calls `panel.registerInstrument(_instrumentName, _instrumentClass);`

### VCockpitPanel (extends HTMLElement)

HTMLElement that will create and append an instrument element to itself

How many VCockpitPanels are there in a single plane?
just 1?
or 1 per physical panel in the plane?
it's coded as if it a VCockpitPanel can have many children

- registerInstrument(_instrumentName, _instrumentClass)
    - `window.customElements.define(_instrumentName, _instrumentClass);`
    - `this.createInstrument(_instrumentName, _instrumentClass);`
- createInstrument(_instrumentName, _instrumentClass)
    - `var template = document.createElement(_instrumentName);`
    - `this.setupInstrument(template);`
- setupInstrument(_elem)
    - `this.appendChild(_elem);`

## TemplateElement

- connectedCallback
    - Instanciate
        - `InstanciateTemplate2(this.templateID, this)`
        - `this.templateID` is a getter defined in the lowest sublcass, like `A320_Neo_PFD`
            - InstanciateTemplate2 (global)
                - `let templateTextContent = document.getElementById(selector);`
                - where does an element get added to the DOM with the id being the templateID?
                    - when the global `registerInstrument` is called?
                - grabs the contents of the `<script type="text/html" id="A320_Neo_PFD">` element in that panel's HTML
                - and places it into a div element which gets cloned and appended to a document fragment (offscreen DOM tree)
                - returns the fragment to Instanciate
        - appends the new fragment to itself
        - copies attributes from the script template element thing onto itself

## BaseInstrument

- connectedCallback()
    - createMainLoop()
        - 