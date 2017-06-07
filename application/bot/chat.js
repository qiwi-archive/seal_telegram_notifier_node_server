'use strict';
var validator = require('../../innotrio_nodejs/validator').validator;
var _ = require('underscore');
var JiraApi = require('jira').JiraApi;

var Chat = function () {

};

Chat.text = {
    waitStatus: 'Ваша регистрация ожидает подтверждения. Напишите Коннову Георгию, Сергею Брюзгину или Никите Хромушкину.',
    smthWrong: 'Что-то пошло не так при регистрации. Попробуйте позже.',
    thx: 'Спасибо!',
    wtf: 'Извините, мне не кажется, что это ФИО',
    nothingNew: 'Я напишу, как мне будет что сообщить.',
    lookAtTroubles: 'Посмотрите, пожалуйста, некоторые проблемы требуют Вашего внимания:',
    hello: 'Здравствуйте, я умный Тюлень! Я иногда буду просить Вашей помощи!',
    contactDeveloper: 'Пожалуйста, свяжитесь с разработчиком',
    askForName: 'Скажите, пожалуйста, как Вы записаны в CRM (ФИО)?',
    availableTagsText: 'Для мониторинга доступны следующие потоки: ',
    availableProvidersText: 'Найдены следующие провайдеры: ',
    noProvidersFound: 'Ничем не могу помочь =(',
    actionsAvailable: "/seal mute = Остановить рассылку в данный чат. \r\n/seal unmute = Возобновить рассылку в данный чат. \r\n/seal + Код потока = график потока. \r\n/seal + имя провайдера = поиск ID провайдера. \r\n/seal + ID провайдера = график провайдера.",
    prepareTagChart: "Готовлю график потока: ",
    prepareProviderChart: "Готовлю график провайдера: ",
    resolutionIsSet: 'Установлено решение по следующим инцидентам: ',
    jiraIssueTitle: 'Срабатывание онлайн-мониторинга seal.qiwi.com',
    isMuted: 'Рассылка в данный чат приостановлена',
    isUnmuted: 'Рассылка в данный чат активирована'
};

Chat.prototype.init = function (chat, botApi, done) {
    console.log(chat);
    //телеграммовское id
    this.id = chat.id;
    //Телеграммовский пользователь или чат
    this.chat = chat;
    this.isGroupChat = chat.type === 'group' || chat.type === 'supergroup';

    //Пользователь из базы данных
    this.dbUser = null;

    this.botApi = botApi;
    this.chatStatus = '';
    this.registrationIsOk = false;

    var self = this;
    waterfall([
        function (next) {
            models.Users.createUser(self.chat, next);
        },
        function (chat, next) {
            self.dbUser = chat;
            next();
        }
    ], done);
};

/** Запускаем пользовательский сценарий  */
Chat.prototype.route = function (message) {
    message = this.validateMessage(message);
    if (message === false) {
        return;
    }
    if (this.dbUser) {
        models.Messages.insertMessage(this.dbUser.idUserContact, message.text || message.data, true, function () {
        });
    }
    if (this.dbUser.userContactType === 'DADM') {
        return this._serveDadms(message);
    } else {
        if (message.text == '&#x2F;start') {
            this._start();
            return
        }
        message.text = message.text || '';
        this._analyzeMessage(message.text.trim());
    }
};

