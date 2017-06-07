module.exports = model.methods({
    /*getAnswers: function (idOffer, status, done) {
        this.data('id_offer_users, user_name').getRows(
            'SELECT * FROM rel_offer_users, obj_user WHERE obj_user.id_user = rel_offer_users.id_user AND id_offer = $1 AND sys_status = $2',
            [idOffer, status], done);
    },
    getMessages: function (idOfferUsers, done) {
        this.data('id_message, msg_text, msg_type, msg_dtime').getRows(
            'SELECT id_message, msg_text, msg_type, to_char(msg_dtime, \'HH24:MI\') as msg_dtime FROM obj_message WHERE id_offer_users = $1 ORDER BY msg_dtime ASC LIMIT 20',
            [idOfferUsers], done);
    },*/
    insertMessage: function (idUserContact, text, isUser, done) {
        var type = isUser?'U':'B'; // Бот или пользователь
        this.data('id_message')
            .getRow('INSERT INTO obj_message (id_user_contact, msg_text, msg_type) ' +
                'VALUES ($1, $2, $3) ' +
                'RETURNING id_message', [idUserContact, text, type], done);
    }
});
