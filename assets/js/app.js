(function () {
    'use strict';

    Date.prototype.toDateTimeInputValue = (function (cutBy) {
        if (cutBy == null) {
            cutBy = 16;
        }
        var local = new Date(this);
        local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
        return local.toJSON().slice(0, cutBy);
    });

    var getURL = function (s) {
        return window.timesheet.baseURL + s;
    };

    // some utility functions

    var extend = function (obj1, obj2) {
        // extends object with the content of another
        for (var idx = 0, keys = Object.keys(obj2), len = keys.length, key; idx < len; idx++) {
            key = keys[idx];
            obj1[key] = obj2[key];
        }
        return obj1;
    };

    var msToH = function (ms) {
        // converts milliseconds to hours
        return ms * 2.777777777777778e-7;
    };

    var resetFields = function (target, items) {
        var item;
        for (var i = 0, l = items.length; i < l; i++) {
            item = target[items[i]];
            item.errors = [];
            item.value = '';
        }
    };

    var checkIfValid = function (predicate, errors, errMsg) {
        var errMsgIdx = errors.indexOf(errMsg),
            hasErrorMsg = errMsgIdx > -1;

        if (predicate) {
            if (!hasErrorMsg) {
                errors.push(errMsg);
            }
            return false;
        } else if (hasErrorMsg) {
            errors.splice(errMsgIdx, 1);
        }
        return true;
    };

    var isFormValid = function (obj) {
        var formValid = true,
            keys = Object.keys(obj),
            reqMsg = 'this field is required',
            field;

        var predicateFn = function (f) {
            return (f.required || false) && !Boolean(f.value);
        };

        for (var i = 0, l = keys.length; i < l; i++) {
            field = obj[keys[i]];
            if (!checkIfValid(predicateFn(field), field.errors, reqMsg)) {
                formValid = false;
            }
        }
        return formValid;
    };

    var unauthorizedHandler = function (resp) {
        if (resp.status == 401) {
            this.$emit('bad-token');
        }
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
                       v-model.trim="username.value"
                       placeholder="enter user name">
                <input-errors :errors="username.errors"/>
            </div>
            <div class="form-group" :class="{'has-danger': password.errors.length > 0}">
                <label for="password">Password</label>
                <input type="password" class="form-control"
                       :class="{'form-control-danger': username.errors.length > 0}"
                       id="password"
                       v-model.trim="password.value"
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

                if (isFormValid(t._data)) {
                    var ks = Object.keys(t._data);

                    $.ajax({
                        url: '/app/login/',
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
                            if (resp.responseJSON != null) {
                                var k;
                                for (var i = 0, l = ks.length; i < l; i++) {
                                    k = ks[i];
                                    t[k].errors = resp.responseJSON[k] || [];
                                }
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
                       v-model.trim="username.value"
                       placeholder="enter your new user name">
                <input-errors :errors="username.errors"/>
            </div>
            <div class="form-group" :class="{'has-danger': email.errors.length > 0}">
                <label for="email">Email</label>
                <input type="email"
                       :class="{'form-control-danger': email.errors.length > 0}"
                       class="form-control"
                       id="email"
                       v-model.trim="email.value"
                       placeholder="enter your email address">
                <input-errors :errors="email.errors"/>
            </div>
            <div class="form-group" :class="{'has-danger': password.errors.length > 0}">
                <label for="password">Password</label>
                <input type="password" class="form-control"
                       :class="{'form-control-danger': password.errors.length > 0}"
                       @keyup="isTheSamePass"
                       id="password"
                       v-model.trim="password.value"
                       placeholder="enter user password">
                <input-errors :errors="password.errors"/>
            </div>
            <div class="form-group" :class="{'has-danger': password2.errors.length > 0}">
                <input type="password" class="form-control"
                       :class="{'form-control-danger': password2.errors.length > 0}"
                       @keyup="isTheSamePass"
                       id="password2"
                       v-model.trim="password2.value"
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

                if (isFormValid(t._data)) {
                    var ks = Object.keys(t._data),
                        data = {
                            username: this.username.value,
                            email: this.email.value,
                            password: this.password.value
                        };

                    $.ajax({
                        url: '/app/reg/',
                        data: data,
                        dataType: 'json',
                        type: 'POST',
                        success: function (resp) {
                            resetFields(t, ks);
                            t.$emit('registered');
                        },
                        error: function (resp) {
                            if (resp.status != 201 && resp.responseJSON != null) {
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

    Vue.component('NewTimesheet', {
        template: `
        <div class="card text-center">
            <div class="card-block">
                <form @submit.prevent="create">
                    <div class="form-group" :class="{'has-danger': durationFrom.errors.length > 0}">
                        <label for="duration-from">Duration from</label>
                        <input type="datetime-local"
                               v-model.trim="durationFrom.value"
                               class="form-control form-control-sm" id="duration-from"
                               :class="{'form-control-danger': durationFrom.errors.length > 0}"
                               aria-describedby="durationFromHelp">
                        <input-errors :errors="durationFrom.errors"/>
                    </div>
                    <div class="form-group" :class="{'has-danger': durationTo.errors.length > 0}">
                        <label for="duration-from">to</label>
                        <input type="datetime-local"
                               v-model.trim="durationTo.value"
                               class="form-control form-control-sm" id="duration-from"
                               :class="{'form-control-danger': durationTo.errors.length > 0}"
                               aria-describedby="durationToHelp">
                        <input-errors :errors="durationTo.errors"/>
                    </div>
                    <div class="form-group" :class="{'has-danger': accomplishments.errors.length > 0}">
                        <label for="accomplishments">Accomplishments</label>
                        <textarea
                            class="form-control form-control-sm"
                            :class="{'form-control-danger': accomplishments.errors.length > 0}"
                            v-model.trim="accomplishments.value"
                            id="accomplishments" rows="3">
                        </textarea>
                        <input-errors :errors="accomplishments.errors"/>
                    </div>
                    <button type="submit" class="btn btn-sm btn-primary">Create</button>
                </form>
            </div>
        </div>
        `,
        methods: {
            getDateTimeNow: function (minOffset) {
                if (minOffset == null) {
                    minOffset = 0;
                }
                var now = new Date();
                now.setMinutes(now.getMinutes() + minOffset);
                return now.toDateTimeInputValue();
            },
            localIsFormValid: function () {
                var tmp = isFormValid(this._data);
                if (!tmp) {
                    return false;
                }

                var from = Date.parse(this.durationFrom.value),
                    to = Date.parse(this.durationTo.value),
                    dateTimeInvalidMsg = 'enter a valid date and time';

                if (!checkIfValid(isNaN(from), this.durationFrom.errors, dateTimeInvalidMsg)) {
                    return false;
                }

                if (!checkIfValid(isNaN(to), this.durationTo.errors, dateTimeInvalidMsg)) {
                    return false;
                }

                if (!checkIfValid(to < from, this.durationFrom.errors, 'from must be before to')) {
                    return false;
                }

                // lets set duration
                this.duration.value = Number(msToH(to - from).toFixed(2));
                return true;
            },
            create: function () {
                if (this.localIsFormValid()) {
                    var data = {
                        duration: this.duration.value,
                        accomplishments: this.accomplishments.value,
                        project_id: this.projectId,
                        user_id: this.userId
                    };

                    this.$http.post(getURL('/timesheet.json'), data)
                        .then(function () {}, function (resp) {
                            // ignore errors - bitbucket issue #360
                            unauthorizedHandler(resp);
                            if (resp.status == 500) {
                                var ld = extend({
                                    date: new Date().toDateTimeInputValue(19)
                                }, data);
                                this.$emit('timesheet-created', ld);
                                resetFields(this, ['accomplishments']);
                            } else {
                                console.log(resp);
                            }
                        });
                }
            }
        },
        data: function () {
            return {
                durationFrom: {
                    value: this.getDateTimeNow(),
                    errors: []
                },
                durationTo: {
                    value: this.getDateTimeNow(15),
                    errors: []
                },
                duration: {
                    value: 0.1,
                    errors: []
                },
                accomplishments: {
                    value: '',
                    errors: [],
                    required: true
                }
            };
        },
        props: {
            userId: {
                type: Number,
                default: -1,
            },
            projectId: {
                type: Number,
                default: -1,
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
                               class="form-control form-control-sm" id="name"
                               :class="{'form-control-danger': name.errors.length > 0}"
                               v-model.trim="name.value"
                               aria-describedby="nameHelp" placeholder="enter a project name">
                        <input-errors :errors="name.errors"/>
                    </div>
                    <div class="form-group" :class="{'has-danger': description.errors.length > 0}">
                        <label for="description">Description</label>
                        <textarea
                            class="form-control form-control-sm"
                            :class="{'form-control-danger': description.errors.length > 0}"
                            v-model.trim="description.value"
                            id="description" rows="3">
                        </textarea>
                        <input-errors :errors="description.errors"/>
                    </div>
                    <button type="submit" class="btn btn-sm btn-primary">Create</button>
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
                if (isFormValid(this._data)) {
                    var data = {
                        name: this.name.value,
                        description: this.description.value
                    };

                    this.$http.post(getURL('/project.json'), data)
                        .then(function (resp) {
                            var tdata = {
                                project_id: resp.data.split('/').pop(),
                                user_id: this.userId,
                                duration: 0,
                                accomplishments: ''
                            };

                            this.$http.post(getURL('/timesheet.json'), tdata).then(function () {}, function (resp) {
                                // ignore 500 errors - bitbucket issue #360
                                unauthorizedHandler(resp)
                                if (resp.status == 500) {
                                    var ld = {
                                        data: extend({
                                            id: tdata.project_id
                                        }, data),
                                        timesheets: []
                                    };
                                    this.$emit('project-created', ld);
                                    resetFields(this, Object.keys(data));
                                } else {
                                    console.log(resp);
                                }
                            });
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
            <div v-if="pids.length > 0">
                <div class="card mt-3" v-for="pid in pids">
                    <div class="card-header">
                        <span><strong>{{ projects[pid].data.name }}</strong></span>
                        <span class="float-sm-right float-md-right float-lg-right">
                            total duration: <strong>{{ sumDuration(projects[pid]) }}</strong> hours
                        </span>
                    </div>
                    <div class="card-block">
                        <new-timesheet :userId="userId" :projectId="Number(pid)" @timesheet-created="addTimesheet"/>
                        <div class="card mt-2" v-for="timesheet in projects[pid].timesheets">
                            <div class="card-header">created: <strong>{{ timesheet.date | formatDateTime }}</strong></div>
                            <div class="card-block">
                                <h6 class="card-subtitle mb-2 text-muted">duration: <strong>{{ timesheet.duration }}</strong> hours</h6>
                                <p class="card-text" style="word-wrap:break-word;">accomplished: <strong>{{ timesheet.accomplishments }}</strong></p>
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
        mounted: function () {
            if (this.userId !== -1) {
                this.$http.get(getURL('/timesheet/user_id/' + this.userId + '.json'))
                    .then(function (resp) {
                        var timesheet, project, pid, timesheets = resp.data;
                        for (var i = timesheets.length - 1; i >= 0; i--) {
                            timesheet = timesheets[i];
                            pid = timesheet.project_id;
                            if (this.projects[pid] == null) {
                                this.$set(this.projects, pid, {
                                    timesheets: [],
                                    data: {}
                                });
                            }
                            if (timesheet.duration >= 0.01) {
                                this.projects[pid].timesheets.push(timesheet);
                            }
                        }
                    }, unauthorizedHandler)
                    .then(function () {
                        this.pids = Object.keys(this.projects).reverse();

                        var successH = function (pid) {
                            return function (resp) {
                                extend(this.projects[pid].data, resp.data);
                            };
                        };

                        for (var i = 0, l = this.pids.length, pid; i < l; i++) {
                            pid = this.pids[i];
                            this.$http.get(getURL('/project/id/' + pid + '.json')).then(successH(pid));
                        }
                    }, unauthorizedHandler);
            }
        },
        data: function () {
            return {
                projects: {},
                pids: []
            };
        },
        methods: {
            addProject: function (project) {
                this.pids.splice(0, 0, project.data.id);
                this.$set(this.projects, project.data.id, project);
            },
            addTimesheet: function (timesheet) {
                this.projects[timesheet.project_id].timesheets.splice(0, 0, timesheet);
            },
            sumDuration: function (project) {
                var tmp = project.timesheets
                    .map(function (el) {
                        return el.duration || 0;
                    })
                    .reduce(function (a, b) {
                        return a + b;
                    }, 0);
                return Number(tmp.toFixed(2));
            },
        },
        filters: {
            formatDateTime: function (value) {
                var d = new Date(value).toDateTimeInputValue().split('T');
                return d[0] + ", " + d[1];
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
                Vue.http.headers.common['Authorization'] = 'Bearer ' + authInfo.accessToken;
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
                    Vue.http.headers.common['Authorization'] = 'Bearer ' + this.authInfo.accessToken;
                    this.userId = this.authInfo.payload.id;
                    this.userName = this.authInfo.payload.username;
                    this.setView('projects');
                }
            },
            deleteAuthInfo: function (key) {
                delete this.$http.headers.common.Authorization;
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