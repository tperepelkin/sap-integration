package org.sap.rest;

import com.atlassian.jira.util.json.JSONException;
import org.apache.log4j.Logger;

import javax.ws.rs.*;
import javax.ws.rs.core.GenericEntity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.*;


@Path("/users")
@Consumes ({ MediaType.APPLICATION_JSON })
@Produces ({ MediaType.APPLICATION_JSON })
public class UserRestService {
    private static final Logger log = Logger.getLogger(UserRestService.class);

    @GET
    @Path("allUsers")
    public Response getAllUsers() throws JSONException {
        GenericEntity<Set<String>> entities = new GenericEntity<Set<String>>(RestUtils.getAllUsers()) { };
        return Response.ok().entity(entities).build();
    }

    @GET
    @Path("allGroups")
    public Response getAllGroups() throws JSONException {
        GenericEntity<Set<String>> entities = new GenericEntity<Set<String>>(RestUtils.getAllGroups()) { };
        return Response.ok().entity(entities).build();
    }

    @GET
    @Path("components")
    public Response getComponents() throws JSONException {
        GenericEntity<Set<String>> entities = new GenericEntity<Set<String>>(RestUtils.getComponents()) { };
        return Response.ok().entity(entities).build();
    }
}