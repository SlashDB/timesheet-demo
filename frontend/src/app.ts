/// <reference path="../typings/index.d.ts" />
'use strict';

class MainCtrl {
    static $inject: Array<String> = [];
    constructor() {
        let ctrl = this;
        ctrl.projects = [
            {
                name: 'p1',
                subitems: [
                    { name: 'task 1' },
                    { name: 'task 2' },
                    { name: 'task 3' }
                ]
            },
            {
                name: 'p2',
                subitems: [
                    { name: 'task 1' },
                    { name: 'task 2' }
                ]
            },
            {
                name: 'p3',
                subitems: [
                    { name: 'task 4' },
                    { name: 'task 5' },
                    { name: 'task 6' },
                    { name: 'task 7' },
                    { name: 'task 8' }
                ]
            }
        ]
    }
}

angular.
    module('timelapseApp', []).
    controller('MainCtrl', MainCtrl);