Chat.prototype._serveDadms = function (message) {
    var self = this;
    var text = message.data || message.text;
    if (typeof text === 'object') {
        text = '';
    }
    var data = message.data;
    if (text.search('&#x2F;punchwithastick') > -1 || text.search('&#x2F;ebanutpalkoy') > -1) {
        bot.sendPhoto(self.id, '/etc/node/47cases_bot/application/bot/punchwithastick.jpg');
    }
    /*
     * todo сделать отдачу логов
     */
    if (text === '&#x2F;seal_replication_log') {

    }
    if (text === '&#x2F;seal_bot_log') {

    }
    if (text === '&#x2F;seal_go_log') {

    }
    if (text === '&#x2F;seal') {
        // аналог /help
        waterfall([
            function (next) {
                models.Users.getUserByTelegramId(self.id, next);
            }, function (user, next) {
                var text = user.userContactMuted === 1 ? Chat.text.isMuted : Chat.text.isUnmuted;
                text += "\r\n\r\n";
                text += Chat.text.actionsAvailable;
                self.sendMessage(text);
                models.Tags.getTagsForMonitoring(next);
            }, function (tags, next) {
                self.sendTagsButtons(tags);
                next();
            }
        ], function (err, result) {
        });
        return;
    }
    if (text.search('&#x2F;seal ') > -1 || data) {
        if (data) {
            if (typeof data === 'string') {
                text = data;
            }
            //Мистическим образом в валидации строка распарсилась в json. Там была проблема с экранированием кавычек в jsone
        }
        if (data && data.hasOwnProperty('id_resolution') && data.hasOwnProperty('cases_ids')) {
            models.Cases.setTagsCasesResolution(data.cases_ids, data.id_resolution, function (err, casesData) {
                var casesIds = [];
                casesData.forEach(function (data) {
                    casesIds.push(data.idCase);
                });
                if (casesIds.length === 0) {
                    return;
                }
                parallel([
                    function (next) {
                        models.Cases.getResolution(data.id_resolution, next);
                    }, function (next) {
                        models.Cases.getTagsCases(casesIds, false, next);
                    }], function (err, results) {
                    var resolutionData = results[0];
                    var casesData = results[1];
                    var greatestCase = _.min(casesData, function (caseData) {
                        return caseData.caseLostAmount
                    });
                    snapshot.takeTagSnapshot(greatestCase.tagCode, 'case.png', function (err) {
                        if (err) {
                            return next(err);
                        }
                        var telegramText = Chat.text.resolutionIsSet
                            + "\r\n" + Format.formatOnlineCasesForTelegram(casesData, false)
                            + "\r\n" + resolutionData.resolutionName;
                        self.sendMessage(telegramText);
                        self.sendPhoto('case.png');

                        if (resolutionData.resolutionCreateTicket === 1) {
                            jira.createIssue(
                                Chat.text.jiraIssueTitle,
                                Format.formatOnlineCasesForJira(casesData),
                                ['case.png'],
                                function (err, result) {
                                        self.sendMessage(Format.formatJiraIssueLinkForTelegram(result.key));
                                }
                            )
                        }
                    });
                });
            });
            return;
        }
        text = text.replace('&#x2F;seal ', ''); // убираем /seal, оставляем потенциальное название тега, провайдера или команды
        var isValid = this.validateMessage(message, true);
        if (isValid === false) {
            return;
        }
        waterfall([
            function (next) {
                switch (text) {
                    case 'mute':
                        models.Users.muteUserByUserContactId(self.dbUser.idUserContact, function (err, idUserContact) {
                            self.sendMessage(Chat.text.isMuted);
                            next('ok');
                        });
                        break;
                    case 'unmute':
                        models.Users.unmuteUserByUserContactId(self.dbUser.idUserContact, function (err, idUserContact) {
                            self.sendMessage(Chat.text.isUnmuted);
                            next('ok');
                        });
                        break;
                    default:
                        next();
                        break;
                }
            }, function (next) {
                models.Tags.getTagByCode(text, next);
            }, function (tag, next) {
                if (tag) {
                    self.sendMessage(Chat.text.prepareTagChart + tag.tagName + ' ' + tag.tagDescription);
                    self.sendFlowsChart(tag.tagCode);
                    next('ok');
                } else {
                    models.Providers.getProviderById(text, next);
                }
            }, function (provider, next) {
                if (provider) {
                    self.sendMessage(Chat.text.prepareProviderChart + provider.idPrv + ' ' + provider.prvName);
                    self.sendProviderChart(provider.idPrv);
                    next('ok');
                } else {
                    models.Providers.searchProviders(text, next);
                }
            }, function (searchResults, next) {
                self.sendSearchResults(searchResults);
                next('ok');
            }
        ], function (err) {
            if (err === 'ok') {
                return;
            }
        });
    }
};

//Проводим оценку для обновления relOfferUser.sysStatus
Chat.prototype._analyzeMessage = function (text) {
    var self = this;
    switch (this.chatStatus) {
        //Ждем имя менеджера
        case 'N':
            if (text.length > 3) {
                models.Users.addManagerName(self.dbUser.idUserContact, text, function (error, result) {
                    if (error != null) {
                        self.sendMessage(Chat.text.smthWrong);
                        return;
                    }
                    self.sendMessage(Chat.text.thx + ' ' + Chat.text.waitStatus);
                    self.changeStatus('');
                });

            } else {
                self.sendMessage(Chat.text.wtf);
            }
            break;
        default:
            self.checkRegistrationStatus(function () {
                if (self.registrationIsOk) {
                    models.Cases.getCasesCountByUserContact(self.dbUser.idUserContact, function (error, result) {
                        if (error != null) {
                            return this.sendErrorMessage('ERROR_GET_CASES');
                        }
                        if (!result || result.length == 0) {
                            return self.sendMessage(Chat.text.nothingNew);
                        } else {
                            var text = Format.formatCasesForTelegram(result);
                            self.sendMessage(text);
                        }
                    });
                }
            });
    }
};

Chat.prototype._start = function () {
    this.sendMessage(Chat.text.hello);
    this.checkRegistrationStatus();
};

