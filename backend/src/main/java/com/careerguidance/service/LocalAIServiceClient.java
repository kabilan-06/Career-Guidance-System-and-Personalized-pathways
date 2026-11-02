package com.careerguidance.service;

import com.careerguidance.config.AIServiceProperties;
import com.careerguidance.dto.AIAnalysisResponse;
import com.careerguidance.exception.AIServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

/** Primary resume-analysis client for the local FastAPI AI service. No external AI provider is used. */
@Service
public class LocalAIServiceClient {
    private static final Logger logger = LoggerFactory.getLogger(LocalAIServiceClient.class);

    private final RestClient restClient;
    private final AIServiceProperties properties;

    public LocalAIServiceClient(@Qualifier("localAiRestClient") RestClient restClient, AIServiceProperties properties) {
        this.restClient = restClient;
        this.properties = properties;
    }

    public AIAnalysisResponse analyzeResume(byte[] bytes, String filename) {
        logger.info("Starting resume AI analysis with local AI service at {}{}",
                properties.getBaseUrl(), properties.getAnalyzeEndpoint());
        try {
            ByteArrayResource resource = new ByteArrayResource(bytes) {
                @Override public String getFilename() { return filename; }
            };
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", resource);
            AIAnalysisResponse response = restClient.post().uri(properties.getAnalyzeEndpoint())
                    .contentType(MediaType.MULTIPART_FORM_DATA).body(body).retrieve().body(AIAnalysisResponse.class);
            if (response == null || !response.isSuccess()) {
                throw new AIServiceException("INVALID_RESPONSE", "The local AI service returned an unexpected response.");
            }
            int jobCount = response.getJobMatches() != null ? response.getJobMatches().size() : 0;
            logger.info("Local AI analysis completed: request_id={}, job matches={}, execution_time={}s",
                    response.getRequestId(), jobCount, response.getExecutionTime());
            return response;
        } catch (RestClientResponseException ex) {
            logger.error("Local AI service returned HTTP {} for resume analysis: {}",
                    ex.getStatusCode().value(), ex.getMessage());
            throw new AIServiceException("LOCAL_AI_ERROR", "The local AI service could not process this resume.", ex);
        } catch (ResourceAccessException ex) {
            logger.error("Local AI service unreachable at {}: {}", properties.getBaseUrl(), ex.getMessage());
            throw new AIServiceException("LOCAL_AI_UNAVAILABLE", "The local AI service is unavailable. Please start the local AI service on port 8000.", ex);
        }
    }

    public com.careerguidance.dto.JobMatchAIResponse matchJob(String resumeText, String jobDescription, String jobTitle,
                                                              java.util.List<String> candidateSkills, java.util.List<String> jobSkills) {
        try {
            java.util.Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("resume_text", resumeText != null ? resumeText : "");
            payload.put("job_description", jobDescription != null ? jobDescription : "");
            if (jobTitle != null) payload.put("job_title", jobTitle);
            if (candidateSkills != null) payload.put("candidate_skills", candidateSkills);
            if (jobSkills != null) payload.put("job_skills", jobSkills);

            return restClient.post()
                    .uri("/jobs/match")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(com.careerguidance.dto.JobMatchAIResponse.class);
        } catch (Exception ex) {
            throw new AIServiceException("LOCAL_AI_UNAVAILABLE", "Failed to connect to local AI job match service: " + ex.getMessage(), ex);
        }
    }
}
