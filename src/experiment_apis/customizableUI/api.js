/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global ChromeUtils ExtensionAPI */

this.customizableUI = class extends ExtensionAPI {
  getAPI(context) {
    const {CustomizableUI} = ChromeUtils.import('resource:///modules/CustomizableUI.jsm');
    const {ExtensionCommon} = ChromeUtils.import('resource://gre/modules/ExtensionCommon.jsm');
    const {EventManager} = ExtensionCommon;
    const {Services} = ChromeUtils.import('resource://gre/modules/Services.jsm');
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
          const {area} = CustomizableUI.getPlacementOfWidget(widgetId);
          const browserWindow = Services.wm.getMostRecentWindow('navigator:browser');
          // First check is for the non-fixed overflow menu (e.g. widget moved by resizing window)
          // Second is for fixed overflow menu (e.g. widget moved by (un)pinning button to overflow)
          return (
            CustomizableUI.getWidget(widgetId).forWindow(browserWindow).overflowed
            || area === 'widget-overflow-fixed-list');
        },
      },
    };
  }
};
