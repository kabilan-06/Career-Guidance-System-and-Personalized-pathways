package com.careerguidance.controller;

import com.careerguidance.dto.SavedJobDto;
import com.careerguidance.security.UserDetailsImpl;
import com.careerguidance.service.SavedJobService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/jobs")
@PreAuthorize("isAuthenticated()")
public class SavedJobController {

    private final SavedJobService savedJobService;

    public SavedJobController(SavedJobService savedJobService) {
        this.savedJobService = savedJobService;
    }

    @GetMapping("/saved")
    public ResponseEntity<List<SavedJobDto>> getSavedJobs(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        return ResponseEntity.ok(savedJobService.getSavedJobs(userDetails.getId()));
    }

    @PostMapping("/{id}/save")
    public ResponseEntity<SavedJobDto> saveJob(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(savedJobService.saveJob(userDetails.getId(), id));
    }

    @DeleteMapping("/{id}/save")
    public ResponseEntity<Map<String, Object>> unsaveJob(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        savedJobService.unsaveJob(userDetails.getId(), id);
        return ResponseEntity.ok(Map.of(
                "message", "Job position removed from saved list successfully.",
                "jobId", id
        ));
    }
}
