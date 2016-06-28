package org.sap.rest;

import com.atlassian.jira.component.ComponentAccessor;
import com.atlassian.jira.util.json.JSONException;
import com.atlassian.jira.util.json.JSONObject;
import com.atlassian.plugins.rest.common.security.AnonymousAllowed;
import org.apache.log4j.Logger;
import org.sap.model.ModelUtils;
import org.sap.model.xml.Status;
import org.sap.service.DBService;

import javax.ws.rs.*;
import javax.ws.rs.core.GenericEntity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.*;

import static com.google.common.collect.Lists.newArrayList;
import static org.sap.model.ModelUtils.*;
import static org.sap.rest.RestUtils.getErrorJSONObject;
import static org.sap.rest.RestUtils.getSuccessJSONObject;


@Path("/works")
@Consumes ({ MediaType.APPLICATION_JSON })
@Produces ({ MediaType.APPLICATION_JSON })
public class StatusRestService {
    private static final Logger log = Logger.getLogger(StatusRestService.class);

    public static final String COLUMNS = "columns";
    public static final String SELECTED_WORKS = "selectedWorks";
    public static final String PROGRAMS = "programs";
    public static final String PROJECTS = "projects";
    public static final String STAGES = "stages";
    public static final String USER_NAME = "userName";
    private DBService DBService;
    public StatusRestService(DBService DBService) {
        this.DBService = DBService;
    }

    @GET
    @Path("{key}")
    public Response getStatus(@PathParam("key") int id) throws JSONException {
        org.sap.model.ao.Status workEntity = DBService.getStatus(id);

        if (workEntity!=null) {
            Status workXML = new Status(workEntity);
            DBService.getStatus(id);
            return Response.ok(workXML).build();
        } else {
            JSONObject result = getErrorJSONObject();
            result.put(ID, NAN);
            return Response.ok(result.toString()).build();
        }
    }

    @PUT
    @Path("{key}")
    public Response updateStatus(@PathParam("key") int id, Map work) throws JSONException {
        JSONObject result = new JSONObject();
        result.put(ID, NAN);
        if (work!=null) {
            Status workXML = new Status(work);
            org.sap.model.ao.Status workEntity = DBService.editStatus(id, workXML);
            if (workEntity!=null) {
                return Response.ok(workXML.updateModel(workEntity)).build();
            } else {
                return Response.ok(result.toString()).build();
            }
        } else {
            return Response.ok(result.toString()).build();
        }
    }


    public Response createStatus(Map status) throws JSONException {
        if (status!=null) {
            Status statusXML = new Status(status);
            org.sap.model.ao.Status addedStatus = DBService.addStatus(statusXML);
            statusXML.setId(addedStatus.getID());
            return Response.ok(statusXML.updateModel(addedStatus)).build();
        } else {
            JSONObject result = getErrorJSONObject();
            result.put(ID, NAN);
            return Response.ok(result.toString()).build();
        }
    }

    @DELETE
    @Path("{key}")
    public Response deleteStatus(@PathParam("key") int id) throws JSONException {
        org.sap.model.ao.Status status = DBService.getStatus(id);

        JSONObject result;
        if (status!=null) {
            result = getSuccessJSONObject();
            if (!DBService.deleteStatus(id)) {
                result = getErrorJSONObject();
                result.put(ID, NAN);
                return Response.ok(result.toString()).build();
            }
            result.put(ID, id);
            return Response.ok(result.toString()).build();
        } else {
            result = getErrorJSONObject();
            result.put(ID, NAN);
            return Response.ok(result.toString()).build();
        }
    }
}