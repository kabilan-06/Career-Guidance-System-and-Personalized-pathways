package com.careerguidance.dto.request;

import com.careerguidance.constant.EmploymentType;
import com.careerguidance.constant.ExperienceLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

public class JobCreateRequest {

    @NotNull(message = "Company ID is required")
    private Long companyId;

    @NotBlank(message = "Job title is required")
    private String title;

    @NotBlank(message = "Job description is required")
    private String description;

    private String requirements;

    private String location;

    private EmploymentType employmentType = EmploymentType.FULL_TIME;

    private ExperienceLevel experienceLevel = ExperienceLevel.ENTRY_LEVEL;

    private BigDecimal salaryMin;

    private BigDecimal salaryMax;

    private String currency = "USD";

    private Boolean remote = false;

    private Boolean active = true;

    private Set<String> skills = new HashSet<>();

    public JobCreateRequest() {}

    public Long getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Long companyId) {
        this.companyId = companyId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRequirements() {
        return requirements;
    }

    public void setRequirements(String requirements) {
        this.requirements = requirements;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
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

    public BigDecimal getSalaryMin() {
        return salaryMin;
    }

    public void setSalaryMin(BigDecimal salaryMin) {
        this.salaryMin = salaryMin;
    }

    public BigDecimal getSalaryMax() {
        return salaryMax;
    }

    public void setSalaryMax(BigDecimal salaryMax) {
        this.salaryMax = salaryMax;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public Boolean getRemote() {
        return remote;
    }

    public void setRemote(Boolean remote) {
        this.remote = remote;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public Set<String> getSkills() {
        return skills;
    }

    public void setSkills(Set<String> skills) {
        this.skills = skills;
    }
}
