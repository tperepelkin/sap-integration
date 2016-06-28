package org.sap.model.ao;

import net.java.ao.Entity;
import net.java.ao.Preload;

/**
 * Created by ngolosin on 06.01.2016.
 */
@Preload
public interface Status extends Entity {
    public String getJiraStatusName();
    public void setJiraStatusName(String statusName);

    public String getSapStatusName();
    public void setSapStatusName(String statusName);
}
