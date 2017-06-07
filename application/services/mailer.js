function MailerService() {

};

MailerService.prototype.init = function (configs, nodeMailer) {
    this.from = configs.mailerConfig.from;
    this.transporter = nodeMailer.createTransport(configs.smtpConfig);
};

/**
 *
 * @param done
 * @param to
 * @param subject
 * @param html
 * @param files [] { filename, path }
 */
MailerService.prototype.mail = function (done, to, subject, html, attachments, cc) {
    var self = this;
    attachments = attachments || [];
    self.transporter.sendMail({
        from: self.from,
        to: to,
        subject: subject,
        // replyTo : self.replyTo,
        html : html,
        attachments: attachments,
        cc: cc || ''
    }, done);
};

exports.MailerService = MailerService;