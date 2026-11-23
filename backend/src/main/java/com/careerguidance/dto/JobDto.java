package com.careerguidance.dto;

import com.careerguidance.constant.EmploymentType;
import com.careerguidance.constant.ExperienceLevel;
import com.careerguidance.entity.Job;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

public class JobDto {
    private Long id;
    private Long companyId;
    private String companyName;
    private String companyLogoUrl;
    private String companyLocation;
    private String title;
    private String description;
    private String requirements;
    private String location;
    private EmploymentType employmentType;
    private ExperienceLevel experienceLevel;
    private BigDecimal salaryMin;
    private BigDecimal salaryMax;
    private String currency;
    private Boolean remote;
    private Boolean active;
    private Set<String> skills = new HashSet<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean saved;
    private boolean applied;
    private String applicationStatus;

    public JobDto() {}

    public static JobDto fromEntity(Job job) {
        if (job == null) return null;
        JobDto dto = new JobDto();
        dto.setId(job.getId());
        if (job.getCompany() != null) {
            dto.setCompanyId(job.getCompany().getId());
            dto.setCompanyName(job.getCompany().getName());
            dto.setCompanyLogoUrl(job.getCompany().getLogoUrl());
            dto.setCompanyLocation(job.getCompany().getLocation());
        }
        dto.setTitle(job.getTitle());
        dto.setDescription(job.getDescription());
        dto.setRequirements(job.getRequirements());
        dto.setLocation(job.getLocation());
        dto.setEmploymentType(job.getEmploymentType());
        dto.setExperienceLevel(job.getExperienceLevel());
        dto.setSalaryMin(job.getSalaryMin());
        dto.setSalaryMax(job.getSalaryMax());
        dto.setCurrency(job.getCurrency());
        dto.setRemote(job.getRemote());
        dto.setActive(job.getActive());
        if (job.getSkills() != null) {
            dto.setSkills(new HashSet<>(job.getSkills()));
        }
        dto.setCreatedAt(job.getCreatedAt());
        dto.setUpdatedAt(job.getUpdatedAt());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Long companyId) {
        this.companyId = companyId;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getCompanyLogoUrl() {
        return companyLogoUrl;
    }

    public void setCompanyLogoUrl(String companyLogoUrl) {
        this.companyLogoUrl = companyLogoUrl;
    }

    public String getCompanyLocation() {
        return companyLocation;
    }

    public void setCompanyLocation(String companyLocation) {
        this.companyLocation = companyLocation;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
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
