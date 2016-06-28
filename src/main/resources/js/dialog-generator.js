var WORKING = WORKING || {};
WORKING.GENERATOR = WORKING.GENERATOR || {
        selectedWorkIds: "",
        filterData: {},
        selectedWorks: "",
        dealTree: "",
        $dialog: null,
        $dialogContent: null,
        ActualCostSummary: null,
        BudgetedCostSummary: null,
        buttonObject: null,
        minScreen: 1,
        maxScreen: 7,
        summaryWorksScreen: 3,
        generatorDialogId: "#work-generator-dialog",
        workDialogId: "#work-dialog",
        isPhasesInitialized: false,
        init: jQuery.noop,

        ajax: WORKING.AJAX,

        getScreenNumber: function () {
            return this.$dialogContent.attr('screen-number');
        },

        getSelectedWorks: function () {
            if (this.getScreenNumber() == 2) {
                var workList = _(jQuery('#selected-works').find('tr[rowId]')).chain().
                    map(function (e) {
                        return e.getAttribute('rowId');
                    }).join("|").value();
                return workList ? ("?workIds=" + workList) : "";
            }
            if (!this.selectedWorkIds)
                return "";
            else
                return this.selectedWorkIds;
        },

        getFilterForColumn: function () {
            if (!this.filterData)
                this.filterData = {};

            return "?" + (this.filterData.programs && "programs={0}&".format(this.filterData.programs) || '') +
                (this.filterData.projects && "projects={0}&".format(this.filterData.projects) || '') +
                (this.filterData.stages && "stages={0}&".format(this.filterData.stages) || '');
        },

        getButtonsStatus: function (prevButton, nextButton) {
            function init() {
                $generateButton.hide();
                prevButton.attr('aria-disabled', true);
                prevButton.attr('disabled', 'disabled');
                nextButton.attr('aria-disabled', false);
                nextButton.removeAttr('disabled');
            }

            function prev(screenNumber) {
                if (screenNumber == this.minScreen) {
                    prevButton.attr('aria-disabled', true);
                    prevButton.attr('disabled', 'disabled');
                } else {
                    prevButton.attr('aria-disabled', false);
                    if (prevButton.attr('disabled'))
                        prevButton.removeAttr('disabled');
                }
                nextButton.attr('aria-disabled', false);
                if (nextButton.attr('disabled'))
                    nextButton.removeAttr('disabled');
            }

            function next(screenNumber) {
                if (screenNumber == this.maxScreen) {
                    nextButton.attr('aria-disabled', true);
                    nextButton.attr('disabled', 'disabled');
                } else {
                    nextButton.attr('aria-disabled', false);
                    if (nextButton.attr('disabled'))
                        nextButton.removeAttr('disabled');
                }
                if (prevButton.attr('disabled'))
                    prevButton.removeAttr('disabled');
                prevButton.attr('aria-disabled', false);
            }

            function setPrevHandler(handler) {
                prevButton.off("click");
                prevButton.on("click", function (e) {
                    return handler.apply(this, arguments);
                }.bind(this));
            }

            function setNextHandler(handler) {
                nextButton.off("click");
                nextButton.on("click", function (e) {
                    return handler.apply(this, arguments);
                }.bind(this));
            }

            function setGenerateHandler(handler) {
                $generateButton.off("click");
                $generateButton.on("click", function (e) {
                    return handler.apply(this, arguments);
                }.bind(this));
            }

            function setVisibilityGenerateHandler(predicate) {
                if (predicate.call()) {
                    if (!$generateButton.is(':visible'))
                        $generateButton.show();
                } else {
                    if ($generateButton.is(':visible'))
                        $generateButton.hide();
                }
            }

            var $generateButton = jQuery("#dialog-generate-button");

            return {
                init: init.bind(WORKING.GENERATOR),
                prev: prev.bind(WORKING.GENERATOR),
                next: next.bind(WORKING.GENERATOR),
                setPrevHandler: setPrevHandler.bind(WORKING.GENERATOR),
                setNextHandler: setNextHandler.bind(WORKING.GENERATOR),
                setGenerateHandler: setGenerateHandler.bind(WORKING.GENERATOR),
                setVisibilityGenerateHandler: setVisibilityGenerateHandler
            };
        }
    };


