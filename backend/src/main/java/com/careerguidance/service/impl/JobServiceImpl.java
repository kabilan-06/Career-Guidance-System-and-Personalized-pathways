package com.careerguidance.service.impl;

import com.careerguidance.dto.JobDto;
import com.careerguidance.dto.JobMatchAIResponse;
import com.careerguidance.dto.JobMatchDto;
import com.careerguidance.dto.request.JobCreateRequest;
import com.careerguidance.dto.request.JobSearchFilter;
import com.careerguidance.entity.*;
import com.careerguidance.exception.ResourceNotFoundException;
import com.careerguidance.repository.*;
import com.careerguidance.service.JobService;
import com.careerguidance.service.LocalAIServiceClient;
import com.careerguidance.service.TextExtractionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Path;
import java.util.*;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.util.stream.Collectors;

@Service
@Transactional
public class JobServiceImpl implements JobService {

    private static final Logger logger = LoggerFactory.getLogger(JobServiceImpl.class);

    private final JobRepository jobRepository;
    private final CompanyRepository companyRepository;
    private final SavedJobRepository savedJobRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final ResumeRepository resumeRepository;
    private final ResumeSkillRepository resumeSkillRepository;
    private final LocalAIServiceClient localAIServiceClient;
    private final TextExtractionService textExtractionService;

