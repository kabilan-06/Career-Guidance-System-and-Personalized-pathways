package com.careerguidance.controller;

import com.careerguidance.dto.response.DashboardResponse;
import com.careerguidance.entity.RoleName;
import com.careerguidance.entity.StudentProfile;
import com.careerguidance.repository.AssessmentSessionRepository;
import com.careerguidance.repository.ResumeAnalysisRepository;
import com.careerguidance.repository.ResumeRepository;
import com.careerguidance.repository.StudentProfileRepository;
import com.careerguidance.repository.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {
    private final UserRepository users;
    private final ResumeRepository resumes;
    private final AssessmentSessionRepository sessions;
    private final ResumeAnalysisRepository analyses;
    private final StudentProfileRepository profiles;

    public AdminDashboardController(UserRepository users, ResumeRepository resumes,
                                    AssessmentSessionRepository sessions, ResumeAnalysisRepository analyses,
                                    StudentProfileRepository profiles) {
        this.users = users;
        this.resumes = resumes;
        this.sessions = sessions;
        this.analyses = analyses;
        this.profiles = profiles;
    }

    @GetMapping
    public DashboardResponse dashboard() {
        var allAnalyses = analyses.findAll();
        double averageResumeScore = allAnalyses.stream()
                .mapToDouble(analysis -> analysis.getResumeScore() == null ? 0 : analysis.getResumeScore())
                .average().orElse(0);
        double averageAtsScore = allAnalyses.stream()
                .mapToDouble(analysis -> analysis.getAtsScore() == null ? 0 : analysis.getAtsScore())
                .average().orElse(0);
        long activeUsers = users.findAll().stream().filter(user -> Boolean.TRUE.equals(user.getActive())).count();

        return new DashboardResponse(users.count(), users.countByRoles_Name(RoleName.STUDENT),
                users.countByRoles_Name(RoleName.MENTOR), users.countByRoles_Name(RoleName.ADMIN),
                resumes.count(), sessions.count(), averageResumeScore, averageAtsScore, activeUsers);
    }

    /**
     * Real chart series for the admin dashboard: account registrations per month,
     * submitted assessments per month (last 6 months), and career-goal distribution
     * across student profiles.
     */
    @GetMapping("/series")
    public Map<String, Object> series() {
        List<YearMonth> months = new ArrayList<>();
        YearMonth current = YearMonth.now();
        for (int i = 5; i >= 0; i--) {
            months.add(current.minusMonths(i));
        }

        Map<YearMonth, Long> regByMonth = users.findAll().stream()
                .filter(u -> u.getCreatedAt() != null)
                .collect(Collectors.groupingBy(u -> YearMonth.from(u.getCreatedAt()), Collectors.counting()));
        Map<YearMonth, Long> compByMonth = sessions.findAll().stream()
                .filter(s -> s.getCompletedAt() != null)
                .collect(Collectors.groupingBy(s -> YearMonth.from(s.getCompletedAt()), Collectors.counting()));

        List<Map<String, Object>> registrations = new ArrayList<>();
        List<Map<String, Object>> completions = new ArrayList<>();
        for (YearMonth m : months) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("m", m.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
            r.put("n", regByMonth.getOrDefault(m, 0L));
            registrations.add(r);
            Map<String, Object> c = new LinkedHashMap<>();
            c.put("m", m.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
            c.put("n", compByMonth.getOrDefault(m, 0L));
            completions.add(c);
        }

        Map<String, Long> goals = profiles.findAll().stream()
                .map(StudentProfile::getCareerGoal)
                .filter(goal -> goal != null && !goal.isBlank())
                .collect(Collectors.groupingBy(String::trim, Collectors.counting()));
        long totalGoals = goals.values().stream().mapToLong(Long::longValue).sum();
        List<Map<String, Object>> domains = goals.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(6)
                .map(e -> {
                    Map<String, Object> d = new LinkedHashMap<>();
                    d.put("name", e.getKey());
                    d.put("value", totalGoals == 0 ? 0L : Math.round(e.getValue() * 100.0 / totalGoals));
                    return d;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("registrations", registrations);
        result.put("completions", completions);
        result.put("domains", domains);
        return result;
    }
}
