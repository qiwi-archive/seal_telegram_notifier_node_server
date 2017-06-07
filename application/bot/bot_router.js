'use strict';
var Chat = require('./chat').Chat;
/*
 PgSql = require('../../innotrio_nodejs/db/db_pg').PgSql;*/

var BotRouter = function (config, botApi) {
    // Массив id пользователя = чат
    this.chatsByUserId = [];
    this.botApi = botApi;
    //'idOffer, offerText, offer_users_count'
    //this.currentOffer = null;
};

BotRouter.prototype.init = function (config) {
    var self = this;

    this.botApi.onText(/(.+)/, function (msg, match) {
        var user = msg.chat;
        self.route(user, msg);
    });
    this.botApi.on('callback_query', function (msg) {
        var user = msg.message.chat;
        self.route(user, msg);
    })
};

/*
BotRouter.prototype.getChatByDbUser = function (user, done) {
    var chat = this.chatsByUserId[user.userTelegramId];
    if (chat === undefined) {
        this._createChat({
            id: user.userTelegramId,
            first_name: user.userName
        }, done);
    } else {
        done(null, chat);
    }
};
*/

/** Запускаем пользовательский сценарий  */
BotRouter.prototype.route = function (user, message) {
    var chat = this.chatsByUserId[user.id];
    if (chat === undefined) {
        this._createChat(user, function (err, result) {
            chat = result;
            chat.route(message);
        });
    } else {
        chat.route(message);
    }
};

/** Отправляем сообщение пользователю по телеграм id */
BotRouter.prototype.sendMessage = function (userTelegramId, text, options) {
    options = options || {};
    options['parse_mode'] = 'HTML';
    this.botApi.sendMessage(userTelegramId, text, options);
};
/** Отправляем картинку пользователю по телеграм id */
BotRouter.prototype.sendPhoto = function (userTelegramId, path) {
    this.botApi.sendPhoto(userTelegramId, path);
};

/** Инициализируем параметры чата */
BotRouter.prototype._createChat = function (user, done) {
    var chat = new Chat();
    // Добавляем в список действующих
    this.chatsByUserId[user.id] = chat;
    chat.init(user, this.botApi, function (err, result) {
        done(err, chat);
    });
};

/** Закрываем чат */
BotRouter.prototype.end = function (user) {
    var chat = this.chatsByUserId[user.id];
    if (chat === undefined)
        return;

    delete this.chatsByUserId[user.id];
};

exports.BotRouter = BotRouter;