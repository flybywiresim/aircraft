import { simbridgeUrl } from 'simbridge-client/common';

/**
 * Class pertaining to retrieving static files for general viewing from SimBridge
 */
export class Viewer {
    /**
     * Used to retrieve a streamable image of specified page within a given PDF file
     * @param filename required field, filename of the pdf
     * @param pageNumber required field, The page of the PDF file
     * @returns on successful response, response body contains a streamable file
     */
    public static async getPDFPage(filename: string, pageNumber: number): Promise<Response> {
        if (filename || pageNumber) {
            return fetch(`${simbridgeUrl}/api/v1/utility/pdf?filename=${filename}&pagenumber=${pageNumber}`);
        }
        throw new Error('File name or page number missing');
    }

    /**
     * Retrieve the number of pages within a specified PDF file
     * @param filename required field, filename of the pdf
     * @returns on successful response, body contains number of pages in PDF
     */
    public static async getPDFPageNum(filename: string): Promise<Response> {
        if (filename) {
            return fetch(`${simbridgeUrl}/api/v1/utility/pdf/numpages?filename=${filename}`);
        }
        throw new Error('File name or page number missing');
    }

    /**
     * Used to retrieve a list of filenames within the PDF folder
     * @returns on sucessful response, response body contains an array of strings of the filenames within the pdf folder
     */
    public static async getPDFList(): Promise<Response> {
        return fetch(`${simbridgeUrl}/api/v1/utility/pdf/list`);
    }

    /**
     * Used to retrieve a streamable image of a specified image in the images folder
     * @param filename required field, filename of the image
     * @returns on successful response, response body contains a streamable file
     */
    public static async getImage(filename: string, pageNumber: number): Promise<Response> {
        if (filename || pageNumber) {
            return fetch(`${simbridgeUrl}/api/v1/utility/image?filename=${filename}`);
        }
        throw new Error('File name or page number missing');
    }

    /**
     * Used to retrieve a list of filenames within the PDF folder
     * @returns on successful response, response body contains a streamable file
     */
    public static async getImageList(): Promise<Response> {
        return fetch(`${simbridgeUrl}/api/v1/utility/image/list`);
    }
}
