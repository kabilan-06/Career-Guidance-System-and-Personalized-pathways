package com.careerguidance.repository;

import com.careerguidance.entity.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {

    List<JobApplication> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<JobApplication> findByJobIdOrderByCreatedAtDesc(Long jobId);

    Optional<JobApplication> findByUserIdAndJobId(Long userId, Long jobId);

    boolean existsByUserIdAndJobId(Long userId, Long jobId);
}
