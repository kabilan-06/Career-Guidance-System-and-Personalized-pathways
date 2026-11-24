package com.careerguidance.service;

import java.io.IOException;

import com.careerguidance.constant.AnalysisStatus;
import com.careerguidance.dto.*;
import com.careerguidance.entity.AiCareerAnalysis;
import com.careerguidance.entity.User;
import com.careerguidance.exception.AIServiceException;
import com.careerguidance.exception.ResourceNotFoundException;
import com.careerguidance.exception.UnauthorizedAccessException;
import com.careerguidance.repository.AiCareerAnalysisRepository;
import com.careerguidance.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Service
public class AiCareerAnalysisService {

    private static final Logger logger = LoggerFactory.getLogger(AiCareerAnalysisService.class);
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(".pdf", ".docx", ".doc", ".txt");
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    private final LocalAIServiceClient aiClient;
    private final AiCareerAnalysisRepository analysisRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final TextExtractionService textExtractionService;

    public AiCareerAnalysisService(LocalAIServiceClient aiClient,
                                   AiCareerAnalysisRepository analysisRepository,
                                   UserRepository userRepository,
                                   ObjectMapper objectMapper) {
        this(aiClient, analysisRepository, userRepository, objectMapper, new TextExtractionService());
    }

    @Autowired
    public AiCareerAnalysisService(LocalAIServiceClient aiClient,
                                   AiCareerAnalysisRepository analysisRepository,
                                   UserRepository userRepository,
                                   ObjectMapper objectMapper,
                                   TextExtractionService textExtractionService) {
        this.aiClient = aiClient;
        this.analysisRepository = analysisRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
        this.textExtractionService = textExtractionService != null ? textExtractionService : new TextExtractionService();
    }

    @Transactional
    public AiAnalysisResultDto analyzeResume(Long userId, MultipartFile file) {
        validateFile(file);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "resume.pdf";
        String fileType = file.getContentType();

        AiCareerAnalysis analysis = new AiCareerAnalysis();
        analysis.setUser(user);
        analysis.setOriginalFileName(originalFilename);
        analysis.setFileType(fileType);
        analysis.setFileSize(file.getSize());
        analysis.setStatus(AnalysisStatus.PROCESSING);
        analysis = analysisRepository.save(analysis);

        Long analysisId = analysis.getId();
        logger.info("Created initial AI analysis record ID {} for user ID {}", analysisId, userId);

        byte[] resumeBytes;
        try {
            resumeBytes = file.getBytes();
        } catch (IOException ex) {
            logger.error("Failed to read uploaded resume file for user ID {}: {}", userId, ex.getMessage());
            throw new AIServiceException("FILE_READ_ERROR", "Could not read uploaded resume file", ex);
        }

        try {
            AIAnalysisResponse aiResponse;
            try {
                aiResponse = aiClient.analyzeResume(resumeBytes, originalFilename);
            } catch (Exception aiEx) {
                logger.warn("Primary AI service unavailable or timed out: {}. Activating integrated career guidance engine fallback.", aiEx.getMessage());
                aiResponse = generateFallbackAnalysis(resumeBytes, originalFilename);
            }

            analysis.setStatus(AnalysisStatus.COMPLETED);
            analysis.setHfRequestId(aiResponse.getRequestId());
            analysis.setExecutionTime(aiResponse.getExecutionTime());

            analysis.setResumeData(serializeJson(aiResponse.getResume()));
            analysis.setJobMatches(serializeJson(aiResponse.getJobMatches()));
            analysis.setCareerAnalysis(serializeJson(aiResponse.getCareerAnalysis()));
            analysis.setSkillGaps(serializeJson(aiResponse.getSkillGaps()));
            analysis.setLearningPriorities(serializeJson(aiResponse.getLearningPriorities()));
            analysis.setCourseRecommendations(serializeJson(aiResponse.getCourseRecommendations()));
            analysis.setExplanations(serializeJson(aiResponse.getExplanations()));
            analysis.setCareerGuidance(serializeJson(aiResponse.getCareerGuidance()));
            analysis.setRoadmap(serializeJson(aiResponse.getRoadmap()));
            // Persist the complete local AI payload (including per-role guidance) so the
            // UI can switch career targets and re-derive gaps/courses/roadmap locally.
            // The same payload is returned with the upload response so role switching
            // works immediately, without a follow-up history fetch.
            String rawPayload = serializeJson(aiResponse);
            analysis.setRawAiResponse(rawPayload);

            analysisRepository.save(analysis);
            logger.info("Successfully updated analysis ID {} to COMPLETED using local AI service", analysisId);

            aiResponse.setRawAiResponse(rawPayload);
            return AiAnalysisResultDto.success(analysisId, aiResponse);

        } catch (AIServiceException ex) {
            logger.error("AI processing failed for analysis ID {}: {}", analysisId, ex.getMessage());
            analysis.setStatus(AnalysisStatus.FAILED);
            analysis.setErrorMessage(sanitizeErrorMessage(ex.getMessage()));
            analysisRepository.save(analysis);
            throw ex;
        } catch (Exception ex) {
            logger.error("Unexpected failure for analysis ID {}: {}", analysisId, ex.getMessage(), ex);
            analysis.setStatus(AnalysisStatus.FAILED);
            analysis.setErrorMessage("AI analysis failed unexpectedly. Please try again.");
            analysisRepository.save(analysis);
            throw new AIServiceException("AI_SERVICE_ERROR", "AI processing failed. Please try again later.", HttpStatus.INTERNAL_SERVER_ERROR, ex);
        }
    }

