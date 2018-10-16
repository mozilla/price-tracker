# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

# Adapted from clouserw's script for publishing add-ons to Test Pilot from
# Jenkins.

set -xe

ADDON_ID="shopping-testpilot@mozilla.org"
ADDON_VERSION=${CIRCLE_TAG}
ADDON_FILE="web-ext-artifacts/firefox_shopping-${ADDON_VERSION}-signed.xpi"
test -f $ADDON_FILE

MAX_AGE=30 # We can up this at some point, but keeping it low while we work out the kinks

# shared headers
HPKP='"public-key-pins": "max-age=5184000; pin-sha256=\"WoiWRyIOVNa9ihaBciRSC7XHjliYS9VwUGOIud4PB18=\"; pin-sha256=\"r/mIkG3eEpVdm+u/ko/cwxzOMo1bk4TyHIlByibiA5E=\"; pin-sha256=\"YLh1dUR9y6Kja30RrAn7JKnbQG/uEtLMkBgFF2Fuihg=\"; pin-sha256=\"sRHdihwgkaib1P1gxX8HFszlD+7/gTfNvuAybgLPNis=\""'
HSTS='"strict-transport-security": "max-age=31536000; includeSubDomains; preload"'
TYPE='"x-content-type-options": "nosniff"'

# sha256sum won't output *just* the hash, gotta extract it from the first column
HASH="$(sha256sum $ADDON_FILE|cut -d' ' -f1)"

# headers just for latest
LATEST="\"x-target-digest\": \"sha256:$HASH\", \"location\": \"/files/$ADDON_ID/$ADDON_FILE\""

# latest is an empty file with headers
: > latest
pipenv run python -m json.tool << EOF > updates.json
{
  "addons": {
    "$ADDON_ID": {
      "updates": [
        { "version": "$ADDON_VERSION",
          "update_link": "https://testpilot.firefox.com/files/$ADDON_ID/latest",
          "update_hash": "sha256:$HASH" }
      ]
    }
  }
}
EOF

S3PATH="s3://$AWS_S3_BUCKET/$ADDON_ID"
S3CMD="pipenv run aws s3 cp --metadata-directive REPLACE --cache-control max-age=$MAX_AGE --content-type"

$S3CMD text/html               --metadata "{$HPKP, $HSTS, $TYPE, $LATEST}"  latest           $S3PATH/
$S3CMD application/json        --metadata "{$HPKP, $HSTS, $TYPE}"           updates.json     $S3PATH/
$S3CMD application/x-xpinstall --metadata "{$HPKP, $HSTS, $TYPE}"           $ADDON_FILE      $S3PATH/signed-addon.xpi
# just in case we need to reference an old add-on for some reason we store them in /archive/...
$S3CMD application/x-xpinstall --metadata "{$HPKP, $HSTS, $TYPE}"           $ADDON_FILE $S3PATH/archive/signed-addon-${ADDON_VERSION}.xpi
