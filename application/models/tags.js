module.exports = model.methods({
    getTagsForMonitoring: function (next) {
        this.data('id_tag, tag_name, tag_description, tag_code')
            .getRows(`SELECT
            spr_tags.id_tag,
            spr_tags.tag_name,
            spr_tags.tag_description,
            spr_tags.tag_code
        FROM spr_tags
        WHERE spr_tags.tag_monitoring_enabled = true`, [], next);
    },
    getTagByCode: function (tagCode, next) {
        this.data('id_tag, tag_name, tag_description, tag_code')
            .getRow(`SELECT
            spr_tags.id_tag,
            spr_tags.tag_name,
            spr_tags.tag_description,
            spr_tags.tag_code
        FROM spr_tags
        WHERE spr_tags.tag_monitoring_enabled = true AND spr_tags.tag_code = $1`, [tagCode], next);
    },
});

