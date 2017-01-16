(function () {
    'use strict';

    function getURL(s) {
        return window.timesheet.baseURL + s;
    }

    Vue.component('LoginForm', {
        template: `
        <form>
            <div class="form-group">
                <label for="username">User name</label>
                <input type="text" class="form-control" id="username" placeholder="enter user name">
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" class="form-control" id="password" placeholder="enter user password">
            </div>
            <button type="button" @click="$emit('login', 'project')" class="btn btn-primary">GO!</button>
        </form>
        `
    });

    Vue.component('RegisterForm', {
        template: `
        <form>
            <div class="form-group">
                <label for="username">User name</label>
                <input type="text" class="form-control" id="username" placeholder="enter your new user name">
            </div>
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" class="form-control" id="email" placeholder="enter your email address">
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" class="form-control" id="password" placeholder="enter user password">
            </div>
            <div class="form-group">
                <input type="password2" class="form-control" id="password2" placeholder="re-enter user password">
            </div>
            <button type="button" @click="$emit('register', 'project')" class="btn btn-primary">GO!</button>
        </form>
        `
    });

    Vue.component('AuthCard', {
        template: `
        <div class="card text-center mt-3">
            <div class="card-header">
                <ul class="nav nav-tabs justify-content-center card-header-tabs">
                    <li class="nav-item" @click="$emit('set-view', 'login')">
                        <a class="nav-link" :class="{active: view == 'login'}">Login</a>
                    </li>
                    <li class="nav-item" @click="$emit('set-view', 'register')">
                        <a class="nav-link" :class="{active: view == 'register'}" >Register</a>
                    </li>
                </ul>
            </div>
            <div v-show="view === 'login'" class="card-block">
                <p class="card-text">
                    <login-form @login="$emit('set-view', 'project')" />
                </p>
            </div>
            <div v-show="view === 'register'" class="card-block">
                <p class="card-text">
                    <register-form @register="$emit('set-view', 'login')" />
                </p>
            </div>
        </div>
        `,
        props: {
            view: {
                type: String,
                required: true
            }
        }
    });

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
        data: function () {
            var data = {
                projects: {},
                pids: []
            };

            $.getJSON(getURL('/timesheet/user_id/2.json'))
                .then(function (timesheets) {
                    var t, pid;
                    for (var i = 0, l = timesheets.length; i < l; i++) {
                        t = timesheets[i];
                        pid = t['project_id'];
                        if (data.projects[pid] == null) {
                            data.projects[pid] = {
                                timesheets: [],
                                data: {}
                            };
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
        },
        methods: {
            formatDateTime: function (value) {
                var d = new Date(value);
                return d.toLocaleTimeString() + ", " + d.toLocaleDateString();
            },
            sumDuration: function (project) {
                return project.timesheets.map(function (el) {
                    return el.duration || 0
                }).reduce(function (a, b) {
                    return a + b;
                }, 0)
            }
        }
    });

    var app = new Vue({
        el: '#app',
        methods: {
            setView: function (viewName) {
                this.view = viewName;
            },
        },
        data: {
            view: 'login'
        }
    });
})();