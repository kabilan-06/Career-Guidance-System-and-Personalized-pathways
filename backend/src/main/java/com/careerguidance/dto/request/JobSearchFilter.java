package com.careerguidance.dto.request;

import com.careerguidance.constant.EmploymentType;
import com.careerguidance.constant.ExperienceLevel;

public class JobSearchFilter {

    private String keyword;
    private String location;
    private Boolean remote;
    private EmploymentType employmentType;
    private ExperienceLevel experienceLevel;
    private Boolean active = true;
    private int page = 0;
    private int size = 10;
    private String sortBy = "createdAt";
    private String sortDirection = "DESC";

    public JobSearchFilter() {}

    public String getKeyword() {
        return keyword;
    }

    public void setKeyword(String keyword) {
        this.keyword = keyword;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Boolean getRemote() {
        return remote;
    }

    public void setRemote(Boolean remote) {
        this.remote = remote;
    }

    public EmploymentType getEmploymentType() {
        return employmentType;
    }

    public void setEmploymentType(EmploymentType employmentType) {
        this.employmentType = employmentType;
    }

    public ExperienceLevel getExperienceLevel() {
        return experienceLevel;
    }

    public void setExperienceLevel(ExperienceLevel experienceLevel) {
        this.experienceLevel = experienceLevel;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = Math.max(0, page);
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size > 0 ? size : 10;
    }

    public String getSortBy() {
        return sortBy;
    }

    public void setSortBy(String sortBy) {
        this.sortBy = sortBy != null && !sortBy.isBlank() ? sortBy : "createdAt";
    }

    public String getSortDirection() {
        return sortDirection;
    }

    public void setSortDirection(String sortDirection) {
        this.sortDirection = sortDirection != null && sortDirection.equalsIgnoreCase("ASC") ? "ASC" : "DESC";
    }
}
