package org.sap.model.xml;

import org.sap.model.ModelUtils;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlRootElement;
import java.util.Map;

/**
 * Created by ngolosin on 18.01.2016.
 */
@XmlRootElement
@XmlAccessorType(XmlAccessType.FIELD)
public class PhaseTemplate {
    private int id;
    public int getId() {
        return this.id;
    }
    public void setId(int id) {
        this.id = id;
    }

    private Integer num;
    public Integer getNum() { return this.num; }

    private String name;
    public String getName() {
        return this.name;
    }

    private String sumPhase;
    public String getSumPhase(){
        return this.sumPhase;
    }

    private Integer progress;
    public Integer getProgress(){
        return this.progress;
    }

    public PhaseTemplate updateModel(org.sap.model.ao.PhaseTemplate phase) {
        this.id = phase.getID();
        this.num = phase.getNum();
        this.name = phase.getName();
        this.sumPhase = phase.getSumPhase();
        this.progress = phase.getProgress();

        return this;
    }

    public PhaseTemplate() { }

    public PhaseTemplate(org.sap.model.ao.PhaseTemplate phaseTemplate) {
        this.id = phaseTemplate.getID();
        this.num = phaseTemplate.getNum();
        this.name = phaseTemplate.getName();
        this.sumPhase = phaseTemplate.getSumPhase();
        this.progress = phaseTemplate.getProgress();
    }

    public PhaseTemplate(Map phase) {
        if (phase.get("id")!=null)
            this.id = Integer.parseInt(phase.get("id").toString());
        if (phase.get("num")!=null)
            this.num = ModelUtils.getIntegerFromString(phase.get("num").toString());
        if (phase.get("name")!=null)
            this.name = (String)phase.get("name");
        if (phase.get("sumPhase")!=null)
            this.sumPhase = (String)phase.get("sumPhase");
        if (phase.get("progress")!=null)
            this.progress = ModelUtils.getIntegerFromString(phase.get("progress").toString());
    }
}