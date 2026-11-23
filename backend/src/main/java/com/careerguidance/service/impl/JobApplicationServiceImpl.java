package com.careerguidance.service.impl;

import com.careerguidance.constant.ApplicationStatus;
import com.careerguidance.dto.JobApplicationDto;
import com.careerguidance.dto.request.ApplicationStatusUpdateRequest;
import com.careerguidance.dto.request.JobApplicationRequest;
import com.careerguidance.entity.Job;
import com.careerguidance.entity.JobApplication;
import com.careerguidance.entity.Resume;
import com.careerguidance.entity.User;
import com.careerguidance.exception.BadRequestException;
import com.careerguidance.exception.ResourceNotFoundException;
import com.careerguidance.exception.UnauthorizedException;
import com.careerguidance.repository.JobApplicationRepository;
import com.careerguidance.repository.JobRepository;
import com.careerguidance.repository.ResumeRepository;
import com.careerguidance.repository.UserRepository;
import com.careerguidance.service.JobApplicationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class JobApplicationServiceImpl implements JobApplicationService {

    private final JobApplicationRepository jobApplicationRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;

    public JobApplicationServiceImpl(JobApplicationRepository jobApplicationRepository,
                                     JobRepository jobRepository,
                                     UserRepository userRepository,
                                     ResumeRepository resumeRepository) {
        this.jobApplicationRepository = jobApplicationRepository;
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.resumeRepository = resumeRepository;
    }

    @Override
    public JobApplicationDto applyToJob(Long userId, Long jobId, JobApplicationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job opening not found with id: " + jobId));

        if (!Boolean.TRUE.equals(job.getActive())) {
            throw new BadRequestException("This job opening is no longer accepting applications.");
        }

        if (jobApplicationRepository.existsByUserIdAndJobId(userId, jobId)) {
            throw new BadRequestException("You have already submitted an application for this position.");
        }

        Resume resume = null;
        if (request != null && request.getResumeId() != null) {
            resume = resumeRepository.findById(request.getResumeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Resume not found with id: " + request.getResumeId()));

            // Strict ownership verification: resume MUST belong to the authenticated user
            if (resume.getUser() == null || !resume.getUser().getId().equals(userId)) {
                throw new UnauthorizedException("Resume does not belong to the authenticated user.");
            }
        } else {
            // Auto-fallback: attach user's latest uploaded resume if available
            resume = resumeRepository.findFirstByUserIdOrderByUploadTimeDesc(userId).orElse(null);
        }

        String coverLetter = request != null ? request.getCoverLetter() : null;

        JobApplication application = new JobApplication(user, job, resume, coverLetter, ApplicationStatus.APPLIED);
        JobApplication saved = jobApplicationRepository.save(application);
        return JobApplicationDto.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobApplicationDto> getApplicationsForUser(Long userId) {
        return jobApplicationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(JobApplicationDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobApplicationDto> getAllApplications() {
        return jobApplicationRepository.findAll()
                .stream()
                .map(JobApplicationDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public JobApplicationDto getApplicationById(Long currentUserId, boolean isAdmin, Long applicationId) {
        JobApplication application = jobApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with id: " + applicationId));

        // Strict ownership check: student may only view their own application
        if (!isAdmin && (application.getUser() == null || !application.getUser().getId().equals(currentUserId))) {
            throw new UnauthorizedException("You are not authorized to view this application.");
        }

        return JobApplicationDto.fromEntity(application);
    }

    @Override
    public JobApplicationDto updateApplicationStatus(Long currentUserId, boolean isAdmin, Long applicationId, ApplicationStatusUpdateRequest request) {
        JobApplication application = jobApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with id: " + applicationId));

        if (!isAdmin) {
            // Student flow
            if (application.getUser() == null || !application.getUser().getId().equals(currentUserId)) {
                throw new UnauthorizedException("You are not authorized to modify another student's application.");
            }

            // Students may only withdraw their own application
            if (request.getStatus() != ApplicationStatus.WITHDRAWN) {
                throw new BadRequestException("Students are only permitted to withdraw their own application.");
            }
        }

        application.setStatus(request.getStatus());
        JobApplication updated = jobApplicationRepository.save(application);
        return JobApplicationDto.fromEntity(updated);
    }
}
