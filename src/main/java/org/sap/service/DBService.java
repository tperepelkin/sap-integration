package org.sap.service;

import com.atlassian.activeobjects.tx.Transactional;
import org.sap.model.ao.Status;

import java.util.List;

/**
 * Created by ngolosin on 18.01.2016.
 */
@Transactional
public interface DBService {
    List<Status> allStatuses();
    List<Status> allStatuses(String userName);
    List<Status> allStatuses(List<String> statuses);

    Status addStatus(org.sap.model.xml.Status status);
    Status addStatus(String jiraStatusName, String sapStatusName);
    Status editStatus(int workID, org.sap.model.xml.Status status);
    boolean isStatusExist(org.sap.model.xml.Status status);
    Status getStatus(int stageID);
    boolean deleteStatus(int statusID);

    List<PhaseTemplate> allPhaseTemplates();
    PhaseTemplate getPhaseTemplate(int phaseTemplateID);
    boolean deletePhaseTemplate(int id);
    PhaseTemplate addPhaseTemplate(org.sap.model.xml.PhaseTemplate phaseXML);
    PhaseTemplate editPhaseTemplate(int id, org.sap.model.xml.PhaseTemplate phaseXML);
}
