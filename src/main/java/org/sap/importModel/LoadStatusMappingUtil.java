package org.sap.importModel;

import com.google.gson.Gson;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xml.sax.SAXException;
import org.xml.sax.helpers.DefaultHandler;

import javax.xml.parsers.ParserConfigurationException;
import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;
import java.io.*;
import java.util.Objects;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Created by ngolosin on 08.01.2016.
 */
public class LoadStatusMappingUtil {
    protected final Logger log = LoggerFactory.getLogger(LoadStatusMappingUtil.class);
    static class BreakParsingException extends SAXException {}

    private StatusMapping getNewStatusMapping() {
        return new StatusMapping();
    }

    private StatusMapping parseStatusMapping(InputStream in, String type) {
        Gson gson = new Gson();

        BufferedReader br = new BufferedReader(new InputStreamReader(in));
        //convert the json string back to object
        StatusMapping statusMaping = gson.fromJson(br, StatusMapping.class);

        System.out.println(statusMaping);

        return statusMaping;
    }

    public static StatusMapping getStatusMapping(File file) {
        LoadStatusMappingUtil util = new LoadStatusMappingUtil();
        StatusMapping statusMapping = null;

        try(FileInputStream fis = new FileInputStream(file)) {
            statusMapping = util.parseStatusMapping(fis, "");
        } catch (FileNotFoundException e) {
            System.out.println(e);
            e.printStackTrace();
        } catch (IOException e) {
            System.out.println(e);
            e.printStackTrace();
        }

        return statusMapping;
    }

    public static void main(String[] args) throws IOException {
        class Person {
            private final String name;
            public Person(String name) {
                this.name = Objects.requireNonNull(name);
            }

            @Override
            public boolean equals(Object o) {
                if (o==null || getClass()!=o.getClass()) return false;
                Person person = (Person)o;
                return name.equalsIgnoreCase(person.name);
            }
            @Override
            public int hashCode() {
                return name.hashCode();
            }
        }

        String fileName = "C:\\projects\\jira\\olya\\1.1\\NL2.xlsx";
        StatusMapping statusMapping = LoadStatusMappingUtil.getStatusMapping(new File(fileName));

        System.out.printf("StatusMapping: %s", statusMapping.getRows().get(1).toString());
    }
}
