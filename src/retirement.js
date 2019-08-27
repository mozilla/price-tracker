/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function main() {
  const button = document.getElementById('uninstall-addon');
  button.addEventListener('click', () => browser.management.uninstallSelf({
    showConfirmDialog: true,
  }));

  const url = new URL(window.location.href);
  const finalNoticeJSON = url.searchParams.get('finalNotice');
  let finalNotice = false;
  if (finalNoticeJSON) {
    finalNotice = JSON.parse(finalNoticeJSON);
  }

  if (finalNotice) {
    const noticeHeaderElement = document.getElementById('notice-header');
    noticeHeaderElement.innerText = 'ends in one day';

    const noticeParagraphElement = document.getElementById('notice-paragraph');
    noticeParagraphElement.innerText = 'one day';
  }
}());
