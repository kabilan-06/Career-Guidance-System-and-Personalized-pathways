package com.careerguidance.repository;
import com.careerguidance.entity.ResumeFeedback; import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ResumeFeedbackRepository extends JpaRepository<ResumeFeedback,Long>{
    List<ResumeFeedback> findByMentorIdOrderByCreatedAtDesc(Long mentorId);
}
