[👈 Back to README](../README.md)


# Metrics

A summary of the metrics the Price Alerts extension will record.


## Definitions

* **Extraction**: The process of extracting the necessary product information from a Product Page using one of two methods: Fathom or fallback (CSS selectors or Open Graph attributes).
* **Feature Engagement**: Any active measure the user took to engage with the feature. Key measures include: opening the popup (`open_popup`) or clicking on an alert (`open_external_page` with `element` value of `'product_card'` or `'system_notification'`).
* **Fathom**: A [JavaScript framework](https://github.com/erikrose/fathom) used to extract product information from a Product Page.
* **Price Alert**: An alert that occurs when a tracked product's price _decreases_ below a certain absolute or percentage threshold. For the MVP, the default thresholds are specified in `./src/config.js`.
* **Product Card**: A product list item in the list of tracked products for which the user has opted to receive Price Alerts displayed on the browserAction popup. Each Product Card displays the product title, image and price among other information.
* **Product Page**: A webpage ([example](https://www.amazon.com/LEGO-Fantastic-Beasts-Grindelwald-Grindelwalds/dp/B07BKQXCZR/ref=sr_1_3_sspa?s=toys-and-games&ie=UTF8&qid=1538418041&sr=1-3-spons&keywords=legos&psc=1)) displaying a single product that the user could purchase online.
* **Supported Sites**: For the initial launch (a.k.a. MVP, Minimum Viable Product) of this extension, we are limiting the sites supported by this feature to [five websites](https://github.com/mozilla/price-scout/issues/36#issuecomment-409641491): Amazon, Ebay, Walmart, Home Depot and Best Buy.
* **Survey**: a short survey collecting user feedback.
* **Onboarding Popup**: The popup displayed when the user has zero products tracked, including the first time the popup is opened.


## Analysis

Data collected by the Price Alerts extension will be used to answer the following questions:

Note: For any questions related to general user shopping behavior, the data about what sites users visit is limited to the Supported Sites for the MVP.

#### Does the extension work?
- How often do product prices change, irrespective of user action?
- How often are products detected on supported product pages? (#125)
- How often is Fathom recognizing products on a page? (#125)
- On which sites do users report the most problems?
- How many Price Alerts are received?

#### Do people use it?
- At what threshold do users respond to price changes?
- How many products are users tracking?
  - Does number of tracked items track to Feature Engagement?
- Are alerts annoying to users?
- Can users be compelled to report positive experiences as well as negative ones?

#### What parts of it do they use?
- Do users set Price Alerts?
- How do users respond to Price Alerts?
- Do they delete alerts?

#### How much do they use it?
- How much of browsing is shopping?
- How often do users shop (daily, weekly, monthly, etc.)?
- How often do users set Price Alerts?
- How often do users respond to Price Alerts?
- Do alerts cause users to re-engage with our shopping feature?
  - At what price changes do users re-engage with saved products?
- How often do users keep alerts?
- How often do they delete them?
- What are users' tolerance for inaccuracy?

#### In what circumstances do they use it?
- Which sites do users track products on most?
- What sites do users shop on the most?
- Which sites do users browse on the most?
- What's the price distribution of products users track?

### Questions to answer in future experiments

While some of these questions may be partially answerable by this extension, answering them thorougly requires controlled A/B testing and/or more extensive data collection on more sites.

#### Does it affect user behavior in Firefox?
- Does it increase shopping browsing?
- Does it increase shopping purchases?
- Did it impact search revenue?
- Did it impact retention?
- Did it impact satisfaction?
- Did it impact usage of Firefox?

#### How well do we understand aggregate user shopping behavior?
- How much of browsing is shopping?
- How often do users shop (daily, weekly, monthly, etc.)?
- Which sites do users browse on the most?
- On what sites do users shop?


## Sample Pings

We will be sending pings using [Event Telemetry](https://firefox-source-docs.mozilla.org/toolkit/components/telemetry/telemetry/collection/events.html) via the [WebExtensions Telemetry API](https://bugzilla.mozilla.org/show_bug.cgi?id=1280234).

Each event will exist as part of the `main` ping under `payload.processes.dynamic.events` as an array in the `events` array. The data types of individual fields for each event follow the Event Telemetry [serialization format](https://firefox-source-docs.mozilla.org/toolkit/components/telemetry/telemetry/collection/events.html#serialization-format).

The telemetry category for events is `'extension.price_alerts'`.

Below is a sample ping for the `badge_toolbar_button` and `visit_supported_site` events.

```javascript
{
  "type": "main",
  // ...
  "payload": {
    // ...
    "processes": {
      // ...
      "dynamic": {
        // ...
        "events": [
          [
            2079,
            "extension.price_alerts",
            "badge_toolbar_button",
            "toolbar_button",
            null,
            {
              "badge_type": "add",
              "tracked_prods": "5"
            }
          ],
          [
            2081,
            "extension.price_alerts",
            "visit_supported_site",
            "supported_site",
            null,
            {
              "tracked_prods": "5"
            }
          ]
        ]
      }
      // ...
    }
    // ...
  }
  // ...
}
```


## `extra_keys`

`extra_keys` are keys in the [optional `extra` object field](https://firefox-source-docs.mozilla.org/toolkit/components/telemetry/telemetry/collection/events.html#serialization-format) for telemetry events. All `extra_keys` and their values are strings.

- `'badge_type'`: Indicates what, if any, badge was present on the browserAction toolbar button. One of 'add', 'price_alert', or 'none'. A value of 'unknown' is possible if the badge text is unrecognized.
- `'extraction_id'`: A unique identifier to associate an extraction attempt to an extraction completion event for a given page.
- `'is_bg_update'`: 'true' if the extraction is associated with a background price check; otherwise 'false'.
- `method`: The extraction method that was successful, if any. One of: 'fathom', 'fallback' or 'neither'. A value of 'neither' means that extraction failed.
- `'price'`: The price of the product in subunits (e.g. a $10.00 product would have a value of `'1000'`). For the MVP, the units here are always cents (USD currency only).
- `'price_alert'`: 'true' if the product has an active Price Alert; otherwise 'false'.
- `'price_orig'`: The original price of the product in subunits (e.g. a $10.00 product would have a value of `'1000'`). For the MVP, the units here are always cents (USD currency only).
- `'product_index'`: The index of the product in the product listing. The top most list item is index '0'. The list is sorted by date added, descending (#113).
- `'product_key'`: A unique identifier for the product relative to other products for a given user. This key is _not_ unique to the product across all users.
- `'tracked_prods'`: The number of products the user is tracking.
- `'element'`: The extension UI element that the user clicked to open a page in a new tab. Note: All `*_link` elements exist in the Onboarding Popup only. One of...
  - `'amazon_link'`: Sends the user to Amazon.
  - `'best_buy_link'`: Sends the user to Best Buy.
  - `'ebay_link'`: Sends the user to Ebay.
  - `'feedback_button'`: Sends the user to a feedback Survey.
  - `'help_button'`: Sends the user to a Price Alerts support.mozilla.org page.
  - `'home_depot_link'`: Sends the user to Home Depot.
  - `'learn_more_link'`: Sends the user to a Price Alerts support.mozilla.org page.
  - `'product_card'`: Sends the user to the product page for the given Product Card.
  - `'system_notification'`: Sends the user to the product page for the Price Alert displayed in the notification.
  - `'walmart_link'`: Sends the user to Walmart.


## Collection (User Events)

### `visit_supported_site`

Fired when the user navigates to a Supported Site.

#### Payload properties
- `methods`: String
  - `'visit_supported_site'`
- `objects`: String
  - `'supported_site'`
- `extra_keys`: Object
  - `'tracked_prods'`

### `open_popup`

Fired when the user clicks the Price Alerts browserAction toolbar button to open the popup.

#### Payload properties
- `methods`: String
  - `'open_popup'`
- `objects`: String
  - `'toolbar_button'`
- `extra_keys`: Object
  - `'badge_type'`
  - `'tracked_prods'`

### `open_external_page`

Fired when the user clicks on a UI element in the extension that opens a page in a new tab.

#### Payload properties
- `methods`: String
  - `'open_external_page'`
- `objects`: String
  - `'ui_element'`
- `extra_keys`: Object; which keys are included depends on the value of the `'element'` extra key.
  - All values:
    - `'tracked_prods'`
    - `'element'`
  - `'system_notification'` and `'product_card'` only:
    - `'price'`
    - `'price_alert'`
    - `'price_orig'`
    - `'product_key'`
  - `'product_card'` only:
    - `'product_index'`

### `add_product`

Fired when the user clicks the add product button in the browserAction popup.

#### Payload properties

- `methods`: String
  - `'add_product'`
- `objects`: String
  - `'add_button'`
- `extra_keys`: Object
  - `'price'`
  - `'product_key'`
  - `'tracked_prods'`

### `delete_product`

Fired when the user clicks a delete product button in a Product Card in the browserAction popup.

#### Payload properties

- `methods`: String
  - `'delete_product'`
- `objects`: String
  - `'delete_button'`
- `extra_keys`: Object
  - `'price'`
  - `'price_alert'`
  - `'price_orig'`
  - `'product_index'`
  - `'product_key'`
  - `'tracked_prods'`

### `undo_delete_product`

Fired when the user clicks an undo button in a Product Card in the browserAction popup.

#### Payload properties

- `methods`: String
  - `'undo_delete_product'`
- `objects`: String
  - `'undo_button'`
- `extra_keys`: Object
  - `'price'`
  - `'price_alert'`
  - `'price_orig'`
  - `'product_index'`
  - `'product_key'`
  - `'tracked_prods'`

### `uninstall`

Fired when the user uninstalls the extension.

#### Payload properties

- `methods`: String
  - `'uninstall'`
- `objects`: String
  - `'uninstall'`
- `extra_keys`: Object
  - `'tracked_prods'`

### `hide_toolbar_button`

Fired when the user hides the extension's browserAction toolbar button from the browser chrome.

#### Payload properties

- `methods`: String
 - `'hide_toolbar_button'`
- `objects`: String
  - `'toolbar_button'`
- `extra_keys`: Object
  - `'badge_type'`
  - `'tracked_prods'`


## Collection (Non-User Events)

### `detect_price_change`

Fired whenever a price change (of any magnitude and in any direction) is detected.

#### Payload properties

- `methods`: String
  - `'detect_price_change'`
- `objects`: String
  - `'product_page'`
- `extra_keys`: Object
  - `'price'`
  - `'price_orig'`
  - `'product_key'`
  - `'tracked_prods'`

### `badge_toolbar_button`

Fired whenever the toolbar is badged in response to:
1. A successful product extraction or
2. A Price Alert

#### Payload properties

- `methods`: String
  - `'badge_toolbar_button'`
- `objects`: String
  - `'toolbar_button'`
- `extra_keys`: Object
  - `'badge_type'`
  - `'tracked_prods'`

### `send_notification`

Fired whenever a system notification is sent to the user notifying them of a Price Alert.

#### Payload properties

- `methods`: String
  - `'send_notification'`
- `objects`: String
  - `'system_notification'`
- `extra_keys`: Object
  - `'price'`
  - `'price_orig'`
  - `'product_key'`
  - `'tracked_prods'`

### `attempt_extraction`

Fired whenever a supported page loads and the add-on attempts to extract product information from the page.

#### Payload properties

- `methods`: String
  - `'attempt_extraction'`
- `objects`: String
  - `'product_page'`
- `extra_keys`: Object
  - `'extraction_id'`
  - `'is_bg_update'`
  - `'tracked_prods'`

### `complete_extraction`

Fired whenever extraction on a supported page completes, whether or not the extraction was successful.

#### Payload properties

- `methods`: String
  - `'complete_extraction'`
- `objects`: String
  - `'product_page'`
- `extra_keys`: Object
  - `'extraction_id'`
  - `'is_bg_update'`
  - `method`
  - `'tracked_prods'`


## Opt-out

All data collection occurs through Firefox telemetry, and standard telemetry opt-out methods apply.

No telemetry will be sent from the extension in the following additional cases:
- [Do Not Track](https://support.mozilla.org/en-US/kb/how-do-i-turn-do-not-track-feature) is enabled
  - Preference: `privacy.donottrackheader.enabled`
- [Tracking Protection](https://support.mozilla.org/en-US/kb/tracking-protection) is enabled
  - Preference: `privacy.trackingprotection.enabled`
- The user is in a [Private Browsing](https://support.mozilla.org/en-US/kb/private-browsing-use-firefox-without-history?redirectlocale=en-US&redirectslug=Private+Browsing)  window
  - Preference: `browser.privatebrowsing.autostart`
  - [`windows.Window`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/windows/Window) property: `window.incognito`
