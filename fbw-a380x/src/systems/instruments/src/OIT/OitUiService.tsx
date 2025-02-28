//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { EventBus, Subject } from '@microsoft/msfs-sdk';

export enum OitSystem {
  None = '',
  Nss = 'nss',
  FltOps = 'flt-ops',
}

/*
 * Hierarchy of URIs: sys / category / page / extra
 */
export interface OitUriInformation {
  uri: string; // Full URI to OIT page, e.g. FLT-OPS/TO-PERF
  sys: OitSystem; // 1st part of URI (system), can be nss or flt-ops
  page: string; // page within system
  extra?: string; // Can be used for deep-linking within a page
}

/*
 * Handles navigation (and potentially other aspects) for OIT pages
 */
export class OitUiService {
  constructor(
    public captOrFo: 'CAPT' | 'FO',
    private readonly bus: EventBus,
  ) {}

  public readonly activeUri = Subject.create<OitUriInformation>({
    uri: '',
    sys: OitSystem.None,
    page: '',
    extra: '',
  });

  private navigationStack: string[] = [];

  public parseUri(uri: string): OitUriInformation {
    const uriParts = uri.split('/');
    return {
      uri,
      sys: uriParts[0] as OitSystem,
      page: uriParts[1],
      extra: uriParts.slice(2).join('/'),
    };
  }

  /**
   * Navigate to OIT page.
   * @param uri The URI to navigate to. Format: sys/category/page, e.g. fms/active/init represents ACTIVE/INIT page from the FMS. Use URI 'back' for returning to previous page.
   * In theory, one can use anything after a third slash for intra-page deep linking: fms/active/perf/appr could link to the approach PERF page.
   */
  public navigateTo(uri: string): void {
    let nextUri: string;

    const forceReloadUrls: string[] = [];
    if (uri === this.activeUri.get().uri && !forceReloadUrls.includes(uri)) {
      // Same URL, don't navigate. Except for some URLs defined in forceReloadUrls
      console.info('Navigate to same URL, ignored.');
      return;
    }

    // Before navigating, make sure that all input fields are un-focused
    Coherent.trigger('UNFOCUS_INPUT_FIELD');

    if (uri === 'back') {
      if (this.navigationStack.length < 2) {
        return;
      }
      this.navigationStack.pop();
      nextUri = this.navigationStack[this.navigationStack.length - 1];
    } else {
      this.navigationStack.push(uri);
      nextUri = uri;
    }

    const parsedUri = this.parseUri(nextUri);
    this.activeUri.set(parsedUri);
  }

  /*
   * Whether one can navigate back
   */
  public canGoBack() {
    return this.navigationStack.length > 1;
  }
}
