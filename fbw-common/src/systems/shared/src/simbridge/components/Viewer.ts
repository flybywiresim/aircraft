// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { fetchWithTimeout, getSimBridgeUrl } from '../common';
import { ClientState } from './ClientState';

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
    if (!ClientState.getInstance().isConnected()) {
      throw new Error('SimBridge is not connected.');
    }
    if (filename || pageNumber) {
      const response = await fetchWithTimeout(
        `${getSimBridgeUrl()}/api/v1/utility/pdf?filename=${filename}&pagenumber=${pageNumber}`,
      );
      if (response.ok) {
        return response.blob();
      }
      throw new Error(`SimBridge Error: ${response.status}`);
    }
    throw new Error('File name or page number missing');
  }

  /**
   * Used to retrieve a URL to the rendered image of the specified PDF page.
   * It internally calls getPDFPage and then calls createObjectURL().
   * @see https://developer.mozilla.org/en-US/docs/web/api/url/createobjecturl
   * @param filename required field, filename of the pdf
   * @param pageNumber required field, The page of the PDF file
   * @returns url to the image (object blob) of the PDF page
   */
  public static async getPDFPageUrl(filename: string, pageNumber: number): Promise<string> {
    const blob = await Viewer.getPDFPage(filename, pageNumber);
    return URL.createObjectURL(blob);
  }

  /**
   * Retrieve the number of pages within a specified PDF file
   * @param filename required field, filename of the pdf
   * @returns A number
   */
  public static async getPDFPageNum(filename: string): Promise<number> {
    if (!ClientState.getInstance().isConnected()) {
      throw new Error('SimBridge is not connected.');
    }
    if (filename) {
      const response = await fetchWithTimeout(`${getSimBridgeUrl()}/api/v1/utility/pdf/numpages?filename=${filename}`);
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
    if (!ClientState.getInstance().isConnected()) {
      throw new Error('SimBridge is not connected.');
    }
    const response = await fetchWithTimeout(`${getSimBridgeUrl()}/api/v1/utility/pdf/list`);
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
  public static async getImage(filename: string): Promise<Blob> {
    if (!ClientState.getInstance().isConnected()) {
      throw new Error('SimBridge is not connected.');
    }
    if (filename) {
      const response = await fetchWithTimeout(`${getSimBridgeUrl()}/api/v1/utility/image?filename=${filename}`);
      if (response.ok) {
        return response.blob();
      }
      throw new Error(`SimBridge Error: ${response.status}`);
    }
    throw new Error('File name or page number missing');
  }

  /**
   * Used to retrieve a URL to the image.
   * It internally calls getPDFImage and then calls createObjectURL().
   * @see https://developer.mozilla.org/en-US/docs/web/api/url/createobjecturl
   * @param filename required field, filename of the pdf
   * @returns url to the image (object blob)
   */
  public static async getImageUrl(filename: string): Promise<string> {
    const blob = await Viewer.getImage(filename);
    return URL.createObjectURL(blob);
  }

  /**
   * Used to retrieve a list of filenames within the PDF folder
   * @returns an Array of strings
   */
  public static async getImageList(): Promise<string[]> {
    if (!ClientState.getInstance().isConnected()) {
      throw new Error('SimBridge is not connected.');
    }
    const response = await fetchWithTimeout(`${getSimBridgeUrl()}/api/v1/utility/image/list`);
    if (response.ok) {
      return response.json();
    }
    throw new Error(`SimBridge Error: ${response.status}`);
  }
}
