package com.mesh.backend;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/join-requests")
@CrossOrigin(origins = "http://localhost:5173")
public class JoinRequestController {

    private final JoinRequestRepository requests;
    private final StudentRepository students;
    private final ProjectRepository projects;

    public JoinRequestController(
        JoinRequestRepository requests,
        StudentRepository students,
        ProjectRepository projects
    ) {
        this.requests = requests;
        this.students = students;
        this.projects = projects;
    }

    @GetMapping("/student/{studentId}")
    public List<JoinRequest> sent(@PathVariable Long studentId) {

        List<JoinRequest> result =
            requests.findByStudentIdOrderByIdDesc(studentId);

        for (JoinRequest r : result) {
            setProjectOwnerName(r);
        }

        return result;
    }

    @GetMapping("/owner/{ownerId}")
    public List<JoinRequest> incoming(@PathVariable Long ownerId) {

        List<String> ids = projects.findAll().stream()
            .filter(p -> p.getOwnerId() != null
                && p.getOwnerId().equals(ownerId))
            .map(p -> String.valueOf(p.getId()))
            .collect(Collectors.toList());

        if (ids.isEmpty()) {
            return List.of();
        }

        List<JoinRequest> result =
            requests.findByProjectIdInOrderByIdDesc(ids);

        for (JoinRequest r : result) {
            setProjectOwnerName(r);
        }

        return result;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {

        String projectId = String.valueOf(body.get("projectId"));
        String title = String.valueOf(body.get("projectTitle"));

        Long studentId;

        try {
            studentId =
                Long.valueOf(String.valueOf(body.get("studentId")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "Invalid student ID."));
        }

        if (!projectId.matches("\\d+")) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "Invalid project ID."));
        }

        Project project =
            projects.findById(Long.valueOf(projectId)).orElse(null);

        if (project == null) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "Project not found."));
        }

if (requests.existsByProjectIdAndStudentId(
    projectId, studentId
)) {
    return ResponseEntity.status(HttpStatus.CONFLICT)
        .body(Map.of(
            "message",
            "You have already requested to join this project."
        ));
}

        JoinRequest r = new JoinRequest();

        r.setProjectId(projectId);
        r.setProjectTitle(title);
        r.setStudentId(studentId);

        students.findById(studentId).ifPresent(s -> {
            r.setStudentName(s.getName());
            r.setStudentDepartment(s.getDepartment());
        });

        setProjectOwnerName(r);

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(requests.save(r));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> withdraw(@PathVariable Long id) {

        JoinRequest r = requests.findById(id).orElse(null);

        if (r == null) {
            return ResponseEntity.notFound().build();
        }

        if (!"PENDING".equals(r.getStatus())) {
            return ResponseEntity.badRequest()
                .body(Map.of(
                    "message",
                    "Only pending requests can be withdrawn."
                ));
        }

        requests.delete(r);

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    @Transactional
    public ResponseEntity<?> update(
        @PathVariable Long id,
        @RequestBody Map<String, String> body
    ) {

        JoinRequest r = requests.findById(id).orElse(null);

        if (r == null) {
            return ResponseEntity.notFound().build();
        }

        String status =
            body.getOrDefault("status", "").toUpperCase();

        if (!List.of("ACCEPTED", "REJECTED").contains(status)) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "Invalid status."));
        }

        if (!"PENDING".equals(r.getStatus())) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "Request already reviewed."));
        }

        if ("ACCEPTED".equals(status)) {

            Long projectId;

            try {
                projectId = Long.valueOf(r.getProjectId());
            } catch (Exception e) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid project ID."));
            }

            Project project =
                projects.findById(projectId).orElse(null);

            if (project == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Project not found."));
            }

            project.setMembers(
                Math.max(1, project.getMembers()) + 1
            );

            projects.save(project);
        }

        r.setStatus(status);
        setProjectOwnerName(r);

        return ResponseEntity.ok(requests.save(r));
    }

    private void setProjectOwnerName(JoinRequest request) {

        try {

            Long projectId =
                Long.valueOf(request.getProjectId());

            Project project =
                projects.findById(projectId).orElse(null);

            if (project == null || project.getOwnerId() == null) {
                return;
            }

            students.findById(project.getOwnerId())
                .ifPresent(owner ->
                    request.setProjectOwnerName(owner.getName())
                );

        } catch (Exception e) {
            // Leave owner name empty if project data is invalid.
        }
    }
}