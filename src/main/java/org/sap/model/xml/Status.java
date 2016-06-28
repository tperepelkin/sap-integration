package org.sap.model.xml;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlRootElement;
import java.util.Arrays;
import java.util.Map;

import static org.sap.model.ModelUtils.*;

/**
 * Created by ngolosin on 18.01.2016.
 */
@XmlRootElement
@XmlAccessorType(XmlAccessType.FIELD)
public class Status {
    private int id;
    public int getId() {
        return this.id;
    }
    public void setId(int id) {
        this.id = id;
    }

    private String jiraStatusName;
    public String getJiraStatusName() { return this.jiraStatusName; }
    public void setJiraStatusName(String statusName) {
        this.jiraStatusName = statusName;
    }

    private String sapStatusName;
    public String getSapStatusName() { return this.sapStatusName; }
    public void setSapStatusName(String statusName) {
        this.sapStatusName = statusName;
    }

    public Status updateModel(org.sap.model.ao.Status statusEntity) {
        this.id = statusEntity.getID();
        this.jiraStatusName = statusEntity.getJiraStatusName();
        this.sapStatusName = statusEntity.getSapStatusName();

        return this;
    }

    public Status() {
    }

    public Status(org.sap.model.ao.Status statusEntity) {
        this.id = statusEntity.getID();
        this.jiraStatusName = statusEntity.getJiraStatusName() != null ? statusEntity.getJiraStatusName() : "";
        this.sapStatusName = statusEntity.getSapStatusName();
    }

    public Status(Map status) {
        if (status.get(ID)!=null)
            this.id = Integer.parseInt(status.get(ID).toString());
        if (status.get(JIRA_ISSUE_STATUS_NAME)!=null)
            this.jiraStatusName = (String)status.get(JIRA_ISSUE_STATUS_NAME);
        if (status.get(SAP_DOCUMENT_STATUS_NAME)!=null)
            this.sapStatusName = (String)status.get(SAP_DOCUMENT_STATUS_NAME);
    }

    public boolean equals(Object obj) {
        if (!(obj instanceof Status))
            return false;
        Status workObj = (Status)obj;
        if (!this.getJiraStatusName().equals(workObj.getJiraStatusName()))
            return false;
        if (!this.getSapStatusName().equals(workObj.getSapStatusName()))
            return false;

        return true;
    }

    public int hashCode() {
        Object[] obj = {getJiraStatusName(), getSapStatusName()};
        return Arrays.hashCode(obj);
    }
}
