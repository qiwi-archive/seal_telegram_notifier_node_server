module.exports = CronTasks;

var CronJob = require('cron').CronJob;

function CronTasks() {

}

CronTasks.text = {
    couldNotNotifyManagers: 'Проблемы на сервере. Не удалось оповестить менеджеров.',
}

CronTasks.prototype.init = function () {
    var self = this;
    console.log((new Date()).toString() + ' CRON started');
    // В 10:00 по будням оповещаем менеджеров
    new CronJob({
        cronTime: '00 00 10 * * 1-5',
        // cronTime: '1 * * * * *',
        onTick: function () {
            notifier.checkAllCasesAndInformManagers(function (err, result) {
                if (err) {
                    notifier.informAdmins(CronTasks.text.couldNotNotifyManagers, function(err, result) {
                        if (err) {
                            console.log('ERROR_COULD_NOT_NOTIFY_ADMINS');
                        }
                    })
                }
            });
        },
        start: true
    });
    // В 10:00 оповещаем админов, если что-то упало
    new CronJob({
        cronTime: '00 00 10 * * *',
        // cronTime: '1 * * * * *',
        onTick: function () {
            notifier.checkCasesAndInformAdmins(function(err, result) {
                    if (err) {
                        console.log('ERROR_COULD_NOT_NOTIFY_ADMINS');
                    }
                }
            );
        },
        start: true
    });
};
