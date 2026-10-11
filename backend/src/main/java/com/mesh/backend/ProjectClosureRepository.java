
package com.mesh.backend;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectClosureRepository
        extends JpaRepository<ProjectClosure, Long> {

    List<ProjectClosure> findByProjectIdOrderByIdDesc(
        Long projectId
    );

    List<ProjectClosure> findByOwnerIdOrderByIdDesc(
        Long ownerId
    );
    ProjectClosure findFirstByProjectIdAndStatusOrderByIdDesc(
    Long projectId, String status
);

}
