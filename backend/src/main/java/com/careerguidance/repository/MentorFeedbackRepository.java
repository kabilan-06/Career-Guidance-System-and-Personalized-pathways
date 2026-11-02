package com.careerguidance.repository;
import com.careerguidance.entity.MentorFeedback; import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface MentorFeedbackRepository extends JpaRepository<MentorFeedback,Long>{
    List<MentorFeedback> findByMentorIdOrderByCreatedAtDesc(Long mentorId);
}
