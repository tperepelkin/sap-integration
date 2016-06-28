var WORKING = WORKING || {};
WORKING.GENERATOR = WORKING.GENERATOR || {};
WORKING.GENERATOR.DIALOG = WORKING.GENERATOR.DIALOG || {};

AJS.toInit(function () {
    console.info("Execute admin-phase-template.js");

    var restWorkTable = new AJS.RestfulTable({
        autoFocus: true,
        el: jQuery("#phases-template"),
        allowReorder: false,
        resources: {
            all: AJS.params.baseURL + "/rest/deal/1.0/phases/templates",
            self: AJS.params.baseURL + "/rest/deal/1.0/phases/templates"
        },
        columns: [{
            id: "num", header: AJS.I18n.getText("deal.generator.phaseNum")
        }, {
            id: "name", header: AJS.I18n.getText("deal.generator.phaseName")
        }, {
            id: "progress", header: AJS.I18n.getText("deal.generator.phaseProgress")
        }],
        noEntriesMsg: AJS.I18n.getText("deal.generator.noRows")
    });

    jQuery(document).bind(AJS.RestfulTable.Events.INITIALIZED, function () {
        console.info("finished setup");
    });

    jQuery(restWorkTable).bind(AJS.RestfulTable.Events.ROW_INITIALIZED, function () {
        console.info("finished setup");
    });
});