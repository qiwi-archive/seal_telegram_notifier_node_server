module.exports = controller('users')
    .actionGet('count', function (req, validator) {
        return {};
    }, function (req, data, done) {
        models.Users.getAllUsers(function (err, result) {
            done(err, result.length);
        });
    }, true)
    .actionGet('inform_all', function (req, validator) {
        return {
            /*name: validator(req.query.name).hasLength(1, 201).escape(),
             text: validator(req.query.text).hasLength(1, 201).escape()*/
        };
    }, function (req, data, done) {
        notifier.checkAllCasesAndInformManagers(done);
    }, true)
    .actionGet('inform_admins', function (req, validator) {
        return {
            /*name: validator(req.query.name).hasLength(1, 201).escape(),
             text: validator(req.query.text).hasLength(1, 201).escape()*/
        };
    }, function (req, data, done) {
        notifier.checkCasesAndInformAdmins(done);
    }, true)
    .actionPost('inform_dadm_cases', function (req, validator) {
        var newCasesIds = Array.isArray(req.body.cases_ids) ? req.body.cases_ids : [req.body.cases_ids];
        newCasesIds.forEach((caseId) => {
            validator(caseId).isInt();
        });
        return {
            newCasesIds: newCasesIds
        };
    }, function (req, data, done) {
        notifier.informDAdminsCases(data.newCasesIds, done);
    }, true)
    .actionPost('jira', function (req, validator) {
        return {
        };
    }, function (req, data, done) {
        waterfall([
            function (next) {
                models.Cases.getTagsCases([240443], false, next);
            },function (casesData, next) {
                jira.createIssue(
                    'Срабатывание онлайн-мониторинга seal.qiwi.com',
                    Format.formatOnlineCasesForJira(casesData),
                    ['cats.png'],
                    next
                )
            },
        ], done);
    }, true)
    .actionPost('inform_adm_replication_troubles', function (req, validator) {
        var replicationLogIds =
            Array.isArray(req.body.replication_log_ids) ? req.body.replication_log_ids : [req.body.replication_log_ids];
        replicationLogIds.forEach((replicationLogId) => {
            validator(replicationLogId).isInt();
        });
        return {
            replicationLogIds: replicationLogIds
        };
    }, function (req, data, done) {
        notifier.checkReplicationLogAndInformAdmins(data.replicationLogIds, done);
    }, true);