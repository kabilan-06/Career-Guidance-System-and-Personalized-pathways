package com.careerguidance.service.impl;

import com.careerguidance.dto.SavedJobDto;
import com.careerguidance.entity.Job;
import com.careerguidance.entity.SavedJob;
import com.careerguidance.entity.User;
import com.careerguidance.exception.ResourceNotFoundException;
import com.careerguidance.repository.JobRepository;
import com.careerguidance.repository.SavedJobRepository;
import com.careerguidance.repository.UserRepository;
import com.careerguidance.service.SavedJobService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class SavedJobServiceImpl implements SavedJobService {

    private final SavedJobRepository savedJobRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;

    public SavedJobServiceImpl(SavedJobRepository savedJobRepository,
                               JobRepository jobRepository,
                               UserRepository userRepository) {
        this.savedJobRepository = savedJobRepository;
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
    }

    @Override
    public SavedJobDto saveJob(Long userId, Long jobId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job opening not found with id: " + jobId));

        Optional<SavedJob> existing = savedJobRepository.findByUserIdAndJobId(userId, jobId);
        if (existing.isPresent()) {
            return SavedJobDto.fromEntity(existing.get());
        }

        SavedJob savedJob = new SavedJob(user, job);
        SavedJob saved = savedJobRepository.save(savedJob);
        return SavedJobDto.fromEntity(saved);
    }

    @Override
    public void unsaveJob(Long userId, Long jobId) {
        savedJobRepository.findByUserIdAndJobId(userId, jobId)
                .ifPresent(savedJobRepository::delete);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SavedJobDto> getSavedJobs(Long userId) {
        return savedJobRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(SavedJobDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isJobSaved(Long userId, Long jobId) {
        return savedJobRepository.existsByUserIdAndJobId(userId, jobId);
    }
}
