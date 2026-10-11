
package com.mesh.backend;

import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = {"http://localhost:5173", "https://unimesh.netlify.app"})
public class StudentController {

    private final StudentRepository repository;

    public StudentController(StudentRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Student> getAllStudents() {
        return repository.findAll();
    }

    @PostMapping
    public Student addStudent(@RequestBody Student student) {
        return repository.save(student);
    }

    @GetMapping("/{id}")
    public Optional<Student> getStudent(@PathVariable Long id) {
        return repository.findById(id);
    }

    @DeleteMapping("/{id}")
    public void deleteStudent(@PathVariable Long id) {
        repository.deleteById(id);
    }

    // AI-assisted skill matching for a project's required skills
    @GetMapping("/match")
    public List<Map<String, Object>> matchStudents(
            @RequestParam String skills,
            @RequestParam(required = false) Long excludeId) {

        List<String> requiredSkills = Arrays.stream(skills.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(String::toLowerCase)
                .distinct()
                .collect(Collectors.toList());

        if (requiredSkills.isEmpty()) {
            return Collections.emptyList();
        }

        return repository.findAll().stream()
                .filter(student -> excludeId == null || !student.getId().equals(excludeId))
                .map(student -> {
                    List<String> studentSkills = Arrays.stream(
                                    student.getSkills().split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .map(String::toLowerCase)
                            .distinct()
                            .collect(Collectors.toList());

                    List<String> matchedSkills = requiredSkills.stream()
                            .filter(required -> studentSkills.stream()
                                    .anyMatch(skill ->
                                            skill.equals(required)
                                            || skill.contains(required)
                                            || required.contains(skill)))
                            .collect(Collectors.toList());

                    int score = (int) Math.round(
                            matchedSkills.size() * 100.0
                                    / requiredSkills.size());

                    Map<String, Object> result = new LinkedHashMap<>();
                    result.put("id", student.getId());
                    result.put("name", student.getName());
                    result.put("department", student.getDepartment());
                    result.put("skills", student.getSkills());
                    result.put("email", student.getEmail());
                    result.put("matchedSkills", matchedSkills);
                    result.put("matchPercentage", score);
                    result.put("reason", matchedSkills.isEmpty()
                            ? "No direct skill matches found."
                            : "Matches " + String.join(", ", matchedSkills));

                    return result;
                })
                .filter(student -> (int) student.get("matchPercentage") > 0)
                .sorted((a, b) -> Integer.compare(
                        (int) b.get("matchPercentage"),
                        (int) a.get("matchPercentage")))
                .collect(Collectors.toList());
    }
}
