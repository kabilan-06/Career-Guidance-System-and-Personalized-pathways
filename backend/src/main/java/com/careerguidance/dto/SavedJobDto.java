package com.careerguidance.dto;

import com.careerguidance.entity.SavedJob;
import java.time.LocalDateTime;

public class SavedJobDto {
    private Long id;
    private Long userId;
    private Long jobId;
    private JobDto job;
    private LocalDateTime createdAt;

    public SavedJobDto() {}

    public static SavedJobDto fromEntity(SavedJob savedJob) {
        if (savedJob == null) return null;
        SavedJobDto dto = new SavedJobDto();
        dto.setId(savedJob.getId());
        if (savedJob.getUser() != null) {
            dto.setUserId(savedJob.getUser().getId());
        }
        if (savedJob.getJob() != null) {
            dto.setJobId(savedJob.getJob().getId());
            dto.setJob(JobDto.fromEntity(savedJob.getJob()));
        }
        dto.setCreatedAt(savedJob.getCreatedAt());
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
