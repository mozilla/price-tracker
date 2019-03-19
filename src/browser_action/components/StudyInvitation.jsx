/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import autobind from 'autobind-decorator';
import pt from 'prop-types';
import React from 'react';

import 'commerce/browser_action/components/StudyInvitation.css';

/**
 * Study Invitation page for when users click the StudyFooter
 */
@autobind
export default class StudyInvitation extends React.Component {
  static propTypes = {
    // Direct props
    onClickBack: pt.func.isRequired,
    onClickParticipate: pt.func.isRequired,
  }

  render() {
    return (
      <React.Fragment>
        <div className="title-bar study">
          <button
            className="ghost back button"
            type="button"
            onClick={this.props.onClickBack}
            title="Back to Products"
          >
            <img
              className="icon"
              src={browser.extension.getURL('img/back.svg')}
              alt="Back to Products"
            />
          </button>
          <h1 className="title">Feedback</h1>
        </div>
        <div className="study-invitation">
          <img className="hero" src={browser.extension.getURL('img/ur_survey.svg')} alt="" />
          <p className="description">
            {"Help us improve Price Tracker by participating in a research study. Take this 5-minute survey to learn more about the study and see if you're a fit."}
          </p>
          <button
            className="button participate"
            type="button"
            onClick={this.props.onClickParticipate}
          >
            Take a 5-minute survey
          </button>
        </div>
      </React.Fragment>
    );
  }
}
