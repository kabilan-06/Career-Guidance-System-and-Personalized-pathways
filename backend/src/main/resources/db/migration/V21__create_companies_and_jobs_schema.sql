-- V21: Create companies, jobs, and job_skills schema

CREATE TABLE IF NOT EXISTS companies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    location VARCHAR(255),
    logo_url VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jobs (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    location VARCHAR(255),
    employment_type VARCHAR(50) NOT NULL DEFAULT 'FULL_TIME',
    experience_level VARCHAR(50) NOT NULL DEFAULT 'ENTRY_LEVEL',
    salary_min NUMERIC(12, 2),
    salary_max NUMERIC(12, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    remote BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_jobs_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_skills (
    job_id BIGINT NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (job_id, skill_name),
    CONSTRAINT fk_job_skills_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(active);
CREATE INDEX IF NOT EXISTS idx_jobs_employment_type ON jobs(employment_type);
CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON jobs(experience_level);
CREATE INDEX IF NOT EXISTS idx_jobs_remote ON jobs(remote);
CREATE INDEX IF NOT EXISTS idx_job_skills_skill ON job_skills(skill_name);

-- Seed initial real industry companies and job openings
INSERT INTO companies (name, description, website, location, logo_url)
VALUES
('Google Cloud & Enterprise', 'Leading technology company providing global cloud and AI platforms.', 'https://cloud.google.com', 'Mountain View, CA', 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg'),
('Amazon Web Services', 'World leading cloud infrastructure and distributed enterprise computing platform.', 'https://aws.amazon.com', 'Seattle, WA', 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg'),
('Microsoft Azure Systems', 'Enterprise platform solutions, modern developer tools, and cloud platforms.', 'https://microsoft.com', 'Redmond, WA', 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg'),
('Stripe Financial Technologies', 'Financial infrastructure for the internet powering modern commerce.', 'https://stripe.com', 'San Francisco, CA', 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg'),
('Meta Platforms Inc', 'Global technology platform building immersive connection and open AI technologies.', 'https://meta.com', 'Menlo Park, CA', 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg')
ON CONFLICT DO NOTHING;

-- Seed initial jobs with varied roles, requirements, and skill tags
INSERT INTO jobs (company_id, title, description, requirements, location, employment_type, experience_level, salary_min, salary_max, currency, remote, active)
VALUES
(1, 'Full Stack Software Engineer', 'Design, develop, and deploy end-to-end full stack web applications using React, Node.js, and cloud services. Collaborate with cross-functional teams to build scalable user interfaces and resilient backend microservices.', 'Experience with React, Node.js, TypeScript, REST APIs, Git, and relational databases like PostgreSQL. Familiarity with Docker is a plus.', 'San Francisco, CA', 'FULL_TIME', 'MID_LEVEL', 125000.00, 165000.00, 'USD', TRUE, TRUE),
(2, 'Cloud DevOps Engineer', 'Build and maintain automated CI/CD deployment pipelines, container orchestration on Kubernetes, infrastructure as code, and cloud monitoring across AWS environments.', 'Hands-on experience with Docker, Kubernetes, AWS, Terraform, Jenkins/GitHub Actions, Linux system administration, and Python scripting.', 'Seattle, WA', 'FULL_TIME', 'MID_LEVEL', 130000.00, 175000.00, 'USD', TRUE, TRUE),
(3, 'Java Backend Engineer', 'Develop high-throughput enterprise backend services, RESTful microservices, and database persistence layers using Java and Spring Boot framework.', 'Proficiency in Java, Spring Boot, PostgreSQL, Microservices architecture, Hibernate/JPA, and Git. Experience with Redis caching is preferred.', 'New York, NY', 'FULL_TIME', 'ENTRY_LEVEL', 95000.00, 130000.00, 'USD', FALSE, TRUE),
(4, 'AI & Machine Learning Engineer', 'Build, evaluate, and deploy scalable machine learning and natural language processing models into production services.', 'Strong programming in Python, PyTorch or TensorFlow, Scikit-Learn, data modeling, REST APIs, and Docker containerization.', 'San Francisco, CA', 'FULL_TIME', 'MID_LEVEL', 140000.00, 190000.00, 'USD', TRUE, TRUE),
(5, 'Frontend Developer (React)', 'Craft pixel-perfect, accessible, and responsive web user interfaces with React, Tailwind CSS, and state management.', 'Expertise in modern JavaScript/TypeScript, React.js, Tailwind CSS, HTML5, CSS3, and browser performance optimization.', 'Remote', 'REMOTE', 'ENTRY_LEVEL', 85000.00, 115000.00, 'USD', TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- Seed skill mappings for seeded jobs
INSERT INTO job_skills (job_id, skill_name) VALUES
(1, 'React.js'), (1, 'Node.js'), (1, 'TypeScript'), (1, 'JavaScript'), (1, 'REST API'), (1, 'PostgreSQL'), (1, 'Git'), (1, 'Docker'),
(2, 'Docker'), (2, 'Kubernetes'), (2, 'AWS'), (2, 'Linux'), (2, 'CI/CD'), (2, 'Python'), (2, 'Git'),
(3, 'Java'), (3, 'Spring Boot'), (3, 'PostgreSQL'), (3, 'Microservices'), (3, 'SQL'), (3, 'Git'), (3, 'Docker'),
(4, 'Python'), (4, 'Machine Learning'), (4, 'Deep Learning'), (4, 'PyTorch'), (4, 'Docker'), (4, 'REST API'), (4, 'SQL'),
(5, 'React.js'), (5, 'JavaScript'), (5, 'TypeScript'), (5, 'Tailwind CSS'), (5, 'HTML'), (5, 'CSS'), (5, 'Git')
ON CONFLICT DO NOTHING;
