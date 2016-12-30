/// <reference path="../typings/index.d.ts" />

(function (): void {
    'use strict';

    interface SubItem {
        name: String
    }

    interface Item {
        name: String
        subitem: Array<SubItem>
    }

    Vue.component('SearchItems', {
        template: `
        <div class="card card-block">
            <h4 class="card-title">{{ header }} <button type="button" class="btn btn-link">+</button></h4>
            <form>
                <div class="form-group">
                    <input class="form-control form-control-sm" type="text" v-model="searchBy" placeholder="search">
                </div>
                <div class="form-check" v-if="showOwned">
                    <label class="form-check-label">
                        <input class="form-check-input" type="checkbox" v-model="owned">
                        owned
                    </label>
                </div>
            </form>
        </div>
        `,
        data: function (): Object {
            return { searchBy: '', owned: true }
        },
        props: {
            showOwned: {
                type: Boolean,
                default: false
            },
            header: {
                type: String,
                required: true
            }
        }
    });

    Vue.component('ItemsList', {
        template: `
        <div class="card">
            <ul class="list-group list-group-flush" v-for="item in items">
                <li class="list-group-item bg-faded">{{ item.name }}</li>
                <li class="list-group-item">
                    <ul v-for="subitem in item.subitems">
                        <li>{{ subitem.name }}</li>
                    </ul>
                </li>
            </ul>
        </div>
        `,
        props: ['items']
    });

    let app = new Vue({
        el: '#app',
        data: function (): Object {
            return {
                projects: [
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
    });
})();
