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

    var resetFields = function (target, items) {
        var item;
        for (var i = 0, l = items.length; i < l; i++) {
            item = target[items[i]];
            item.errors = [];
            item.value = '';
        }
    };

    var formValid = function (obj) {
        var formValid = true,
            keys = Object.keys(obj),
            reqMsg = 'this field is required',
            field, reqMsgIdx;

        for (var i = 0, l = keys.length; i < l; i++) {
            field = obj[keys[i]];
            reqMsgIdx = field.errors.indexOf(reqMsg);

            if ((field.required || false) && !Boolean(field.value)) {
                if (reqMsgIdx === -1) {
                    field.errors.push(reqMsg);
                }
                formValid = false;
            } else {
                field.errors.splice(reqMsgIdx, 1);
            }
        }
        return formValid;
    };

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
                    errors: [],
                    required: true
                },
                password: {
                    value: '',
                    errors: [],
                    required: true
                },
                form: {
                    errors: []
                },
            };
        },
        methods: {
            createAuthInfo: function (accessToken) {
                var payload = JSON.parse(atob(accessToken.split('.')[1])),
                    authInfo = {
                        accessToken: accessToken,
                        payload: payload
                    };
                return authInfo;
            },
            login: function ($event) {
                var t = this;

                if (formValid(t._data)) {
                    var ks = Object.keys(t._data);

                    $.ajax({
                        url: '/app/auth/',
                        data: {
                            username: t.username.value,
                            password: t.password.value
                        },
                        dataType: 'json',
                        type: 'POST',
                        success: function (resp) {
                            resetFields(t, ks);
                            t.$emit('logged-in', t.createAuthInfo(resp.accessToken));
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
                    errors: [],
                    required: true
                },
                email: {
                    value: '',
                    errors: [],
                    required: true
                },
                password: {
                    value: '',
                    errors: [],
                    required: true
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
                var t = this;

                if (formValid(t._data)) {
                    var ks = Object.keys(t._data);

                    $.ajax({
                        url: '/app/reg/',
                        data: {
                            username: t.username.value,
                            email: t.email.value,
                            password: t.password.value
                        },
                        dataType: 'json',
                        type: 'POST',
                        success: function (resp) {
                            resetFields(t, ks);
                            t.$emit('registered');
                        },
                        error: function (resp) {
                            if (resp.status != 201) {
                                var k;
                                for (var i = 0, l = ks.length; i < l; i++) {
                                    k = ks[i];
                                    t[k].errors = resp.responseJSON[k] || [];
                                }
                            } else {
                                resetFields(t, ks);
                                t.$emit('registered');
                            }
                        }
                    });
                }
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
                    <login-form @logged-in="onLoggedIn"/>
                </p>
            </div>
            <div v-show="view === 'register'" class="card-block">
                <p class="card-text">
                    <register-form @registered="$emit('set-view', 'login')"/>
                </p>
            </div>
        </div>
        `,
        methods: {
            onLoggedIn: function (accessInfo) {
                this.$emit('store-auth-info', accessInfo);
                this.$emit('set-view', 'projects');
            }
        },
        props: {
            view: {
                type: String,
                required: true
            }
        }
    });

    Vue.component('NewProject', {
        template: `
        <div class="card text-center">
            <div class="card-block">
                <h4 class="card-title">New project</h4>
                <form @submit.prevent="create">
                    <div class="form-group" :class="{'has-danger': name.errors.length > 0}">
                        <label for="name">Name</label>
                        <input type="name"
                               class="form-control form-control-sm"id="name"
                               :class="{'form-control-danger': name.errors.length > 0}"
                               v-model="name.value"
                               aria-describedby="emailHelp" placeholder="enter a project name">
                        <input-errors :errors="name.errors"/>
                    </div>
                    <div class="form-group" :class="{'has-danger': description.errors.length > 0}">
                        <label for="description">Description</label>
                        <textarea
                            class="form-control form-control-sm"
                            :class="{'form-control-danger': description.errors.length > 0}"
                            v-model="description.value"
                            id="description" rows="3">
                        </textarea>
                        <input-errors :errors="description.errors"/>
                    </div>
                    <button type="submit" class="btn btn-primary">Create</button>
                </form>
            </div>
        </div>
        `,
        data: function () {
            return {
                name: {
                    value: '',
                    errors: [],
                    required: true
                },
                description: {
                    value: '',
                    errors: [],
                    required: true
                }
            };
        },
        methods: {
            create: function () {
                var t = this;

                if (formValid(t._data)) {
                    var data = {
                        name: t.name.value,
                        description: t.description.value
                    };

                    $.ajax({
                        url: getURL('/project.json'),
                        type: "POST",
                        data: JSON.stringify(data),
                        contentType: "application/json; charset=utf-8",
                        success: function (resp) {
                            var tdata = {
                                project_id: resp.split('/').pop(),
                                user_id: t.userId,
                                duration: 0,
                                accomplishments: ''
                            };

                            $.ajax({
                                url: getURL('/timesheet.json'),
                                type: "POST",
                                data: JSON.stringify(tdata),
                                contentType: "application/json; charset=utf-8",
                                error: function (resp) {
                                    // ignore errors - bitbucket issue #360
                                    var ld = {
                                        data: $.extend({
                                            id: tdata.project_id
                                        }, data),
                                        timesheets: []
                                    };
                                    t.$emit('project-created', ld);
                                    resetFields(t, ['name', 'description']);
                                }
                            });
                        },
                        error: function (resp) {
                            if (resp.status != 201) {
                                console.log(resp);
                            }
                        }
                    });
                }
            }
        },
        props: {
            userId: {
                type: Number,
                default: -1,
            }
        }
    });

    Vue.component('ProjectList', {
        template: `
        <div class="mt-3">
            <new-project :userId="userId" @project-created="addProject"/>
            <div v-if="pids.length > 0" class="mt-3">
                <div class="card mb-3" v-for="pid in pids">
                    <div class="card-header">
                        <span><strong>{{ projects[pid].data.name }}</strong></span>
                        <span class="float-sm-right float-md-right float-lg-right">
                            total duration: <strong>{{ sumDuration(projects[pid]) }}</strong> hours
                        </span>
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
            <div v-else class="card text-center mt-3">
                <div class="card-block">
                    <h4 class="card-title">You have no project yet.</h4>
                </div>
            </div>
        </div>
        `,
        data: function () {
            var data = {
                projects: {},
                pids: []
            };

            if (this.userId !== -1) {
                $.getJSON(getURL('/timesheet/user_id/' + this.userId + '.json'))
                    .then(function (timesheets) {
                        var t, pid;
                        for (var i = 0, l = timesheets.length; i < l; i++) {
                            t = timesheets[i];
                            pid = t.project_id;
                            if (data.projects[pid] == null) {
                                data.projects[pid] = {
                                    timesheets: [],
                                    data: {}
                                };
                            }
                            if (t.duration >= 0.01) {
                                data.projects[pid].timesheets.push(t);
                            }
                        }

                        data.pids = Object.keys(data.projects).reverse();
                        for (i = 0, l = data.pids.length; i < l; i++) {
                            pid = data.pids[i];
                            $.ajax({
                                url: getURL('/project/id/' + pid + '.json?sort=timestamp'),
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
            }

            return data;
        },
        methods: {
            addProject: function (project) {
                this.pids.splice(0, 0, project.data.id);
                this.projects[project.data.id] = project;
            },
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
        },
        props: {
            userId: {
                type: Number,
                default: -1,
            }
        }
    });

    Vue.component('User', {
        template: 'you are: <strong>{{ name }}</strong>',
        props: {
            name: {
                type: String,
                default: ''
            }
        }
    });

    var app = new Vue({
        el: '#app',
        methods: {
            storeAuthInfo: function (authInfo) {
                this.authInfo = authInfo;
                this.userId = authInfo.payload.id;
                this.userName = authInfo.payload.username;
                localStorage.setItem(this.lsAuthInfoKey, JSON.stringify(authInfo));
            },
            restoreAuthInfo: function (key) {
                key = key == null ? this.lsAuthInfoKey : key;
                var authInfoStr = localStorage.getItem(key);
                if (authInfoStr != null) {
                    this.authInfo = JSON.parse(authInfoStr);
                    this.userId = this.authInfo.payload.id;
                    this.userName = this.authInfo.payload.username;
                    this.setView('projects');
                }
            },
            deleteAuthInfo: function (key) {
                key = key == null ? this.lsAuthInfoKey : key;
                localStorage.removeItem(key);
            },
            setView: function (viewName) {
                this.view = viewName;
            },
            logOut: function () {
                this.deleteAuthInfo();
                this.setView('login');
            }
        },
        mounted: function () {
            this.restoreAuthInfo(this.lsAuthInfoKey);
        },
        data: {
            view: 'login',
            authInfo: {},
            userId: '',
            userName: '',
            lsAuthInfoKey: 'timesheetAuthInfo',
        }
    });
})();