package org.sap.service;

import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.jira.component.ComponentAccessor;
import com.atlassian.jira.security.PermissionManager;
import com.atlassian.jira.user.ApplicationUser;
import com.google.common.base.Joiner;
import com.google.common.base.Preconditions;
import com.google.common.collect.Iterables;
import com.google.common.collect.Lists;
import org.apache.log4j.Logger;
import org.sap.model.ModelUtils;
import org.sap.model.ao.Status;

import java.util.*;


/**
 * Created by ngolosin on 18.01.2016.
 */
public class DBServiceImpl implements DBService {
    private static final Logger log = Logger.getLogger(DBServiceImpl.class);

    private final ActiveObjects ao;

    public DBServiceImpl(ActiveObjects ao) {
        this.ao = Preconditions.checkNotNull(ao);
    }

    @Override
    public Status addStatus(String jiraStatusName, String sapStatusName) {
        final Status statusEntity = ao.create(org.sap.model.ao.Status.class);
        statusEntity.setJiraStatusName(jiraStatusName);
        statusEntity.setSapStatusName(sapStatusName);

        statusEntity.save();
        return statusEntity;
    }

    @Override
    public Status addStatus(org.sap.model.xml.Status statusXML) {
        final Status statusEntity = ao.create(Status.class);
        statusEntity.setJiraStatusName(statusXML.getJiraStatusName());
        statusEntity.setSapStatusName(statusXML.getSapStatusName());

        statusEntity.save();
        return statusEntity;
    }

    @Override
    public Status editStatus(int statusID, org.sap.model.xml.Status statusXML) {
        Status statusEntity = ao.get(Status.class, statusID);
        if (statusEntity != null) {
            if (statusXML.getJiraStatusName() != null)
                statusEntity.setJiraStatusName(statusXML.getJiraStatusName());
            if (statusXML.getSapStatusName() != null)
                statusEntity.setSapStatusName(statusXML.getSapStatusName());

            statusEntity.save();
            return statusEntity;
        } else {
            return null;
        }
    }

    @Override
    public boolean deleteStatus(int statusID) {
        Status statusEntity = ao.get(Status.class, statusID);
        if (statusEntity != null) {
            ao.delete(statusEntity);
            return true;
        } else {
            return false;
        }
    }

    @Override
    public Status getStatus(int statusID) {
        Status statusEntity = ao.get(Status.class, statusID);
        return statusEntity;
    }

    @Override
    public boolean isStatusExist(org.sap.model.xml.Status status) {
        List<Status> statuses = Lists.newArrayList(ao.find(Status.class));
        List<org.sap.model.xml.Status> workXMLList = ModelUtils.getWorkModelList(statuses);

        return workXMLList.contains(status);
    }

    @Override
    public List<Status> allStatuses() {
        return Lists.newArrayList(ao.find(Status.class));
    }

    @Override
    public List<Status> allStatuses(String userName) {
        final ApplicationUser user = ComponentAccessor.getUserManager().getUserByName(userName);
        final PermissionManager permissionManager = ComponentAccessor.getPermissionManager();

        return Lists.newArrayList(ao.find(Status.class));
    }

    @Override
    public List<Status> allStatuses(List<String> statuses) {
        List<String> resultList = Lists.newArrayList(Iterables.transform(statuses, item -> "ID=" + item));

        String query = Joiner.on(" OR ").join(resultList);
        Object[] emptyObject = {};
        return Lists.newArrayList(ao.find(Status.class, query, emptyObject));
    }



    @Override
    public List<PhaseTemplate> allPhaseTemplates() {
        List<PhaseTemplate> phaseTemplates = Lists.newArrayList(ao.find(PhaseTemplate.class));
        return phaseTemplates;
    }

    @Override
    public org.sap.model.ao.PhaseTemplate getPhaseTemplate(int phaseTemplateID) {
        return ao.get(PhaseTemplate.class, phaseTemplateID);
    }

    @Override
    public boolean deletePhaseTemplate(int id) {
        PhaseTemplate phaseEntity = ao.get(PhaseTemplate.class, id);
        if (phaseEntity != null) {
            ao.delete(phaseEntity);
            return true;
        } else {
            return false;
        }
    }

    @Override
    public PhaseTemplate editPhaseTemplate(int id, org.sap.model.xml.PhaseTemplate phaseXML) {
        PhaseTemplate phaseEntity = ao.get(PhaseTemplate.class, id);
        if (phaseEntity != null) {
            if (phaseXML.getNum() != null)
                phaseEntity.setNum(phaseXML.getNum());
            if (phaseXML.getName() != null)
                phaseEntity.setName(phaseXML.getName());
            if (phaseXML.getProgress() != null)
                phaseEntity.setProgress(phaseXML.getProgress());
            if (phaseXML.getSumPhase() != null)
                phaseEntity.setSumPhase(phaseXML.getSumPhase());
            phaseEntity.save();
            return phaseEntity;
        } else
            return null;
    }

    @Override
    public PhaseTemplate addPhaseTemplate(org.sap.model.xml.PhaseTemplate phaseXML) {
        final PhaseTemplate phaseEntity = ao.create(PhaseTemplate.class);
        phaseEntity.setNum(phaseXML.getNum());
        phaseEntity.setName(phaseXML.getName());
        phaseEntity.setProgress(phaseXML.getProgress());
        phaseEntity.setSumPhase(phaseXML.getSumPhase());
        phaseEntity.save();
        return phaseEntity;
    }
}
