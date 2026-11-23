package com.careerguidance.controller;

import com.careerguidance.dto.JobDto;
import com.careerguidance.dto.JobMatchDto;
import com.careerguidance.dto.request.JobCreateRequest;
import com.careerguidance.dto.request.JobSearchFilter;
import com.careerguidance.security.UserDetailsImpl;
import com.careerguidance.service.JobService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobService jobService;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    @GetMapping
    public ResponseEntity<Page<JobDto>> searchJobs(
            @ModelAttribute JobSearchFilter filter,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        Long currentUserId = userDetails != null ? userDetails.getId() : null;
        return ResponseEntity.ok(jobService.searchJobs(filter, currentUserId));
    }

    @GetMapping("/matches")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<JobMatchDto>> getJobMatches(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        return ResponseEntity.ok(jobService.getJobMatchesForUser(userDetails.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobDto> getJobById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        Long currentUserId = userDetails != null ? userDetails.getId() : null;
        return ResponseEntity.ok(jobService.getJobById(id, currentUserId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<JobDto> createJob(@Valid @RequestBody JobCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(jobService.createJob(request));
    }
}