    public JobServiceImpl(JobRepository jobRepository,
                          CompanyRepository companyRepository,
                          SavedJobRepository savedJobRepository,
                          JobApplicationRepository jobApplicationRepository,
                          ResumeRepository resumeRepository,
                          ResumeSkillRepository resumeSkillRepository,
                          LocalAIServiceClient localAIServiceClient,
                          TextExtractionService textExtractionService) {
        this.jobRepository = jobRepository;
        this.companyRepository = companyRepository;
        this.savedJobRepository = savedJobRepository;
        this.jobApplicationRepository = jobApplicationRepository;
        this.resumeRepository = resumeRepository;
        this.resumeSkillRepository = resumeSkillRepository;
        this.localAIServiceClient = localAIServiceClient;
        this.textExtractionService = textExtractionService;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<JobDto> searchJobs(JobSearchFilter filter, Long currentUserId) {
        Sort sort = Sort.by(Sort.Direction.fromString(filter.getSortDirection()), filter.getSortBy());
        Pageable pageable = PageRequest.of(filter.getPage(), filter.getSize(), sort);

        Specification<Job> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (filter.getActive() != null) {
                predicates.add(cb.equal(root.get("active"), filter.getActive()));
            }
            if (filter.getLocation() != null && !filter.getLocation().trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("location")), "%" + filter.getLocation().trim().toLowerCase() + "%"));
            }
            if (filter.getRemote() != null) {
                predicates.add(cb.equal(root.get("remote"), filter.getRemote()));
            }
            if (filter.getEmploymentType() != null) {
                predicates.add(cb.equal(root.get("employmentType"), filter.getEmploymentType()));
            }
            if (filter.getExperienceLevel() != null) {
                predicates.add(cb.equal(root.get("experienceLevel"), filter.getExperienceLevel()));
            }
            if (filter.getKeyword() != null && !filter.getKeyword().trim().isEmpty()) {
                String kw = "%" + filter.getKeyword().trim().toLowerCase() + "%";
                Join<Job, Company> companyJoin = root.join("company", JoinType.LEFT);
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), kw);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), kw);
                Predicate compMatch = cb.like(cb.lower(companyJoin.get("name")), kw);
                predicates.add(cb.or(titleMatch, descMatch, compMatch));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Job> jobPage = jobRepository.findAll(spec, pageable);

        Set<Long> savedJobIds = Collections.emptySet();
        Map<Long, String> applicationStatusMap = Collections.emptyMap();

        if (currentUserId != null) {
            savedJobIds = savedJobRepository.findByUserIdOrderByCreatedAtDesc(currentUserId)
                    .stream().map(sj -> sj.getJob().getId()).collect(Collectors.toSet());

            applicationStatusMap = jobApplicationRepository.findByUserIdOrderByCreatedAtDesc(currentUserId)
                    .stream().collect(Collectors.toMap(
                            app -> app.getJob().getId(),
                            app -> app.getStatus().name(),
                            (existing, replacement) -> existing
                    ));
        }

        final Set<Long> finalSavedIds = savedJobIds;
        final Map<Long, String> finalAppMap = applicationStatusMap;

        return jobPage.map(job -> {
            JobDto dto = JobDto.fromEntity(job);
            dto.setSaved(finalSavedIds.contains(job.getId()));
            dto.setApplied(finalAppMap.containsKey(job.getId()));
            dto.setApplicationStatus(finalAppMap.get(job.getId()));
            return dto;
        });
    }

    @Override
    @Transactional(readOnly = true)
    public JobDto getJobById(Long id, Long currentUserId) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job opening not found with id: " + id));

        JobDto dto = JobDto.fromEntity(job);
        if (currentUserId != null) {
            dto.setSaved(savedJobRepository.existsByUserIdAndJobId(currentUserId, id));
            jobApplicationRepository.findByUserIdAndJobId(currentUserId, id)
                    .ifPresent(app -> {
                        dto.setApplied(true);
                        dto.setApplicationStatus(app.getStatus().name());
                    });
        }
        return dto;
    }

    @Override
    public JobDto createJob(JobCreateRequest request) {
        Company company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + request.getCompanyId()));

        Job job = new Job();
        job.setCompany(company);
        job.setTitle(request.getTitle());
        job.setDescription(request.getDescription());
        job.setRequirements(request.getRequirements());
        job.setLocation(request.getLocation());
        job.setEmploymentType(request.getEmploymentType());
        job.setExperienceLevel(request.getExperienceLevel());
        job.setSalaryMin(request.getSalaryMin());
        job.setSalaryMax(request.getSalaryMax());
        job.setCurrency(request.getCurrency());
        job.setRemote(request.getRemote() != null ? request.getRemote() : false);
        job.setActive(request.getActive() != null ? request.getActive() : true);
        if (request.getSkills() != null) {
            job.setSkills(new HashSet<>(request.getSkills()));
        }

        Job saved = jobRepository.save(job);
        return JobDto.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobMatchDto> getJobMatchesForUser(Long userId) {
        List<Job> activeJobs = jobRepository.findByActiveTrue();
        if (activeJobs.isEmpty()) {
            return Collections.emptyList();
        }

        // 1. Fetch user's saved jobs and applications
        Set<Long> savedJobIds = savedJobRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(sj -> sj.getJob().getId()).collect(Collectors.toSet());

        Map<Long, String> applicationStatusMap = jobApplicationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().collect(Collectors.toMap(
                        app -> app.getJob().getId(),
                        app -> app.getStatus().name(),
                        (existing, replacement) -> existing
                ));

        // 2. Locate student's active resume and extracted competencies
        Optional<Resume> resumeOpt = resumeRepository.findFirstByUserIdOrderByUploadTimeDesc(userId);

        List<String> candidateSkills = new ArrayList<>();
        String resumeText = "";

        if (resumeOpt.isPresent()) {
            Resume resume = resumeOpt.get();
            List<ResumeSkill> skills = resumeSkillRepository.findByResumeId(resume.getId());
            candidateSkills = skills.stream()
                    .map(ResumeSkill::getSkillName)
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());

            if (resume.getFilePath() != null) {
                try {
                    resumeText = textExtractionService.extractText(Path.of(resume.getFilePath()));
                } catch (Exception ex) {
                    logger.warn("Could not extract full text from resume file {}: {}", resume.getFilePath(), ex.getMessage());
                }
            }

            if (resumeText.isBlank() && !candidateSkills.isEmpty()) {
                resumeText = "Candidate possessed competencies: " + String.join(", ", candidateSkills);
            }
        }

        List<JobMatchDto> matches = new ArrayList<>();

        for (Job job : activeJobs) {
            JobDto jobDto = JobDto.fromEntity(job);
            jobDto.setSaved(savedJobIds.contains(job.getId()));
            jobDto.setApplied(applicationStatusMap.containsKey(job.getId()));
            jobDto.setApplicationStatus(applicationStatusMap.get(job.getId()));

            List<String> targetJobSkills = job.getSkills() != null
                    ? new ArrayList<>(job.getSkills())
                    : Collections.emptyList();

            JobMatchDto matchDto;

            if (resumeOpt.isEmpty() || (resumeText.isBlank() && candidateSkills.isEmpty())) {
                // No resume uploaded yet: present job with empty match indicator
                matchDto = new JobMatchDto(
                        jobDto,
                        0.0,
                        Collections.emptyList(),
                        targetJobSkills,
                        "Upload or activate your resume to calculate personalized semantic match scores."
                );
            } else {
                // Perform matching using local Python AI model
                try {
                    JobMatchAIResponse aiResponse = localAIServiceClient.matchJob(
                            resumeText,
                            job.getTitle() + " - " + job.getDescription() + " Requirements: " + (job.getRequirements() != null ? job.getRequirements() : ""),
                            job.getTitle(),
                            candidateSkills,
                            targetJobSkills
                    );

                    matchDto = new JobMatchDto(
                            jobDto,
                            aiResponse != null && aiResponse.getMatchScore() != null ? aiResponse.getMatchScore() : 0.0,
                            aiResponse != null ? aiResponse.getMatchedSkills() : Collections.emptyList(),
                            aiResponse != null ? aiResponse.getMissingSkills() : targetJobSkills,
                            aiResponse != null ? aiResponse.getReasoning() : "Semantic match computed."
                    );
                } catch (Exception ex) {
                    // Fallback behavior: deterministic skill-overlap calculation (Section 18)
                    logger.warn("Local AI service call failed for job ID {}; executing deterministic fallback: {}", job.getId(), ex.getMessage());

                    Set<String> candSet = candidateSkills.stream().map(String::toLowerCase).collect(Collectors.toSet());
                    List<String> matched = new ArrayList<>();
                    List<String> missing = new ArrayList<>();

                    for (String reqSkill : targetJobSkills) {
                        if (candSet.contains(reqSkill.toLowerCase())) {
                            matched.add(reqSkill);
                        } else {
                            missing.add(reqSkill);
                        }
                    }

                    double fallbackScore = targetJobSkills.isEmpty()
                            ? 50.0
                            : Math.round(((double) matched.size() / targetJobSkills.size()) * 1000.0) / 10.0;

                    String fallbackReasoning = String.format(
                            "Deterministic skill overlap match (Fallback): %d of %d required competencies verified in candidate profile.",
                            matched.size(), targetJobSkills.size()
                    );

                    matchDto = new JobMatchDto(jobDto, fallbackScore, matched, missing, fallbackReasoning);
                }
            }

            matchDto.setSaved(jobDto.isSaved());
            matchDto.setApplied(jobDto.isApplied());
            matchDto.setApplicationStatus(jobDto.getApplicationStatus());
            matches.add(matchDto);
        }

        // Sort by match score descending
        matches.sort((a, b) -> Double.compare(
                b.getMatchScore() != null ? b.getMatchScore() : 0.0,
                a.getMatchScore() != null ? a.getMatchScore() : 0.0
        ));

        // Assign ranks
        for (int i = 0; i < matches.size(); i++) {
            matches.get(i).setRank(i + 1);
        }

        return matches;
    }
}
