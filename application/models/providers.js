module.exports = model.methods({
    getProviderById: function (idPrv, next) {
        this.data('id_prv, prv_name')
            .getRow(`SELECT
            id_prv, prv_name
        FROM v_providers
        WHERE id_prv = $1 AND tag_code = 'HAS_AGGR_BILLS'`, [idPrv], next);
    },
    searchProviders: function (search, next) {
        search = '%' + search.toUpperCase() + '%';
        this.data('id_prv, prv_name')
            .getRows(`SELECT prv.id_prv, prv.prv_name
				FROM v_providers AS prv
				WHERE
				prv.tag_code = 'HAS_AGGR_BILLS'
				AND (
				   prv.id_prv LIKE $1
				OR upper(prv.prv_name) LIKE $1
				OR upper(prv.prv_global_name) LIKE $1
				OR upper(prv.prv_merch_name) LIKE $1
				)
				ORDER BY prv.id_prv LIMIT 100`, [search], next);
    }
});

