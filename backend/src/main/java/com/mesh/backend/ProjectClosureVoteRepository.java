
package com.mesh.backend;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectClosureVoteRepository
        extends JpaRepository<ProjectClosureVote, Long> {

    List<ProjectClosureVote> findByClosureIdOrderByIdAsc(
        Long closureId
    );

    Optional<ProjectClosureVote> findByClosureIdAndStudentId(
        Long closureId, Long studentId
    );
    void deleteByClosureId(Long closureId);
    List<ProjectClosureVote> findByStudentIdOrderByIdDesc(
    Long studentId
);
}
