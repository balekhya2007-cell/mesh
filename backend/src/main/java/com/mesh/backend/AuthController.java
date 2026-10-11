
package com.mesh.backend;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final StudentRepository repository;
    private final BCryptPasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();

    public AuthController(StudentRepository repository) {
        this.repository = repository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody RegisterRequest request) {

        if (request.getName() == null
                || request.getEmail() == null
                || request.getPassword() == null
                || request.getName().isBlank()
                || request.getEmail().isBlank()
                || request.getPassword().length() < 8) {

            return ResponseEntity.badRequest().body(
                    Map.of("message",
                            "Enter your name and email, and use a password with at least 8 characters."));
        }

        String email = request.getEmail()
                .trim().toLowerCase();

        if (repository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message",
                            "An account with this email already exists."));
        }

        Student student = new Student(
                request.getName().trim(),
                request.getDepartment(),
                request.getSkills(),
                email,
                passwordEncoder.encode(request.getPassword())
        );

        Student saved = repository.save(student);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(publicUser(saved));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request) {

        if (request.getEmail() == null
                || request.getPassword() == null) {
            return ResponseEntity.badRequest().body(
                    Map.of("message",
                            "Email and password are required."));
        }

        String email = request.getEmail()
                .trim().toLowerCase();

        return repository.findByEmail(email)
                .filter(student -> passwordEncoder.matches(
                        request.getPassword(),
                        student.getPasswordHash()))
                .<ResponseEntity<?>>map(student ->
                        ResponseEntity.ok(publicUser(student)))
                .orElseGet(() ->
                        ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                .body(Map.of("message",
                                        "Invalid email or password.")));
    }

    private Map<String, Object> publicUser(Student student) {
        Map<String, Object> user = new LinkedHashMap<>();
        user.put("id", student.getId());
        user.put("name", student.getName());
        user.put("email", student.getEmail());
        user.put("department", student.getDepartment());
        user.put("skills", student.getSkills());
        return user;
    }
}
