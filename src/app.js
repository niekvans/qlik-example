/* eslint-env browser */

import Halyard from 'halyard.js';
import angular from 'angular';
import enigma from 'enigma.js';
import enigmaMixin from 'halyard.js/dist/halyard-enigma-mixin';
import qixSchema from 'enigma.js/schemas/3.2.json';
import template from './app.html';
import Scatterplot from './scatterplot';
import ScatterplotAirport from './scatterplot-airport';

const halyard = new Halyard();

angular.module('app', []).component('app', {
  bindings: {},
  controller: ['$scope', '$q', '$http', function Controller($scope, $q, $http) {
    $scope.dataSelected = false;
    $scope.showFooter = false;

    $scope.toggleFooter = () => {
      $scope.showFooter = !$scope.showFooter;
      if (!$scope.showFooter && $scope.dataSelected) {
        this.clearAllSelections();
      }
    };

    $scope.openGithub = () => {
      window.open('https://github.com/qlik-oss/core-get-started');
    };

    this.connected = false;
    this.painted = false;
    this.connecting = true;

    let app = null;
    let scatterplotObject = null;
    let scatterplotObjectAirport = null;

    const select = (value) => {
      // app.getField('Movie').then((field) => {
      //   field.select(value).then(() => {
      //     $scope.dataSelected = true;
      //     this.getMovieInfo().then(() => {
      //       $scope.showFooter = true;
      //     });
      //   });
      // });
    };

    const scatterplotProperties = {
      qInfo: {
        qType: 'visualization',
        qId: '',
      },
      type: 'my-picasso-scatterplot',
      labels: true,
      qHyperCubeDef: {
        qDimensions: [{
          qDef: {
            qFieldDefs: ['Movie'],
            qSortCriterias: [{
              qSortByAscii: 1,
            }],
          },
        }],
        qMeasures: [{
          qDef: {
            qDef: '[Adjusted Costs]',
            qLabel: 'Adjusted cost ($)',
          },
          qSortBy: {
            qSortByNumeric: -1,
          },
        },
        {
          qDef: {
            qDef: '[imdbRating]',
            qLabel: 'imdb rating',
          },
        }],
        qInitialDataFetch: [{
          qTop: 0, qHeight: 50, qLeft: 0, qWidth: 3,
        }],
        qSuppressZero: false,
        qSuppressMissing: true,
      },
    };

    const scatterplot = new Scatterplot();

    const paintScatterPlot = (layout) => {
      scatterplot.paintScatterplot(document.getElementById('chart-container-scatterplot'), layout, {
        select,
        clear: () => this.clearAllSelections(),
        hasSelected: $scope.dataSelected,
      });
      this.painted = true;
    };

    const scatterplotPropertiesAirport = {
      qInfo: {
        qType: 'visualization',
        qId: '',
      },
      type: 'my-picasso-scatterplot',
      labels: true,
      qHyperCubeDef: {
        qDimensions: [{
          qDef: {
            qFieldDefs: ['Airport'],
            qSortCriterias: [{
              qSortByAscii: 1,
            }],
          },
        }],
        qMeasures: [{
          qDef: {
            qDef: '[Latitude]',
            qLabel: 'Latitude',
          },
          qSortBy: {
            qSortByNumeric: -1,
          },
        },
        {
          qDef: {
            qDef: '[Longitude]',
            qLabel: 'Longitude',
          },
        }],
        qInitialDataFetch: [{
          qTop: 0, qHeight: 500, qLeft: 0, qWidth: 3,
        }],
        qSuppressZero: false,
        qSuppressMissing: true,
      },
    };

    const scatterplotAirport = new ScatterplotAirport();

    const paintScatterPlotAirport = (layout) => {
      scatterplotAirport.paintScatterplot(document.getElementById('chart-container-scatterplot'), layout, {
        select,
        clear: () => this.clearAllSelections(),
        hasSelected: $scope.dataSelected,
      });
      this.painted = true;
    };

    this.generateGUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      // eslint-disable-next-line no-bitwise
      const r = Math.random() * 16 | 0;
      // eslint-disable-next-line no-bitwise
      const v = c === 'x' ? r : ((r & 0x3) | 0x8);
      return v.toString(16);
    });

    this.$onInit = () => {
      const config = {
        Promise: $q,
        schema: qixSchema,
        mixins: enigmaMixin,
        url: `ws://${window.location.hostname}:19076/app/${this.generateGUID()}`,
      };

      // Add local data
      const filePathMovie = '/data/movies.csv';
      const tableMovie = new Halyard.Table(filePathMovie, {
        name: 'Movies',
        fields: [
          { src: 'Movie', name: 'Movie' },
          { src: 'Year', name: 'Year' },
          { src: 'Adjusted Costs', name: 'Adjusted Costs' },
          { src: 'Description', name: 'Description' },
          { src: 'Image', name: 'Image' },
        ],
        delimiter: ',',
      });
      halyard.addTable(tableMovie);

      const filePathAirport = '/data/airports.csv';
      const tableAirport = new Halyard.Table(filePathAirport, {
        name: 'Airports',
        fields: [
          { src: 'Airport', name: 'Airport' },
          { src: 'City', name: 'City' },
          { src: 'Latitude', name: 'Latitude' },
          { src: 'Longitude', name: 'Longitude' },
          { src: 'Altitude (ft)', name: 'Altitude (ft)' },
        ],
        delimiter: ','
      });
      halyard.addTable(tableAirport);

      enigma.create(config).open().then((qix) => {
        this.connected = true;
        this.connecting = false;
        qix.createSessionAppUsingHalyard(halyard).then((result) => {
          app = result;
          result.getAppLayout()
            .then(() => {
              result.createSessionObject(scatterplotPropertiesAirport).then((model) => {
                scatterplotObject = model;

                const update = () => scatterplotObject.getLayout().then((layout) => {
                  // console.log(layout);
                  // paintScatterPlot(layout);
                  paintScatterPlotAirport(layout);
                });

                scatterplotObject.on('changed', update);
                update();
              });
            });
        }, () => {
          this.error = 'Could not create session app';
          this.connected = false;
          this.connecting = false;
        });
      }, () => {
        this.error = 'Could not connect to QIX Engine';
        this.connecting = false;
      });

      // Add web data
      $http.get('https://gist.githubusercontent.com/carlioth/b86ede12e75b5756c9f34c0d65a22bb3/raw/e733b74c7c1c5494669b36893a31de5427b7b4fc/MovieInfo.csv')
        .then((data) => {
          const table = new Halyard.Table(data.data, { name: 'MoviesInfo', delimiter: ';', characterSet: 'utf8' });
          halyard.addTable(table);
        })
        .then(() => {
          // enigma.create(config).open().then((qix) => {
          //   this.connected = true;
          //   this.connecting = false;
          //   qix.createSessionAppUsingHalyard(halyard).then((result) => {
          //     app = result;
          //     result.getAppLayout()
          //       .then(() => {
          //         result.createSessionObject(scatterplotPropertiesAirport).then((model) => {
          //           scatterplotObject = model;

          //           const update = () => scatterplotObject.getLayout().then((layout) => {
          //             // console.log(layout);
          //             paintScatterPlotAirport(layout);
          //           });

          //           scatterplotObject.on('changed', update);
          //           update();
          //         });
          //       });
          //   }, () => {
          //     this.error = 'Could not create session app';
          //     this.connected = false;
          //     this.connecting = false;
          //   });
          // }, () => {
          //   this.error = 'Could not connect to QIX Engine';
          //   this.connecting = false;
          // });
        });
    };

    this.clearAllSelections = () => {
      if ($scope.dataSelected) {
        $scope.dataSelected = false;
        app.clearAll();
      }
      $scope.showFooter = false;
    };

    this.getMovieInfo = () => {
      const tableProperties = {
        qInfo: {
          qType: 'visualization',
          qId: '',
        },
        type: 'my-info-table',
        labels: true,
        qHyperCubeDef: {
          qDimensions: [{
            qDef: {
              qFieldDefs: ['Movie'],
            },
          },
          {
            qDef: {
              qFieldDefs: ['Image'],
            },
          },
          {
            qDef: {
              qFieldDefs: ['Year'],
            },
          },
          {
            qDef: {
              qFieldDefs: ['Genre'],
            },
          },
          {
            qDef: {
              qFieldDefs: ['Description'],
            },
          },
          ],
          qInitialDataFetch: [{
            qTop: 0, qHeight: 50, qLeft: 0, qWidth: 50,
          }],
          qSuppressZero: false,
          qSuppressMissing: true,
        },
      };
      return app.createSessionObject(tableProperties)
        .then(model => model.getLayout()
          .then((layout) => {
            Scatterplot.showDetails(layout);
          }));
    };
  }],
  template,
});

angular.bootstrap(document, ['app']);
