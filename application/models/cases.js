module.exports = model.methods({
    getCasesCountByUserContact: function (idUser, next) {
        this.data('prs_manager, id_prv_count')
            .getRows('SELECT COUNT(DISTINCT obj_case_provider.id_prv) as id_prv_count, prs_manager FROM obj_case_provider \
        INNER JOIN obj_provider ON obj_case_provider.id_prv = obj_provider.id_prv AND prs_manager IN ( \
            SELECT manager_name FROM spr_manager_names WHERE id_user_contact = $1 AND sys_status = \'A\' \
        ) WHERE case_status = \'W\' GROUP BY prs_manager', [idUser],
                function (err, result) {
                    if (err !== null) {
                        return next(err);
                    }
                    next(null, result);
                });
    },
    /**
     * Получение количества любых инцидентов за последний день (вчерашний)
     * @param next
     */
    getLastDayCasesCount: function (next) {
        this.data('cases_count')
            .getRow('SELECT COUNT(obj_case_provider.id_case) as cases_count \
                FROM obj_case_provider WHERE case_start_timestamp = date_trunc(\'day\', now()) - INTERVAL \'1 day\'', [],
                function (err, result) {
                    if (err !== null) {
                        return next(err);
                    }
                    next(null, parseInt(result.casesCount));
                });
    },
    /**
     * Получение информации по инцидентам по массиву id инцидентов
     * @param casesIds string[]
     * @param onlyWaiting bool
     * @param next Function
     */
    getTagsCases: function (casesIds, onlyWaiting, next) {
        var waitingFilter = onlyWaiting ? 'case_status = \'W\' AND ' : '';
        this.data('id_case, tag_name, tag_description, tag_code, case_start_dtime, case_end_dtime, case_lost_amount, case_count_deviation, case_conversion_deviation, case_paid_count_deviation, case_payments_count_deviation')
            .getRows('SELECT * FROM v_obj_case_tag WHERE '+ waitingFilter + 'case_end_timestamp > case_start_timestamp AND id_case IN (' + casesIds.join() + ') ORDER BY case_lost_amount', [], next);
    },
    /**
     * Установка статуса по инцидентам по массиву id инцидентов
     * @param casesIds string[]
     * @param next Function
     */
    setTagsCasesStatus: function (casesIds, status, next) {
        this.data('id_case')
            .getRows('UPDATE obj_case_tag SET case_status = $1 WHERE id_case IN (' + casesIds.join() + ') returning id_case', [status], next);
    },
    /**
     * Установка решения для иницдентов по массиву id инцидентов
     * @param casesIds string[]
     * @param next Function
     */
    setTagsCasesResolution: function (casesIds, idResolution, next) {
        this.data('id_case')
            .getRows('UPDATE obj_case_tag set id_resolution = $1 WHERE id_resolution IS NULL AND id_case IN (' + casesIds.join() + ')' +
                'returning id_case', [idResolution], next);
    },
    /**
     * Получение возможных решений по инцидентам
     * @param next Function
     */
    getResolutions: function (next) {
        var sql = 'SELECT * FROM spr_resolutions ORDER BY resolution_order';
        params = [];
        this.data('id_resolution, resolution_name')
            .getRows(sql, params, next);
    },
    /**
     * Получение возможных решений по инцидентам
     * @param next Function
     */
    getResolution: function (idResolution, next) {
        var sql = 'SELECT * FROM spr_resolutions WHERE id_resolution = $1';
        var params = [idResolution];
        this.data('id_resolution, resolution_name, resolution_create_ticket')
            .getRow(sql, params, next);
    }
});

