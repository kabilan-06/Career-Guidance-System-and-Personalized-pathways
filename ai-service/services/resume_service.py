import os
import uuid
import time
import logging
from typing import Dict, Any
from fastapi import UploadFile, HTTPException

from pipeline.doc_processor import doc_processor
from pipeline.nlp_parser import ResumeNLPParser
from pipeline.job_matcher import JobMatcherEngine
from pipeline.skill_gap import SkillGapAnalyzer
from pipeline.course_recommender import CourseRecommender
from pipeline.explainer import generate_explanations
from pipeline.career_guidance import CareerGuidanceEngine
from pipeline.roadmap_generator import RoadmapGenerator
from pipeline.cache_store import cache_store

logger = logging.getLogger(__name__)

STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage")
os.makedirs(STORAGE_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

class ResumePipelineService:
    @staticmethod
    async def process_resume_file(file: UploadFile) -> Dict[str, Any]:
        start_time = time.time()
        filename = file.filename or "uploaded_resume.pdf"
        ext = os.path.splitext(filename)[1].lower()

        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format '{ext}'. Allowed formats: PDF, DOCX, DOC, TXT."
            )

        # Read file bytes to validate size
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size exceeds maximum 10MB limit.")

        request_id = str(uuid.uuid4())
        temp_filename = f"{request_id}{ext}"
        temp_file_path = os.path.join(STORAGE_DIR, temp_filename)

        try:
            # Write file to temp storage
            with open(temp_file_path, "wb") as f:
                f.write(content)

            # 1. Document Extraction (Docling / RapidOCR / Fallback)
            extracted_text, extraction_method = doc_processor.process_document(temp_file_path)

            if not extracted_text or len(extracted_text.strip()) == 0:
                raise HTTPException(
                    status_code=422,
                    detail="Failed to extract readable text from document."
                )

            # 2. NLP Section & Skill Normalization
            contact_info = ResumeNLPParser.parse_contact_info(extracted_text)
            skills_analysis = ResumeNLPParser.extract_skills_analysis(extracted_text)
            sections = ResumeNLPParser.extract_sections(extracted_text)

            candidate_skills = skills_analysis["normalized_skills"]
            if not candidate_skills:
                candidate_skills = ["Communication", "Problem Solving", "Git"]

            resume_data = {
                "filename": filename,
                "file_type": ext.lstrip("."),
                "extraction_method": extraction_method,
                "processing_status": "completed",
                "personal_information": contact_info,
                "summary": sections["summary"],
                "skills": candidate_skills,
                "skill_categories": skills_analysis["skill_categories"],
                "technical_skills": skills_analysis["technical_skills"],
                "professional_skills": skills_analysis["professional_skills"],
                "experience": sections["experience"],
                "education": sections["education"],
                "projects": sections["projects"],
                "certifications": sections["certifications"]
            }

            # 3. Semantic Job Matching & Ranking
            job_matches = JobMatcherEngine.match_jobs(candidate_skills, sections["summary"])

            # 4. Skill-Gap & Readiness Analysis
            top_job = job_matches[0] if job_matches else {"job_title": "Software Engineer", "matched_skills": candidate_skills, "missing_skills": []}
            gap_analysis = SkillGapAnalyzer.analyze_gaps(candidate_skills, top_job)

            # 5. Course Recommendations
            learning_priorities = gap_analysis["learning_priorities"]
            course_recommendations = CourseRecommender.recommend_courses(learning_priorities, gap_analysis["career_role"])

            # 6. SHAP & Rule Explainability
            explanations = generate_explanations(course_recommendations)

            # 7. Career Guidance & Role Ranking
            career_analysis = CareerGuidanceEngine.analyze_career(job_matches, candidate_skills)

            # 8. Learning & Career Roadmap Generation
            roadmap = RoadmapGenerator.generate_roadmap(gap_analysis["skill_gaps"], course_recommendations, gap_analysis["career_role"])

            # 9. Per-role guidance so the UI can switch career targets (courses,
            # skill gaps and roadmap) without re-running inference. Each entry
            # mirrors the role payload shape already consumed by the frontend.
            role_guidance = []
            for index, match in enumerate(job_matches[:5]):
                if index == 0:
                    role_gap = gap_analysis
                    role_courses = course_recommendations
                    role_explanations = explanations
                    role_roadmap = roadmap
                else:
                    role_gap = SkillGapAnalyzer.analyze_gaps(candidate_skills, match)
                    role_courses = CourseRecommender.recommend_courses(role_gap["learning_priorities"], role_gap["career_role"])
                    role_explanations = generate_explanations(role_courses)
                    role_roadmap = RoadmapGenerator.generate_roadmap(role_gap["skill_gaps"], role_courses, role_gap["career_role"])

                high_gaps = [g["skill"] for g in role_gap["skill_gaps"] if g["priority"] == "High"]
                medium_gaps = [g["skill"] for g in role_gap["skill_gaps"] if g["priority"] == "Medium"]
                low_gaps = [g["skill"] for g in role_gap["skill_gaps"] if g["priority"] == "Low"]
                readiness = role_gap["readiness_score"]

                courses_with_explanations = []
                for course, explanation in zip(role_courses, role_explanations):
                    enriched = dict(course)
                    enriched["explanation"] = explanation
                    courses_with_explanations.append(enriched)

                role_guidance.append({
                    "job": {
                        "job_id": match.get("job_id"),
                        "job_title": match["job_title"],
                        "company": match["company"],
                        "domain": match["domain"],
                        "domain_score": match["match_score"],
                        "final_role_score": match["match_score"],
                        "rank": match.get("rank", index + 1),
                    },
                    "skills_you_have": match["matched_skills"],
                    "skills_to_learn": role_gap["learning_priorities"],
                    "career_fit": {
                        "career_readiness_percentage": readiness,
                        "overall_skill_gap_percentage": round(100.0 - readiness, 1),
                        "status": "Strong readiness" if readiness >= 70 else "Developing readiness",
                    },
                    # Only tiers that actually contain gaps are emitted, so the UI
                    # never shows an empty "0% (0/0)" coverage card.
                    "skill_gap": {
                        "required": ({"missing_skills": high_gaps} if high_gaps else None),
                        "preferred": ({"missing_skills": medium_gaps} if medium_gaps else None),
                        "soft_skills": ({"missing_skills": low_gaps} if low_gaps else None),
                        "career_readiness_percentage": readiness,
                        "overall_skill_gap_percentage": round(100.0 - readiness, 1),
                    },
                    "skill_summary": {
                        "skills_you_have_count": len(match["matched_skills"]),
                        "skills_to_learn_count": len(role_gap["skill_gaps"]),
                        "required_missing_count": len(high_gaps),
                    },
                    "recommended_courses": courses_with_explanations,
                    "role_explanation": {
                        "summary": match.get("job_summary", ""),
                        "why_ranked_here": (
                            f"Ranked #{match.get('rank', index + 1)} for this profile with a "
                            f"{match['match_score']}% composite score (60% skill overlap and "
                            f"40% semantic similarity of {match['semantic_similarity']})."
                        ),
                        "skills_you_have": match["matched_skills"],
                        "main_skill_gaps": match["missing_skills"],
                    },
                    "roadmap": role_roadmap,
                })

            execution_time = round(time.time() - start_time, 3)

            full_result = {
                "success": True,
                "request_id": request_id,
                "resume": resume_data,
                "job_matches": job_matches,
                "career_analysis": career_analysis["domain_analysis"],
                "skill_gaps": gap_analysis["skill_gaps"],
                "learning_priorities": learning_priorities,
                "course_recommendations": course_recommendations,
                "explanations": explanations,
                "career_guidance": {
                    "recommended_roles": career_analysis["recommended_roles"],
                    "domain_analysis": career_analysis["domain_analysis"]
                },
                "roadmap": roadmap,
                "role_guidance": role_guidance,
                "execution_time": execution_time
            }

            # Save in TTL Cache
            cache_store.put(request_id, full_result)
            return full_result

        finally:
            # Clean up temp file
            if os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except Exception as e:
                    logger.warning(f"Failed to remove temp file {temp_file_path}: {e}")