AJS.toInit(function () {
    console.info("Execute dialog-generator.js");

    var $messageElement = jQuery('<div id="aui-message-bar"></div>');
    $messageElement.appendTo(jQuery("body"));

    var generatorDialogHTML = JIRA.WorkGenerator.Templates.WorkGeneratorDialog();
    this.$dialog = jQuery(generatorDialogHTML);
    this.$dialog.appendTo(jQuery("body"));
    this.$dialogContent = jQuery(this.generatorDialogId + ' .aui-dialog2-content');

    this.changeButtonsStatus = this.getButtonsStatus(jQuery('#dialog-prev-button'), jQuery('#dialog-next-button'));
    this.changeButtonsStatus.setPrevHandler(function (e) {
        this.changeButtonsStatus.setVisibilityGenerateHandler(function () {
            return false;
        });

        var val = jQuery.parseJSON(e.target.getAttribute('aria-disabled'));
        e.target.setAttribute('aria-disabled', !val);

        var screenNumber = parseInt(this.$dialogContent.attr('screen-number'));
        if (screenNumber > this.minScreen) {
            screenNumber--;
            if (this.isGenerateFromTemplate)
                screenNumber--;

            this.changeButtonsStatus.prev(screenNumber);
            var headerHTML = JIRA.WorkGenerator.Templates.ScreenHeaderName({number: screenNumber, byTemplate: WORKING.GENERATOR.isGenerateFromTemplate});
            this.$dialogHeader.html(headerHTML);
            this.$dialogContent.attr('screen-number', screenNumber);

            if (screenNumber == this.minScreen) {
                initScreen1(doFilterData);
            } else {
                var screenHTML = JIRA.WorkGenerator.Templates.ScreenContent({
                    number: screenNumber
                });
                this.$dialogContent.html(screenHTML);
                if (screenNumber == 2) {
                    initScreen2();
                    var nextButton = jQuery('#dialog-next-button');
                    nextButton.attr('aria-disabled', true);
                    nextButton.attr('disabled', 'disabled');
                } else if (screenNumber == 4) {
                    jQuery('#dialog-next-button').removeAttr('disabled');
                } else if (screenNumber == 5) {
                    initScreen5();
                }
                else if (screenNumber == 6) {
                    initScreen6();
                    var nextButton = jQuery('#dialog-next-button');
                    nextButton.attr('aria-disabled', true);
                    nextButton.attr('disabled', 'disabled');
                }
            }
        }

        if (screenNumber == this.summaryWorksScreen) {
            initScreen3();
        }
    });
    this.changeButtonsStatus.setNextHandler(function (e) {
        var val = jQuery.parseJSON(e.target.getAttribute('aria-disabled'));
        e.target.setAttribute('aria-disabled', !val);

        var disabled = jQuery.parseJSON(e.target.getAttribute('disabled'));
        if (disabled) {
            return;
        }

        var screenNumber = parseInt(this.$dialogContent.attr('screen-number'));
        if (screenNumber < this.maxScreen) {
            screenNumber++;
            if (screenNumber == 5) {
                var input = jQuery('.group input.radio').filter(function (i, e) {
                    return e.checked == true;
                });
                if (input.length > 0 && input[0].id == "createPhaseFromTemplate") {
                    this.isGenerateFromTemplate = true;
                } else
                    this.isGenerateFromTemplate = false;
            } else if (screenNumber == this.summaryWorksScreen) {
                this.selectedWorkIds = this.getSelectedWorks();
            } else if (screenNumber == 2) {
            } else if (screenNumber == 4) {
                this.BudgetedCostSummary = jQuery("#budget-cost-summary").text();
                this.ActualCostSummary = jQuery("#actual-cost-summary > #actualValue").val();
            } else if (screenNumber == 7) {
                var jQueryDealTree = jQuery('#dealTree'), dealTree = jQueryDealTree.dynatree("getTree"),
                    dealNode = dealTree.getNodeByKey("dealNode");
                this.dealTree = [];
                var phase, work, phaseNode;
                for (var i = 0; i < dealNode.childList.length; i++) {
                    var phase = dealNode.childList[i];
                    phaseNode = {phaseId: phase.data.phaseId, works: []};
                    if (!phase.childList) continue;
                    this.dealTree.push(phaseNode);
                    for (var j = 0; j < phase.childList.length; j++) {
                        work = phase.childList[j];
                        phaseNode.works.push({workId: work.data.workId, workPercent: work.data.workPercent});
                    }
                }
            }

            if (screenNumber == 6) {
                if (this.isGenerateFromTemplate) {
                    screenNumber++;
                } else {
                    null;
                }
            }

            this.changeButtonsStatus.next(screenNumber);
            var headerHTML = JIRA.WorkGenerator.Templates.ScreenHeaderName({number: screenNumber, byTemplate: WORKING.GENERATOR.isGenerateFromTemplate});
            var screenHTML = JIRA.WorkGenerator.Templates.ScreenContent({
                number: screenNumber
            });

            this.$dialogHeader.html(headerHTML);
            this.$dialogContent.html(screenHTML);
            this.$dialogContent.attr('screen-number', screenNumber);

             if (screenNumber == this.summaryWorksScreen) {
                 WORKING.GENERATOR.ajax.lockWorks();
                 initScreen3();
            } else if (screenNumber == 2) {
                initScreen2();
                var nextButton = jQuery('#dialog-next-button');
                nextButton.attr('aria-disabled', true);
                nextButton.attr('disabled', 'disabled');
            } else if (screenNumber == 4) {
                jQuery('#dialog-next-button').removeAttr('disabled');
            } else if (screenNumber == 5) {
                var input = jQuery('.group input.radio').filter(function (i, e) {
                    return e.checked == true;
                });
                initScreen5();
            } else if (screenNumber == 6) {
                initScreen6();
                var nextButton = jQuery('#dialog-next-button');
                nextButton.attr('aria-disabled', true);
                nextButton.attr('disabled', 'disabled');
            } else if (screenNumber == 7) {
                initScreen7();
            }
        }
    });

    this.init = function () {
        WORKING.GENERATOR.ajax.clearPhases(jQuery.noop, function () {
            console.error(errorThrown);
        }).then(function () {
            if (!this.$dialog.children().is(":visible"))
                this.dialog.show();

            // [NGolosin] - Это всплывающая подсказка, она прозрачная, но висит поверх всего на экране, не даёт перехватывать события от мыши
            jQuery("body#jira>.tipsy:visible");
            initScreen1();

            var width = jQuery(window).width() * 2 / 3;
            var height = jQuery(window).height() * 2 / 3;
            this.$dialog.children().each(function (num, item) {
                jQuery(item).width(width);
            });
            this.$dialog.children().eq(1).height(height);
            this.changeButtonsStatus.init();
        }.bind(this));
    }.bind(this);

    this.openDialogButton = jQuery('#open-work-generator-dialog');
    this.$dialogHeader = jQuery(this.generatorDialogId + ' .aui-dialog2-header');
    this.openDialogButton.off('click');
    this.openDialogButton.on('click', function (e) {
        e.stopPropagation();
        e.preventDefault();

        if (!this.dialog) {
            this.dialog = AJS.dialog2(this.generatorDialogId);
            AJS.dialog2("#work-generator-dialog").on("show", _.debounce(function () {
                WORKING.GENERATOR.init();
            }, 500)).on("hide", _.debounce(function () {
                WORKING.GENERATOR.isPhasesInitialized = false;
                WORKING.GENERATOR.$dialogContent.empty();
            }, 500));
        }
        this.dialog.show();
        return false;
    }.bind(this));


    recalculateSummary = function ($budgetCost, $actualCost) {
        if ($budgetCost !== undefined && $budgetCost instanceof jQuery) {
            $budgetCost.text(_(jQuery('#selected-works tbody>tr>td:nth-child(7)')).
                reduce(function (sum, e) {
                    return sum + parseFloat(e.textContent);
                }, 0).toFixed(2));
        }
        if ($actualCost !== undefined && $actualCost instanceof jQuery) {
            $actualCost.val(_(jQuery('#selected-works tbody>tr>td:nth-child(8)')).
                reduce(function (sum, e) {
                    return sum + parseFloat(e.textContent);
                }, 0).toFixed(2))
        }
    }

    prepareFilterData = function () {
        var checkBoxes = jQuery('.filter-list-checkbox input');
        var data = {};
        checkBoxes.each(function (i, checkBox) {
            if (checkBox.checked) {
                var paramName = checkBox.getAttribute("data-id");
                var selected = jQuery("#screen1-multiselect-" + paramName).val();
                if (selected instanceof Array) {
                    data[paramName] = _(selected).chain().map(function (e) {
                        return "'" + e + "'";
                    }).join("|").value();
                }
            }
        });

        return data;
    }

    doFilterData = function (data) {
        WORKING.GENERATOR.ajax.getWorksAgainistColumns(data).done(function (works) {
            var programs = works.programs.sort();
            var projects = works.projects.sort();
            var stages = works.stages.sort();

            var selectedPrograms = jQuery("#screen1-multiselect-programs").val();
            var selectedProjects = jQuery("#screen1-multiselect-projects").val();
            var selectedStages = jQuery("#screen1-multiselect-stages").val();

            jQuery("#screen1-multiselect-programs").empty();
            for (var k = 0; k < programs.length; k++) {
                var option = jQuery('<option></option>').attr("value", programs[k]).text(programs[k]);
                jQuery("#screen1-multiselect-programs").append(option);
            }

            jQuery("#screen1-multiselect-projects").empty();
            for (var k = 0; k < projects.length; k++) {
                var option = jQuery('<option></option>').attr("value", projects[k]).text(projects[k]);
                jQuery("#screen1-multiselect-projects").append(option);
            }

            jQuery("#screen1-multiselect-stages").empty();
            for (var k = 0; k < stages.length; k++) {
                var option = jQuery('<option></option>').attr("value", stages[k]).text(stages[k]);
                jQuery("#screen1-multiselect-stages").append(option);
            }

            jQuery("#screen1-multiselect-programs").val(selectedPrograms);
            jQuery("#screen1-multiselect-projects").val(selectedProjects);
            jQuery("#screen1-multiselect-stages").val(selectedStages);
        }).fail(function () {
            console.error(nerrorThrown);
        });
    }

    validateNum = function (evt) {
        var theEvent = evt || window.event;
        var key = theEvent.keyCode || theEvent.which;
        key = String.fromCharCode(key);
        var regex = /[0-9]|\./;
        if (!regex.test(key)) {
            theEvent.returnValue = false;
            if (theEvent.preventDefault) theEvent.preventDefault();
        }
    }


    initScreen1 = function (forceFilterData) {
        WORKING.GENERATOR.ajax.getWorksAgainistColumns().done(function (response) {
            var screenNumber = WORKING.GENERATOR.minScreen;
            var headerHTML = JIRA.WorkGenerator.Templates.ScreenHeaderName({number: screenNumber});

            var projects = response.projects.sort();
            var programs = response.programs.sort();
            var stages = response.stages.sort();

            var screenHTML = JIRA.WorkGenerator.Templates.ScreenContent({
                number: screenNumber,
                op1: programs,
                op2: projects,
                op3: stages
            });

            WORKING.GENERATOR.$dialogHeader.html(headerHTML);
            WORKING.GENERATOR.$dialogContent.html(screenHTML);
            WORKING.GENERATOR.$dialogContent.attr('screen-number', screenNumber);

            var height = WORKING.GENERATOR.$dialogContent.height() * 0.95;
            jQuery(".screen1-list > .field-group").height(height);

            jQuery('.filter-list-checkbox input').on('click', function () {
                var data = prepareFilterData();
                WORKING.GENERATOR.filterData = data;
                doFilterData(data);
            });

            if (forceFilterData) {
                forceFilterData(WORKING.GENERATOR.filterData);

                if (WORKING.GENERATOR.filterData.stages)
                    jQuery('.filter-list-checkbox.stages input').attr("checked", true);
                if (WORKING.GENERATOR.filterData.projects)
                    jQuery('.filter-list-checkbox.projects input').attr("checked", true);
                if (WORKING.GENERATOR.filterData.programs)
                    jQuery('.filter-list-checkbox.programs input').attr("checked", true);
            }
        }).fail(function (jqXHR, textStatus, errorThrown) {
            console.error(errorThrown);
        });
    }


    initScreen2 = function () {
        var $allTable = jQuery(".aui.screen2-dragging-works");
        var $allTableBody = $allTable.children("tbody:eq(1)").eq(0);
        var $selectedTable = jQuery(".aui.screen2-dragging-works");

        var height = WORKING.GENERATOR.$dialogContent.height() * 0.4;
        $allTable.height(height);
        $selectedTable.height(height);

        WORKING.GENERATOR.ajax.getWorks().done(function (response) {
            var works = response;
            for (i = 0; i < works.length; i++) {
                var tableRow = JIRA.WorkGenerator.Templates.Screen2TableRow({
                    rowId: works[i].id,
                    gipOfProject: works[i].gipOfProject, program: works[i].program,
                    project: works[i].project, stage: works[i].stage, codeISR: works[i].codeISR,
                    subject: works[i].subject, kindOfPir: works[i].kindOfPir,
                    volume: works[i].volume, revision: works[i].revision,
                    mark: works[i].mark, budgetedCost: works[i].budgetedCost
                });
                $allTableBody.append(tableRow);
            }

            jQuery('.t_sortable>tr:not(.header-row,.disabled)').draggable({
                helper: 'clone',
                revert: 'invalid',
                start: function (event, ui) {
                    jQuery(this).css('opacity', '.5');
                },
                stop: function (event, ui) {
                    jQuery(this).css('opacity', '1');
                }
            });

            jQuery('.screen2-dragging-works').droppable({
                drop: function (event, ui) {
                    var $table = jQuery(this);
                    jQuery(ui.draggable).appendTo($table.children('tbody'));

                    var nextButton = jQuery('#dialog-next-button');
                    if (!!WORKING.GENERATOR.getSelectedWorks()) {
                        nextButton.attr('aria-disabled', false);
                        nextButton.removeAttr('disabled');
                    } else {
                        nextButton.attr('aria-disabled', true);
                        nextButton.attr('disabled', 'disabled');
                    }

                }
            });
        }).fail(function (jqXHR, textStatus, errorThrown) {
            console.error(errorThrown);
        });
    }


    initScreen3 = function () {
        jQuery('#dialog-next-button').removeAttr('disabled');

        var height = WORKING.GENERATOR.$dialogContent.height() * 0.8;
        var $selectedTable = jQuery('#selected-works');
        $selectedTable.height(height);

        var actualCostEditView = AJS.RestfulTable.CustomEditView.extend({
            render: function () {
                var actualCost = this.model.get('actualCost');
                var budgetedCost = this.model.get('budgetedCost');

                var actualCostVal = parseFloat(actualCost);
                var budgetedCostVal = parseFloat(budgetedCost);

                if (!actualCostVal)
                    actualCostVal = budgetedCostVal;

                actualCostVal = actualCostVal.toFixed(2);

                var html = '';
                html += '<input onkeypress="validateNum(event)" name="actualCost" type="number" step="any" min="0" maxlength="255" max="10000000000" value="';
                html += actualCostVal;
                html += '"/>';

                return html;
            }
        });

        function getActualCost() {
            var sum = _(jQuery('#selected-works tbody>tr>td:nth-child(8) > span, #selected-works tbody>tr>td:nth-child(8) > input')).
                map(function (e) {
                    if (e.tagName == "INPUT")
                        return parseFloat(e.value);
                    else
                        return parseFloat(e.textContent);
                }).
                reduce(function (sum, e) {
                    return sum + e;
                }, 0).toFixed(2);
            return parseFloat(sum);
        }
        function updateActualCost() {
            if (!this.disabledUpdateActualCost) {
                var sum = getActualCost();
                jQuery('#actual-cost-summary > #actualValue').val(sum);
            }
        }
        var editWorkRow = AJS.RestfulTable.EditRow.extend({
            initialize: function () {
                AJS.RestfulTable.EditRow.prototype.initialize.apply(this, arguments);
                this.bind(this._event.SUBMIT_STARTED, _.debounce(updateActualCost, 500));
            }
        });

        var selectedWorks = new AJS.RestfulTable({
            autoFocus: true,
            el: $selectedTable,
            allowCreate: false, allowReorder: false, allowDelete: false,
            resources: {
                all: AJS.params.baseURL + "/rest/deal/1.0/works" + WORKING.GENERATOR.selectedWorkIds,
                self: AJS.params.baseURL + "/rest/deal/1.0/works"
            },
            columns: [{
                id: "system", header: AJS.I18n.getText("deal.generator.admin.System"), allowEdit: false
            }, {
                id: "subject", header: AJS.I18n.getText("deal.generator.admin.Subject"), allowEdit: false
            }, {
                id: "kindOfPir", header: AJS.I18n.getText("deal.generator.admin.KindOfPir"), allowEdit: false
            }, {
                id: "mark", header: AJS.I18n.getText("deal.generator.admin.Mark"), allowEdit: false
            }, {
                id: "volume", header: AJS.I18n.getText("deal.generator.admin.Volume"), allowEdit: false,
                readView: AJS.RestfulTable.CustomReadView.extend({
                    render: function (self) {
                        return self.value || "<span>0</span>";
                    }
                })
            }, {
                id: "revision", header: AJS.I18n.getText("deal.generator.admin.Revision"), allowEdit: false,
                readView: AJS.RestfulTable.CustomReadView.extend({
                    render: function (self) {
                        return self.value || "<span>0</span>";
                    }
                })
            }, {
                id: "budgetedCost", header: AJS.I18n.getText("deal.generator.admin.BudgetedCost"), allowEdit: false,
                readView: AJS.RestfulTable.CustomReadView.extend({
                    render: function (self) {
                        return self.value || "<span>0.0</span>";
                    }
                })
            }, {
                id: "actualCost",
                header: AJS.I18n.getText("screen3.actual.cost"),
                fieldName: "actualCost",
                editView: actualCostEditView,
                readView: AJS.RestfulTable.CustomReadView.extend({
                    render: function (self) {
                        return self.value || "<span>{0}</span>".format(this.model.get("budgetedCost"));
                    }
                })
            }
            ],
            views: {
                editRow: editWorkRow
            },
            noEntriesMsg: AJS.I18n.getText("deal.generator.noRows")
        });

        $selectedTable.bind(AJS.RestfulTable.Events.INITIALIZED, function () {
            var tableFooter = JIRA.WorkGenerator.Templates.Screen3TableFooter();
            $selectedTable.append(jQuery(tableFooter));
            recalculateSummary(jQuery('#budget-cost-summary'), jQuery('#actual-cost-summary > #actualValue'));
            var $actualCostSummary = jQuery('#actual-cost-summary > #actualValue');

            var changeActualCostSummary = function (e) {
                jQuery('#actual-cost-summary > #actualValue').off("change");
                var budgetedCostSummary = parseFloat(jQuery('#budget-cost-summary').text()),
                    actualCostSummary = parseFloat($actualCostSummary.val()),
                    budgetedCost, actulCost, ratio, actualValue;
                var row, rows = selectedWorks.getRows(), editRow, deferreds = rows.length, deferred = jQuery.Deferred();

                function rowUpdated() {
                    this.off(this._event.VALIDATION_ERROR, rowNotUpdated);
                    this.disabledUpdateActualCost = false;
                    deferreds--;
                    if (deferreds<=0)
                        deferred.resolve();
                }
                function rowNotUpdated() {
                    this.off(this._event.VALIDATION_ERROR, rowUpdated);
                    this.disabledUpdateActualCost = false;
                    deferreds = 0;
                    deferred.reject();
                }

                var zeroBudgetedRows = rows.filter(function(row) { return parseFloat(row.model.get("budgetedCost"))==0; });
                for (var i = 0; i < rows.length; i++) {
                    row = rows[i];
                    budgetedCost = parseFloat(row.model.get("budgetedCost"));
                    ratio = budgetedCost / budgetedCostSummary;
                    actualValue = (zeroBudgetedRows.length > 0) ? (actualCostSummary / rows.length).toFixed(2) : (ratio * actualCostSummary).toFixed(2);
                    editRow = selectedWorks.edit(row, "actualCost");
                    editRow.$(" input[name=actualCost]").val(actualValue);
                    editRow.disabledUpdateActualCost = true;
                    editRow.submit(false);
                    editRow.once(editRow._event.UPDATED, rowUpdated);
                    editRow.once(editRow._event.VALIDATION_ERROR, rowNotUpdated);
                }
                //recalculateSummary(jQuery('#budget-cost-summary'), jQuery('#actual-cost-summary > #actualValue'));
                var sum = getActualCost();
                if (actualCostSummary!=sum) {
                    deferred.then(function() {
                        row = rows[0];
                        editRow = selectedWorks.edit(row, "actualCost");
                        actualValue = parseFloat(editRow.$(" input[name=actualCost]").val());
                        editRow.$(" input[name=actualCost]").val(actualValue + (actualCostSummary-sum));
                        editRow.disabledUpdateActualCost = true;
                        editRow.submit(false);
                        editRow.disabledUpdateActualCost = false;
                    })
                }

                $actualCostSummary.on("change", changeActualCostSummary);
            }
            $actualCostSummary.on("change", changeActualCostSummary);
        });
        jQuery("#reset-button").click(function () {
            var row, rows = selectedWorks.getRows();
            for (var i = 0; i < rows.length; i++) {
                row = rows[i];
                var budgetedCost = row.model.get("budgetedCost");
                var editRow = selectedWorks.edit(row, "actualCost");
                editRow.$("input[name=actualCost]").val(budgetedCost);
                editRow.disabledUpdateActualCost = true;
                editRow.submit(false);
                editRow.disabledUpdateActualCost = false;
            }
        });
    }


    initScreen5 = function () {
        var isFromTemplate = "";
        rowNum = 1;
        if (WORKING.GENERATOR.isGenerateFromTemplate) {
            isFromTemplate = "?fromTemplate";
            jQuery('#isFromTemplateButton').show();
            jQuery('#isFromTemplateButton').one('click', function () {
                jQuery('.aui-restfultable-create').show();
            });
        }

        var afterInitPhases = WORKING.GENERATOR.ajax.initPhases(jQuery.noop, function () {
            console.error(errorThrown);
        });

        afterInitPhases.then(function () {
            WORKING.GENERATOR.isPhasesInitialized = WORKING.GENERATOR.isGenerateFromTemplate;

            var height = WORKING.GENERATOR.$dialogContent.height() * 0.8;
            jQuery('#phases').height(height);

            jQuery('#dialog-next-button').attr('disabled', 'disabled');

            var $restPhaseTable = jQuery('#phases');

            var phaseRow = AJS.RestfulTable.Row.extend({
                render: function () {
                    var progress = this.model.get("progress") || 0;
                    this.model.set("sumPhase", (parseFloat(WORKING.GENERATOR.ActualCostSummary) * progress / 100).toFixed(2));

                    AJS.RestfulTable.Row.prototype.render.apply(this, arguments);
                    return this;
                }
            });

            var startDatePickerEditView = AJS.RestfulTable.CustomEditView.extend({
                render: function () {
                    var id = this.model.get('id');

                    var elId = 'startDate-input-';
                    if (id) {
                        elId += id;
                    } else {
                        elId += 'create';
                    }

                    var startDate = this.model.get('startDate'), html;
                    if (!startDate) {
                        html = '<input id="{0}" name="startDate" type="text" size="8">'.format(elId);
                    } else {
                        html = '<input id="{0}" name="startDate" type="text" size="8" value="{1}">'.format(elId, startDate);
                    }

                    //if (jQuery("#phases tr.aui-restfultable-row").length > 0)
                    setTimeout(function () {
                        Calendar.setup({
                            inputField: elId,
                            ifFormat: "%Y-%m-%d"
                        });
                    }, 1000);
                    return html;
                }
            });

            var endDatePickerEditView = AJS.RestfulTable.CustomEditView.extend({
                render: function () {
                    var id = this.model.get('id');

                    var elId = 'endDate-input-';
                    if (id) {
                        elId += id;
                    } else {
                        elId += 'create';
                    }

                    var endDate = this.model.get('endDate'), html;
                    if (!endDate) {
                        html = '<input id="{0}" name="endDate" type="text" size="8">'.format(elId);
                    } else {
                        html = '<input id="{0}" name="endDate" type="text" size="8" value="{1}">'.format(elId, endDate);
                    }

                    //if (jQuery("#phases tr.aui-restfultable-row").length > 0)
                    setTimeout(function () {
                        Calendar.setup({
                            inputField: elId,
                            ifFormat: "%Y-%m-%d"
                        });
                    }, 1000);
                    return html;
                }
            });

            var EditPhaseRow = AJS.RestfulTable.EditRow.extend({
                mapSubmitParams: function (params) {
                    var data = {};
                    data.name = params.name;
                    data.progress = params.progress;
                    data.startDate = params.startDate;
                    data.endDate = params.endDate;
                    data.sumPhase = this.model.get('sumPhase');
                    data.isGenerateFromTemplate = !!WORKING.GENERATOR.isGenerateFromTemplate;

                    data.existsNames = _(jQuery("#phases span[data-field-name='name']")).chain().map(function (e) {
                        return jQuery(e).text();
                    }).join("|||").value();

                    setTimeout(function () {
                        validatePhases();
                    }, 1000);

                    return data;
                }
            });


            var columns = [];
            columns.push({
                id: "num", header: AJS.I18n.getText("deal.generator.phaseNum"), allowEdit: false
            });
            columns.push({
                id: "name", header: AJS.I18n.getText("deal.generator.phaseName")
            });
            columns.push({
                id: "sumPhase", header: AJS.I18n.getText("deal.generator.sumPhase"), allowEdit: false
            });
            if (WORKING.GENERATOR.isGenerateFromTemplate) {
                columns.push({
                    id: "progress", header: AJS.I18n.getText("deal.generator.phaseProgress")
                });
            }
            columns.push({
                id: "startDate", header: AJS.I18n.getText("deal.generator.startDate"),
                editView: startDatePickerEditView
            });
            columns.push({
                id: "endDate", header: AJS.I18n.getText("deal.generator.finishDate"),
                editView: endDatePickerEditView
            });

            var tableOptions = {
                autoFocus: true,
                el: jQuery("#phases"),
                allowReorder: false,
                createPosition: "bottom",
                resources: {
                    all: AJS.params.baseURL + "/rest/deal/1.0/phases/",
                    self: AJS.params.baseURL + "/rest/deal/1.0/phases/"
                },
                columns: columns,
                views: {
                    row: phaseRow,
                    editRow: EditPhaseRow
                },
                noEntriesMsg: AJS.I18n.getText("deal.generator.noRows")
            };
            var phaseTable = new AJS.RestfulTable(tableOptions);

            phaseTable.addRow = function () {
                AJS.RestfulTable.prototype.addRow.apply(this, arguments);
                var rows = this.getRows(), row = rows[rows.length-1], rowAttributes = row.model.attributes;
                rowAttributes['num'] = rows.length;
                row.sync(rowAttributes);

                validatePhases();
            };

            phaseTable.removeRow = function () {
                AJS.RestfulTable.prototype.removeRow.apply(this, arguments);
                var row, rows = phaseTable.getRows(), rowAttributes;
                for (var i = 0; i < rows.length; i++) {
                    row = rows[i]; rowAttributes = row.model.attributes;
                    rowAttributes['num'] = i+1;
                    row.sync(rowAttributes);
                }

                validatePhases();
            };

            var phaseTableCreateRow = phaseTable.getCreateRow();
            phaseTableCreateRow.bind(AJS.RestfulTable.Events.SUBMIT_FINISHED, function (ev) {
                validatePhases();
            });

            $restPhaseTable.bind(AJS.RestfulTable.Events.INITIALIZED, function () {
                if (WORKING.GENERATOR.isGenerateFromTemplate) {
                    jQuery('.aui-restfultable-create').hide();
                }

                validatePhases();
            });
        });
    },

    validatePhases = function () {
        if (jQuery("#phases span[data-field-name='name']").length > 0) {
            jQuery('#dialog-next-button').removeAttr('disabled');
            jQuery("#phase-message-bar").hide();
        } else {
            jQuery('#dialog-next-button').attr('disabled', 'disabled');

            jQuery("#phase-message-bar").show();
            jQuery("#phase-message-bar").css("visibility", "visible");
            jQuery("#phase-message-bar").html("<p class='title'><strong>Не заданы этапы.</strong></p>");

            return;
        }

        var valid = true;
        jQuery("#phases span[data-field-name='startDate']").each(function () {
            if (!Date.parse(jQuery(this).text())) {
                valid = false;
                return false;
            }
        });
        jQuery("#phases span[data-field-name='endDate']").each(function () {
            if (!Date.parse(jQuery(this).text())) {
                valid = false;
                return false;
            }
        });

        if (valid) {
            jQuery('#dialog-next-button').removeAttr('disabled');
            jQuery("#phase-message-bar").hide();
        } else {
            jQuery('#dialog-next-button').attr('disabled', 'disabled');

            jQuery("#phase-message-bar").show();
            jQuery("#phase-message-bar").css("visibility", "visible");
            jQuery("#phase-message-bar").html("<p class='title'><strong>Не указаны даты начала и завершения всех этапов.</strong></p>");

            return;
        }

        if (WORKING.GENERATOR.isGenerateFromTemplate) {
            var sumP = 0;
            jQuery("#phases span[data-field-name='progress']").each(function () {
                if (jQuery(this).text() != "") {
                    sumP += parseInt(jQuery(this).text());
                }
            });

            if (sumP == 100) {
                jQuery('#dialog-next-button').removeAttr('disabled');
                jQuery("#phase-message-bar").hide();
            } else {
                jQuery('#dialog-next-button').attr('disabled', 'disabled');

                jQuery("#phase-message-bar").show();
                jQuery("#phase-message-bar").css("visibility", "visible");
                jQuery("#phase-message-bar").html("<p class='title'><strong>Сумма процентов этапов должна быть равной 100.</strong></p>");

                return;
            }
        }
    },

    initScreen6 = function () {
        var dialog, $dialog;
        if (jQuery(WORKING.GENERATOR.workDialogId).length>0) {
            $dialog = jQuery(WORKING.GENERATOR.workDialogId);
            dialog = $dialog.data("_auiWidgetDialog2");
            if (!dialog)
                dialog = AJS.dialog2(WORKING.GENERATOR.workDialogId);
        } else {
            var dialogTemplate = JIRA.WorkGenerator.Templates.WorkPercentDialog();
            $dialog = jQuery(dialogTemplate);
            $dialog.appendTo(jQuery("body"));
            dialog = AJS.dialog2(WORKING.GENERATOR.workDialogId);
        }

        var jQueryDealTree = jQuery('#dealTree'), $workTree = jQuery('#workTree'),
            $headerTableContainer = jQuery('#header-table-container'),
            $inputTableContainer = jQuery('#input-container'),
            $workTreeContainer = jQuery('#work-tree-container');

        jQueryDealTree.addClass('screen6');

        $dealTreeContainer = jQuery('#deal-tree-container');

        jQueryDealTree.dynatree({
            dnd: {
                revert: true,
                autoExpandMS: 1000,
                preventVoidMoves: true,
                onDragStart: function (node) {
                    node.data.fromDealTree = true;
                    if (!node.data.isWork) return false;
                    return true;
                },
                onDragStop: function (node) {
                    delete node.data.fromDealTree;
                    return true;
                },
                onDragEnter: function (node, sourceNode) {
                    if (node.getKeyPath().contains("dealNode") && sourceNode.getKeyPath().contains("dealNode"))
                        return false;

                    if (node.data.isPhase) {
                        return ["over"];
                    } else if (node.data.isWork) {
                        return ["before", "after"];
                    }
                    return false;
                },
                onDragOver: function (node, sourceNode, hitMode) {
                    if (node.getKeyPath().contains("dealNode") && sourceNode.getKeyPath().contains("dealNode"))
                        return false;

                    if (node.data.isPhase || node.data.isWork) {
                        return true;
                    }
                    return false;
                },
                onDrop: function (node, sourceNode, hitMode, ui, draggable) {
                    var copynode, isSourceNodeRemoved = false, isFoundNode = false;
                    if (sourceNode) {
                        var foundNode = _(node.data.isWork?node.parent.childList:node.childList).find(function(e) {
                            return e.data.workId==sourceNode.data.workId;
                        });
                        if (foundNode) {
                            copynode = foundNode;
                            isFoundNode = true;
                        } else {
                            copynode = sourceNode.toDict(true, function (dict) {
                                delete dict.key;
                                delete dict.workPercent;
                                delete dict.workId;
                            });
                        }
                    }

                    if (hitMode == "over" || hitMode == "before" || hitMode == "after") {
                        if (node.data.isWork)
                            node = node.parent;
                        if (!foundNode) {
                            copynode = node.addChild(copynode);
                            copynode.data.workId = sourceNode.data.workId;
                            copynode.data.workPercent = 0;

                            var div = jQuery('<div />');
                            div.append(copynode.data.title); div.children('.percent').text('__');
                            copynode.data.title = div.html();
                        }
                        node.expand(true);
                        isSourceNodeRemoved = true;
                    }

                    if (isSourceNodeRemoved) {
                        if (dialog.$el.data("events") && dialog.$el.data("events")["_aui-internal-layer-show"])
                            delete dialog.$el.data("events")["_aui-internal-layer-show"];
                        dialog.on("show", _.debounce(function () {
                            var form = jQuery("#workPercent-form"),
                                input = jQuery("#workPercent"),
                                closeButton = jQuery("#dialog-close-button");

                            if (sourceNode)
                                input.val(sourceNode.data.workPercent);
                            else
                                input.val(100.0);

                            if (form.data('validator'))
                                delete dialog.$el.removeData("validator");
                            form.validate({
                                rules: {
                                    workPercent: {
                                        required: true,
                                        number: true,
                                        min: { depends: function(element) {
                                            var val = input.val();
                                            return _(val).isNaN() || parseFloat(input.val())<=0.0;
                                        }},
                                        max: 100
                                    }
                                }
                            });
                            if (input.data("events") && input.data("events")["change"])
                                delete dialog.$el.data("events")["change"];
                            input.on("keypress", function(e) {
                                if (e.keyCode == 13) {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    jQuery("#dialog-close-button").click();
                                }
                            });
                            input.on("change", function() {
                                form.valid();
                            });

                            var clickHandler = function() {
                                if (form.valid()) {
                                    var foundNode = _(node.childList).find(function(e) {
                                        return e.data.workId==sourceNode.data.workId;
                                    });
                                    if (foundNode) {
                                        copynode.data.workPercent += parseFloat(input.val());
                                        if (copynode.data.workPercent>100) copynode.data.workPercent = 100.0
                                    } else
                                        copynode.data.workPercent = parseFloat(input.val());

                                    sourceNode.data.workPercent -= parseFloat(input.val());
                                    if (sourceNode.data.workPercent<0.0) sourceNode.data.workPercent = 0.0;

                                    var div = jQuery('<div />');
                                    div.append(copynode.data.title); div.children('.percent').text(copynode.data.workPercent);
                                    copynode.data.title = div.html(); div.empty();
                                    div.append(sourceNode.data.title); div.children('.percent').text(sourceNode.data.workPercent);

                                    jQuery(sourceNode.span).find('.percent').text(sourceNode.data.workPercent);
                                    jQuery(copynode.span).find('.percent').text(copynode.data.workPercent);

                                    dialog.hide();
                                } else
                                    jQuery(this).one("click", clickHandler);

                                if (sourceNode.data.workPercent==0.0)
                                    sourceNode && sourceNode.remove();

                                var workTree = $workTree.dynatree("getTree"), workNode = workTree.getNodeByKey("workNode"),
                                    nextButton = jQuery('#dialog-next-button');
                                if (workNode.childList && workNode.childList.length>0) {
                                    nextButton.attr('aria-disabled', true);
                                    nextButton.attr('disabled', 'disabled');
                                } else {
                                    nextButton.attr('aria-disabled', false);
                                    nextButton.removeAttr('disabled');
                                }
                            }
                            if (closeButton.data("events") && closeButton.data("events")["click"])
                                delete closeButton.data("events")["click"];
                            jQuery("#dialog-close-button").one("click", clickHandler);
                        }, 500));
                        if (dialog.$el.data("events") && dialog.$el.data("events")["_aui-internal-layer-hide"])
                            delete dialog.$el.data("events")["_aui-internal-layer-hide"];
                        dialog.on("hide", _.debounce(function () {
                            var form = jQuery( "#workPercent-form" ), input = jQuery("#workPercent");
                            if (copynode.data.workPercent) {
                                input.val("");
                                return true;
                            }
                            if (!form.valid()) {
                                input.val("");
                                return false;
                            }
                            node.data.workPersent = parseFloat(input.val());
                            input.val("");
                        }, 500));
                        dialog.show();
                    }
                }
            }
        });

        var dealTree = jQueryDealTree.dynatree("getTree"), dealNode = dealTree.getNodeByKey("dealNode"),
            headerNode = dealTree.getNodeByKey("header");
        dealTree.enableUpdate(false);
        dealNode.data.unselectable = true;
        headerNode.data.unselectable = true;
        dealNode.expand(true);

        var height = WORKING.GENERATOR.$dialogContent.height() * 0.4;
        jQueryDealTree.height(height), $workTree.height(height);
        $headerTableContainer.hide();
        $inputTableContainer.hide();
        $workTreeContainer.show();

        jQuery('#workTreeName').text(AJS.I18n.getText('deal.generator.dialog.screen3.selectedWorks'));
        jQuery('#dealTreeName').text(AJS.I18n.getText('deal.generator.dialog.screen6.dealTreeName'));

        $workTree.dynatree({
            dnd: {
                revert: true,
                preventVoidMoves: true,
                onDragStart: function (node) {
                    if (!node.data.isWork) return false;
                    return true;
                },
                onDragEnter: function (node, sourceNode) {
                    if (node.getKeyPath().contains("workNode") && sourceNode.getKeyPath().contains("workNode"))
                        return false;
                    if (node.data.isWork) {
                        return ["over", "before", "after"];
                    } else (node.data && !node.data.isWork)
                        return "over";
                    return false;
                },
                onDragOver: function (node, sourceNode, hitMode) {
                    if (node.getKeyPath().contains("workNode") && sourceNode.getKeyPath().contains("workNode"))
                        return false;
                    if (node.data.isWork) {
                        return true;
                    } else (node.data && !node.data.isWork)
                        return true;
                    return false;
                },
                onDrop: function (node, sourceNode, hitMode, ui, draggable) {
                    var dealTree = jQueryDealTree.dynatree("getTree");
                    var copynode, isSourceNodeRemoved = false, isFoundNode = false;
                    if (sourceNode) {
                        copynode = sourceNode.toDict(true, function (dict) {
                            delete dict.key;
                        });
                    }

                    if (hitMode == "over" || hitMode == "before" || hitMode == "after") {
                        if (node.data.isWork)
                            node = node.parent;

                        var foundNode = _(node.childList).find(function(e) { console.log(e.data.workId);
                            return e.data.workId==sourceNode.data.workId;
                        }), title;
                        if (!foundNode) {
                            copynode = node.addChild(copynode);
                        } else {
                            foundNode.data.workPercent += copynode.workPercent;
                            var div = jQuery('<div />');
                            div.append(foundNode.data.title); div.children('.percent').text(foundNode.data.title);
                            foundNode.data.title = div.html();
                            copynode = foundNode;
                        }
                        title = jQuery(copynode.span).find('.percent');
                        title.text(copynode.data.workPercent);

                        sourceNode && sourceNode.remove();
                        node.expand(true);
                    }
                }
            }
        });

        var workTree = $workTree.dynatree("getTree"), workNode = workTree.getNodeByKey("workNode");
        workTree.enableUpdate(false);
        workNode.data.unselectable = true;
        workNode.expand(true);
        workNode.focus();

        jQuery.when(WORKING.GENERATOR.ajax.getPhases(), WORKING.GENERATOR.ajax.getSelectedWorks()).then(function (phases, works) {
            if (works && works.length > 0) {
                var workAddNode = undefined;
                for (var i = 0; i < works.length; i++) {
                    workAddNode = workNode.addChild({
                        title: AJS.format('<span class="td">{0} <i>{1}</i>:{2}, <i>{3}</i>:{4}</span><span class="td">,&nbsp;&nbsp;</span><span class="td percent">{5}</span>%',
                            AJS.I18n.getText("deal.generator.dialog.deal.Work"), AJS.I18n.getText("deal.generator.admin.codeISR"),
                            works[i].codeISR, AJS.I18n.getText("deal.generator.admin.Mark"), works[i].mark, 100)
                    });
                    workAddNode.data.workId = works[i].id;
                    workAddNode.data.isWork = true;
                    workAddNode.data.workPercent = 100.0;
                    workAddNode.data.codeISR = works[i].codeISR;
                    workAddNode.data.mark = works[i].mark;
                }
            }

            if (phases && phases.length > 0) {
                var phaseNode = undefined;
                for (var i = 0; i < phases.length; i++) {
                    phaseNode = dealNode.addChild({
                        title: AJS.format('{0} {1}', AJS.I18n.getText("deal.generator.dialog.deal.Phase"), phases[i].name)
                    });
                    phaseNode.data.phaseId = phases[i].id;
                    phaseNode.data.isPhase = true;
                    phaseNode.data.workPercent = 0;
                }
            }
            dealNode.expand(true);
            workTree.enableUpdate(true);
            dealTree.enableUpdate(true);
        });
    }

    initScreen7 = function () {
        var jQueryDealTree = jQuery('#dealTree'),
            $headerTableContainer = jQuery('#header-table-container'),
            $inputTableContainer = jQuery('#input-container'),
            $workTreeContainer = jQuery('#work-tree-container');

        jQueryDealTree.removeClass('screen6');

        jQuery('#deal-name').off("keydown");
        jQuery('#deal-name').on("keydown", function () {
            setTimeout(function () {
                var value = jQuery(this).val();
                WORKING.GENERATOR.changeButtonsStatus.setVisibilityGenerateHandler(function () {
                    return value.trim() != '';
                });
            }.bind(this));
        });


        var dealTree, dealNode, headerNode;

        jQueryDealTree.dynatree();

        dealTree = jQueryDealTree.dynatree("getTree"), dealNode = dealTree.getNodeByKey("dealNode"),
            headerNode = dealTree.getNodeByKey("header");
        dealTree.enableUpdate(false);
        dealNode.data.unselectable = true;
        headerNode.data.unselectable = true;
        dealNode.expand(true);

        var height = WORKING.GENERATOR.$dialogContent.height() * 0.7;
        jQueryDealTree.height(height);
        height = $inputTableContainer.find('[name=deal-name]').width();

        $workTreeContainer.hide();
        $headerTableContainer.show();
        $inputTableContainer.show();

        headerNode.data.title = AJS.format('<span class="td">&nbsp;</span><span class="td">{0}</span><span class="td">%</span><span class="td">{1}</span><span class="td">{2}</span><span class="td">{3}</span><span class="td">{4}</span><span class="td">{5}</span>',
            AJS.I18n.getText("deal.generator.phaseName"),
            AJS.I18n.getText("deal.generator.dialog.screen6.budgetedCost.short"), AJS.I18n.getText("deal.generator.dialog.screen6.actualCost.short"),
            AJS.I18n.getText("deal.generator.dialog.screen6.startDate.short"), AJS.I18n.getText("deal.generator.dialog.screen6.endDate.short"),
            AJS.I18n.getText("deal.generator.dialog.screen6.durations.short"));

        jQuery.when(WORKING.GENERATOR.ajax.getComponents(), WORKING.GENERATOR.ajax.getPhases(), WORKING.GENERATOR.ajax.getSelectedWorks()).then(function (components, phases, works) {
            if (components && components.length > 0) {
                var select = jQuery("select#component");
                for (var i=0; i<components.length; i++)
                    select.append(components[i])
            }

            if (works && works.length > 0) {
                var worksChain = _(works).chain();
                var headerTable = JIRA.WorkGenerator.Templates.Screen6TableHeader({
                    program: worksChain.map(function (e) {
                        return e.program
                    }).uniq().join(", ").value(),
                    project: worksChain.map(function (e) {
                        return e.project
                    }).uniq().join(", ").value(),
                    stage: worksChain.map(function (e) {
                        return e.stage
                    }).uniq().join(", ").value(),
                    kindOfPir: worksChain.map(function (e) {
                        return e.kindOfPir
                    }).uniq().join(", ").value(),
                    system: worksChain.map(function (e) {
                        return e.system
                    }).uniq().join(", ").value()
                });
                jQuery("#headerTable").replaceWith(headerTable);
                height = WORKING.GENERATOR.$dialogContent.height() * 0.2;
                jQuery("#headerTable").height(height);

                var workNode;
                if (!WORKING.GENERATOR.isGenerateFromTemplate) {
                    var workNodes = _(WORKING.GENERATOR.dealTree).chain().map(function (e) {
                        return e.works;
                    }).flatten().pluck("workId").unique().value();
                    works = _(works).filter(function (e) {
                        return _(workNodes).contains(e.id);
                    });
                    for (var i = 0; i < works.length; i++) {
                        workNode = dealNode.addChild({
                            title: AJS.format('{0} <i>{1}</i>:{2} <i>{3}</i>:{4}', AJS.I18n.getText("deal.generator.dialog.deal.Work"),
                                AJS.I18n.getText("deal.generator.admin.codeISR"), works[i].codeISR,
                                AJS.I18n.getText("deal.generator.admin.Mark"), works[i].mark)
                        });
                        workNode.expand(false);
                    }
                } else {
                    for (var i = 0; i < works.length; i++) {
                        workNode = dealNode.addChild({
                            title: AJS.format('{0} <i>{1}</i>:{2} <i>{3}</i>:{4}', AJS.I18n.getText("deal.generator.dialog.deal.Work"),
                                AJS.I18n.getText("deal.generator.admin.codeISR"), works[i].codeISR,
                                AJS.I18n.getText("deal.generator.admin.Mark"), works[i].mark)
                        });
                        workNode.expand(false);
                    }
                }

                var phaseNode, phase, phaseLength = phases.length, progress, budgetedCost, actualCost, startMoment, endMoment;
                if (phases && phases.length > 0) {
                    if (!WORKING.GENERATOR.isGenerateFromTemplate) {
                        var phaseNodes = _(WORKING.GENERATOR.dealTree).chain().map(function (e) {
                            return e.phaseId;
                        }).unique().value();
                        phases = _(phases).filter(function (e) {
                            return _(phaseNodes).contains(e.id);
                        });

                        var phaseSum, phaseActualSum;
                        for (var j = 0; j < dealNode.childList.length; j++) {
                            phaseSum = 0, phaseActualSum = 0;
                            workNode = dealNode.childList[j]; workNode.data.isWork = true;
                            var work = works[j];
                            for (var i = 0; i < phases.length; i++) {
                                phase = phases[i];
                                if (!_(WORKING.GENERATOR.dealTree).find(function (e) {
                                        return e.phaseId == phase.id
                                    }))
                                    continue;

                                var foundWork = _(WORKING.GENERATOR.dealTree).chain().filter(function(item) { return item.phaseId==phase.id; })
                                    .map(function(item) { return item.works; }).flatten()
                                    .find(function(item) { return item.workId==work.id}).value();
                                if (!foundWork) continue;
                                progress = foundWork.workPercent || 0;

                                budgetedCost = parseFloat((parseFloat(work.budgetedCost) * foundWork.workPercent / 100).toFixed(2));
                                actualCost = parseFloat((parseFloat(work.actualCost) *  foundWork.workPercent / 100).toFixed(2));
                                phaseSum += budgetedCost; phaseActualSum += actualCost;

                                startMoment = moment(phase.startDate, "YYYY-M-D"); endMoment = moment(phase.endDate, "YYYY-M-D");
                                phaseNode = workNode.addChild({
                                    title: AJS.format('<span class="td">{0}</span><span class="td">{1}</span><span class="td">{2}</span><span class="td">{3}</span><span class="td">{4}</span><span class="td">{5}</span><span class="td">{6}</span><span class="td">{7}</span>',
                                        AJS.I18n.getText("deal.generator.dialog.deal.Phase"),
                                        phase.name, progress, budgetedCost, actualCost,
                                        phase.startDate, phase.endDate, endMoment.diff(startMoment, "days"))
                                });
                            }
                        }
                    } else {
                        for (var j = 0; j < dealNode.childList.length; j++) {
                            workNode = dealNode.childList[j];
                            workNode.data.isWork = true;
                            for (var i = 0; i < phases.length; i++) {
                                phase = phases[i];
                                progress = (phase.progress || 0).toString();
                                budgetedCost = (parseFloat(works[j].budgetedCost) * progress / 100).toFixed(2); budgetedCost = !_(budgetedCost).isNaN() ? budgetedCost : 0.0;
                                actualCost = (parseFloat(works[j].actualCost) * progress / 100).toFixed(2); actualCost = !_(actualCost).isNaN() ? actualCost : 0.0;
                                startMoment = moment(phase.startDate, "YYYY-M-D"); endMoment = moment(phase.endDate, "YYYY-M-D");
                                phaseNode = workNode.addChild({
                                    title: AJS.format('<span class="td">{0}</span><span class="td">{1}</span><span class="td">{2}</span><span class="td">{3}</span><span class="td">{4}</span><span class="td">{5}</span><span class="td">{6}</span><span class="td">{7}</span>',
                                        AJS.I18n.getText("deal.generator.dialog.deal.Phase"),
                                        phase.name, progress, budgetedCost, actualCost,
                                        phase.startDate, phase.endDate, endMoment.diff(startMoment, "days"))
                                });
                            }
                        }
                    }
                    console.info('12345');
                    WORKING.GENERATOR.changeButtonsStatus.setGenerateHandler(function () {
                        var deal = {};

                        //deal["program"] = jQuery("#headerTable>thead>tr>th:nth(1)").text() || "";
                        //deal["project"] = jQuery("#headerTable>tbody>tr:nth(0)>td:nth(1)").text() || "";
                        deal["contractSummary"] = $inputTableContainer.find('[name=deal-name]').val() || "test";
                        deal["component"] = jQuery("#component").val();
                        //deal["dateBegin"] = "22.11.2016";
                        //deal["dateEnd"] = "22.11.2016";
                        //deal["dateBeginFact"] = "22.11.2016";
                        //deal["dateEndFact"] = "22.11.2016";
                        deal["price"] = WORKING.GENERATOR.BudgetedCostSummary;
                        deal["actualPrice"] = WORKING.GENERATOR.ActualCostSummary;

                        var work, dealBudgetCost = 0, dealActualCost = 0, phaseBudgetCost, phaseActualCost,
                            phaseProgress, sum, phaseProgressesAccumulator;
                        for (var j = 0; j < phases.length; j++) {
                            deal["pahase_summary_" + j] = phases[j].name;
                            deal["pahase_num_" + j] = phases[j].num;
                            deal["pahase_dateBegin_" + j] = phases[j].startDate;
                            deal["pahase_dateEnd_" + j] = phases[j].endDate;
                            deal["pahase_dateBeginFact_" + j] = phases[j].startDate;
                            deal["pahase_dateEndFact_" + j] = phases[j].endDate;

                            phaseProgress = 0; phaseProgressesAccumulator = [];
                            phaseBudgetCost = 0, phaseActualCost = 0;
                            for (var i = 0; i < works.length; i++) {
                                if (!WORKING.GENERATOR.isGenerateFromTemplate) {
                                    var workIds = _(WORKING.GENERATOR.dealTree).chain().find(function (e) {
                                        return e.phaseId == phases[j].id;
                                    }).pick("works").flatten().map(function (e) {
                                        return e.workId;
                                    }).value();
                                    if (!workIds || !workIds.length)
                                        continue;
                                    if (!_(workIds).contains(works[i].id))
                                        continue;
                                }

                                deal["work__" + j + "summary_" + i] = works[i].subject;
                                deal["work__" + j + "codeISR_" + i] = works[i].codeISR;
                                deal["work__" + j + "system_" + i] = works[i].system;
                                deal["work__" + j + "subject_" + i] = works[i].subject;
                                deal["work__" + j + "kindOfPir_" + i] = works[i].kindOfPir;
                                deal["work__" + j + "stage_" + i] = works[i].stage;
                                deal["work__" + j + "dgip_" + i] = works[i].gipOfProject;
                                deal["work__" + j + "ico_" + i] = works[i].program + "/" + works[i].project + "/" + works[i].stage + "/" + works[i].system;
                                deal["work__" + j + "icp_" + i] = works[i].mark;
                                deal["work__" + j + "mark_" + i] = works[i].mark;
                                deal["work__" + j + "tom_" + i] = works[i].volume;
                                deal["work__" + j + "revision_" + i] = works[i].revision;

                                if (WORKING.GENERATOR.isGenerateFromTemplate) {
                                    budgetedCost = parseFloat((parseFloat(works[i].budgetedCost) * phases[j].progress / 100).toFixed(2));
                                    actualCost = parseFloat((parseFloat(works[i].actualCost) *  phases[j].progress / 100).toFixed(2));
                                    deal["work__" + j + "price_" + i] = budgetedCost;
                                    deal["work__" + j + "actualPrice_" + i] = actualCost;
                                } else {
                                    work = _(WORKING.GENERATOR.dealTree).chain().filter(function(item) { return item.phaseId==phases[j].id; })
                                        .map(function(item) { return item.works; }).flatten()
                                        .find(function(item) { return item.workId==works[i].id}).value();
                                    if (!work) continue;

                                    budgetedCost = parseFloat((parseFloat(works[i].budgetedCost) * work.workPercent / 100).toFixed(2));
                                    actualCost = parseFloat((parseFloat(works[i].actualCost) *  work.workPercent / 100).toFixed(2));
                                    phaseProgress += actualCost * work.workPercent / 100;

                                    deal["work__" + j + "price_" + i] = budgetedCost;
                                    deal["work__" + j + "actualPrice_" + i] = actualCost;
                                }

                                phaseBudgetCost += budgetedCost;
                                phaseActualCost += actualCost;

                                deal["work__" + j + "project_" + i] = works[i].project;
                                deal["work__" + j + "program_" + i] = works[i].program;
                                deal["pahase_project_" + j] = works[i].project;
                                deal["pahase_program_" + j] = works[i].program;
                                deal["pahase_stage_" + j] = works[i].stage;

                                deal["project"] = works[i].project;
                                deal["program"] = works[i].program;
                            }

                            if (WORKING.GENERATOR.isGenerateFromTemplate) {
                                deal["pahase_percentage_" + j] = phases[j].progress;
                                deal["pahase_price_" + j] = phaseBudgetCost;
                                deal["pahase_actualPrice_" + j] = phaseActualCost;
                            } else {
                                phaseProgress = phaseProgress / WORKING.GENERATOR.ActualCostSummary * 100;
                                if ((j+1) == phases.length) {
                                    sum =_(phaseProgressesAccumulator).reduce(function(sum, e) { return sum + e }, 0);
                                    deal["pahase_percentage_" + j] = 100 - sum;
                                } else {
                                    deal["pahase_percentage_" + j] = phaseProgress.toFixed(2);
                                    phaseProgressesAccumulator.push(+phaseProgress.toFixed(2));
                                }
                                deal["pahase_price_" + j] = phaseBudgetCost;
                                deal["pahase_actualPrice_" + j] = phaseActualCost;
                                dealBudgetCost += phaseBudgetCost;
                                dealActualCost += phaseActualCost;
                            }
                        }

                        if (WORKING.GENERATOR.isGenerateFromTemplate) {
                            deal["price"] = WORKING.GENERATOR.BudgetedCostSummary;
                            deal["actualPrice"] = WORKING.GENERATOR.ActualCostSummary;
                        } else {
                            deal["price"] = dealBudgetCost;
                            deal["actualPrice"] = dealActualCost;
                        }

                        WORKING.GENERATOR.ajax.generateDeal(deal).done(function (data) {
                            WORKING.GENERATOR.dialog.hide();
                            JIRA.Messages.showSuccessMsg('{0}: {1}'.
                                format(AJS.I18n.getText("deal.generator.dialog.deal.generated.message"),
                                AJS.params.baseURL + "/browse/" + data.contractIssueKey));
                        }).fail(function () {
                            JIRA.Messages.showErrorMsg(AJS.I18n.getText("deal.generator.dialog.deal.generated.failMessage"));
                        });
                    });
                }
                dealTree.enableUpdate(true);
            }
        });
    }
}.bind(WORKING.GENERATOR));