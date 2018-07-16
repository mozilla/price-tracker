/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import autobind from 'autobind-decorator';
import pt from 'prop-types';
import React from 'react';

/**
 * An expandable section in an Accordion container. Must be used as a
 * direct child of an Accordion.
 */
@autobind
class AccordionSection extends React.Component {
  static propTypes = {
    /** Text displayed in the clickable header of the section */
    title: pt.string.isRequired,

    /** If true, this section will be expanded by default. */
    initial: pt.bool, // eslint-disable-line react/no-unused-prop-types

    /** Contents that will be displayed when this section is active. */
    children: pt.node.isRequired,

    // All reamaining props are provided by Accordion automatically.
    active: pt.bool,
    index: pt.number,
    onClick: pt.func,

  }

  static defaultProps = {
    active: false,
    initial: false,
    onClick() {},
    index: null,
  }

  handleClick() {
    this.props.onClick(this.props.index);
  }

  render() {
    const {active, children, title} = this.props;
    return (
      <div className={`accordion-section ${active ? 'active' : ''}`} onClick={this.handleClick}>
        <h1 className="accordion-section-title">{title}</h1>
        <div className="accordion-section-content">
          {active && children}
        </div>
      </div>
    );
  }
}

/**
 * Displays collapsable content panels in a vertical stack. Only one section can
 * be expanded at a time.
 *
 * @example
 *   <Accordion>
 *     <Accordion.Section title="Section 1" initial>Section 1 Content</Accordion.Section>
 *     <Accordion.Section title="Section 2">Section 2 Content</Accordion.Section>
 *   </Accordion>
 */
@autobind
export default class Accordion extends React.Component {
  static Section = AccordionSection;

  static propTypes = {
    /** The only direct children of an Accordion should be Accordion.Section elements */
    children: pt.node.isRequired,

    /** Extra classnames to add to the container element */
    className: pt.string,
  }

  static defaultProps = {
    className: '',
  }

  constructor(props) {
    super(props);
    this.state = {
      activeChildIndex: null,
    };
  }

  componentDidMount() {
    // Find the first child with `initial` set and make it active.
    const childArray = React.Children.toArray(this.props.children);
    const initialChildIndex = childArray.findIndex(child => child.props.initial);
    this.setState({activeChildIndex: initialChildIndex});
  }

  handleSectionClicked(index) {
    this.setState({activeChildIndex: index});
  }

  render() {
    const {children, className} = this.props;
    return (
      <div className={`${className} accordion`}>
        {
          // toArray strips out null children, which we want.
          React.Children.toArray(children).map(
            (child, childIndex) => React.cloneElement(child, {
              active: childIndex === this.state.activeChildIndex,
              onClick: this.handleSectionClicked,
              index: childIndex,
            }),
          )
        }
      </div>
    );
  }
}
