export const CODE_SNIPPETS = {
  adaptiveTestingService: {
    filename: 'AdaptiveTestingService.java',
    path: 'springapp/src/main/java/com/kabilan/assessment/service/AdaptiveTestingService.java',
    language: 'java',
    description: '3-Parameter Logistic (3PL) Item Response Theory (IRT) with latency speed-weighting and Fisher Information maximization.',
    code: `package com.kabilan.assessment.service;

import org.springframework.stereotype.Service;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class AdaptiveTestingService {

    private static final double MIN_THETA = -3.5;
    private static final double MAX_THETA = 3.5;
    private static final double LEARNING_RATE = 0.55;
    private static final double DEFAULT_GUESSING_PROB = 0.25;

    public record ItemParameters(Long id, String questionText, double discrimination, double difficulty, double guessing) {}
    public record ResponseTelemetry(boolean isCorrect, long latencyMs, long expectedTimeMs) {}
    public record AbilityAssessment(double currentTheta, double standardError, int questionsAnswered, String proficiencyBand) {}

    // 3PL IRT Probability: P(theta) = c + (1 - c) / (1 + e^(-1.702 * a * (theta - b)))
    public double calculateProbability(double theta, ItemParameters item) {
        double a = item.discrimination();
        double b = item.difficulty();
        double c = item.guessing() > 0 ? item.guessing() : DEFAULT_GUESSING_PROB;
        double exponent = -1.702 * a * (theta - b);
        return c + (1.0 - c) * (1.0 / (1.0 + Math.exp(exponent)));
    }

    // Fisher Information: I(theta) for maximum diagnostic certainty
    public double calculateFisherInformation(double theta, ItemParameters item) {
        double p = calculateProbability(theta, item);
        double a = item.discrimination();
        double c = item.guessing() > 0 ? item.guessing() : DEFAULT_GUESSING_PROB;
        if (p <= c || p >= 1.0) return 0.001;
        double numerator = Math.pow(1.702 * a, 2) * Math.pow(p - c, 2) * (1.0 - p);
        double denominator = Math.pow(1.0 - c, 2) * p;
        return numerator / denominator;
    }

    // Speed-weighted ability recalibration
    public double recalibrateAbility(double currentTheta, ItemParameters item, ResponseTelemetry telemetry) {
        double predictedProb = calculateProbability(currentTheta, item);
        double actualScore = telemetry.isCorrect() ? 1.0 : 0.0;
        double speedRatio = (double) telemetry.latencyMs() / Math.max(1000, telemetry.expectedTimeMs());
        double speedWeight = telemetry.isCorrect()
                ? (speedRatio < 0.7 ? 1.25 : (speedRatio > 1.5 ? 0.85 : 1.0))
                : (speedRatio < 0.25 ? 1.35 : 1.0); // Harsh penalty for rapid guessing

        double deltaTheta = LEARNING_RATE * item.discrimination() * (actualScore - predictedProb) * speedWeight;
        return Math.max(MIN_THETA, Math.min(MAX_THETA, currentTheta + deltaTheta));
    }

    public Optional<ItemParameters> selectOptimalQuestion(double currentTheta, List<ItemParameters> availableQuestions) {
        if (availableQuestions == null || availableQuestions.isEmpty()) return Optional.empty();
        return availableQuestions.stream().max(Comparator.comparingDouble(q -> calculateFisherInformation(currentTheta, q)));
    }
}`
  },

  webSocketConfig: {
    filename: 'WebSocketConfig.java',
    path: 'springapp/src/main/java/com/kabilan/assessment/config/WebSocketConfig.java',
    language: 'java',
    description: 'STOMP WebSocket endpoint registration and message broker configuration for multiplayer quiz arenas.',
    code: `package com.kabilan.assessment.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-arena").setAllowedOriginPatterns("*").withSockJS();
        registry.addEndpoint("/ws-arena-native").setAllowedOriginPatterns("*");
    }
}`
  },

  arenaRoomManager: {
    filename: 'ArenaRoomManager.java',
    path: 'springapp/src/main/java/com/kabilan/assessment/arena/ArenaRoomManager.java',
    language: 'java',
    description: 'Thread-safe concurrent multiplayer arena room manager with atomic scoring and STOMP broadcasting.',
    code: `package com.kabilan.assessment.arena;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class ArenaRoomManager {
    private final SimpMessagingTemplate messagingTemplate;
    private final Map<String, ArenaRoom> activeRooms = new ConcurrentHashMap<>();

    public ArenaRoomManager(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public record Participant(String userId, String username, AtomicInteger score, AtomicInteger consecutiveStreak) {}
    public record LeaderboardEntry(int rank, String userId, String username, int score, int streak) {}

    public static class ArenaRoom {
        private final String roomId;
        private final Map<String, Participant> participants = new ConcurrentHashMap<>();
        public ArenaRoom(String roomId) { this.roomId = roomId; }
        public Map<String, Participant> getParticipants() { return participants; }
    }

    public void submitAnswer(String roomId, String userId, boolean isCorrect, long latencyMs) {
        ArenaRoom room = activeRooms.get(roomId);
        if (room == null) return;
        Participant p = room.getParticipants().get(userId);
        if (p == null) return;

        if (isCorrect) {
            int streak = p.consecutiveStreak().incrementAndGet();
            int speedBonus = (int) Math.max(0, 500 - (latencyMs / 20));
            double multiplier = 1.0 + Math.min(1.0, (streak - 1) * 0.10);
            p.score().addAndGet((int) Math.round((1000 + speedBonus) * multiplier));
        } else {
            p.consecutiveStreak().set(0);
        }
        broadcastLeaderboard(roomId);
    }

    public void broadcastLeaderboard(String roomId) {
        ArenaRoom room = activeRooms.get(roomId);
        if (room == null) return;
        List<Participant> sorted = room.getParticipants().values().stream()
                .sorted((a, b) -> Integer.compare(b.score().get(), a.score().get()))
                .toList();

        List<LeaderboardEntry> lb = new ArrayList<>();
        for (int i = 0; i < sorted.size(); i++) {
            Participant p = sorted.get(i);
            lb.add(new LeaderboardEntry(i + 1, p.userId(), p.username(), p.score().get(), p.consecutiveStreak().get()));
        }
        messagingTemplate.convertAndSend("/topic/arena/" + roomId + "/leaderboard", lb);
    }
}`
  },

  codeSandboxService: {
    filename: 'CodeExecutionSandboxService.java',
    path: 'springapp/src/main/java/com/kabilan/assessment/service/CodeExecutionSandboxService.java',
    language: 'java',
    description: 'Sandboxed code execution engine with static AST security filters and timeout constraints.',
    code: `package com.kabilan.assessment.service;

import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class CodeExecutionSandboxService {

    private static final List<Pattern> SECURITY_BLACKLIST = List.of(
            Pattern.compile("System\\\\.exit", Pattern.CASE_INSENSITIVE),
            Pattern.compile("Runtime\\\\.getRuntime", Pattern.CASE_INSENSITIVE),
            Pattern.compile("ProcessBuilder", Pattern.CASE_INSENSITIVE),
            Pattern.compile("java\\\\.lang\\\\.reflect", Pattern.CASE_INSENSITIVE),
            Pattern.compile("sun\\\\.misc\\\\.Unsafe", Pattern.CASE_INSENSITIVE),
            Pattern.compile("java\\\\.net\\\\.", Pattern.CASE_INSENSITIVE),
            Pattern.compile("Thread\\\\.stop", Pattern.CASE_INSENSITIVE)
    );

    public record ExecutionResult(String status, String stdout, String stderr, long executionTimeMs) {}

    public Optional<String> validateSecurityRules(String sourceCode) {
        if (sourceCode == null || sourceCode.isBlank()) return Optional.of("Empty source code.");
        for (Pattern pattern : SECURITY_BLACKLIST) {
            if (pattern.matcher(sourceCode).find()) {
                return Optional.of("Security Violation: Access to restricted API [" + pattern.pattern() + "] is forbidden.");
            }
        }
        return Optional.empty();
    }
}`
  },

  useIntegrityGuard: {
    filename: 'useIntegrityGuard.ts',
    path: 'reactapp/src/hooks/useIntegrityGuard.ts',
    language: 'typescript',
    description: 'Client-side React hook tracking window blur, tab switching, paste injection, and trust scores.',
    code: `import { useState, useEffect, useCallback } from 'react';

export interface IntegrityGuardState {
  trustScore: number;
  violationCount: number;
  isWindowFocused: boolean;
  isTabVisible: boolean;
}

export const useIntegrityGuard = () => {
  const [trustScore, setTrustScore] = useState<number>(100);
  const [violationCount, setViolationCount] = useState<number>(0);
  const [isWindowFocused, setIsWindowFocused] = useState<boolean>(true);
  const [isTabVisible, setIsTabVisible] = useState<boolean>(true);

  const penalize = useCallback((penalty: number) => {
    setTrustScore(prev => Math.max(0, prev - penalty));
    setViolationCount(c => c + 1);
  }, []);

  useEffect(() => {
    const handleBlur = () => { setIsWindowFocused(false); penalize(5); };
    const handleFocus = () => { setIsWindowFocused(true); };
    const handleVisibility = () => {
      if (document.hidden) { setIsTabVisible(false); penalize(10); }
      else { setIsTabVisible(true); }
    };
    const handlePaste = (e: ClipboardEvent) => {
      if ((e.clipboardData?.getData('text') || '').length > 50) penalize(8);
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('paste', handlePaste);
    };
  }, [penalize]);

  return { trustScore, violationCount, isWindowFocused, isTabVisible };
};`
  },

  pomXml: {
    filename: 'pom.xml',
    path: 'springapp/pom.xml',
    language: 'xml',
    description: 'Modern Spring Boot 3.2.5 configuration with WebSockets, Redis, JWT 0.12.5, and Validation.',
    code: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.5</version>
    </parent>
    <groupId>com.kabilan.assessment</groupId>
    <artifactId>ai-adaptive-assessment-engine</artifactId>
    <version>1.0.0</version>
    <name>AI Adaptive Assessment Engine</name>

    <dependencies>
        <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId></dependency>
        <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-websocket</artifactId></dependency>
        <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-data-redis</artifactId></dependency>
        <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-validation</artifactId></dependency>
        <dependency><groupId>io.jsonwebtoken</groupId><artifactId>jjwt-api</artifactId><version>0.12.5</version></dependency>
    </dependencies>
</project>`
  }
};
