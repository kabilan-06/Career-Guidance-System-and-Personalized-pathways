package com.careerguidance.controller;

import com.careerguidance.dto.JobApplicationDto;
import com.careerguidance.dto.request.ApplicationStatusUpdateRequest;
import com.careerguidance.dto.request.JobApplicationRequest;
import com.careerguidance.security.UserDetailsImpl;
import com.careerguidance.service.JobApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/jobs")
@PreAuthorize("isAuthenticated()")
public class JobApplicationController {

    private final JobApplicationService jobApplicationService;

    public JobApplicationController(JobApplicationService jobApplicationService) {
        this.jobApplicationService = jobApplicationService;
    }

    @GetMapping("/applications")
    public ResponseEntity<List<JobApplicationDto>> getApplications(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            return ResponseEntity.ok(jobApplicationService.getAllApplications());
        } else {
            return ResponseEntity.ok(jobApplicationService.getApplicationsForUser(userDetails.getId()));
        }
    }

    @PostMapping("/{id}/apply")
    public ResponseEntity<JobApplicationDto> applyToJob(
            @PathVariable Long id,
            @RequestBody(required = false) JobApplicationRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(jobApplicationService.applyToJob(userDetails.getId(), id, request));
    }

    @GetMapping("/applications/{id}")
    public ResponseEntity<JobApplicationDto> getApplicationById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        return ResponseEntity.ok(jobApplicationService.getApplicationById(userDetails.getId(), isAdmin, id));
    }

    @PatchMapping("/applications/{id}/status")
    public ResponseEntity<JobApplicationDto> updateApplicationStatus(
            @PathVariable Long id,
            @Valid @RequestBody ApplicationStatusUpdateRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        return ResponseEntity.ok(jobApplicationService.updateApplicationStatus(userDetails.getId(), isAdmin, id, request));
    }
}
