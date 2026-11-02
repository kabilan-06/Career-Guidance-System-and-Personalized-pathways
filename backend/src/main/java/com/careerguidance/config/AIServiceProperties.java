package com.careerguidance.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/** The local FastAPI AI service (resume analysis, semantic job matching) that runs on this machine. */
@Configuration
@ConfigurationProperties(prefix = "ai.service")
public class AIServiceProperties {
    private String baseUrl = "http://localhost:8000";
    private String analyzeEndpoint = "/api/resume/analyze";
    private boolean fallbackEnabled = true;

    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public String getAnalyzeEndpoint() { return analyzeEndpoint; }
    public void setAnalyzeEndpoint(String analyzeEndpoint) { this.analyzeEndpoint = analyzeEndpoint; }
    public boolean isFallbackEnabled() { return fallbackEnabled; }
    public void setFallbackEnabled(boolean fallbackEnabled) { this.fallbackEnabled = fallbackEnabled; }
}
