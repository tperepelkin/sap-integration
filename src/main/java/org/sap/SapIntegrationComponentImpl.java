package org.sap;

import com.atlassian.jira.bc.issue.IssueService;
import com.atlassian.jira.component.ComponentAccessor;
import com.atlassian.jira.config.IssueTypeManager;
import com.atlassian.jira.config.PriorityManager;
import com.atlassian.jira.issue.CustomFieldManager;
import com.atlassian.jira.issue.IssueFactory;
import com.atlassian.jira.issue.IssueInputParametersImpl;
import com.atlassian.jira.issue.MutableIssue;
import com.atlassian.jira.issue.context.JiraContextNode;
import com.atlassian.jira.issue.customfields.CustomFieldType;
import com.atlassian.jira.issue.customfields.CustomFieldUtils;
import com.atlassian.jira.issue.fields.CustomField;
import com.atlassian.jira.issue.issuetype.IssueType;
import com.atlassian.jira.project.AssigneeTypes;
import com.atlassian.jira.project.Project;
import com.atlassian.jira.project.ProjectManager;
import com.atlassian.jira.user.ApplicationUser;
import com.atlassian.jira.workflow.WorkflowFunctionUtils;
import com.atlassian.plugin.Plugin;
import com.atlassian.plugin.osgi.bridge.external.PluginRetrievalService;
import com.atlassian.sal.api.ApplicationProperties;
import org.apache.log4j.Logger;
import org.ofbiz.core.entity.GenericEntityException;

import javax.servlet.http.HttpServletRequest;
import java.sql.Timestamp;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SapIntegrationComponentImpl implements SapIntegrationComponent {
    private static final Logger log = Logger.getLogger(SapIntegrationComponentImpl.class);

    private final ApplicationProperties applicationProperties;
    private final CustomFieldManager customFieldManager;
    private final ProjectManager projectManager;
    private final IssueFactory issueFactory;
    private final IssueTypeManager issueTypeManager;
    private final PriorityManager priorityManager;
    private final IssueService issueService;
    private final Plugin plugin;

    private static final String EPIC_NAME = "Epic Name";

    public SapIntegrationComponentImpl(ApplicationProperties applicationProperties, CustomFieldManager _customFieldManager,
                                       ProjectManager _projectManager, IssueFactory _issueFactory,
                                       IssueTypeManager _issueTypeManager, PriorityManager _priorityManager,
                                       IssueService _issueService, PluginRetrievalService prs) {
        this.applicationProperties = applicationProperties;
        this.customFieldManager = _customFieldManager;
        this.projectManager = _projectManager;
        this.issueFactory = _issueFactory;
        this.issueTypeManager = _issueTypeManager;
        this.priorityManager = _priorityManager;
        this.issueService = _issueService;
        this.plugin = prs.getPlugin();
    }

    public Plugin getPlugin() {
        return this.plugin;
    }

    public CustomField checkCustomField(String cfName, String cfType) throws GenericEntityException {
        CustomField cField = customFieldManager.getCustomFieldObjectByName(cfName);

        if (cField != null)
            return cField;

        List<Long> prIds = new ArrayList<>();

        for (Project prj : projectManager.getProjectObjects()) {
            prIds.add(prj.getId());
        }

        final List<JiraContextNode> contexts = CustomFieldUtils
                .buildJiraIssueContexts(true, prIds.toArray(new Long[]{}), projectManager);

        CustomFieldType cft = customFieldManager.getCustomFieldType(cfType);

        cField = customFieldManager.createCustomField(cfName, cfName,
                cft,
                customFieldManager.getDefaultSearcher(cft),
                contexts,
                new ArrayList<>(ComponentAccessor.getComponent(IssueTypeManager.class).getIssueTypes())
        );

        return cField;
    }


    public IssueService.CreateValidationResult doValidate(
            HttpServletRequest request, Map actionParams, String summary,
            String description, String issueTypeId) throws Exception {
        ApplicationUser user = ComponentAccessor.getJiraAuthenticationContext().getLoggedInUser();

        Project projectObj = ComponentAccessor.getComponent(ProjectManager.class).getProjectObjByKey("IA");

        MutableIssue issue = issueFactory.getIssue();

        //required field
        IssueType issueTypeObj = issueTypeManager.getIssueType(issueTypeId);
        issue.setIssueTypeObject(issueTypeObj);

        //required field
        issue.setSummary(summary);

        if (description != null) {
            issue.setDescription(description);
        }
        issue.setStatusId("1");
        issue.setProjectObject(projectObj);


        String priority = null;
//    if( priority == null )
//    {
        if (priorityManager.getDefaultPriority() != null) {
            issue.setPriorityObject(priorityManager.getDefaultPriority());
            priority = priorityManager.getDefaultPriority().getId();
        }
/*
      else
      {
        List<Priority> priorities = priorityManager.getPriorities();
        if( !priorities.isEmpty() )
        {
          for( Priority priorityVal : priorities )
          {
            if( priorityVal.getName().contains("Major") )
            {
              issue.setPriorityObject(priorityVal);
              priority = priorityVal.getId();
              break;
            }
          }
        }
      }
    }
    else
    {
      issue.setPriorityId(priority);
    }
*/

        if (AssigneeTypes.UNASSIGNED == projectObj.getAssigneeType()) {
            issue.setAssignee(null);
        } else {
            issue.setAssignee(projectObj.getLead());
        }


        issue.setReporter(user);


        Map fields = new HashMap();
        fields.put("issue", issue);
        fields.put(WorkflowFunctionUtils.ORIGINAL_ISSUE_KEY, issue);

        IssueInputParametersImpl params = new IssueInputParametersImpl(fields);

        params.setPriorityId(priority);
        params.setProjectId(projectObj.getId());
        params.setIssueTypeId(issueTypeId);
        params.setSummary(summary);
        params.setReporterId(user.getName());

        CustomField epicNameCF = checkCustomField(EPIC_NAME, TEXT_CF_TYPE);
        issue.setCustomFieldValue(epicNameCF, summary);
        params.addCustomFieldValue(epicNameCF.getId(), summary);

        if (description != null) {
            params.setDescription(description);
        }

        IssueService.CreateValidationResult createValidationResult = issueService.validateCreate(user, params);

        if (!createValidationResult.isValid()) {
            log.error("createValidationResult error :: "
                    + createValidationResult.getErrorCollection().getErrorMessages());
        }

        return createValidationResult;
    }

    @Override
    public void setUpDateCF(CustomField cf, MutableIssue issue, String val, String df) {
        try {
            SimpleDateFormat sdf = new SimpleDateFormat(df);
            issue.setCustomFieldValue(cf, new Timestamp(sdf.parse(val).getTime()));
        } catch (ParseException e) {
            log.error(e, e);
        }
    }

    @Override
    public void setUpFloatCF(CustomField cf, MutableIssue issue, String val) {
        try {
            issue.setCustomFieldValue(cf, new Double(val));
        } catch (Exception e) {
            log.error(e, e);
        }
    }
}