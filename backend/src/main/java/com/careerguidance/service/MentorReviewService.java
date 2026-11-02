package com.careerguidance.service;

import com.careerguidance.constant.ResumeReviewStatus;
import com.careerguidance.dto.request.*;
import com.careerguidance.dto.response.*;
import com.careerguidance.entity.*;
import com.careerguidance.exception.*;
import com.careerguidance.repository.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class MentorReviewService {
    private final MentorAccessService access;
    private final MentorStudentRepository assignments;
    private final StudentProfileRepository profiles;
    private final ResumeRepository resumes;
    private final ResumeAnalysisRepository analysis;
    private final ResumeSkillRepository skills;
    private final AssessmentResultRepository assessments;
    private final MentorFeedbackRepository mentorFeedback;
    private final ResumeFeedbackRepository resumeFeedback;

    public MentorReviewService(MentorAccessService a, MentorStudentRepository ms, StudentProfileRepository p,
            ResumeRepository r, ResumeAnalysisRepository ra, ResumeSkillRepository s, AssessmentResultRepository ar,
            MentorFeedbackRepository mf, ResumeFeedbackRepository rf) {
        access = a;
        assignments = ms;
        profiles = p;
        resumes = r;
        analysis = ra;
        skills = s;
        assessments = ar;
        mentorFeedback = mf;
        resumeFeedback = rf;
    }

    public Page<AssignedStudentResponse> students(org.springframework.security.core.Authentication auth,
            Pageable page) {
        Mentor m = access.current(auth);
        List<AssignedStudentResponse> all = assignments.findByMentorId(m.getId()).stream()
                .map(x -> student(x.getStudent())).toList();
        int from = (int) Math.min(page.getOffset(), all.size()), to = Math.min(from + page.getPageSize(), all.size());
        return new PageImpl<>(all.subList(from, to), page, all.size());
    }

    public AssignedStudentResponse student(org.springframework.security.core.Authentication auth, Long id) {
        Mentor m = access.current(auth);
        access.assigned(m, id);
        return studentUser(id);
    }

    private AssignedStudentResponse student(User u) {
        StudentProfile p = profiles.findByUserId(u.getId()).orElse(null);
        return new AssignedStudentResponse(u.getId(), u.getFirstName(), u.getLastName(), u.getEmail(),
                p == null ? u.getCollegeName() : p.getCollegeName(), p == null ? u.getCgpa() : p.getCgpa(),
                completion(p), p == null ? null : p.getCareerGoal());
    }

    private AssignedStudentResponse studentUser(Long id) {
        return student(profiles.findByUserId(id).map(StudentProfile::getUser)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found")));
    }

    private int completion(StudentProfile p) {
        if (p == null)
            return 0;
        int n = 0;
        if (p.getCollegeName() != null)
            n++;
        if (p.getDegree() != null)
            n++;
        if (p.getCgpa() != null)
            n++;
        if (!p.getSkills().isEmpty())
            n++;
        if (!p.getInterests().isEmpty())
            n++;
        if (p.getCareerGoal() != null)
            n++;
        return n * 100 / 6;
    }

    public AssessmentReviewResponse assessment(org.springframework.security.core.Authentication auth, Long id) {
        Mentor m = access.current(auth);
        access.assigned(m, id);
        AssessmentResult a = assessments.findBySessionUserIdOrderByCreatedAtDesc(id).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found"));
        // Entity scores are 1–5 Likert averages; expose them to the mentor UI as 0–100 percentages.
        return new AssessmentReviewResponse(a.getId(), percent(a.getTechnicalScore()), percent(a.getAptitudeScore()),
                percent(a.getInterestScore()), percent(a.getPersonalityScore()), percent(a.getOverallScore()),
                a.getPersonalityType(), a.getRecommendedCategory(), a.getSession().getCompletedAt());
    }

    public ResumeReviewResponse resume(org.springframework.security.core.Authentication auth, Long id) {
        Mentor m = access.current(auth);
        access.assigned(m, id);
        return resumeFor(id);
    }

    private ResumeReviewResponse resumeFor(Long studentId) {
        Resume r = resumes.findFirstByUserIdOrderByUploadTimeDesc(studentId)
                .orElseThrow(() -> new ResumeNotFoundException("Resume not found"));
        ResumeAnalysis a = analysis.findByResumeId(r.getId()).orElse(null);
        return new ResumeReviewResponse(r.getId(), r.getOriginalFileName(), r.getFileType(), r.getFileSize(),
                r.getReviewStatus().name(), a == null ? null : a.getResumeScore(), a == null ? null : a.getAtsScore(),
                skills.findByResumeId(r.getId()).stream().map(x -> x.getSkillName()).toList(), r.getUploadTime());
    }

    @Transactional
    public void assessmentFeedback(org.springframework.security.core.Authentication auth, Long id,
            AssessmentFeedbackRequest req) {
        Mentor m = access.current(auth);
        access.assigned(m, id);
        MentorFeedback f = new MentorFeedback();
        f.setMentor(m);
        f.setStudent(profiles.findByUserId(id).orElseThrow(() -> new ResourceNotFoundException("Student not found"))
                .getUser());
        f.setFeedbackType("ASSESSMENT");
        f.setFeedback(req.feedback());
        mentorFeedback.save(f);
    }

    @Transactional
    public void resumeFeedback(org.springframework.security.core.Authentication auth, Long id,
            ResumeFeedbackRequest req) {
        Mentor m = access.current(auth);
        access.assigned(m, id);
        Resume r = resumes.findFirstByUserIdOrderByUploadTimeDesc(id)
                .orElseThrow(() -> new ResumeNotFoundException("Resume not found"));
        ResumeFeedback f = new ResumeFeedback();
        f.setMentor(m);
        f.setResume(r);
        f.setFeedback(req.feedback());
        resumeFeedback.save(f);
    }

    @Transactional
    public void review(org.springframework.security.core.Authentication auth, Long id, ResumeReviewStatus status,
            String comment) {
        Mentor m = access.current(auth);
        access.assigned(m, id);
        Resume r = resumes.findFirstByUserIdOrderByUploadTimeDesc(id)
                .orElseThrow(() -> new ResumeNotFoundException("Resume not found"));
        r.setReviewStatus(status);
        if (comment != null && !comment.isBlank()) {
            ResumeFeedback f = new ResumeFeedback();
            f.setMentor(m);
            f.setResume(r);
            f.setFeedback(comment);
            resumeFeedback.save(f);
        }
    }

    public MentorDashboardResponse dashboard(org.springframework.security.core.Authentication auth) {
        Mentor m = access.current(auth);
        List<Long> ids = assignments.findByMentorId(m.getId()).stream().map(x -> x.getStudent().getId()).toList();
        List<ResumeReviewResponse> rs = ids.stream().map(i -> {
            try {
                return resumeFor(i);
            } catch (ResumeNotFoundException e) {
                return null;
            }
        }).filter(Objects::nonNull).toList();
        List<Double> as = ids.stream()
                .flatMap(i -> assessments.findBySessionUserIdOrderByCreatedAtDesc(i).stream().limit(1))
                .map(r -> percent(r.getOverallScore())).toList();
        return new MentorDashboardResponse(ids.size(),
                rs.stream().filter(r -> r.reviewStatus().equals("PENDING")).count(),
                rs.stream().filter(r -> !r.reviewStatus().equals("PENDING")).count(),
                avg(rs.stream().map(ResumeReviewResponse::resumeScore).toList()), avg(as));
    }

    private Double percent(Double score) {
        return score == null ? null : Math.round(score * 20.0 * 100.0) / 100.0;
    }

    /** Full feedback history (assessment + resume) authored by the authenticated mentor. */
    public java.util.List<com.careerguidance.dto.response.MentorFeedbackResponse> feedback(
            org.springframework.security.core.Authentication auth) {
        Mentor m = access.current(auth);
        java.util.List<com.careerguidance.dto.response.MentorFeedbackResponse> items = new java.util.ArrayList<>();
        for (MentorFeedback f : mentorFeedback.findByMentorIdOrderByCreatedAtDesc(m.getId())) {
            User student = f.getStudent();
            items.add(new com.careerguidance.dto.response.MentorFeedbackResponse(f.getId(), f.getFeedbackType(),
                    student == null ? null : (student.getFirstName() + " " + student.getLastName()).trim(),
                    f.getFeedback(), f.getCreatedAt()));
        }
        for (ResumeFeedback f : resumeFeedback.findByMentorIdOrderByCreatedAtDesc(m.getId())) {
            User student = f.getResume() == null ? null : f.getResume().getUser();
            items.add(new com.careerguidance.dto.response.MentorFeedbackResponse(f.getId(), "RESUME",
                    student == null ? null : (student.getFirstName() + " " + student.getLastName()).trim(),
                    f.getFeedback(), f.getCreatedAt()));
        }
        items.sort(java.util.Comparator.comparing(
                com.careerguidance.dto.response.MentorFeedbackResponse::createdAt,
                java.util.Comparator.nullsLast(java.util.Comparator.<java.time.LocalDateTime>reverseOrder())));
        return items;
    }

    private Double avg(List<Double> v) {
        return v.stream().filter(Objects::nonNull).mapToDouble(Double::doubleValue).average().isPresent()
                ? v.stream().filter(Objects::nonNull).mapToDouble(Double::doubleValue).average().getAsDouble()
                : null;
    }
}
