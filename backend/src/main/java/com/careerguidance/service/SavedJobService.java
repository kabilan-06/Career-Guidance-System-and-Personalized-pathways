package com.careerguidance.service;

import com.careerguidance.dto.SavedJobDto;
import java.util.List;

public interface SavedJobService {

    SavedJobDto saveJob(Long userId, Long jobId);

    void unsaveJob(Long userId, Long jobId);

    List<SavedJobDto> getSavedJobs(Long userId);

    boolean isJobSaved(Long userId, Long jobId);
}
