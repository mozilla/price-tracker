/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import {shallow} from 'enzyme';

import test from 'tape';

import Accordion from 'commerce/sidebar/components/Accordion';

test('<Accordion> should apply the className prop to the returned container element', (t) => {
  const wrapper = shallow(<Accordion className="foobar" />);
  t.ok(wrapper.is('.foobar.accordion'), 'Accordion container has extra class');
  t.end();
});
