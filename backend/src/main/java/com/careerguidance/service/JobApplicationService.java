package com.careerguidance.service;

import com.careerguidance.dto.JobApplicationDto;
import com.careerguidance.dto.request.ApplicationStatusUpdateRequest;
import com.careerguidance.dto.request.JobApplicationRequest;
import java.util.List;

public interface JobApplicationService {

    JobApplicationDto applyToJob(Long userId, Long jobId, JobApplicationRequest request);

    List<JobApplicationDto> getApplicationsForUser(Long userId);

    List<JobApplicationDto> getAllApplications();

    JobApplicationDto getApplicationById(Long currentUserId, boolean isAdmin, Long applicationId);

    JobApplicationDto updateApplicationStatus(Long currentUserId, boolean isAdmin, Long applicationId, ApplicationStatusUpdateRequest request);
}
