package com.careerguidance.dto.request;

public class JobApplicationRequest {

    private Long resumeId;
    private String coverLetter;

    public JobApplicationRequest() {}

    public JobApplicationRequest(Long resumeId, String coverLetter) {
        this.resumeId = resumeId;
        this.coverLetter = coverLetter;
    }

    public Long getResumeId() {
        return resumeId;
    }

    public void setResumeId(Long resumeId) {
        this.resumeId = resumeId;
    }

    public String getCoverLetter() {
        return coverLetter;
    }

    public void setCoverLetter(String coverLetter) {
        this.coverLetter = coverLetter;
    }
}
