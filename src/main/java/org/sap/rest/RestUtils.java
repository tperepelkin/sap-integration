package org.sap.rest;

import com.atlassian.jira.bc.user.search.UserSearchParams;
import com.atlassian.jira.bc.user.search.UserSearchService;
import com.atlassian.jira.component.ComponentAccessor;
import com.atlassian.jira.security.groups.GroupManager;
import com.atlassian.jira.user.ApplicationUser;
import com.atlassian.jira.util.json.JSONException;
import com.atlassian.jira.util.json.JSONObject;

import java.util.*;
import java.util.stream.Collectors;

public class RestUtils {
    static JSONObject getSuccessJSONObject() throws JSONException {
        JSONObject result = new JSONObject();
        result.put("success", true);
        return result;
    }

    static JSONObject getErrorJSONObject() throws JSONException {
        return getSuccessJSONObject().put("success", false);
    }

    static JSONObject getEmptyJSONObject(JSONObject object) throws JSONException {
        return object.put("id", false);
    }

    static Set<String> getAllUsers() {
        UserSearchService userSearchService = ComponentAccessor.getComponentOfType(UserSearchService.class);

        List<ApplicationUser> userList = userSearchService.findUsers("", UserSearchParams.ACTIVE_USERS_ALLOW_EMPTY_QUERY);
        return userList.stream().map(user -> user.getName()).collect(Collectors.toSet());
    }

    static Set<String> getAllGroups() {
        GroupManager groupManager = ComponentAccessor.getGroupManager();
        Set<String> groupNameList = new HashSet();
        for (String user: getAllUsers()) {
            groupNameList.addAll((Set)groupManager.getGroupNamesForUser(user));
        }

        return groupNameList;
    }

    public static Set<String> getComponents() {
        com.atlassian.jira.project.Project project = ComponentAccessor.getProjectManager().getProjectByCurrentKey("IA");
        Collection<com.atlassian.jira.bc.project.component.ProjectComponent> projectComponents = ComponentAccessor.getProjectComponentManager().findAllForProject(project.getId());
        return projectComponents.stream().map(it -> String.format("<option value=\"%d\">%s</option>", it.getId(), it.getName()))
                .collect(java.util.stream.Collectors.toSet());
    }
}