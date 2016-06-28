package org.sap;

import com.atlassian.jira.bc.issue.IssueService;
import com.atlassian.jira.issue.MutableIssue;
import com.atlassian.jira.issue.fields.CustomField;
import com.atlassian.plugin.Plugin;
import org.ofbiz.core.entity.GenericEntityException;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

public interface SapIntegrationComponent
{
  public final static String FLOAT_CF_TYPE = "com.atlassian.jira.plugin.system.customfieldtypes:float";
  public final static String TEXT_CF_TYPE = "com.atlassian.jira.plugin.system.customfieldtypes:textfield";
  public final static String DT_CF_TYPE = "com.atlassian.jira.plugin.system.customfieldtypes:datetime";

  Plugin getPlugin();

  CustomField checkCustomField(String cfName, String cfType) throws GenericEntityException;

  IssueService.CreateValidationResult doValidate(HttpServletRequest request, Map actionParams, String summary,
                                                 String description, String issueTypeId) throws Exception;

  void setUpDateCF(CustomField cf, MutableIssue issue, String val, String df);
  void setUpFloatCF(CustomField cf, MutableIssue issue, String val);
}