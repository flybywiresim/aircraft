export interface OancConfiguration {
    /** Whether the Software Control Panel is enabled */
    enableScp: boolean,

    /** Whether Brake-To-Vacate functionality is available */
    enableBtv: boolean,

    /** The URL to the map configuration JSON file to use */
    mapConfigurationUrl: string,
}
