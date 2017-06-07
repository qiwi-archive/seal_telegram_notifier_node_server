var _ = require('underscore');

function NotifierService() {
    this.notifiedCasesIds = [];
    this.notifiedReplicationLogsIds = [];
};

NotifierService.text = {
    emailTitle: 'Оповещение seal@qiwi.com',
    emptyCases: 'Проблемы на сервере. Отсутствуют инциденты за вчерашний день.',
};

NotifierService.prototype.init = function () {
};

NotifierService.prototype.checkAllCasesAndInformManagers = function (done) {
    var self = this;
    models.Users.getAllUsers(function (error, usersArray) {
        if (error) {
            logger.log('ERROR_CASES_INFORM', '', err);
            return done(error);
        }

        if (usersArray && usersArray.length > 0) {
            usersArray.forEach(function (user) {
                self.checkUserCasesAndInform(user);
            });
        }

        done();
    });
};

NotifierService.prototype.checkCasesAndInformAdmins = function (done) {
    var self = this;
    models.Cases.getLastDayCasesCount(function (error, casesCount) {
        if (error) {
            logger.log('ERROR_ADMINS_INFORM', '', error);
            return done(error);
        }

        if (casesCount === 0) {
            self.informAdmins(NotifierService.text.emptyCases, done);
        } else {
            done(null, casesCount);
        }
    });
};

NotifierService.prototype.checkReplicationLogAndInformAdmins = function (replicationLogIds, done) {
    var self = this;
    var logs;
    if (!Array.isArray(replicationLogIds) || replicationLogIds.length === 0) {
        replicationLogIds = 'NO_LOGS!';
    } else {
        replicationLogIds = _.without.apply(_, [replicationLogIds].concat(this.notifiedReplicationLogsIds));
    }
    if (Array.isArray(replicationLogIds) && replicationLogIds.length === 0) {
        return done();
    }
    this.notifiedReplicationLogsIds = this.notifiedReplicationLogsIds.concat(replicationLogIds);
    waterfall([
        function (next) {
            if (replicationLogIds !== 'NO_LOGS!') {
                models.Replication.getReplicationLogs(replicationLogIds, next)
            } else {
                next(null, replicationLogIds);
            }
        }, function (logsData, next) {
            logs = logsData;
            models.Users.getAdminsContacts(next);
        }, function (usersArray, next) {
            if (!usersArray || usersArray.length == 0) {
                next('NO_USERS');
            } else {
                var text = Format.formatReplicationData(logs);
                usersArray.forEach(function (user) {
                    self.inform(user, text, text);
                });
            }
        }],
        function (err) {
            if (err === 'ok') {
                return done();
            }
            done(err);
    });
};

NotifierService.prototype.informAdmins = function (text, done) {
    var self = this;

    models.Users.getAdminsContacts(function (error, usersArray) {
            if (usersArray && usersArray.length > 0) {
                usersArray.forEach(function (user) {
                    self.inform(user, text);
                });
            }
        }
    );
    done();
};

NotifierService.prototype.informDAdminsCases = function (casesIds, done) {
    var self = this;
    var usersArray;
    casesIds = _.without.apply(_, [casesIds].concat(this.notifiedCasesIds));
    this.notifiedCasesIds = this.notifiedCasesIds.concat(casesIds);
    waterfall([
            function (next) {
                models.Users.getDAdminsContacts(next);
            }, function (dadmins, next) {
                usersArray = dadmins;
                if (!usersArray || usersArray.length == 0) {
                    next('NO_USERS');
                } else {
                    parallel([function (next) {
                        models.Cases.getTagsCases(casesIds, true, next);
                    },function (next) {
                        models.Cases.getResolutions(next);
                    }], next);
                }
            }, function (casesData, next) {
                var cases = casesData[0];
                var resolutions = casesData[1];
                if (cases && cases.length > 0) {
                    var greatestCase = _.min(cases, function (caseData) { return caseData.caseLostAmount });
                    snapshot.takeTagSnapshot(greatestCase.tagCode, 'case.png', function (err) {
                        if (err) {
                            return next(err);
                        }
                        var telegramText = Format.formatOnlineCasesForTelegram(cases);
                        var mailText = Format.formatOnlineCasesForEmail(cases);
                        var keyboard = [];
                        resolutions.forEach(function (resolution, index) {
                            keyboard.push([{
                                text: resolution.resolutionName,
                                callback_data: JSON.stringify({
                                    id_resolution: resolution.idResolution,
                                    cases_ids: casesIds
                                })
                            }]);
                        });
                        usersArray.forEach(function (user) {
                            self.inform(user, telegramText, mailText, 'case.png', {
                                reply_markup: JSON.stringify({inline_keyboard: keyboard})
                            });
                        });
                    });
                }
                next();
            }, function (next) {
                models.Cases.setTagsCasesStatus(casesIds, 'I', next);
            }
        ],
        done);
};

/**
 * Проверяет наличие инцидентов, ожидающих реакции менеджера и оповещает менеджера user
 * @param user сущность из sys_user_contacts
 */
NotifierService.prototype.checkUserCasesAndInform = function (user) {
    var self = this;
    models.Cases.getCasesCountByUserContact(user.idUserContact, function (error, result) {
        if (error != null) {
            return this.sendErrorMessage('ERROR_GET_CASES');
        }
        if (result && result.length > 0) {
            var telegramText = Format.formatCasesForTelegram(result);
            var mailText = Format.formatCasesForEmail(result);
            self.inform(user, telegramText, mailText);
        }
    });
};

/**
 * Оповещает пользователя по телеграм и почте текстом и картинкой
 * @param user сущность из sys_user_contacts
 * @param telegramText string
 * @param mailText string
 * @param snapshot string - путь до картинки
 */
NotifierService.prototype.inform = function (user, telegramText, mailText, snapshot, options) {
    if (user.userTelegramId) {
        options = options || {};
        bot.sendMessage(
            user.userTelegramId,
            telegramText,
            options
        );
        if (snapshot) {
            bot.sendPhoto(
                user.userTelegramId,
                snapshot
            );
        }
    }
    if (typeof mailText !== 'undefined' && user.userEmail) {
        var attachments = [];
        if (snapshot) {
            attachments.push({
                filename: 'snapshot.png', path: snapshot
            });
        }
        mailer.mail(
            function () {
            },
            user.userEmail,
            NotifierService.text.emailTitle,
            mailText,
            attachments
        );
    }
};


exports.NotifierService = NotifierService;