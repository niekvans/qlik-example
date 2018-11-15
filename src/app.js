/* eslint-env browser */

import Halyard from 'halyard.js';
import angular from 'angular';
import enigma from 'enigma.js';
import enigmaMixin from 'halyard.js/dist/halyard-enigma-mixin';
import qixSchema from 'enigma.js/schemas/3.2.json';
import template from './app.html';
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
    
    this.connected = false;
    this.painted = false;
    this.connecting = true;

    let app = null;
    let scatterplotObject = null;

    const select = (value) => {
      app.getField('Airport').then((field) => {
        field.select(value).then(() => {
          $scope.dataSelected = true;
          this.getAirportInfo().then(() => {
            $scope.showFooter = true;
          });
        });
      });
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
        },
        {
          qDef: {
            qDef: '[Altitude (ft)]',
            qLabel: 'Altitude (ft)',
          },
          qSortBy: {
            qSortByNumeric: -1,
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
      const filePathAirport = '/data/airports.csv';
      const tableAirport = new Halyard.Table(filePathAirport, {
        name: 'Airports',
        fields: [
          { src: 'Airport', name: 'Airport' },
          { src: 'City', name: 'City' },
          { src: 'Latitude', name: 'Latitude' },
          { src: 'Longitude', name: 'Longitude' },
          { src: 'Altitude (ft)', name: 'Altitude (ft)' },
          { src: 'Country', name: 'Country' },
          { src: 'IATA Code', name: 'IATA Code' },
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

    };

    this.clearAllSelections = () => {
      if ($scope.dataSelected) {
        $scope.dataSelected = false;
        app.clearAll();
      }
      $scope.showFooter = false;
    };

    this.getAirportInfo = () => {
      const tableProperties = {
        qInfo: {
          qType: 'visualization',
          qId: '',
        },
        type: 'my-info-table',
        labels: true,
        qHyperCubeDef: {
          qDimensions: [
            {
              qDef: {
                qFieldDefs: ['Airport'],
              },
            },
            {
              qDef: {
                qFieldDefs: ['Longitude'],
              },
            },
            {
              qDef: {
                qFieldDefs: ['Latitude'],
              },
            },
            {
              qDef: {
                qFieldDefs: ['City'],
              },
            },
            {
              qDef: {
                qFieldDefs: ['Altitude (ft)'],
              },
            },
            {
              qDef: {
                qFieldDefs: ['Country'],
              },
            },
            {
              qDef: {
                qFieldDefs: ['IATA Code'],
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
            ScatterplotAirport.showDetails(layout);
          }));
    };


  }],
  template,
});

angular.bootstrap(document, ['app']);