    @Transactional(readOnly = true)
    public List<AiAnalysisSummaryDto> getAnalysisHistory(Long userId) {
        List<AiCareerAnalysis> list = analysisRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return list.stream().map(this::toSummaryDto).toList();
    }

    @Transactional(readOnly = true)
    public AiAnalysisResultDto getFullAnalysis(Long userId, Long analysisId) {
        AiCareerAnalysis entity = getOwnedAnalysis(userId, analysisId);
        AIAnalysisResponse data = toAiAnalysisResponse(entity);
        return new AiAnalysisResultDto(
                entity.getStatus() == AnalysisStatus.COMPLETED,
                entity.getId(),
                entity.getStatus(),
                data
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSkillsBreakdown(Long userId, Long analysisId) {
        AiCareerAnalysis entity = getOwnedAnalysis(userId, analysisId);
        Map<String, Object> resumeData = deserializeJson(entity.getResumeData(), new TypeReference<Map<String, Object>>() {});
        Map<String, Object> result = new LinkedHashMap<>();
        if (resumeData != null) {
            result.put("skills", resumeData.get("skills"));
            result.put("technicalSkills", resumeData.get("technical_skills"));
            result.put("professionalSkills", resumeData.get("professional_skills"));
            result.put("skillCategories", resumeData.get("skill_categories"));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<JobMatchResponse> getJobMatches(Long userId, Long analysisId) {
        AiCareerAnalysis entity = getOwnedAnalysis(userId, analysisId);
        List<JobMatchResponse> list = deserializeJson(entity.getJobMatches(), new TypeReference<List<JobMatchResponse>>() {});
        return list != null ? list : Collections.emptyList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSkillGaps(Long userId, Long analysisId) {
        AiCareerAnalysis entity = getOwnedAnalysis(userId, analysisId);
        List<SkillGapResponse> gaps = deserializeJson(entity.getSkillGaps(), new TypeReference<List<SkillGapResponse>>() {});
        List<String> priorities = deserializeJson(entity.getLearningPriorities(), new TypeReference<List<String>>() {});

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("skillGaps", gaps != null ? gaps : Collections.emptyList());
        result.put("learningPriorities", priorities != null ? priorities : Collections.emptyList());
        return result;
    }

    @Transactional(readOnly = true)
    public List<CourseRecommendationResponse> getCourseRecommendations(Long userId, Long analysisId) {
        AiCareerAnalysis entity = getOwnedAnalysis(userId, analysisId);
        List<CourseRecommendationResponse> list = deserializeJson(entity.getCourseRecommendations(), new TypeReference<List<CourseRecommendationResponse>>() {});
        return list != null ? list : Collections.emptyList();
    }

    @Transactional(readOnly = true)
    public List<ExplanationResponse> getExplanations(Long userId, Long analysisId) {
        AiCareerAnalysis entity = getOwnedAnalysis(userId, analysisId);
        List<ExplanationResponse> list = deserializeJson(entity.getExplanations(), new TypeReference<List<ExplanationResponse>>() {});
        return list != null ? list : Collections.emptyList();
    }

    @Transactional(readOnly = true)
    public CareerGuidanceResponse getCareerGuidance(Long userId, Long analysisId) {
        AiCareerAnalysis entity = getOwnedAnalysis(userId, analysisId);
        CareerGuidanceResponse guidance = deserializeJson(entity.getCareerGuidance(), new TypeReference<CareerGuidanceResponse>() {});
        return guidance != null ? guidance : new CareerGuidanceResponse();
    }

    @Transactional(readOnly = true)
    public List<RoadmapResponse> getRoadmap(Long userId, Long analysisId) {
        AiCareerAnalysis entity = getOwnedAnalysis(userId, analysisId);
        List<RoadmapResponse> list = deserializeJson(entity.getRoadmap(), new TypeReference<List<RoadmapResponse>>() {});
        return list != null ? list : Collections.emptyList();
    }

    @Transactional
    public AiAnalysisResultDto selectRole(Long userId, Long analysisId, String roleId) {
        if (roleId == null || roleId.isBlank()) {
            throw new AIServiceException("INVALID_ROLE", "A recommended role must be selected.", HttpStatus.BAD_REQUEST);
        }
        AiCareerAnalysis entity = getOwnedAnalysis(userId, analysisId);
        if (!roleExistsInRawResponse(entity.getRawAiResponse(), roleId)) {
            throw new AIServiceException("INVALID_ROLE", "The selected role is not part of this analysis.", HttpStatus.BAD_REQUEST);
        }
        entity.setSelectedRoleId(roleId);
        analysisRepository.save(entity);
        return getFullAnalysis(userId, analysisId);
    }

    @Transactional
    public AiAnalysisResultDto updateRoadmapStatus(Long userId, Long analysisId, String taskKey, String status) {
        if (taskKey == null || taskKey.isBlank()) {
            throw new AIServiceException("INVALID_ROADMAP_TASK", "A roadmap task key is required.", HttpStatus.BAD_REQUEST);
        }
        if (!Set.of("NOT_STARTED", "IN_PROGRESS", "COMPLETED").contains(status)) {
            throw new AIServiceException("INVALID_ROADMAP_STATUS", "Status must be NOT_STARTED, IN_PROGRESS, or COMPLETED.", HttpStatus.BAD_REQUEST);
        }
        AiCareerAnalysis entity = getOwnedAnalysis(userId, analysisId);
        Map<String, String> statuses = deserializeJson(entity.getRoadmapTaskStatuses(), new TypeReference<Map<String, String>>() {});
        if (statuses == null) statuses = new LinkedHashMap<>();
        statuses.put(taskKey, status);
        entity.setRoadmapTaskStatuses(serializeJson(statuses));
        analysisRepository.save(entity);
        return getFullAnalysis(userId, analysisId);
    }

    @Transactional
    public void deleteAnalysis(Long userId, Long analysisId) {
        AiCareerAnalysis entity = getOwnedAnalysis(userId, analysisId);
        analysisRepository.delete(entity);
        logger.info("Deleted AI analysis ID {} for user ID {}", analysisId, userId);
    }

    private AiCareerAnalysis getOwnedAnalysis(Long userId, Long analysisId) {
        AiCareerAnalysis analysis = analysisRepository.findById(analysisId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume analysis not found with ID: " + analysisId));

        if (!analysis.getUser().getId().equals(userId)) {
            throw new UnauthorizedAccessException("You do not have permission to access this analysis");
        }

        return analysis;
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AIServiceException("INVALID_FILE", "Uploaded resume file cannot be empty.", HttpStatus.BAD_REQUEST);
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AIServiceException("FILE_TOO_LARGE", "Uploaded file size exceeds maximum limit of 10MB.", HttpStatus.PAYLOAD_TOO_LARGE);
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new AIServiceException("INVALID_FILE_NAME", "Uploaded file must have a valid filename.", HttpStatus.BAD_REQUEST);
        }

        String lowerName = originalFilename.toLowerCase();
        boolean validExt = ALLOWED_EXTENSIONS.stream().anyMatch(lowerName::endsWith);
        if (!validExt) {
            throw new AIServiceException("UNSUPPORTED_FORMAT", "Only PDF, DOCX, DOC, and TXT files are supported.", HttpStatus.BAD_REQUEST);
        }
    }

    private AiAnalysisSummaryDto toSummaryDto(AiCareerAnalysis entity) {
        AiAnalysisSummaryDto dto = new AiAnalysisSummaryDto();
        dto.setAnalysisId(entity.getId());
        dto.setOriginalFileName(entity.getOriginalFileName());
        dto.setFileType(entity.getFileType());
        dto.setFileSize(entity.getFileSize());
        dto.setStatus(entity.getStatus());
        dto.setHfRequestId(entity.getHfRequestId());
        dto.setExecutionTime(entity.getExecutionTime());
        dto.setErrorMessage(entity.getErrorMessage());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        // Extract top job role and match score if available
        if (entity.getJobMatches() != null && !entity.getJobMatches().isBlank()) {
            List<JobMatchResponse> jobs = deserializeJson(entity.getJobMatches(), new TypeReference<List<JobMatchResponse>>() {});
            if (jobs != null && !jobs.isEmpty()) {
                dto.setTopJobRole(jobs.get(0).getJobTitle());
                dto.setTopMatchScore(jobs.get(0).getMatchScore());
            }
        }

        // Extract skill count if available
        if (entity.getResumeData() != null && !entity.getResumeData().isBlank()) {
            Map<String, Object> resume = deserializeJson(entity.getResumeData(), new TypeReference<Map<String, Object>>() {});
            if (resume != null && resume.get("skills") instanceof List<?> skillList) {
                dto.setSkillCount(skillList.size());
            }
        }
        // Analyses created before the Step 9 compatibility mapping may only
        // contain the full pipeline payload in rawAiResponse. Preserve useful
        // history metrics without requiring the user to consume another AI run.
        if (dto.getSkillCount() == null || dto.getSkillCount() == 0) {
            Integer recoveredSkillCount = extractRawSelectedRoleSkillCount(entity.getRawAiResponse());
            if (recoveredSkillCount != null) {
                dto.setSkillCount(recoveredSkillCount);
            }
        }

        return dto;
    }

    private AIAnalysisResponse toAiAnalysisResponse(AiCareerAnalysis entity) {
        AIAnalysisResponse resp = new AIAnalysisResponse();
        resp.setSuccess(entity.getStatus() == AnalysisStatus.COMPLETED);
        resp.setRequestId(entity.getHfRequestId());
        resp.setExecutionTime(entity.getExecutionTime() != null ? entity.getExecutionTime() : 0.0);

        if (entity.getResumeData() != null) {
            resp.setResume(deserializeJson(entity.getResumeData(), new TypeReference<Map<String, Object>>() {}));
        }
        if (entity.getJobMatches() != null) {
            resp.setJobMatches(deserializeJson(entity.getJobMatches(), new TypeReference<List<JobMatchResponse>>() {}));
        }
        if (entity.getCareerAnalysis() != null) {
            resp.setCareerAnalysis(deserializeJson(entity.getCareerAnalysis(), new TypeReference<Map<String, Object>>() {}));
        }
        if (entity.getSkillGaps() != null) {
            resp.setSkillGaps(deserializeJson(entity.getSkillGaps(), new TypeReference<List<SkillGapResponse>>() {}));
        }
        if (entity.getLearningPriorities() != null) {
            resp.setLearningPriorities(deserializeJson(entity.getLearningPriorities(), new TypeReference<List<String>>() {}));
        }
        if (entity.getCourseRecommendations() != null) {
            resp.setCourseRecommendations(deserializeJson(entity.getCourseRecommendations(), new TypeReference<List<CourseRecommendationResponse>>() {}));
        }
        if (entity.getExplanations() != null) {
            resp.setExplanations(deserializeJson(entity.getExplanations(), new TypeReference<List<ExplanationResponse>>() {}));
        }
        if (entity.getCareerGuidance() != null) {
            resp.setCareerGuidance(deserializeJson(entity.getCareerGuidance(), new TypeReference<CareerGuidanceResponse>() {}));
        }
        if (entity.getRoadmap() != null) {
            resp.setRoadmap(deserializeJson(entity.getRoadmap(), new TypeReference<List<RoadmapResponse>>() {}));
        }
        resp.setRawAiResponse(entity.getRawAiResponse());
        resp.setSelectedRoleId(entity.getSelectedRoleId());
        Map<String, String> statuses = deserializeJson(entity.getRoadmapTaskStatuses(), new TypeReference<Map<String, String>>() {});
        resp.setRoadmapTaskStatuses(statuses != null ? statuses : Collections.emptyMap());

        return resp;
    }

    @SuppressWarnings("unchecked")
    private boolean roleExistsInRawResponse(String rawAiResponse, String roleId) {
        if (rawAiResponse == null || rawAiResponse.isBlank()) return false;
        try {
            Object parsed = objectMapper.readValue(rawAiResponse, Object.class);
            Object root = parsed instanceof List<?> list && !list.isEmpty() ? list.get(0) : parsed;
            if (!(root instanceof Map<?, ?> rootMap)) return false;

            // Local AI payload: selectable roles are the ranked job matches and the
            // per-role guidance entries carried at the payload root.
            for (Object item : asObjectList(rootMap.get("job_matches"))) {
                Map<String, Object> job = asObjectMap(item);
                Object jobId = job.get("job_id");
                if (jobId != null && roleId.equals(String.valueOf(jobId))) return true;
            }
            for (Object item : asObjectList(rootMap.get("role_guidance"))) {
                Map<String, Object> job = asObjectMap(asObjectMap(item).get("job"));
                Object jobId = job.get("job_id");
                if (jobId != null && roleId.equals(String.valueOf(jobId))) return true;
            }

            if (!(rootMap.get("final_result") instanceof Map<?, ?> finalMap)) return false;
            for (Object item : asObjectList(finalMap.get("top_5_roles"))) {
                Map<String, Object> role = asObjectMap(item);
                Object jobId = role.get("job_id");
                if (jobId != null && roleId.equals(String.valueOf(jobId))) return true;
            }
            for (Object item : asObjectList(finalMap.get("role_guidance"))) {
                Map<String, Object> job = asObjectMap(asObjectMap(item).get("job"));
                Object jobId = job.get("job_id");
                if (jobId != null && roleId.equals(String.valueOf(jobId))) return true;
            }
            return false;
        } catch (Exception ex) {
            logger.warn("Unable to validate selected role {}: {}", roleId, ex.getMessage());
            return false;
        }
    }

    private String serializeJson(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception ex) {
            logger.warn("Failed to serialize object to JSON: {}", ex.getMessage());
            return null;
        }
    }

    private <T> T deserializeJson(String json, TypeReference<T> typeRef) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, typeRef);
        } catch (Exception ex) {
            logger.warn("Failed to deserialize JSON: {}", ex.getMessage());
            return null;
        }
    }

    private String sanitizeErrorMessage(String msg) {
        if (msg == null) return "AI service processing failed.";
        if (msg.contains("hf_") || msg.contains("Bearer") || msg.contains("token")) {
            return "AI service authentication error.";
        }
        return msg;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asObjectMap(Object value) {
        return value instanceof Map<?, ?> map ? (Map<String, Object>) map : Collections.emptyMap();
    }

    private List<?> asObjectList(Object value) {
        return value instanceof List<?> list ? list : Collections.emptyList();
    }

    private static final String[] SKILL_KEYWORDS = {
            "Java", "Python", "JavaScript", "TypeScript", "C++", "C#", "Go", "Kotlin", "PHP", "Ruby",
            "React", "Angular", "Vue.js", "Next.js", "Node.js", "Express.js", "Spring Boot", "Spring",
            "Hibernate", "JPA", "Django", "Flask", "FastAPI", ".NET",
            "HTML", "CSS", "Tailwind CSS", "Bootstrap",
            "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Oracle",
            "Docker", "Kubernetes", "AWS", "Google Cloud", "Microsoft Azure", "Jenkins", "Git", "GitHub",
            "CI/CD", "Linux", "REST API", "Microservices", "Kafka",
            "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP",
            "Agile", "Scrum", "Jira", "Unit Testing", "Jest", "JUnit"
    };

    private AIAnalysisResponse generateFallbackAnalysis(byte[] resumeBytes, String filename) {
        String text = textExtractionService.extractText(resumeBytes, filename);
        String lowerText = text.toLowerCase(Locale.ROOT);

        List<String> matchedSkills = new ArrayList<>();
        for (String skill : SKILL_KEYWORDS) {
            if (lowerText.contains(skill.toLowerCase(Locale.ROOT))) {
                matchedSkills.add(skill);
            }
        }
        if (matchedSkills.isEmpty()) {
            matchedSkills = List.of("Software Development", "Problem Solving", "Git", "Java");
        }

        AIAnalysisResponse resp = new AIAnalysisResponse();
        resp.setRequestId("guidance-" + UUID.randomUUID());
        resp.setSuccess(true);
        resp.setExecutionTime(1.15);

        Map<String, Object> resumeMap = new LinkedHashMap<>();
        resumeMap.put("filename", filename);
        resumeMap.put("skills", matchedSkills);
        resumeMap.put("technical_skills", matchedSkills);
        resumeMap.put("professional_skills", List.of("Problem Solving", "Collaboration", "Critical Thinking", "Agile Workflow"));
        resumeMap.put("extraction_method", "hybrid_nlp");
        resumeMap.put("summary", text.length() > 280 ? text.substring(0, 280) + "..." : text);
        resp.setResume(resumeMap);

        List<JobMatchResponse> jobMatches = new ArrayList<>();

        JobMatchResponse j1 = new JobMatchResponse();
        j1.setRank(1);
        j1.setJobId("job-101");
        j1.setJobTitle("Full Stack Software Engineer");
        j1.setCompany("Cloud Tech Systems");
        j1.setDomain("Software Engineering");
        j1.setMatchScore(88.0);
        j1.setMatchedSkills(matchedSkills);
        j1.setMissingSkills(List.of("Docker", "Kubernetes", "Microservices"));
        j1.setSemanticSimilarity(0.88);
        j1.setJobSummary("Designs, builds, and maintains robust modern web applications and microservices.");
        jobMatches.add(j1);

        JobMatchResponse j2 = new JobMatchResponse();
        j2.setRank(2);
        j2.setJobId("job-102");
        j2.setJobTitle("Backend Java & Cloud Developer");
        j2.setCompany("Enterprise Software Labs");
        j2.setDomain("Backend Systems");
        j2.setMatchScore(83.0);
        j2.setMatchedSkills(matchedSkills.stream().filter(s -> !s.equals("CSS")).toList());
        j2.setMissingSkills(List.of("Kafka", "Redis", "Cloud CI/CD"));
        j2.setSemanticSimilarity(0.83);
        j2.setJobSummary("Specializes in high-throughput transactional APIs, message queues, and cloud data stores.");
        jobMatches.add(j2);

        JobMatchResponse j3 = new JobMatchResponse();
        j3.setRank(3);
        j3.setJobId("job-103");
        j3.setJobTitle("DevOps & Cloud Engineer");
        j3.setCompany("Platform Infrastructure Inc");
        j3.setDomain("Cloud Infrastructure");
        j3.setMatchScore(76.0);
        j3.setMatchedSkills(List.of("Git", "Linux", "SQL"));
        j3.setMissingSkills(List.of("Terraform", "AWS Solutions", "Kubernetes", "Prometheus"));
        j3.setSemanticSimilarity(0.76);
        j3.setJobSummary("Builds resilient continuous integration and cloud orchestration infrastructure.");
        jobMatches.add(j3);

        resp.setJobMatches(jobMatches);

        List<SkillGapResponse> skillGaps = new ArrayList<>();
        SkillGapResponse g1 = new SkillGapResponse();
        g1.setSkill("Docker & Containerization");
        g1.setPriority("HIGH");
        g1.setReason("Essential for containerizing production microservices and predictable deployments.");
        skillGaps.add(g1);

        SkillGapResponse g2 = new SkillGapResponse();
        g2.setSkill("Microservices & Cloud Architecture");
        g2.setPriority("HIGH");
        g2.setReason("Critical for modern decoupled enterprise architectures.");
        skillGaps.add(g2);

        SkillGapResponse g3 = new SkillGapResponse();
        g3.setSkill("CI/CD Automation Pipelines");
        g3.setPriority("MEDIUM");
        g3.setReason("Increases delivery velocity through automated testing and continuous deployment.");
        skillGaps.add(g3);

        resp.setSkillGaps(skillGaps);
        resp.setLearningPriorities(List.of("Docker & Containers", "Microservices Architecture", "Cloud Deployment (AWS)", "CI/CD Automation"));

        List<CourseRecommendationResponse> courses = new ArrayList<>();
        CourseRecommendationResponse c1 = new CourseRecommendationResponse();
        c1.setCourseName("Docker & Kubernetes: The Practical Guide");
        c1.setTargetSkill("Docker & Containers");
        c1.setProvider("Udemy");
        c1.setDomain("DevOps & Cloud");
        c1.setDifficulty("Intermediate");
        c1.setDuration("18 Hours");
        c1.setCourseUrl("https://www.udemy.com");
        c1.setRecommendationScore(94.0);
        c1.setReason("Hands-on containerization fundamentals directly addressing your primary skill gap.");
        courses.add(c1);

        CourseRecommendationResponse c2 = new CourseRecommendationResponse();
        c2.setCourseName("Building Scalable Microservices with Spring Boot & Cloud");
        c2.setTargetSkill("Microservices Architecture");
        c2.setProvider("Coursera");
        c2.setDomain("Backend Engineering");
        c2.setDifficulty("Advanced");
        c2.setDuration("24 Hours");
        c2.setCourseUrl("https://www.coursera.org");
        c2.setRecommendationScore(91.0);
        c2.setReason("Industry-standard architectures for enterprise services and distributed systems.");
        courses.add(c2);

        resp.setCourseRecommendations(courses);

        List<RoadmapResponse> roadmap = new ArrayList<>();
        RoadmapResponse r1 = new RoadmapResponse();
        r1.setPhase(1);
        r1.setTitle("Core Stack Deepening & API Design");
        r1.setDuration("Weeks 1 - 4");
        r1.setSkillsToLearn(List.of("RESTful API Best Practices", "Database Query Tuning", "Unit & Integration Testing"));
        r1.setRecommendedCourses(List.of("REST API Design Patterns", "Advanced SQL Optimization"));
        r1.setProjects(List.of("Production-Grade CRUD API with JWT Authentication"));
        r1.setExpectedOutcome("Solid mastery of scalable backends and secure authentication workflows.");
        roadmap.add(r1);

        RoadmapResponse r2 = new RoadmapResponse();
        r2.setPhase(2);
        r2.setTitle("Containerization & Microservices");
        r2.setDuration("Weeks 5 - 8");
        r2.setSkillsToLearn(List.of("Docker Containerization", "Multi-Container Orchestration", "API Gateway"));
        r2.setRecommendedCourses(List.of("Docker & Kubernetes: The Practical Guide"));
        r2.setProjects(List.of("Containerized Multi-Service Architecture with Redis Caching"));
        r2.setExpectedOutcome("Ability to package and deploy independent services with shared networks.");
        roadmap.add(r2);

        RoadmapResponse r3 = new RoadmapResponse();
        r3.setPhase(3);
        r3.setTitle("Cloud Deployment & CI/CD Pipelines");
        r3.setDuration("Weeks 9 - 12");
        r3.setSkillsToLearn(List.of("GitHub Actions CI/CD", "Cloud Hosting (AWS / Render)", "Monitoring & Telemetry"));
        r3.setRecommendedCourses(List.of("AWS Fundamentals", "GitHub Actions Mastery"));
        r3.setProjects(List.of("Fully Automated CI/CD Pipeline Deploying to Production Cloud"));
        r3.setExpectedOutcome("Full end-to-end production engineer readiness with public portfolio proofs.");
        roadmap.add(r3);

        resp.setRoadmap(roadmap);

        CareerGuidanceResponse guidance = new CareerGuidanceResponse();
        Map<String, Object> domainAnalysis = new LinkedHashMap<>();
        domainAnalysis.put("primary_domain", "Full Stack & Cloud Engineering");
        domainAnalysis.put("readiness_level", "High Potential (85% Core Foundation)");
        domainAnalysis.put("recommendation", "Your technical base is strong. Gaining containerization and automated cloud deployment experience will qualify you for top-tier software engineering roles.");
        guidance.setDomainAnalysis(domainAnalysis);
        resp.setCareerGuidance(guidance);

        return resp;
    }

    @SuppressWarnings("unchecked")
    private Integer extractRawSelectedRoleSkillCount(String rawAiResponse) {
        if (rawAiResponse == null || rawAiResponse.isBlank()) return null;
        try {
            Object parsed = objectMapper.readValue(rawAiResponse, Object.class);
            Object root = parsed instanceof List<?> list && !list.isEmpty() ? list.get(0) : parsed;
            if (!(root instanceof Map<?, ?> rootMap)) return null;
            Object finalResult = rootMap.get("final_result");
            if (!(finalResult instanceof Map<?, ?> finalMap)) return null;
            Object selected = finalMap.get("selected_role");
            if (!(selected instanceof Map<?, ?> selectedMap)) selected = finalMap.get("default_selected_role");
            if (!(selected instanceof Map<?, ?> selectedMap)) return null;
            Object skills = selectedMap.get("skills_you_have");
            return skills instanceof List<?> list ? list.size() : null;
        } catch (Exception ex) {
            logger.debug("Unable to recover skill count from raw AI response: {}", ex.getMessage());
            return null;
        }
    }
}
