module.exports = model.methods({
    getReplicationLogs: function (replicationLogIds, next) {
        this.data('replication_code, replication_start_date, replication_end_date, replication_max_date, replication_lag')
            .getRows(`
SELECT
    replication_code,
    replication_start_date,
    replication_end_date,
    replication_max_date
FROM
    sys_replication_log
WHERE
id_replication_log IN (` + replicationLogIds.join() + `)
`, [], next);
    }
});

