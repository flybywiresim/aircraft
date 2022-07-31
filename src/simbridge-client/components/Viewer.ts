import { simbridgeUrl } from '../common';

/**
 * Class pertaining to retrieving static files for general viewing from SimBridge
 */
export class Viewer {
    /**
     * Used to retrieve a streamable image of specified page within a given PDF file
     * @param filename required field, filename of the pdf
     * @param pageNumber required field, The page of the PDF file
     * @returns a Blob
     */
    public static async getPDFPage(filename: string, pageNumber: number): Promise<Blob> {
        if (filename || pageNumber) {
            const response = await fetch(`${simbridgeUrl}/api/v1/utility/pdf?filename=${filename}&pagenumber=${pageNumber}`);
            if (response.ok) {
                return response.blob();
            }
            throw new Error(`SimBridge Error: ${response.status}`);
        }
        throw new Error('File name or page number missing');
    }

    /**
     * Retrieve the number of pages within a specified PDF file
     * @param filename required field, filename of the pdf
     * @returns A number
     */
    public static async getPDFPageNum(filename: string): Promise<Number> {
        if (filename) {
            const response = await fetch(`${simbridgeUrl}/api/v1/utility/pdf/numpages?filename=${filename}`);
            if (response.ok) {
                return response.json();
            }
            throw new Error(`SimBridge Error: ${response.status}`);
        }
        throw new Error('File name or page number missing');
    }

    /**
     * Used to retrieve a list of filenames within the PDF folder
     * @returns an Array of strings
     */
    public static async getPDFList(): Promise<string[]> {
        const response = await fetch(`${simbridgeUrl}/api/v1/utility/pdf/list`);
        if (response.ok) {
            return response.json();
        }
        throw new Error(`SimBridge Error: ${response.status}`);
    }

    /**
     * Used to retrieve a streamable image of a specified image in the images folder
     * @param filename required field, filename of the image
     * @returns A Blob
     */
    public static async getImage(filename: string, pageNumber: number): Promise<Blob> {
        if (filename || pageNumber) {
            const response = await fetch(`${simbridgeUrl}/api/v1/utility/image?filename=${filename}`);
            if (response.ok) {
                return response.blob();
            }
            throw new Error(`SimBridge Error: ${response.status}`);
        }
        throw new Error('File name or page number missing');
    }

    /**
     * Used to retrieve a list of filenames within the PDF folder
     * @returns an Array of strings
     */
    public static async getImageList(): Promise<string[]> {
        const response = await fetch(`${simbridgeUrl}/api/v1/utility/image/list`);
        if (response.ok) {
            return response.json();
        }
        throw new Error(`SimBridge Error: ${response.status}`);
    }
}
