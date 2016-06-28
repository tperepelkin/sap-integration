var WORKING = WORKING || {};
WORKING.AJAX = WORKING.AJAX || {
     generateDeal: function(data) {
        var d = jQuery.Deferred();
        return jQuery.ajax({
            method: "post",
            type: "post",
            data: data,
            dataType: "json",
            url: contextPath + "/rest/deal/1.0/generate/contract",
            success: function (data) {
                d.resolve(data);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error("Request {0} was performed with error".format(contextPath + "rest/deal/1.0/generate/contract"), errorThrown);
                d.reject();
            }
        });
    },

    getAllUsers: function() {
        var d = jQuery.Deferred();
        return jQuery.ajax({
            method: "get",
            dataType: "json",
            url: contextPath + "/rest/deal/1.0/users/allUsers",
            success: function (users) {
                d.resolve(users);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                d.reject();
            }
        });
    },

    getWorks: function() {
        var d = jQuery.Deferred()
        jQuery.ajax({
            method: "get",
            dataType: "json",
            url: contextPath + "/rest/deal/1.0/works" + WORKING.GENERATOR.getFilterForColumn(),
            success: function (works) {
                d.resolve(works);
            },
            error: function () {
                d.reject();
            }
        });
        return d;
    },

    getSelectedWorks: function() {
        var d = jQuery.Deferred()
        jQuery.ajax({
            method: "get",
            dataType: "json",
            url: contextPath + "/rest/deal/1.0/works" + WORKING.GENERATOR.getSelectedWorks(),
            success: function (works) {
                d.resolve(works);
            },
            error: function () {
                d.reject();
            }
        });
        return d;
    },


    getComponents: function() {
        var d = jQuery.Deferred()
        jQuery.ajax({
            method: "get",
            dataType: "json",
            url: contextPath + "/rest/deal/1.0/users/components",
            success: function (components) {
                d.resolve(components);
            },
            error: function () {
                d.reject();
            }
        });
        return d;
    }

    };