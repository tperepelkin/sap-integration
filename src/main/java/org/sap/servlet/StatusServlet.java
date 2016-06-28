package org.sap.servlet;

import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.jira.component.ComponentAccessor;
import com.atlassian.jira.config.properties.APKeys;
import com.atlassian.jira.config.properties.ApplicationProperties;
import com.atlassian.jira.user.ApplicationUser;
import com.atlassian.jira.util.I18nHelper;
import com.atlassian.jira.util.VelocityParamFactory;
import com.atlassian.soy.renderer.SoyTemplateRenderer;
import com.atlassian.velocity.VelocityManager;
import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.FileUploadException;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;
import org.sap.importModel.LoadStatusMappingUtil;
import org.sap.importModel.StatusMapping;
import org.sap.model.ModelUtils;
import org.sap.model.ao.Status;
import org.sap.service.DBService;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.text.SimpleDateFormat;
import java.util.*;

import static org.sap.model.ModelUtils.*;


/**
 * Created by ngolosin on 10.01.2016.
 */
public class StatusServlet extends HttpServlet {
    Logger log = Logger.getLogger(StatusServlet.class);

    private final ActiveObjects activeObjects;
    private final SoyTemplateRenderer soyTemplateRenderer;
    private final DBService DBService;

    private final ApplicationProperties ap = ComponentAccessor.getApplicationProperties();
    private final String baseUrl = ap.getString(APKeys.JIRA_BASEURL);
    private final String webworkEncoding = ap.getString(APKeys.JIRA_WEBWORK_ENCODING);
    private final VelocityParamFactory vp = ComponentAccessor.getVelocityParamFactory();
    private final VelocityManager vm = ComponentAccessor.getVelocityManager();

    private StatusMapping statusMapping = null;

    public StatusServlet(DBService DBService, SoyTemplateRenderer soyTemplateRenderer, ActiveObjects activeObjects) {
        this.soyTemplateRenderer = soyTemplateRenderer;
        this.activeObjects = activeObjects;
        this.DBService = DBService;
    }

    protected static final String tmpPath = System.getProperty("java.io.tmpdir");
    protected static final SimpleDateFormat fmt = new SimpleDateFormat("dd.MM.yyyy");

    @Override
    public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
        File file = null;
        try {
            File tmpDir = new File(tmpPath);
            DiskFileItemFactory fileItemFactory = new DiskFileItemFactory();
            fileItemFactory.setSizeThreshold(1 * 1024 * 1024); //1 MB
            fileItemFactory.setRepository(tmpDir);
            ServletFileUpload uploadHandler = new ServletFileUpload(fileItemFactory);

            String enc = "UTF-8";
            enc = request.getCharacterEncoding();

            List items = null;
            try {
                items = uploadHandler.parseRequest(request);
            } catch (FileUploadException e) {
                e.printStackTrace();
                throw new IOException(e);
            }

            Iterator itr = items.iterator();

            while (itr.hasNext()) {
                FileItem item = (FileItem) itr.next();
                if (item.isFormField()) {
                } else {
                    try {
                        if (StringUtils.isNotEmpty(item.getName())) {
                            File tmpFile = File.createTempFile(item.getName(), ".input.excel.plugin.tmp");
                            tmpFile.deleteOnExit();
                            item.write(tmpFile);
                            this.statusMapping = LoadStatusMappingUtil.getStatusMapping(tmpFile);
                            List<StatusMapping.Row> rows = this.statusMapping.getRows();
                            if (rows.size()>1) {
                                String budgetedCostStr; Integer codeISR, volume, revision;
                                for (int i = 1; i < rows.size(); i++) {
                                    StatusMapping.Row row = rows.get(i);
                                    budgetedCostStr = ModelUtils.getFloatStringFromString(row.cells.get(11).value, 2);
                                    codeISR = ModelUtils.getIntegerFromString(row.cells.get(5).value);
                                    volume = ModelUtils.getIntegerFromString(row.cells.get(9).value);
                                    revision = ModelUtils.getIntegerFromString(row.cells.get(10).value);

                                    Map statusMap = new HashMap();
                                    statusMap.put(JIRA_ISSUE_STATUS_NAME, row.cells.get(0).value);
                                    statusMap.put(SAP_DOCUMENT_STATUS_NAME, row.cells.get(1).value);
                                    org.sap.model.xml.Status status = new org.sap.model.xml.Status(statusMap);
                                    if (!this.DBService.isStatusExist(status))
                                        this.DBService.addStatus(status);
                                }
                            }
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        } catch( Exception e ) {
            PrintWriter writer = response.getWriter();
            writer.flush();
            return;
        }

        response.sendRedirect("viewTable");
    }

    @Override
    public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
        List<Status> works = this.DBService.allStatuses();

        response.setContentType("text/html;charset=utf-8");
        Map context = vp.getDefaultVelocityParams();
        context.put("statusMapping",  this.statusMapping);
        context.put("works",  works);
        ApplicationUser currentUser = ComponentAccessor.getJiraAuthenticationContext().getLoggedInUser();
        I18nHelper i18nHelper = ComponentAccessor.getI18nHelperFactory().getInstance(currentUser);
        context.put("i18n",  i18nHelper);
        String renderedText = vm.getEncodedBody("templates/", "view-works.vm", baseUrl, webworkEncoding, context);
        response.getWriter().write(renderedText);

        System.out.println("Works in database: " + works.size());
        for (Status status: works) {
            log.info("One Work object has been read");
        }
    }

    public String getHtml() {
        Map<String, Object> data = new HashMap<String,Object>();
        data.put("isLocal", true);
        return this.soyTemplateRenderer.render("org.sap.integration:soy-templates", "JIRA.WorkGenerator.Templates.ViewTableWorks", data);
    }
}
