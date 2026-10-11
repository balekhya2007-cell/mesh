
package com.mesh.backend;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JoinRequestRepository
        extends JpaRepository<JoinRequest, Long> {

    List<JoinRequest> findByStudentIdOrderByIdDesc(Long studentId);

    List<JoinRequest> findByProjectIdInOrderByIdDesc(
        List<String> projectIds
    );

    Optional<JoinRequest> findByProjectIdAndStudentIdAndStatus(
        String projectId, Long studentId, String status
    );

    boolean existsByProjectIdAndStudentId(
        String projectId, Long studentId
    );
    List<JoinRequest> findByProjectIdAndStatus(
    String projectId, String status
);

void deleteByProjectId(String projectId);
}
