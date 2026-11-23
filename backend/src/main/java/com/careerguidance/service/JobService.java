package com.careerguidance.service;

import com.careerguidance.dto.JobDto;
import com.careerguidance.dto.JobMatchDto;
import com.careerguidance.dto.request.JobCreateRequest;
import com.careerguidance.dto.request.JobSearchFilter;
import org.springframework.data.domain.Page;
import java.util.List;

public interface JobService {

    Page<JobDto> searchJobs(JobSearchFilter filter, Long currentUserId);

    JobDto getJobById(Long id, Long currentUserId);

    JobDto createJob(JobCreateRequest request);

    List<JobMatchDto> getJobMatchesForUser(Long userId);
}
