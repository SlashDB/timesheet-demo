(function () {
    'use strict';

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
        data: function () {
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

    function getURL(s) {
        return window.timesheet.baseURL + s;
    }

    Vue.component('ProjectList', {
        template: `
        <div class="mt-3">
            <div class="card mb-3" v-for="pid in pids">
                <div class="card-header">
                    <span><strong>{{ projects[pid].data.name }}</strong></span>
                    <span class="float-sm-right float-md-right float-lg-right">total duration: <strong>{{ sumDuration(projects[pid]) }}</strong> hours</span>
                </div>
                <div class="card-block">
                    <div class="card" v-for="timesheet in projects[pid].timesheets">
                        <div class="card-block">
                            <form>
                                <fieldset disabled readonly>
                                    <div class="form-group">
                                        <label for="date">Timestamp</label>
                                        <input type="text"
                                               v-model="timesheet.date"
                                               id="date" class="form-control"
                                               placeholder="timestamp">
                                    </div>
                                    <div class="form-group">
                                        <label for="duration">Duration</label>
                                        <input type="text"
                                               v-model="timesheet.duration"
                                               id="duration" class="form-control"
                                               placeholder="duration">
                                    </div>
                                    <div class="form-group">
                                        <label for="accomplishment">Accomplishment</label>
                                        <textarea type="text"
                                               v-model="timesheet.accomplishments"
                                               id="accomplishment" class="form-control"
                                               placeholder="accomplishment"></textarea>
                                    </div>
                                </fieldset>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `,
        formatDateTime: function (value) {
            var d = new Date(value);
            return d.toLocaleTimeString() + ", " + d.toLocaleDateString();
        },
        methods: {
            sumDuration: function (project) {
                return project.timesheets.map(function (el) { return el.duration || 0 }).reduce(function (a, b) {
                    return a + b;
                }, 0)
            }
        },
        props: ['projects', 'pids']
    });

    var app = new Vue({
        el: '#app',
        data: function () {
            var data = { view: 'projects', projects: {}, pids: [] };

            $.getJSON(getURL('/timesheet/user_id/2.json'))
                .then(function (timesheets) {
                    var t, pid;
                    for (var i = 0, l = timesheets.length; i < l; i++) {
                        t = timesheets[i];
                        pid = t['project_id'];
                        if (data.projects[pid] == null) {
                            data.projects[pid] = { timesheets: [], data: {} };
                        }
                        data.projects[pid]['timesheets'].push(t);
                    }

                    data.pids = Object.keys(data.projects);
                    for (var i = 0, l = data.pids.length; i < l; i++) {
                        var pid = data.pids[i];
                        $.ajax({
                            url: getURL('/project/id/' + pid + '.json'),
                            type: 'GET',
                            async: false,
                            cache: false,
                            timeout: 30000,
                            success: function (pdata) {
                                $.extend(true, data.projects[pid].data, pdata);
                            }
                        });

                    }
                });

            return data;
        }
    });
})();
