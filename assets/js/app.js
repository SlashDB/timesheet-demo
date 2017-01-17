(function () {
    'use strict';

    function getURL(s) {
        return window.timesheet.baseURL + s;
    }

    Vue.component('InputErrors', {
        template: '<div><div v-for="e in errors" class="form-control-feedback">{{ e }}</div></div>',
        props: {
            errors: {
                type: Array,
                default: function () {
                    return [];
                }
            }
        }
    });

    Vue.component('LoginForm', {
        template: `
        <form @submit.prevent="login">
            <div class="form-group" :class="{'has-danger': username.errors.length > 0}">
                <label for="username">User name</label>
                <input type="text" class="form-control"
                       :class="{'form-control-danger': username.errors.length > 0}"
                       id="username"
                       v-model="username.value"
                       placeholder="enter user name">
                <input-errors :errors="username.errors"/>
            </div>
            <div class="form-group" :class="{'has-danger': password.errors.length > 0}">
                <label for="password">Password</label>
                <input type="password" class="form-control"
                       :class="{'form-control-danger': username.errors.length > 0}"
                       id="password"
                       v-model="password.value"
                       placeholder="enter password">
                <input-errors :errors="password.errors"/>
            </div>
            <button type="submit" class="btn btn-primary">GO!</button>
        </form>
        `,
        data: function () {
            return {
                username: {
                    value: '',
                    errors: []
                },
                password: {
                    value: '',
                    errors: []
                },
                form: {
                    errors: []
                },
            };
        },
        methods: {
            login: function ($event) {
                var t = this,
                    ks = Object.keys(t._data);

                $.ajax({
                    url: '/app/auth/',
                    data: {
                        username: t.username.value,
                        password: t.password.value,
                    },
                    dataType: 'json',
                    type: 'POST',
                    success: function (resp) {
                        for (var i = 0, l = ks.length; i < l; i++) {
                            t[ks[i]].errors = [];
                        }
                        t.$emit('logged-in');
                    },
                    error: function (resp) {
                        for (var i = 0, l = ks.length; i < l; i++) {
                            k = ks[i];
                            t[k].errors = resp.responseJSON[k] || [];
                        }
                    }
                });
            }
        }
    });

    Vue.component('RegisterForm', {
        template: `
        <form @submit.prevent="register">
            <div class="form-group" :class="{'has-danger': username.errors.length > 0}">
                <label for="username">User name</label>
                <input type="text" class="form-control"
                       :class="{'form-control-danger': username.errors.length > 0}"
                       id="username"
                       v-model="username.value"
                       placeholder="enter your new user name">
                <input-errors :errors="username.errors"/>
            </div>
            <div class="form-group" :class="{'has-danger': email.errors.length > 0}">
                <label for="email">Email</label>
                <input type="email"
                       :class="{'form-control-danger': email.errors.length > 0}"
                       class="form-control"
                       id="email"
                       v-model="email.value"
                       placeholder="enter your email address">
                <input-errors :errors="email.errors"/>
            </div>
            <div class="form-group" :class="{'has-danger': password.errors.length > 0}">
                <label for="password">Password</label>
                <input type="password" class="form-control"
                       :class="{'form-control-danger': password.errors.length > 0}"
                       @keyup="isTheSamePass"
                       id="password"
                       v-model="password.value"
                       placeholder="enter user password">
                <input-errors :errors="password.errors"/>
            </div>
            <div class="form-group" :class="{'has-danger': password2.errors.length > 0}">
                <input type="password" class="form-control"
                       :class="{'form-control-danger': password2.errors.length > 0}"
                       @keyup="isTheSamePass"
                       id="password2"
                       v-model="password2.value"
                       placeholder="re-enter user password">
                <input-errors :errors="password2.errors"/>
                <small class="form-text text-muted">You need to re-enter the password above.</small>
            </div>
            <button type="submit" class="btn btn-primary">GO!</button>
        </form>
        `,
        data: function () {
            return {
                username: {
                    value: '',
                    errors: []
                },
                email: {
                    value: '',
                    errors: []
                },
                password: {
                    value: '',
                    errors: []
                },
                password2: {
                    value: '',
                    errors: []
                },
                form: {
                    errors: []
                },
            };
        },
        methods: {
            isTheSamePass: function () {
                if (this.password.value !== this.password2.value) {
                    if (this.password2.errors.length === 0) {
                        this.password2.errors.push("the password is different to the one above");
                    }
                    return;
                }
                this.password2.errors.pop();
            },
            register: function () {
                var t = this,
                    ks = Object.keys(t._data);

                $.ajax({
                    url: '/app/reg/',
                    data: {
                        username: t.username.value,
                        email: t.email.value,
                        password: t.password.value,
                    },
                    dataType: 'json',
                    type: 'POST',
                    success: function (resp) {
                        for (var i = 0, l = ks.length; i < l; i++) {
                            t[ks[i]].errors = [];
                        }
                        t.$emit('registered');
                    },
                    error: function (resp) {
                        var k;
                        for (var i = 0, l = ks.length; i < l; i++) {
                            k = ks[i];
                            t[k].errors = resp.responseJSON[k] || [];
                        }
                    }
                });
            }
        }
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
                    <login-form @logged-in="$emit('set-view', 'project')"/>
                </p>
            </div>
            <div v-show="view === 'register'" class="card-block">
                <p class="card-text">
                    <register-form @registered="$emit('set-view', 'login')"/>
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
                return project.timesheets
                    .map(function (el) {
                        return el.duration || 0;
                    })
                    .reduce(function (a, b) {
                        return a + b;
                    }, 0);
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