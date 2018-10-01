[👈 Back to README](../README.md)


# Metrics

A summary of the metrics the Price Alerts extension will record.


## Definitions

* **Fathom**: A [JavaScript framework](https://github.com/erikrose/fathom) used to extract product information from a Product Page.
* **Product Page**: A webpage ([example](https://www.amazon.com/LEGO-Fantastic-Beasts-Grindelwald-Grindelwalds/dp/B07BKQXCZR/ref=sr_1_3_sspa?s=toys-and-games&ie=UTF8&qid=1538418041&sr=1-3-spons&keywords=legos&psc=1)) displaying a single product that the user could purchase online.
* **Extraction**: The process of extracting the necessary product information from a Product Page using one of two methods: Fathom or fallback (CSS selectors or Open Graph attributes).
* **Product Card**: A list item in the list of tracked products for which the user has opted to receive Price Alerts displayed on the browserAction popup. Each Product Card displays the product title, image and price.
* **Survey**: a short survey collecting user feedback.
* **Onboarding Popup**: The popup displayed when the user has zero products tracked, including the first time the popup is opened.


## Analysis

Data collected by the Price Alerts extension will be used to answer the following questions:

### User Engagement

- Is the Price Alerts experience compelling?
  - How often do users set price alerts?
  - Do alerts cause users to re-engage with our shopping feature?
  - How often do they respond to price alerts?
  - At what threshold do users respond to price changes?
  - How do users respond when they receive a price alert?
    - Do they click through to the product page?
      - In what intervals?
      - In what circumstances?
  - How often are UI elements used?
  - What are users' tolerance for inaccuracy?
  - Are alerts annoying to users?
  - How often do users keep alerts?
  - How often do users delete alerts?
  - How much time passes before the "set alert" button is available in the drop down?
- Where do users use Price Alerts?
  - For what kinds of products?
  - Which sites do users track products on most?
  - What's the price distribution of products users track?


### Experiment Health

- Can users be compelled to report positive experiences as well as negative ones?
- How often are products detected on supported product pages? (#125)
- How often is Fathom recognizing products on a page? (#125)
- On which sites do users report the most problems?
- How often do product prices change, irrespective of user action?
- How many price alerts are received?
  - In what intervals?


### Performance

There are open questions about whether and how much Fathom may affect page performance. Time permitting, we may ask:

- What is the frame rate for a page while Fathom is running? (#124)


### Questions to answer in future experiments

Answering these questions requires controlled A/B testing or more extensive data collection.

- Does our feature increase shopping browsing?
- Does our feature increase shopping purchase?
- Which sites do users browse on the most?
- On what sites do users shop?

## Sample Pings

We will be sending pings using [Event Telemetry](https://firefox-source-docs.mozilla.org/toolkit/components/telemetry/telemetry/collection/events.html) via the [WebExtensions Telemetry API](https://bugzilla.mozilla.org/show_bug.cgi?id=1280234).

Each event will exist as part of the `main` ping, under `payload.processes.dynamic.events` as an array. Below is a sample ping for the `badge_toolbar_button` event:

```json
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
            618573,
            "extension.price_alerts",
            "badge_toolbar_button",
            "toolbar_button",
            null,
            {
              "badge_type": "add"
            }
          ]
        ]
      }
    }
  }
}
```


## Collection (User Events)

Each event here is the value of the `methods` key used in Event Telemetry.


### `open_popup`

Fired when the user clicks the Price Alerts browserAction toolbar button to open the popup.


#### Payload properties
- `objects`:
  - `'toolbar_button'`
- `extra_keys`:
  - `'badge-type'`: String indicating what, if any, badge was present on the toolbar. One of 'add', 'price_alert', or 'none'.


### `open_external_page`

Fired when the user clicks on a UI element that opens a page in a new tab.


#### Payload properties
- `objects`: (All links are in the Onboarding Popup only.)
  - `'help_button'`: Sends the user to a Price Alerts support.mozilla.org page.
  - `'feedback_button'`: Sends the user to a feedback Survey.
  - `'system_notification'`: Sends the user to the product page for the price alert displayed in the notification.
  - `'product_card'`: Sends the user to the product page for the given Product Card.
  - `'amazon_link'`: Sends the user to Amazon.
  - `'best_buy_link'`: Sends the user to Best Buy.
  - `'ebay_link'`: Sends the user to Ebay.
  - `'home_depot_link'`: Sends the user to Home Depot.
  - `'walmart_link'`: Sends the user to Walmart.
  - `'learn_more_link'`: Sends the user to a Price Alerts support.mozilla.org page.
- `extra_keys`: For objects of type `'system_notification'` and `'product'` only
  - `'product_id'`: String. The unique product identifier.
  - `'price'`: Number. The price of the product in subunits (e.g. a $10.00 product would have a value of `1000`).
  - `'price_original'`: Number. The original price of the product in subunits (e.g. a $10.00 product would have a value of `1000`).


### `add_product`

Fired when the user clicks the add product button in the browserAction popup.


#### Payload properties

- `objects`:
  - `'add_button'`
- `extra_keys`:
  - `'product_id'`: String. The unique product identifier.


### `delete_product`

Fired when the user clicks a delete product button in a Product Card in the browserAction popup.


#### Payload properties

- `objects`:
  - `'delete_button'`
- `extra_keys`:
  - `'product_id'`: String. The unique product identifier.


### `undo_delete_product`

Fired when the user clicks an undo button in a Product Card in the browserAction popup.


#### Payload properties

- `objects`:
  - `'undo_button'`
- `extra_keys`:
  - `'product_id'`: String. The unique product identifier.


### `uninstall`

Fired when the user uninstalls the extension.


#### Payload properties

- `objects`:
  - `'uninstall'`


### `hide_toolbar_button`

Fired when the user hides the extension's browserAction toolbar button from the browser chrome.


#### Payload properties

- `objects`:
  - `'toolbar_button'`


## Collection (Non-User Events)


### `badge_toolbar_button`

Fired whenever the toolbar is badged in response to:
1. A successful product extraction or
2. A price alert


#### Payload properties

- `objects`:
  - `'toolbar_button'`
- `extra_keys`:
  - `'badge-type'`: String indicating what, if any, badge was present on the toolbar. One of 'add' or 'price_alert'.


### `send_system_notice`

Fired whenever a system notification is sent to the user notifying them of a price alert.


#### Payload properties

- `objects`:
  - `'system_notification'`
- `extra_keys`:
  - `'product_id'`: String. The unique product identifier.
  - `'price'`: Number. The price of the product in subunits (e.g. a $10.00 product would have a value of `1000`).
  - `'price_original'`: Number. The original price of the product in subunits (e.g. a $10.00 product would have a value of `1000`).


### `attempt_extraction`

Fired whenever a supported page loads and the add-on attempts to extract product information from the page.


#### Payload properties

- `objects`:
  - `'page'`
- `extra_keys`:
  - `url`: String. The url of the page the extraction script is running in


### `complete-extraction`

Fired whenever extraction on a supported page completes, whether or not the extraction was successful.


#### Payload properties

- `objects`:
  - `'page'`
- `extra_keys`:
  - `url`: String. The url of the page the extraction script is running in
  - `method`: String. The extraction method that was successful, if any. One of: 'fathom', 'fallback' or 'neither'. A value of 'neither' means that extraction failed.


## Opt-out

All data collection occurs through Firefox telemetry, and standard telemetry opt-out methods apply.

No telemetry will be sent from the extension in the following additional cases:
* [Do Not Track](https://support.mozilla.org/en-US/kb/how-do-i-turn-do-not-track-feature) is enabled
  * Preference: `privacy.donottrackheader.enabled` 
* [Tracking Protection](https://support.mozilla.org/en-US/kb/tracking-protection) is enabled
  * Preference: `privacy.trackingprotection.enabled`
* The user is in a [Private Browsing](https://support.mozilla.org/en-US/kb/private-browsing-use-firefox-without-history?redirectlocale=en-US&redirectslug=Private+Browsing)  window
  * Preference: `browser.privatebrowsing.autostart`
  * [`windows.Window`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/windows/Window) property: `window.incognito`