Chat.prototype.checkRegistrationStatus = function (cb) {
    var self = this;
    waterfall([
        function (next) {
            models.Users.getManagerNames(self.dbUser.idUserContact, '', next);
        },
        function (names, next) {
            //Подтвержден или ожидает активации
            if (names && names.length > 0) {
                models.Users.getManagerNames(self.dbUser.idUserContact, 'W', function (error, names) {
                    if (error != null) {
                        return next(error);
                    }

                    if (names && names.length > 0) {
                        self.sendMessage(Chat.text.waitStatus);
                    } else {
                        self.registrationIsOk = true;
                        //Ничего делать не надо, человек зарегистрирован
                        /*if (!self.registrationIsOk) {
                         self.registrationIsOk = true;
                         self.sendMessage('Ваша регистрация прошла успешно. Я напишу, как мне будет что сообщить.');
                         }*/
                    }
                    self.changeStatus('');
                    next();
                });
            } else {
                //Запрашиваем имя менеджера
                self.changeStatus('N');
                next();
            }
        }
    ], function () {
        if (cb)
            cb();
    });
};


Chat.prototype.changeStatus = function (status) {
    var message = '';
    switch (status) {
        case '':
            break;
        //Ждем имя менеджера
        case 'N':
            message = Chat.text.askForName;
            break;
        default:
            this.sendErrorMessage('ERROR_CHANGE_STATUS');
            break;
    }
    this.chatStatus = status;
    if (message != '') {
        this.sendMessage(message);
    }
};

Chat.prototype.sendFlowsChart = function (tagCode) {
    var self = this;
    snapshot.takeTagSnapshot(tagCode, 'tag.png', function (err) {
        if (err) {
            return console.log(err);
        }
        bot.sendPhoto(self.id, 'tag.png');
    });
};

Chat.prototype.sendProviderChart = function (idPrv) {
    var self = this;
    snapshot.takeProviderSnapshot(idPrv, 'provider.png', function (err) {
        if (err) {
            return console.log(err);
        }
        bot.sendPhoto(self.id, 'provider.png');
    });
};

Chat.prototype.sendMessage = function (text) {
    if (this.dbUser) {
        models.Messages.insertMessage(this.dbUser.idUserContact, text, false, function () {
        });
    } else {
        console.log('sendMessage', text);
    }
    //this.lastMessage = text;
    return this.botApi.sendMessage(this.id, text, {'parse_mode': 'HTML'});
};
Chat.prototype.sendPhoto = function (path) {
    //this.lastMessage = text;
    return this.botApi.sendPhoto(this.id, path);
};

Chat.prototype.sendTagsButtons = function (tags) {
    var requestMessage = Chat.text.availableTagsText;
    var keyboard = [];
    tags.forEach(function (tag, index) {
        requestMessage += "\r\n";
        keyboard.push([{text: tag.tagName + ' ' + tag.tagDescription, callback_data: tag.tagCode}]);
    });
    return this.botApi.sendMessage(this.dbUser.userTelegramId, requestMessage, {
        reply_markup: JSON.stringify({inline_keyboard: keyboard})
    });
};

Chat.prototype.sendSearchResults = function (providersSearchResults) {
    var requestMessage = providersSearchResults.length > 0 ? Chat.text.availableProvidersText : Chat.text.noProvidersFound;
    var keyboard = [];
    providersSearchResults.forEach(function (provider, index) {
        requestMessage += "\r\n";
        keyboard.push([{text: provider.idPrv + ' : ' + provider.prvName, callback_data: provider.idPrv}]);
    });
    return this.botApi.sendMessage(this.dbUser.userTelegramId, requestMessage, {
        reply_markup: JSON.stringify({inline_keyboard: keyboard})
    });
};

Chat.prototype.sendErrorMessage = function (code, data) {
    this.sendMessage(Code + ' ' + Chat.text.contactDeveloper);
};

Chat.prototype.validateMessage = function (message, isCode) {
    try {
        if (message.data) {
            var parsedData;
            try {
                parsedData = JSON.parse(message.data);
                message.data = parsedData;
            } catch (err) {

            }
        }
        if (typeof message.data === 'object') {
            return message;
        }
        var text = validator(message.text || message.data).hasLength(0, 500).escape();
        if (isCode) {
            validator(text).matches(/[A-Za-z_0-9]+/)
        }
        if (message.text) {
            message.text = text;
        } else {
            message.data = text;
        }
    } catch (error) {
        // switch (error.toString()) {
        //     case 'WRONG_LENGTH':
        //         text = '[Bot] Слишком длинное сообщение от пользователя.';
        //         break;
        //     case 'NOT_MATCH':
        //         text = '[Bot] Не код.';
        //         break;
        //     default:
        //         text = '[Bot] Сообщение пользователя не прошло валидацию на сервере.';
        // }
        return false;
    }

    return message;
};

exports.Chat = Chat;