var fs = require('fs');
var path = require('path');

function JiraService() {

}

function addAttachment(issueKey, attachment, callback) {
    var options = {
        rejectUnauthorized: this.strictSSL,
        uri: this.makeUri('/issue/' + issueKey + '/attachments'),
        //Иначе имеем XSRF check failed
        headers: {
            'X-Atlassian-Token': 'nocheck'
        },
        method: 'POST',
        followAllRedirects: true,
        auth: {
            'user': this.username,
            'pass': this.password
        }
    };

    var request = this.request(options, function (error, response) {
        if (error) {
            callback(error, null);
            return;
        }
        if (response.statusCode === 200 || response.statusCode === 204) {
            callback(null, "Success");
            return;
        }
        callback(response.statusCode + ': Error while uploading an attachment');
    });

    request.form().append('file', fs.createReadStream(attachment));
}

JiraService.prototype.init = function (configs, JiraApi) {

    var jiraConfig = configs.jira;
    this.jira = new JiraApi(
        jiraConfig.protocol,
        jiraConfig.host,
        jiraConfig.port,
        jiraConfig.user,
        jiraConfig.password,
        '2'
    );
    //манкипатчинг это плохо.
    this.jira.addAttachment = addAttachment.bind(this.jira);
    this.issueProjectKey = jiraConfig.incProjectKey;
    this.issueTypeKey = jiraConfig.incidentIssueTypeKey;
    this.assignee = jiraConfig.assignee;
    this.reporter = jiraConfig.user;
};

/**
 *
 * @param title
 * @param text
 * @param attachments string[] - массив имён файлов
 * @param done
 */
JiraService.prototype.createIssue = function (title, text, attachments, done) {
    var self = this;
    waterfall([
        function (next) {
            self.jira.addNewIssue({
                "fields": {
                    "project": {
                        "key": self.issueProjectKey
                    },
                    "summary": title,
                    "description": text,
                    "issuetype": {
                        "name": self.issueTypeKey
                    },
                    // это customer!
                    // "customfield_10231": [{name: self.reporter}]
                }
            }, next);
        }, function (createdIssue, next) {
            each(attachments, function (attachment, cb) {
                self.jira.addAttachment(createdIssue.key, attachment, cb);
            }, function (err) {
                next(err, createdIssue);
            });
        }
    ], done);
};

exports.JiraService = JiraService;