package com.careerguidance.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public class JobMatchAIResponse {

    @JsonProperty("match_score")
    private Double matchScore;

    @JsonProperty("matched_skills")
    private List<String> matchedSkills = new ArrayList<>();

    @JsonProperty("missing_skills")
    private List<String> missingSkills = new ArrayList<>();

    private String reasoning;

    public JobMatchAIResponse() {}

    public JobMatchAIResponse(Double matchScore, List<String> matchedSkills, List<String> missingSkills, String reasoning) {
        this.matchScore = matchScore;
        this.matchedSkills = matchedSkills != null ? matchedSkills : new ArrayList<>();
        this.missingSkills = missingSkills != null ? missingSkills : new ArrayList<>();
        this.reasoning = reasoning;
    }

    public Double getMatchScore() {
        return matchScore;
    }

    public void setMatchScore(Double matchScore) {
        this.matchScore = matchScore;
    }

    public List<String> getMatchedSkills() {
        return matchedSkills;
    }

    public void setMatchedSkills(List<String> matchedSkills) {
        this.matchedSkills = matchedSkills;
    }

    public List<String> getMissingSkills() {
        return missingSkills;
    }

    public void setMissingSkills(List<String> missingSkills) {
        this.missingSkills = missingSkills;
    }

    public String getReasoning() {
        return reasoning;
    }

    public void setReasoning(String reasoning) {
        this.reasoning = reasoning;
    }
}
