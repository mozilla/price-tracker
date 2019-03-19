/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import autobind from 'autobind-decorator';
import pt from 'prop-types';
import React from 'react';

import 'commerce/browser_action/components/StudyFooter.css';

/**
 * Feedback footer for User Research study recruitment.
 */
@autobind
export default class StudyFooter extends React.Component {
  static propTypes = {
    // Direct props
    onClick: pt.func.isRequired,
  }

  render() {
    return (
      <button
        type="button"
        className="menu-item study"
        onClick={this.props.onClick}
      >
      Help us improve Price Tracker&hellip;
      </button>
    );
  }
}
