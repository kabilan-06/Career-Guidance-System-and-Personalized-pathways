package com.careerguidance.controller;

import com.careerguidance.dto.response.MentorFeedbackResponse;
import com.careerguidance.service.MentorReviewService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Read-only feedback history for the authenticated mentor.
 * Feedback itself is written through the per-student review endpoints
 * (/api/mentor/students/{id}/assessment-feedback and .../resume-feedback).
 */
@RestController
@RequestMapping("/api/mentor/feedback")
@PreAuthorize("hasRole('MENTOR')")
public class MentorFeedbackController {

    private final MentorReviewService service;

    public MentorFeedbackController(MentorReviewService service) {
        this.service = service;
    }

    @GetMapping
    public List<MentorFeedbackResponse> history(Authentication authentication) {
        return service.feedback(authentication);
    }
}
