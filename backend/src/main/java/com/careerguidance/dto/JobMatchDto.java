package com.careerguidance.dto;

import java.util.ArrayList;
import java.util.List;

public class JobMatchDto {
    private JobDto job;
    private Double matchScore;
    private List<String> matchedSkills = new ArrayList<>();
    private List<String> missingSkills = new ArrayList<>();
    private String reasoning;
    private Integer rank;
    private boolean saved;
    private boolean applied;
    private String applicationStatus;

    public JobMatchDto() {}

    public JobMatchDto(JobDto job, Double matchScore, List<String> matchedSkills, List<String> missingSkills, String reasoning) {
        this.job = job;
        this.matchScore = matchScore;
        this.matchedSkills = matchedSkills != null ? matchedSkills : new ArrayList<>();
        this.missingSkills = missingSkills != null ? missingSkills : new ArrayList<>();
        this.reasoning = reasoning;
    }

    public JobDto getJob() {
        return job;
    }

    public void setJob(JobDto job) {
        this.job = job;
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

    public Integer getRank() {
        return rank;
    }

    public void setRank(Integer rank) {
        this.rank = rank;
    }

    public boolean isSaved() {
        return saved;
    }

    public void setSaved(boolean saved) {
        this.saved = saved;
    }

    public boolean isApplied() {
        return applied;
    }

    public void setApplied(boolean applied) {
        this.applied = applied;
    }

    public String getApplicationStatus() {
        return applicationStatus;
    }

    public void setApplicationStatus(String applicationStatus) {
        this.applicationStatus = applicationStatus;
    }
}
