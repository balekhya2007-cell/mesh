
package com.mesh.backend;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "https://unimesh.netlify.app"})
public class HealthController {

    @GetMapping("/api/health")
    public String health() {
        return "MESH backend is running!";
    }
}
