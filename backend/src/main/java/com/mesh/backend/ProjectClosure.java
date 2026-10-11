
package com.mesh.backend;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "project_closures")
public class ProjectClosure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long projectId;
    private Long ownerId;

    private String status = "PENDING";

    private LocalDateTime createdAt = LocalDateTime.now();

    public ProjectClosure() {}

    public Long getId() {
        return id;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
