package com.careerguidance.dto;

import com.careerguidance.constant.ApplicationStatus;
import com.careerguidance.entity.JobApplication;
import java.time.LocalDateTime;

public class JobApplicationDto {
    private Long id;
    private Long userId;
    private String candidateName;
    private String candidateEmail;
    private Long jobId;
    private JobDto job;
    private Long resumeId;
    private String resumeFileName;
    private String coverLetter;
    private ApplicationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public JobApplicationDto() {}

    public static JobApplicationDto fromEntity(JobApplication app) {
        if (app == null) return null;
        JobApplicationDto dto = new JobApplicationDto();
        dto.setId(app.getId());
        if (app.getUser() != null) {
            dto.setUserId(app.getUser().getId());
            dto.setCandidateName(app.getUser().getFirstName() + " " + app.getUser().getLastName());
            dto.setCandidateEmail(app.getUser().getEmail());
        }
        if (app.getJob() != null) {
            dto.setJobId(app.getJob().getId());
            dto.setJob(JobDto.fromEntity(app.getJob()));
        }
        if (app.getResume() != null) {
            dto.setResumeId(app.getResume().getId());
            dto.setResumeFileName(app.getResume().getOriginalFileName());
        }
        dto.setCoverLetter(app.getCoverLetter());
        dto.setStatus(app.getStatus());
        dto.setCreatedAt(app.getCreatedAt());
        dto.setUpdatedAt(app.getUpdatedAt());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getCandidateName() {
        return candidateName;
    }

    public void setCandidateName(String candidateName) {
        this.candidateName = candidateName;
    }

    public String getCandidateEmail() {
        return candidateEmail;
    }

    public void setCandidateEmail(String candidateEmail) {
        this.candidateEmail = candidateEmail;
    }

    public Long getJobId() {
        return jobId;
    }

    public void setJobId(Long jobId) {
        this.jobId = jobId;
    }

    public JobDto getJob() {
        return job;
    }

    public void setJob(JobDto job) {
        this.job = job;
    }

    public Long getResumeId() {
        return resumeId;
    }

    public void setResumeId(Long resumeId) {
        this.resumeId = resumeId;
    }

    public String getResumeFileName() {
        return resumeFileName;
    }

    public void setResumeFileName(String resumeFileName) {
        this.resumeFileName = resumeFileName;
    }

    public String getCoverLetter() {
        return coverLetter;
    }

    public void setCoverLetter(String coverLetter) {
        this.coverLetter = coverLetter;
    }

    public ApplicationStatus getStatus() {
        return status;
    }

    public void setStatus(ApplicationStatus status) {
        this.status = status;
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
}
