/*! Modified by Junjue Wang <junjuew@cs.cmu.edu> (2018)
 */
/*! JointJS v2.2.1 (2018-11-12) - JavaScript diagramming library


This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import joint from 'jointjs';
import React from 'react';

joint.shapes.basic.Circle.define('fsa.State', {
    attrs: {
        circle: {
            'stroke-width': 3
        },
        text: {
            'font-weight': '800'
        }
    }
});

joint.dia.Element.define('fsa.StartState', {
    size: {
        width: 20,
        height: 20
    },
    attrs: {
        circle: {
            transform: 'translate(10, 10)',
            r: 10,
            fill: '#000000'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><circle/></g></g>',
});

joint.dia.Element.define('fsa.EndState', {
    size: {
        width: 20,
        height: 20
    },
    attrs: {
        '.outer': {
            transform: 'translate(10, 10)',
            r: 10,
            fill: '#ffffff',
            stroke: '#000000'
        },

        '.inner': {
            transform: 'translate(10, 10)',
            r: 6,
            fill: '#000000'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><circle class="outer"/><circle class="inner"/></g></g>',
});

joint.dia.Link.define('fsa.Arrow', {
    attrs: {
        '.marker-target': {
            d: 'M 10 0 L 0 5 L 10 10 z'
        },
        '.link-tools': {
            display: 'none'
        },
        '.tool-remove': {
            display: 'none'
        }
    },
    smooth: true
});

export default joint;

// export class State extends React.Component {
//     componentDidMount() {
//         const state = this.props.state;

//         const rect = new joint.shapes.fsa.State({
//             position: {
//                 x: state.x,
//                 y: state.y
//             },
//             size: {
//                 width: 100,
//                 height: 30
//             },
//             attrs: {
//                 rect: {
//                     fill: 'blue'
//                 },
//                 text: {
//                     text: state.name,
//                     fill: 'white'
//                 }
//             }
//         });
//         rect.set('id', state.id);

//         rect.on('change:position', (event) => {
//             this.props.onChangedPosition(state.id, event.attributes.position.x, event.attributes.position.y);
//         });
//         this.props.container.push(rect);
//     }

//     render() {
//         return null;
//     }
// }