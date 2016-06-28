package org.sap.model;

import org.sap.model.xml.Status;
import org.sap.model.xml.PhaseTemplate;

import javax.xml.bind.annotation.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@XmlRootElement
@XmlAccessorType(XmlAccessType.FIELD)
public class ModelUtils {
    public static final String JIRA_ISSUE_STATUS_NAME = "gipOfProject";
    public static final String SAP_DOCUMENT_STATUS_NAME = "program";
    public static final String PROJECT = "project";
    public static final String STAGE = "stage";
    public static final String CODE_ISR = "codeISR";
    public static final String SYSTEM = "system";
    public static final String SUBJECT = "subject";
    public static final String KIND_OF_PIR = "kindOfPir";
    public static final String MARK = "mark";
    public static final String VOLUME = "volume";
    public static final String REVISION = "revision";
    public static final String BUDGETED_COST = "budgetedCost";
    public static final String ACTUAL_COST = "actualCost";
    public static final String LOCKED_BY = "lockedBy";
    public static final String ID = "id";
    public static final String NAN = "NaN";

    public static List<Status> getWorkModelList(List<org.sap.model.ao.Status> statuses) {
        List<Status> statusModels;
        if (statuses.size() == 0) {
            statusModels = new ArrayList<Status>();
        } else {
            statusModels = statuses.stream().map(status -> new Status(status)).collect(Collectors.toList());
        }
        return statusModels;
    }

    public static boolean isNotNullNotEmptyString(String str) {
        if (str!=null)
            if (!str.isEmpty())
                return true;
        return false;
    }

    public static Integer getIntegerFromString(String item) {
//        Integer num = new Integer(0);
        Integer num = null;
        if (isNotNullNotEmptyString(item)) {
            try {
                num = Integer.parseInt(item);
                return num;
            } catch (NumberFormatException e) { }
        }
        return num;
    }

    public static float getFloatFromString(String item, int precision) {
        if (isNotNullNotEmptyString(item))
            return new BigDecimal(item).setScale(precision, BigDecimal.ROUND_CEILING).floatValue();
        return new Float(0).floatValue();
    }
    public static String getFloatStringFromString(String item) {
        if (isNotNullNotEmptyString(item))
            return item;
        return new Float(0).toString();
    }
    public static String getFloatStringFromString(String item, int precision) {
        if (isNotNullNotEmptyString(item))
            return new BigDecimal(item).setScale(precision, BigDecimal.ROUND_CEILING).toString();
        return new Float(0).toString();
    }
}