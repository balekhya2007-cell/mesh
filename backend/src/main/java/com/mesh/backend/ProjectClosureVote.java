
package com.mesh.backend;

import jakarta.persistence.*;

@Entity
@Table(name = "project_closure_votes")
public class ProjectClosureVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long closureId;
    private Long studentId;

    private String studentName;
    private String status = "PENDING";

    public ProjectClosureVote() {}

    public Long getId() {
        return id;
    }

    public Long getClosureId() {
        return closureId;
    }

    public void setClosureId(Long closureId) {
        this.closureId = closureId;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
