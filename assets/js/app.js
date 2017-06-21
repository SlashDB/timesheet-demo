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
            login: function () {
                var self = this;

                if (isFormValid(self._data)) {
                    var ks = Object.keys(self._data);

                    $.ajax({
                        url: '/app/login/',
                        data: {
                            username: self.username.value,
                            password: self.password.value
                        },
                        dataType: 'json',
                        type: 'POST',
                        success: function (resp) {
                            resetFields(self, ks);
                            self.$emit('logged-in', self.createAuthInfo(resp.accessToken));
                        },
                        error: function (resp) {
                            if (resp.responseJSON != null) {
                                var k;
                                for (var i = 0, l = ks.length; i < l; i++) {
                                    k = ks[i];
                                    self[k].errors = resp.responseJSON[k] || [];
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
                var self = this;

                if (isFormValid(self._data)) {
                    var ks = Object.keys(self._data),
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
                            resetFields(self, ks);
                            self.$emit('registered');
                        },
                        error: function (resp) {
                            if (resp.status != 201 && resp.responseJSON != null) {
                                var k;
                                for (var i = 0, l = ks.length; i < l; i++) {
                                    k = ks[i];
                                    self[k].errors = resp.responseJSON[k] || [];
                                }
                            } else {
                                resetFields(self, ks);
                                self.$emit('registered');
                            }
                        }
                    });
                }
            }
        }
    });

    Vue.component('AuthCard', {
        template: `
        <div class="row align-items-center">
            <div class="col-4 col-md-3 col-sm-2"></div>
            <div class="col">
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
            </div>
            <div class="col-4 col-md-3 col-sm-2"></div>
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
                        project_id: this.project.id,
                        user_id: this.userId
                    };

                    this.$http.post(getURL('/timesheet/user_id/' + this.userId + '.json'), data)
                        .then(function (resp) {
                            var ld = extend({
                                date: new Date().toDateTimeInputValue(19)
                            }, data);
                            this.$emit('timesheet-created', this.project, ld);
                            resetFields(this, ['accomplishments']);
                        }, function (resp) {
                            unauthorizedHandler(resp);
                            console.log(resp);
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
                default: -1
            },
            project: {
                type: Object,
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

                    this.$http.post(getURL('/timesheet/user_id/' + this.userId + '/project.json'), data)
                        .then(function (resp) {
                            var tdata = {
                                project_id: resp.data.split('/').pop(),
                                user_id: this.userId,
                                duration: 0,
                                accomplishments: ''
                            };

                            this.$http.post(getURL('/timesheet/user_id/' + this.userId + '.json'), tdata)
                                .then(function (resp) {
                                    var ld = extend({
                                        id: Number(tdata.project_id),
                                        timesheet: []
                                    }, data);
                                    this.$emit('project-created', ld);
                                    resetFields(this, Object.keys(data));
                                }, function (resp) {
                                    unauthorizedHandler(resp)
                                    console.log(resp);
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

    Vue.component('RemoveBtn', {
        template: `
        <button type="button" class="btn btn-sm" :class="btnClass" @click="confirmation = true">
            <span v-show="!confirmation">&times;</span>
            <span v-show="confirmation">
                <span class="btn-link" @click.stop.self="onConfirm(); confirmation = false">yes</span>
                <span class="btn-link" @click.stop.self="confirmation = false">no</span>
            </span>
        </button>
        `,
        computed: {
            btnClass: function () {
                return this.confirmation ? 'btn-secondary' : 'btn-outline-danger';
            }
        },
        data: function () {
            return {
                confirmation: false
            };
        },
        props: {
            onConfirm: {
                type: Function,
                required: true
            }
        }
    });

    Vue.component('ProjectList', {
        template: `
        <div class="row align-items-center">
            <div class="col-3 col-md-2 col-sm-1"></div>
            <div class="col">
                <div class="mt-3">
                    <new-project :userId="userId" @project-created="addProject"/>
                    <div v-if="projects.length > 0 && !loading">
                        <div class="card mt-3" v-for="(project, pIdx) in projects">
                            <div class="card-header">
                                <span><strong>{{ project.name }}</strong></span>
                                <span class="float-sm-right float-md-right float-lg-right">
                                    total duration: <strong>{{ sumDuration(project) }}</strong> hours
                                    <remove-btn class="ml-2" :on-confirm="removeProject(pIdx)"/>
                                </span>
                            </div>
                            <div class="card-block">
                                <new-timesheet :userId="userId" :project="project" @timesheet-created="addTimesheet"/>
                                <div class="card mt-2" v-for="(timesheet, tIdx) in project.timesheet" v-if="timesheet.duration > 0 && timesheet.accomplishments.length > 0">
                                    <div class="card-header">
                                        created: <strong>{{ timesheet.date | formatDateTime }}</strong>
                                        <remove-btn class="float-sm-right float-md-right float-lg-right" :on-confirm="removeTimesheet(project, timesheet, tIdx)"/>
                                    </div>
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
                            <h4 v-if="loading" class="card-title">Loading...</h4>
                            <h4 v-else class="card-title">You have no project yet - add one above :)</h4>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-3 col-md-2 col-sm-1"></div>
        </div>
        `,
        mounted: function () {
            if (this.userId !== -1) {
                // get all projects and their timesheet-s
                this.$http.get(getURL('/timesheet/user_id/' + this.userId + '/project.json?depth=1&sort=timestamp'))
                    .then(function (resp) {
                        var projects = resp.data.reverse();
                        for (var i = 0, l = projects.length, project; i < l; i++) {
                            project = projects[i];
                            project.timesheet = project.timesheet.reverse();
                        }
                        this.projects = projects;
                        this.loading = false;
                    }, unauthorizedHandler);
            }
        },
        data: function () {
            return {
                projects: [],
                loading: true,
            };
        },
        methods: {
            addProject: function (project) {
                this.projects.splice(0, 0, project);
            },
            removeProject: function (pIdx) {
                var self = this;
                return function () {
                    var project = self.projects.splice(pIdx, 1)[0];
                    if (project != null) {
                        // first remove all the children timesheet entires
                        self.$http.delete(getURL('/timesheet/user_id/' + self.userId + '/project_id/' + project.id))
                            .then(function (resp) {
                                // then remove the project itself
                                self.$http.delete(getURL('/timesheet/user_id/' + self.userId + '/project/id/' + project.id))
                                    .then(function (resp) {}, unauthorizedHandler);
                            }, unauthorizedHandler);
                    }
                };
            },
            updateProjectData: function (project) {
                this.$http.get(getURL('/timesheet/user_id/' + this.userId + '/project/id/' + project.id + '?depth=1'))
                    .then(function (resp) {
                        project.timesheet = resp.data.timesheet.reverse();
                    }, unauthorizedHandler);
            },
            addTimesheet: function (project, timesheet) {
                project.timesheet.splice(0, 0, timesheet);
                // reload and sync-up project data
                this.updateProjectData(project);
            },
            removeTimesheet: function (project, timesheet, tIdx) {
                var self = this;
                return function () {
                    project.timesheet.splice(tIdx, 1);
                    self.$http.delete(getURL('/timesheet/user_id/' + self.userId + '/project_id/' + project.id + '/date/' + timesheet.date))
                        .then(function (resp) {}, unauthorizedHandler);
                };
            },
            sumDuration: function (project) {
                var tmp = project.timesheet
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
        template: '<span>you are: <strong>{{ name }}</strong></span>',
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
                this.authInfo = {};
                this.userId = '';
                this.userName = '';
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