
package com.mesh.backend;

import org.springframework.web.bind.annotation.*;
import java.util.List;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = {"http://localhost:5173", "https://unimesh.netlify.app"})
public class ProjectController {

    private final ProjectRepository repository;

    public ProjectController(ProjectRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Project> getProjects() {
        return repository.findAll();
    }

    @PostMapping
    public Project addProject(@RequestBody Project project) {
        return repository.save(project);
    }

    @GetMapping("/{id}")
    public Project getProject(@PathVariable Long id) {
        return repository.findById(id).orElse(null);
    }

    
@DeleteMapping("/{id}")
public ResponseEntity<?> deleteProject(@PathVariable Long id) {
    return ResponseEntity.status(
        org.springframework.http.HttpStatus.CONFLICT
    ).body(java.util.Map.of(
        "message",
        "Projects cannot be deleted directly. Request closure and obtain member approval."
    ));
}

}
