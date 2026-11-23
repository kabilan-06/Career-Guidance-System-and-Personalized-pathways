package com.careerguidance.dto.request;

public class SaveJobRequest {
    private Long jobId;

    public SaveJobRequest() {}

    public SaveJobRequest(Long jobId) {
        this.jobId = jobId;
    }

    public Long getJobId() {
        return jobId;
    }

    public void setJobId(Long jobId) {
        this.jobId = jobId;
    }
}
