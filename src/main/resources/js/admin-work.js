var WORKING = WORKING || {};
WORKING.GENERATOR = WORKING.GENERATOR || {};
WORKING.GENERATOR.DIALOG = WORKING.GENERATOR.DIALOG || {};

AJS.toInit(function () {
    console.info("Execute admin-work.js");

    var userList = [];
    var deferred = WORKING.AJAX.getAllUsers().then(function (users) {
        if (users && users.length > 0) {
            userList = users;
        }
    });

    deferred.then(function() {
        var restWorkTable = new AJS.RestfulTable({
            autoFocus: true,
            el: jQuery("#project-config-works-table"),
            allowReorder: false,
            resources: {
                all: AJS.params.baseURL + "/rest/deal/1.0/works/forAdmin",
                self: AJS.params.baseURL + "/rest/deal/1.0/works/"
            },
            columns: [ {
                id: "gipOfProject", header: AJS.I18n.getText("deal.generator.admin.GipOfProject"),
                editView: AJS.RestfulTable.CustomEditView.extend({
                    render: function () {
                        var id = this.model.get('id');

                        var options = _(userList).map(function(e) { return '<option value="{0}">{1}</option>'.format(e, e); }).join('');
                        var $select = jQuery("<select name='gipOfProject' class='select'>" + options + "</select>")

                        $select.val(this.model.get("gipOfProject")); // select currently selected
                        return $select;
                    }
                })
            }, {
                id: "program", header: AJS.I18n.getText("deal.generator.admin.Program")
            }, {
                id: "project", header: AJS.I18n.getText("deal.generator.admin.Project")
            }, {
                id: "stage", header: AJS.I18n.getText("deal.generator.admin.Stage")
            }, {
                id: "codeISR", header: AJS.I18n.getText("deal.generator.admin.codeISR")
            }, {
                id: "system", header: AJS.I18n.getText("deal.generator.admin.System")
            }, {
                id: "subject", header: AJS.I18n.getText("deal.generator.admin.Subject")
            }, {
                id: "kindOfPir", header: AJS.I18n.getText("deal.generator.admin.KindOfPir")
            }, {
                id: "mark", header: AJS.I18n.getText("deal.generator.admin.Mark")
            }, {
                id: "volume", header: AJS.I18n.getText("deal.generator.admin.Volume"),
                readView: AJS.RestfulTable.CustomReadView.extend({
                    render: function (self) {
                        console.info(self)
                        return self.value||"<span>0</span>";
                    }
                })
            }, {
                id: "revision", header: AJS.I18n.getText("deal.generator.admin.Revision"),
                readView: AJS.RestfulTable.CustomReadView.extend({
                    render: function (self) {
                        console.info(self)
                        return self.value||"<span>0</span>";
                    }
                })
            }, {
                id: "budgetedCost", header: AJS.I18n.getText("deal.generator.admin.BudgetedCost"),
                readView: AJS.RestfulTable.CustomReadView.extend({
                    render: function (self) {
                        console.info(self)
                        return self.value||"<span>0.0</span>";
                    }
                })
            }
                , {
                id: "lockedBy", header: AJS.I18n.getText("deal.generator.admin.lockedBy")
            }],
            views: {
                editRow: AJS.RestfulTable.EditRow.extend({
                    initialize: function () {
                        AJS.RestfulTable.EditRow.prototype.initialize.apply(this, arguments);
                        this.bind(this._event.SUBMIT_STARTED, function () {
                            var stageVal = this.$("input[name='stage']").val();
                            if (!this.model.get("stage") && stageVal) {
                                this.model.set("stage", stageVal);
                            }
                        });
                    }
                })

            },
            noEntriesMsg: AJS.I18n.getText("deal.generator.noRows")
        });

        jQuery(document).bind(AJS.RestfulTable.Events.INITIALIZED, function () {
            console.info("finished setup");
        });

        jQuery(restWorkTable).bind(AJS.RestfulTable.Events.ROW_INITIALIZED, function () {
            console.info("finished setup");
        });
    });
});