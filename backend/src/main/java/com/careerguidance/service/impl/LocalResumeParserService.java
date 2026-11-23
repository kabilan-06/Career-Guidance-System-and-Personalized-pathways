package com.careerguidance.service.impl;

import com.careerguidance.entity.SkillTaxonomy;
import com.careerguidance.service.ResumeParserService;
import com.careerguidance.service.SkillTaxonomyService;
import com.careerguidance.service.TextExtractionService;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Local rule-based resume parser used by the standard upload flow
 * (/api/resumes/{id}/parse). Extracts text with the shared PDFBox/POI
 * {@link TextExtractionService} and matches skills against the taxonomy
 * normalization service, so parsed skills match the same canonical identity
 * used by the NLP pipeline, job matching, and skill-gap analysis.
 */
@Service
public class LocalResumeParserService implements ResumeParserService {

    /** Skill dictionary scanned case-insensitively against the resume text. */
    private static final String[] SKILL_KEYWORDS = {
            "Java", "Python", "JavaScript", "TypeScript", "C++", "C#", "Go", "Kotlin", "PHP", "Ruby", "R", "Scala", "Swift",
            "React", "React.js", "Angular", "Vue.js", "Next.js", "Node.js", "Express.js", "Spring Boot", "Spring",
            "Hibernate", "JPA", "Django", "Flask", "FastAPI", ".NET", "ASP.NET",
            "HTML", "CSS", "Tailwind CSS", "Bootstrap", "Sass",
            "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Oracle", "SQLite", "Firebase",
            "Docker", "Kubernetes", "AWS", "Google Cloud", "Microsoft Azure", "Jenkins", "Git", "GitHub", "GitLab",
            "CI/CD", "Terraform", "Linux", "Bash", "Nginx", "Apache",
            "REST API", "GraphQL", "Microservices", "Kafka", "RabbitMQ", "Elasticsearch", "gRPC",
            "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-Learn", "Keras",
            "Pandas", "NumPy", "OpenCV", "NLP", "Computer Vision",
            "Flutter", "React Native", "Android", "iOS",
            "Agile", "Scrum", "Jira", "Unit Testing", "Jest", "JUnit", "Selenium", "Cypress",
    };

    private final TextExtractionService textExtractionService;
    private final SkillTaxonomyService skillTaxonomyService;

    public LocalResumeParserService(TextExtractionService textExtractionService,
                                    SkillTaxonomyService skillTaxonomyService) {
        this.textExtractionService = textExtractionService;
        this.skillTaxonomyService = skillTaxonomyService;
    }

    @Override
    public List<String> extractSkills(Path file) {
        String text = textExtractionService.extractText(file);
        String lowerText = text.toLowerCase(Locale.ROOT);

        List<String> found = new ArrayList<>();
        for (String skill : SKILL_KEYWORDS) {
            String needle = skill.toLowerCase(Locale.ROOT);
            if (lowerText.contains(needle)) {
                try {
                    SkillTaxonomy taxonomy = skillTaxonomyService.normalizeSkill(skill);
                    found.add(taxonomy.getNormalizedName() != null ? taxonomy.getNormalizedName() : skill);
                } catch (RuntimeException ex) {
                    // Taxonomy persistence hiccup must not fail the whole parse.
                    found.add(skill);
                }
            }
        }
        return found.stream().distinct().toList();
    }

    @Override
    public String generateResumeSummary(Path file) {
        List<String> skills = extractSkills(file);
        if (skills.isEmpty()) {
            return "No recognizable technical skills detected in this resume.";
        }
        return "Detected " + skills.size() + " skill(s): " + String.join(", ", skills) + ".";
    }
}
