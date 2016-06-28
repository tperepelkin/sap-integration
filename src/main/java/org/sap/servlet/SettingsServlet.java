package org.sap.servlet;

import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.jira.component.ComponentAccessor;
import com.atlassian.jira.config.StatusManager;
import com.atlassian.jira.config.properties.APKeys;
import com.atlassian.jira.config.properties.ApplicationProperties;
import com.atlassian.jira.issue.issuetype.IssueType;
import com.atlassian.jira.issue.status.Status;
import com.atlassian.jira.user.ApplicationUser;
import com.atlassian.jira.util.I18nHelper;
import com.atlassian.jira.util.VelocityParamFactory;
import com.atlassian.plugin.Plugin;
import com.atlassian.sal.api.pluginsettings.PluginSettings;
import com.atlassian.sal.api.pluginsettings.PluginSettingsFactory;
import com.atlassian.soy.renderer.SoyTemplateRenderer;
import com.atlassian.velocity.VelocityManager;
import com.google.common.collect.Maps;
import org.apache.log4j.Logger;
import org.sap.SapIntegrationComponent;
import org.sap.importModel.StatusMapping;
import org.sap.service.DBService;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Map;


/**
 * Created by ngolosin on 10.01.2016.
 */
public class SettingsServlet extends HttpServlet {
    Logger log = Logger.getLogger(SettingsServlet.class);

    public static final String PLUGIN_STORAGE_KEY = "com.atlassian.plugins.tutorial.refapp.adminui";

    private final ActiveObjects activeObjects;
    private final PluginSettingsFactory pluginSettingsFactory;
    private final SoyTemplateRenderer soyTemplateRenderer;
    private final DBService DBService;
    private final Plugin plugin;

    private final ApplicationProperties ap = ComponentAccessor.getApplicationProperties();
    private final String baseUrl = ap.getString(APKeys.JIRA_BASEURL);
    private final String webworkEncoding = ap.getString(APKeys.JIRA_WEBWORK_ENCODING);
    private final VelocityParamFactory vp = ComponentAccessor.getVelocityParamFactory();
    private final VelocityManager vm = ComponentAccessor.getVelocityManager();

    private StatusMapping statusMapping = null;

    public SettingsServlet(DBService DBService, SoyTemplateRenderer soyTemplateRenderer, ActiveObjects activeObjects,
                           PluginSettingsFactory pluginSettingsFactory, SapIntegrationComponent component) {
        this.soyTemplateRenderer = soyTemplateRenderer;
        this.activeObjects = activeObjects;
        this.pluginSettingsFactory = pluginSettingsFactory;
        this.DBService = DBService;
        this.plugin = component.getPlugin();
    }

    protected static final String tmpPath = System.getProperty("java.io.tmpdir");
    protected static final SimpleDateFormat fmt = new SimpleDateFormat("dd.MM.yyyy");

    Map<String, Object> context = Maps.newHashMap();

    @Override
    public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
//        PluginSettings pluginSettings = pluginSettingsFactory.createGlobalSettings();
//        pluginSettings.put(Config.class.getName() + ".name", config.getName());
//        pluginSettings.put(Config.class.getName()  +".time", Integer.toString(config.getTime()));


        String pluginStorageKey = plugin.getKey() + "." + plugin.getName();
        PluginSettings pluginSettings = pluginSettingsFactory.createGlobalSettings();
        if (pluginSettings.get(pluginStorageKey + ".name") == null) {
            String noName = "Enter a name here.";
//            pluginSettings.put(pluginStorageKey +".name", noName);
        }
        StatusManager statusManager = ComponentAccessor.getComponentOfType(StatusManager.class);
        java.util.Collection<Status> statusesCollection = statusManager.getStatuses();
        Status[] statuses = new Status[statusesCollection.size()];
        statusesCollection.toArray(statuses);
        com.atlassian.jira.config.IssueTypeManager issueTypeManager = ComponentAccessor.getComponentOfType(com.atlassian.jira.config.IssueTypeManager.class);
        java.util.Collection<IssueType> issueTypesCollection = issueTypeManager.getIssueTypes();
        IssueType[] issueTypes = new IssueType[issueTypesCollection.size()];
        issueTypesCollection.toArray(issueTypes);

        response.setContentType("text/html;charset=utf-8");
        Map context = vp.getDefaultVelocityParams();
        context.put("issueStatuses", statuses);
        context.put("issueTypes", issueTypes);

        ApplicationUser currentUser = ComponentAccessor.getJiraAuthenticationContext().getLoggedInUser();
        I18nHelper i18nHelper = ComponentAccessor.getI18nHelperFactory().getInstance(currentUser);
        context.put("i18n", i18nHelper);
        String renderedText = vm.getEncodedBody("templates/", "edit-plugin-settings.vm", baseUrl, webworkEncoding, context);
        response.getWriter().write(renderedText);
    }
}
