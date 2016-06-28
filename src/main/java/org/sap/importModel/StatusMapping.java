package org.sap.importModel;

import java.util.*;
import java.util.logging.Logger;

/**
 * Created by ngolosin on 12.01.2016.
 */
public class StatusMapping {
    Logger log = Logger.getLogger(StatusMapping.class.getSimpleName());
    class SharedStrings {
        List<String> strings = new LinkedList<String>();
    }

    public int rowCount = 0;
    public int getRowCount() { return this.rowCount; }

    public class Row {
        String jiraStatusName;
        String sapStatusName;

        public boolean equals(Object obj) {
            if (!(obj instanceof Row))
                return false;
            Row row = (Row) obj;
            if (this.jiraStatusName==row.jiraStatusName && this.sapStatusName==row.sapStatusName)
                return true;

            return false;
        }

        public int hashCode() {
            Object[] obj = {this.jiraStatusName, this.sapStatusName};
            return Arrays.hashCode(obj);
        }
    }


    public List<Row> rows = new ArrayList<Row>();
    public List<Row> getRows() {
        return this.rows;
    }

    public static Map getEmptyRowMap() {
        return new HashMap() {{
            put("rowCount", 0);
        }};
    }

    public Map rowMap = StatusMapping.getEmptyRowMap();

    @Override
    public String toString() {
        System.out.printf("StatusMapping contains %d rows\n", this.rowCount);
        System.out.printf("Header\t", this.rowCount);
        if (this.rows.size()>0) {
            for (int i = 0; i < this.rowCount-1; i++) {
                StatusMapping.Row row = this.rows.get(i);
                System.out.printf("Row %d\t", i);
                System.out.printf("\tJira Status: %s", row.jiraStatusName);
                System.out.printf(",\tSap Status: %s", row.sapStatusName);
                System.out.printf("\n");
            }
        }
        return "";
    }
}
