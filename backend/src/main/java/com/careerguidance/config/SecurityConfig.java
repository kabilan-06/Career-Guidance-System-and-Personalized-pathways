package com.careerguidance.config;

import com.careerguidance.security.AuthTokenFilter;
import com.careerguidance.security.JwtUtils;
import com.careerguidance.security.UserDetailsServiceImpl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final JwtUtils jwtUtils;
    private final com.careerguidance.security.VerifiedMentorAuthorizationManager verifiedMentorAuthorizationManager;

    public SecurityConfig(UserDetailsServiceImpl userDetailsService, JwtUtils jwtUtils, com.careerguidance.security.VerifiedMentorAuthorizationManager verifiedMentorAuthorizationManager) {
        this.userDetailsService = userDetailsService;
        this.jwtUtils = jwtUtils;
        this.verifiedMentorAuthorizationManager = verifiedMentorAuthorizationManager;
    }

    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter(jwtUtils, userDetailsService);
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        String envOrigins = System.getenv("CORS_ALLOWED_ORIGINS");
        List<String> origins;
        if (envOrigins != null && !envOrigins.isBlank()) {
            origins = java.util.Arrays.stream(envOrigins.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        } else {
            origins = List.of(
                    "http://localhost:*",
                    "http://127.0.0.1:*",
                    "https://*.vercel.app",
                    "https://*.netlify.app",
                    "https://*.onrender.com"
            );
        }
        configuration.setAllowedOriginPatterns(origins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**", "/api/public/**", "/uploads/**", "/health",
                                "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html",
                                "/actuator/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/jobs", "/api/jobs/{id:[0-9]+}").permitAll()
                        // Admin/mentor sign-in must be reachable before a JWT exists; the endpoints
                        // themselves verify the role inside their controllers and reject others.
                        .requestMatchers(HttpMethod.POST, "/api/admin/login", "/api/mentor/login").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/student/**").hasRole("STUDENT")
                        .requestMatchers("/api/mentor/**").access(verifiedMentorAuthorizationManager)
                        .anyRequest().authenticated());

        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
