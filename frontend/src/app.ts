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
                <div v-if="showOwned" class="form-group">
                    <label class="col-form-label col-form-label-sm" for="owned" @click="owned = !owned">owned</label>
                    <input class="form-check-input" type="checkbox" v-model="owned">
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
        <div>
            <div v-for="item in items">
                <div>{{ item.name }}</div>
                <div>
                    <ul>
                        <li v-for="subitem in item.subitems">{{ subitem.name }}</li>
                    </ul>
                </div>
            </div>
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
