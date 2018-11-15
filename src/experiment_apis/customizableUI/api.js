/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global ChromeUtils ExtensionAPI ExtensionCommon */

this.customizableUI = class extends ExtensionAPI {
  getAPI(context) {
    const {Services} = ChromeUtils.import('resource://gre/modules/Services.jsm');
    ChromeUtils.import('resource://gre/modules/ExtensionCommon.jsm');
    const {EventManager} = ExtensionCommon;
    const {CustomizableUI} = ChromeUtils.import('resource:///modules/CustomizableUI.jsm', {});
    return {
      customizableUI: {
        onWidgetRemoved: new EventManager(
          context,
          'customizableUI.onWidgetRemoved',
          (fire) => {
            const toolbarButton = {
              onWidgetRemoved(widgetId) {
                fire.async(widgetId);
              },
            };
            CustomizableUI.addListener(toolbarButton);
            return () => {
              CustomizableUI.removeListener(toolbarButton);
            };
          },
        ).api(),
        async isWidgetInOverflow(widgetId) {
          const browserWindow = Services.wm.getMostRecentWindow('navigator:browser');
          return CustomizableUI.getWidget(widgetId).forWindow(browserWindow).overflowed;
        },
      },
    };
  }
};
