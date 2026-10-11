
package com.mesh.backend;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class ProjectClosureController {

    private final ProjectRepository projects;
    private final ProjectClosureRepository closures;
    private final ProjectClosureVoteRepository votes;
    private final JoinRequestRepository requests;
    private final StudentRepository students;

    public ProjectClosureController(
            ProjectRepository projects,
            ProjectClosureRepository closures,
            ProjectClosureVoteRepository votes,
            JoinRequestRepository requests,
            StudentRepository students) {
        this.projects = projects;
        this.closures = closures;
        this.votes = votes;
        this.requests = requests;
        this.students = students;
    }

    // OWNER REQUESTS PROJECT CLOSURE
    @PostMapping("/api/projects/{projectId}/closure")
    @Transactional
    public ResponseEntity<?> requestClosure(
            @PathVariable Long projectId,
            @RequestBody Map<String, Object> body) {

        Long ownerId = readId(body.get("ownerId"));

        if (ownerId == null) {
            return error(HttpStatus.BAD_REQUEST, "Invalid owner ID.");
        }

        Project project = projects.findById(projectId).orElse(null);

        if (project == null) {
            return error(HttpStatus.NOT_FOUND, "Project not found.");
        }

        if (!ownerId.equals(project.getOwnerId())) {
            return error(HttpStatus.FORBIDDEN,
                    "Only the project owner can request closure.");
        }

        if (closures.findFirstByProjectIdAndStatusOrderByIdDesc(
                projectId, "PENDING") != null) {
            return error(HttpStatus.CONFLICT,
                    "A closure request is already pending.");
        }

        List<JoinRequest> accepted =
                requests.findByProjectIdAndStatus(
                        String.valueOf(projectId), "ACCEPTED");

        Set<Long> memberIds = accepted.stream()
                .map(JoinRequest::getStudentId)
                .filter(Objects::nonNull)
                .filter(id -> !id.equals(ownerId))
                .collect(Collectors.toCollection(LinkedHashSet::new));

        ProjectClosure closure = new ProjectClosure();
        closure.setProjectId(projectId);
        closure.setOwnerId(ownerId);
        closure.setStatus("PENDING");
        closure = closures.save(closure);

        // No other members: closure can proceed immediately.
        if (memberIds.isEmpty()) {
            closure.setStatus("APPROVED");
            closures.save(closure);
            removeProject(project);
            return ResponseEntity.ok(Map.of(
                    "message", "Project closed successfully.",
                    "status", "APPROVED"));
        }

        for (Long memberId : memberIds) {
            ProjectClosureVote vote = new ProjectClosureVote();
            vote.setClosureId(closure.getId());
            vote.setStudentId(memberId);
            vote.setStudentName(
                    students.findById(memberId)
                            .map(Student::getName)
                            .orElse("Student"));
            vote.setStatus("PENDING");
            votes.save(vote);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(
                Map.of(
                        "message",
                        "Closure request sent to all project members.",
                        "closureId", closure.getId(),
                        "status", "PENDING"));
    }

    // MEMBER VIEWS CLOSURE NOTIFICATIONS
    @GetMapping("/api/project-closures/student/{studentId}")
    public List<Map<String, Object>> getNotifications(
            @PathVariable Long studentId) {

        List<Map<String, Object>> result = new ArrayList<>();

        for (ProjectClosureVote vote :
                votes.findByStudentIdOrderByIdDesc(studentId)) {

            ProjectClosure closure =
                    closures.findById(vote.getClosureId()).orElse(null);

            if (closure == null) {
                continue;
            }

            Project project =
                    projects.findById(closure.getProjectId()).orElse(null);

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("voteId", vote.getId());
            item.put("closureId", closure.getId());
            item.put("projectId", closure.getProjectId());
            item.put("projectTitle",
                    project == null ? "Deleted project" : project.getTitle());
            item.put("ownerId", closure.getOwnerId());
            item.put("voteStatus", vote.getStatus());
            item.put("closureStatus", closure.getStatus());

            result.add(item);
        }

        return result;
    }

    // MEMBER APPROVES OR REJECTS CLOSURE
    @PatchMapping("/api/project-closures/votes/{voteId}")
    @Transactional
    public ResponseEntity<?> castVote(
            @PathVariable Long voteId,
            @RequestBody Map<String, Object> body) {

        Long studentId = readId(body.get("studentId"));

        if (studentId == null) {
            return error(HttpStatus.BAD_REQUEST, "Invalid student ID.");
        }

        String decision = String.valueOf(
                body.getOrDefault("status", ""))
                .toUpperCase(Locale.ROOT);

        if (!List.of("APPROVED", "REJECTED").contains(decision)) {
            return error(HttpStatus.BAD_REQUEST,
                    "Choose APPROVED or REJECTED.");
        }

        ProjectClosureVote vote =
                votes.findById(voteId).orElse(null);

        if (vote == null) {
            return error(HttpStatus.NOT_FOUND, "Vote not found.");
        }

        if (!studentId.equals(vote.getStudentId())) {
            return error(HttpStatus.FORBIDDEN,
                    "This vote belongs to another student.");
        }

        ProjectClosure closure =
                closures.findById(vote.getClosureId()).orElse(null);

        if (closure == null || !"PENDING".equals(closure.getStatus())) {
            return error(HttpStatus.CONFLICT,
                    "This closure request is no longer pending.");
        }

        if (!"PENDING".equals(vote.getStatus())) {
            return error(HttpStatus.CONFLICT,
                    "You have already responded.");
        }

        vote.setStatus(decision);
        votes.save(vote);

        // One rejection cancels the closure request.
        if ("REJECTED".equals(decision)) {
            closure.setStatus("CANCELLED");
            closures.save(closure);

            return ResponseEntity.ok(Map.of(
                    "message",
                    "Closure cancelled because a member rejected it.",
                    "status", "CANCELLED"));
        }

        List<ProjectClosureVote> allVotes =
                votes.findByClosureIdOrderByIdAsc(closure.getId());

        boolean allApproved = allVotes.stream()
                .allMatch(v -> "APPROVED".equals(v.getStatus()));

        if (allApproved) {
            Project project = projects.findById(
                    closure.getProjectId()).orElse(null);

            if (project == null) {
                closure.setStatus("CANCELLED");
                closures.save(closure);
                return error(HttpStatus.NOT_FOUND,
                        "Project no longer exists.");
            }

            closure.setStatus("APPROVED");
            closures.save(closure);
            removeProject(project);

            return ResponseEntity.ok(Map.of(
                    "message", "All members approved. Project closed.",
                    "status", "APPROVED"));
        }

        return ResponseEntity.ok(Map.of(
                "message", "Your approval has been recorded.",
                "status", "PENDING"));
    }

    // ACCEPTED MEMBER LEAVES A PROJECT
    @PostMapping("/api/projects/{projectId}/leave")
    @Transactional
    public ResponseEntity<?> leaveProject(
            @PathVariable Long projectId,
            @RequestBody Map<String, Object> body) {

        Long studentId = readId(body.get("studentId"));

        if (studentId == null) {
            return error(HttpStatus.BAD_REQUEST, "Invalid student ID.");
        }

        Project project = projects.findById(projectId).orElse(null);

        if (project == null) {
            return error(HttpStatus.NOT_FOUND, "Project not found.");
        }

        if (studentId.equals(project.getOwnerId())) {
            return error(HttpStatus.BAD_REQUEST,
                    "The owner must use the project closure process.");
        }

        JoinRequest membership =
                requests.findByProjectIdAndStudentIdAndStatus(
                        String.valueOf(projectId),
                        studentId,
                        "ACCEPTED").orElse(null);

        if (membership == null) {
            return error(HttpStatus.CONFLICT,
                    "You are not an active member of this project.");
        }

        membership.setStatus("LEFT");
        requests.save(membership);

        project.setMembers(Math.max(1, project.getMembers() - 1));
        projects.save(project);

        return ResponseEntity.ok(Map.of(
                "message", "You have left the project.",
                "status", "LEFT"));
    }

    // CLEAN UP RELATED DATA WHEN CLOSURE IS APPROVED
    private void removeProject(Project project) {
        String projectId = String.valueOf(project.getId());

        List<JoinRequest> projectRequests =
                requests.findByProjectIdInOrderByIdDesc(
                        List.of(projectId));

        requests.deleteAll(projectRequests);

        List<ProjectClosure> projectClosures =
                closures.findByProjectIdOrderByIdDesc(project.getId());

        for (ProjectClosure closure : projectClosures) {
            votes.deleteByClosureId(closure.getId());
            closures.delete(closure);
        }

        projects.delete(project);
    }

    private Long readId(Object value) {
        try {
            return value == null ? null :
                    Long.valueOf(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private ResponseEntity<Map<String, String>> error(
            HttpStatus status, String message) {
        return ResponseEntity.status(status)
                .body(Map.of("message", message));
    }
}
