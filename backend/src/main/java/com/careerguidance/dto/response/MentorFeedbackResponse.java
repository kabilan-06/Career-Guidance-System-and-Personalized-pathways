package com.careerguidance.dto.response;

import java.time.LocalDateTime;

/**
 * One feedback entry authored by a mentor (assessment or resume review),
 * with the student it was written for.
 */
public record MentorFeedbackResponse(Long id, String type, String studentName, String feedback,
        LocalDateTime createdAt) {
}
