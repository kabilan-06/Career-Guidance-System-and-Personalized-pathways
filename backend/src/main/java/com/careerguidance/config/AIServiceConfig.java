package com.careerguidance.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.http.converter.ResourceHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.http.converter.support.AllEncompassingFormHttpMessageConverter;
import org.springframework.web.client.RestClient;

/**
 * HTTP wiring for the local FastAPI AI service (resume analysis + job matching).
 * All AI inference runs locally; no external or cloud AI provider is involved.
 */
@Configuration
public class AIServiceConfig {

    private final AIServiceProperties aiServiceProperties;

    public AIServiceConfig(AIServiceProperties aiServiceProperties) {
        this.aiServiceProperties = aiServiceProperties;
    }

    @Bean(name = "localAiRestClient")
    public RestClient localAiRestClient(ObjectMapper objectMapper) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(10000);
        // The first analysis loads the local embedding model into memory, which can
        // take a couple of minutes on CPU; subsequent requests are far faster.
        requestFactory.setReadTimeout(300000);

        return RestClient.builder()
                .baseUrl(aiServiceProperties.getBaseUrl())
                .requestFactory(requestFactory)
                .messageConverters(converters -> {
                    converters.add(new MappingJackson2HttpMessageConverter(objectMapper));
                    converters.add(new ResourceHttpMessageConverter());
                    converters.add(new AllEncompassingFormHttpMessageConverter());
                })
                .build();
    }
}
