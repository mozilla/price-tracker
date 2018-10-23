/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global ChromeUtils ExtensionAPI ExtensionCommon */

this.customizableUI = class extends ExtensionAPI {
  getAPI(context) {
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
      },
    };
  }
};
