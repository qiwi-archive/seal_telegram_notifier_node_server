module.exports = model.methods({
    createUser: function (chat, done) {
        this.getUserOrCreate(chat, done);
    },
    getAllUsers: function (done) {
        this.data('id_user_contact, user_name, user_telegram_id, user_email').getRows(
            'SELECT DISTINCT sys_user_contacts.id_user_contact, ucontact_name AS user_name, ucontact_telegram_id AS user_telegram_id, ucontact_email AS user_email FROM sys_user_contacts \
            INNER JOIN spr_manager_names ON sys_user_contacts.id_user_contact = spr_manager_names.id_user_contact AND sys_status = \'A\'',
            [], done);
    },
    getAdminsContacts: function (done) {
        this.data('id_user_contact, user_name, user_telegram_id, user_email').getRows(
            'SELECT sys_user_contacts.id_user_contact, ucontact_name AS user_name, \
            ucontact_telegram_id AS user_telegram_id, ucontact_email AS user_email FROM sys_user_contacts \
            WHERE ucontact_type = \'A\'',
            [], done);
    },
    getDAdminsContacts: function (done) {
        this.data('id_user_contact, user_name, user_telegram_id, user_email').getRows(
            'SELECT sys_user_contacts.id_user_contact, ucontact_name AS user_name, \
            ucontact_telegram_id AS user_telegram_id, ucontact_email AS user_email FROM sys_user_contacts \
            WHERE ucontact_type = \'DADM\' AND ucontact_muted IS NULL',
            [], done);
    },
    getJiraContact: function (done) {
        this.data('user_email').getRow(
            'SELECT ucontact_email AS user_email FROM sys_user_contacts \
            WHERE ucontact_type = \'JIRA\'',
            [], done);
    },
    getUserByTelegramId: function (telegramId, done) {
        this.data('id_user_contact, user_name, user_telegram_id, user_contact_type, user_contact_muted').getRow('SELECT id_user_contact, ucontact_name as user_name, ucontact_telegram_id as user_telegram_id, ucontact_type as user_contact_type, ucontact_muted as user_contact_muted FROM sys_user_contacts where ucontact_telegram_id=$1 LIMIT 1', [telegramId], done);
    },
    muteUserByUserContactId: function (userContactId, done) {
        this.data('id_user_contact').getRow('UPDATE sys_user_contacts SET ucontact_muted = 1 WHERE id_user_contact=$1 RETURNING id_user_contact', [userContactId], done);
    },
    unmuteUserByUserContactId: function (userContactId, done) {
        this.data('id_user_contact').getRow('UPDATE sys_user_contacts SET ucontact_muted = DEFAULT WHERE id_user_contact=$1 RETURNING id_user_contact', [userContactId], done);
    },
    addUser: function (user, done) {
        this.data('id_user_contact, ucontact_name, ucontact_telegram_id').insertOne('sys_user_contacts', {ucontactName: user.userName, ucontactTelegramId: user.userTelegramId},
            function (err, result) {
                if (result != null) {
                    result = {idUserContact: result.idUserContact, userName: result.ucontactName, userTelegramId: result.ucontactTelegramId};
                }
                done(err, result);
            });
    },
    getUserOrCreate: function (chat, done) {
        var self = this;
        waterfall([
            function (next) {
                self.getUserByTelegramId(chat.id, next);
            },
            function (user, done) {
                if (user) return done(null, user);
                self.addUser({
                    userTelegramId: chat.id,
                    userName: chat.type == 'group' || chat.type == 'supergroup'? chat.title || '' : chat.last_name ? chat.first_name + ' ' + chat.last_name : chat.first_name
                    //      first_name: user_data.first_name
                }, done);
            }
        ], done);
    },
    getManagerNames: function (idUser,status,done) {
        var statusCheck = "";
        var params = [idUser];
        if (status !== ''){
            statusCheck = ' AND sys_status = $2';
            params.push(status);
        }
        this.data('id_manager_name, manager_name').getRows('SELECT * FROM spr_manager_names WHERE id_user_contact = $1 '+statusCheck, params, done);
    },
    addManagerName: function (idUserContact, managerName, done) {
        this.data('id_manager_name').insertOne('spr_manager_names', {idUserContact:idUserContact,managerName:managerName},
            function (err, result) {
                done(err, result);
            });
    }
});
