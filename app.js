var configFile = require('./application/configs/app');
var env = process.env.NODE_ENV === 'development' ? 'development' : 'production',
    configs = configFile[env];

GLOBAL.configs = configs;


//API сервер
var express = require('express'),
    http = require('http'),
    path = require('path'),
    async = require('async'),
    router = require('./innotrio_nodejs/express/router').router,
    modelsLoader = require('./innotrio_nodejs/db').modelsLoader,
    pg = require('./innotrio_nodejs/db').pg,
    errors = require('./application/errors'),
    configFile = require('./application/configs/app'),
    logger = require('./innotrio_nodejs/logger/index').logger;

GLOBAL.waterfall = async.waterfall;
GLOBAL.async = async;
GLOBAL.series = async.series;
GLOBAL.each = async.each;
GLOBAL.parallel = async.parallel;
GLOBAL.map = async.map;
GLOBAL.logger = logger;
GLOBAL['ERRORS'] = errors;

var dbObject = pg(configs.db);

dbObject.client.on('error', (error) => {
    console.log(`[ERROR] Data base error - ${error}`);
    setTimeout(function () {
        process.exit(1);
    }, 5000);
});

GLOBAL.services = {
    db: dbObject.connect()
};



GLOBAL.controller = require('./innotrio_nodejs/express/controller').controller;
GLOBAL.model = require('./innotrio_nodejs/db').modelFactory(services.db);

GLOBAL.models = modelsLoader({
    modelsPath: 'application/models'
}).load();

process.on('uncaughtException', function (err) {
    console.log(err.stack);
    console.log(err);
});

//CORS middleware
var allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}

var app = express();

// all environments
app.set('port', process.env.PORT || configs.port);

app.use(express.cookieParser(configs.cookies.secret));
app.use(express.cookieSession());
app.use(express.compress());
app.use(express.favicon());
if (env === 'development') {
    app.use(express.logger('dev'));
}
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(allowCrossDomain);
app.use(express.errorHandler());
app.disable('etag');

router(app, {
    root: configs.url,
    controllersPath: 'application/controllers',
    authMiddleware: require('./application/middlewares/authentication')
}).route();

var httpServer = http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

//Бот
var TelegramBot = require('node-telegram-bot-api'),
    BotRouter = require('./application/bot/bot_router').BotRouter;

var botApi = new TelegramBot(configs.botToken, {polling: true});

var bot = new BotRouter(configs, botApi);
bot.init();

GLOBAL.bot = bot;

//Мейлер
var nodeMailer = require('nodemailer'),
    MailerService = require('./application/services/mailer').MailerService;
var mailer = new MailerService();
mailer.init(configs, nodeMailer);

GLOBAL.mailer = mailer;

//Jira
var JiraApi = require('jira').JiraApi,
    JiraService = require('./application/services/jira').JiraService;
var jira = new JiraService();
jira.init(configs, JiraApi);

GLOBAL.jira = jira;

var NotifierService = require('./application/services/notifier').NotifierService,
    notifier = new NotifierService;
notifier.init();

GLOBAL.notifier = notifier;

GLOBAL.Format = require('./application/utils/format').Format;


var SnapshotService = require('./application/services/snapshot').SnapshotService,
    snapshot = new SnapshotService;
snapshot.init();

GLOBAL.snapshot = snapshot;


// Задачи cron
var cronTasks = new (require('./cron_tasks'))();
if (env != 'development') {
    cronTasks.init();
}
