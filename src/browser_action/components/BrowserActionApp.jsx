/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import autobind from 'autobind-decorator';
import pt from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import config from 'commerce/config';
import EmptyOnboarding from 'commerce/browser_action/components/EmptyOnboarding';
import TrackedProductList from 'commerce/browser_action/components/TrackedProductList';
import {extractedProductShape, getAllProducts, productShape} from 'commerce/state/products';
import * as syncActions from 'commerce/state/sync';
import {recordEvent, getBadgeType} from 'commerce/telemetry/extension';
import StudyInvitation from 'commerce/browser_action/components/StudyInvitation';
import StudyFooter from 'commerce/browser_action/components/StudyFooter';

import 'commerce/browser_action/components/BrowserActionApp.css';

/**
 * Base component for the entire panel. Handles loading state and whether to
 * display the empty state.
 */
@connect(
  state => ({
    products: getAllProducts(state),
  }),
  {
    loadStateFromStorage: syncActions.loadStateFromStorage,
  },
)
@autobind
export default class BrowserActionApp extends React.Component {
  static propTypes = {
    // Direct props
    extractedProduct: extractedProductShape, // Product detected on the current page, if any

    // State props
    products: pt.arrayOf(productShape).isRequired,

    // Dispatch props
    loadStateFromStorage: pt.func.isRequired,
  }

  static defaultProps = {
    extractedProduct: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      extractedProduct: props.extractedProduct,
      showStudyInvitation: false,
      enableStudyUI: false,
    };
  }

  async componentDidMount() {
    this.props.loadStateFromStorage();

    browser.runtime.onMessage.addListener((message) => {
      if (message.subject === 'extracted-product') {
        this.setState({extractedProduct: message.extractedProduct});
      }
    });

    this.setState({enableStudyUI: await config.get('enableStudyUI')});

    await recordEvent('open_popup', 'toolbar_button', null, {badge_type: await getBadgeType()});
  }

  /**
   * Show the Study popup when the StudyFooter is clicked
   */
  handleClickStudy() {
    this.setState({showStudyInvitation: true});
  }

  /**
   * Return to the TrackedProductList when the back button on the Study popup is clicked
   */
  handleClickBack() {
    this.setState({showStudyInvitation: false});
  }

  /**
   * Open the Study recruitment survey page and close the panel when the participate button
   * in the Study popup is clicked
   */
  async handleClickParticipate() {
    browser.tabs.create({url: await config.get('studyUrl')});
    window.close();
  }

  render() {
    const {products} = this.props;
    const {extractedProduct, showStudyInvitation, enableStudyUI} = this.state;
    if (showStudyInvitation) {
      return (
        <StudyInvitation
          onClickBack={this.handleClickBack}
          onClickParticipate={this.handleClickParticipate}
        />
      );
    }
    return (
      <React.Fragment>
        <div className="title-bar">
          <h1 className="title">Products</h1>
        </div>
        {products.length < 1
          ? (
            <EmptyOnboarding extractedProduct={extractedProduct} />
          )
          : (
            <React.Fragment>
              <TrackedProductList products={products} extractedProduct={extractedProduct} />
              {enableStudyUI ? <StudyFooter onClick={this.handleClickStudy} /> : null}
            </React.Fragment>
          )}
      </React.Fragment>
    );
  }
}
