/* eslint-env browser */
/* eslint import/extensions:0 */

import picasso from 'picasso.js';
import picassoQ from 'picasso-plugin-q';

picasso.use(picassoQ);

export default class Scatterplot {
  constructor() {
    this.axisPainted = false;
    this.pic = null;
  }

  paintScatterplot(element, layout, selectionAPI) {
    if (!(layout.qHyperCube
      && layout.qHyperCube.qDataPages
      && layout.qHyperCube.qDataPages[0]
      && layout.qHyperCube.qDataPages[0].qMatrix)
    ) {
      return;
    }
    if (selectionAPI.hasSelected) {
      return; // keep selected chart state
    }
    const settings = {
      collections: [
        {
          key: 'coll',
          data: {
            extract: {
              field: 'qDimensionInfo/0',
              props: {
                airport: { value: v => v.qText },
                latitude: { field: 'qMeasureInfo/0' },
                longitude: { field: 'qMeasureInfo/1' },
              },
            },
          },
        },
      ],
      scales: {
        x: { data: { field: 'qMeasureInfo/1' }, expand: 0.1 },
        y: { data: { field: 'qMeasureInfo/0' }, expand: 0.1, invert: true },
      },
      components: [
        {
          key: 'xaxis',
          type: 'axis',
          scale: 'x',
          dock: 'bottom',
          settings: { labels: { fill: '#f2f2f2' } },
        },
        {
          key: 'yaxis',
          type: 'axis',
          scale: 'y',
          dock: 'left',
          settings: { labels: { fill: '#f2f2f2' } },
        },
        {
          key: 'xtitle',
          type: 'text',
          scale: 'x',
          dock: 'bottom',
          style: {
            text: { fill: '#f2f2f2' },
          },
        },
        {
          key: 'ytitle',
          type: 'text',
          scale: 'y',
          dock: 'left',
          style: {
            text: { fill: '#f2f2f2' },
          },
        },
        {
          key: 'points',
          type: 'point',
          data: { collection: 'coll' },
          brush: {
            trigger: [{
              on: 'tap',
              action: 'set',
              data: ['airport'],
              propagation: 'stop',
              contexts: ['highlight'],
            }, {
              on: 'over',
              action: 'set',
              data: ['airport'],
              propagation: 'stop',
              contexts: ['tooltip'],
            }],
            consume: [{
              context: 'highlight',
              style: {
                inactive: {
                  fill: 'rgba(109, 232, 193, 0.3)',
                },
              },
            }, {
              context: 'tooltip',
            }],
          },
          settings: {
            x: { scale: 'x', ref: 'longitude' },
            y: { scale: 'y', ref: 'latitude' },
            size: 0.2,
            opacity: 0.8,
            fill: 'rgba(109, 232, 193, 1.0)',
          },
        },
      ],
    };

    if (!this.pic) {
      this.pic = picasso.chart({
        element,
        data: [{
          type: 'q',
          key: 'qHyperCube',
          data: layout.qHyperCube,
        }],
        settings,
      });

      this.pic.brush('highlight').on('update', (added) => {
        if (added[0]) {
          selectionAPI.select(added[0].values[0]);
        } else {
          this.pic.brush('highlight').end();
          selectionAPI.clear();
        }
      });
      this.pic.brush('tooltip').on('update', (added) => {
        if (added.length) {
          const s = this.pic.getAffectedShapes('tooltip')[0];
          const rect = s.element.getBoundingClientRect();
          const p = {
            x: s.bounds.x + s.bounds.width + rect.x + 5,
            y: s.bounds.y + (s.bounds.height / 2) + (rect.y - 28),
          };
          Scatterplot.showTooltip(s.data.airport.value, p);
        } else {
          Scatterplot.hideTooltip();
        }
      });
    } else {
      this.pic.update({
        data: [{
          type: 'q',
          key: 'qHyperCube',
          data: layout.qHyperCube,
        }],
        settings,
      });
    }
  }

  static showDetails(layout) {
    if (!(layout.qHyperCube
      && layout.qHyperCube.qDataPages
      && layout.qHyperCube.qDataPages[0]
      && layout.qHyperCube.qDataPages[0].qMatrix)
    ) {
      return;
    }

    console.log(layout.qHyperCube.qDataPages[0]);

    const data = layout.qHyperCube.qDataPages[0].qMatrix.map(item => ({
      airport: item[0].qText,
      longitude: item[1].qText,
      latitude: item[2].qText,
      city: item[3].qText,
      altitude: item[4].qText,
      country: item[5].qText,
      code: item[6].qText,
    }));

    const airport = document.getElementsByClassName('airport-name')[0];
    airport.innerHTML = data[0].airport;

    const height = document.getElementsByClassName('airport-height')[0];
    height.innerHTML = data[0].altitude + ' (ft); ' + Math.round(data[0].altitude * 30.48)/100 + ' (m).';

    const coordinates = document.getElementsByClassName('airport-coordinates')[0];
    coordinates.innerHTML = `Longitude: ${data[0].longitude}  Latitude: ${data[0].latitude}`;

    const description = document.getElementsByClassName('airport-description')[0];
    description.innerHTML = `${data[0].airport} (${data[0].code}) is located in ${data[0].city}, ${data[0].country}.`;

  }

  static hideTooltip() {
    const elements = document.getElementsByClassName('tooltip');
    if (elements[0]) {
      document.body.removeChild(elements[0]);
    }
  }

  static showTooltip(text, point) {
    Scatterplot.hideTooltip();
    const currentTooltip = document.createElement('div');
    currentTooltip.appendChild(document.createTextNode(text));
    currentTooltip.style.position = 'absolute';
    currentTooltip.style.top = '-99999px';
    currentTooltip.style.left = '-99999px';
    currentTooltip.classList.add('tooltip');

    document.body.appendChild(currentTooltip);

    // Reposition the tooltip
    currentTooltip.style.top = `${point.y}px`;
    currentTooltip.style.left = `${(point.x + 5)}px`;
  }
}