package com.mesh.backend;

import jakarta.persistence.*;

@Entity
@Table(name = "join_requests")
public class JoinRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String projectId;
    private String projectTitle;
    private Long studentId;
    private String studentName;
    private String studentDepartment;
    private String status = "PENDING";

    @Transient
    private String projectOwnerName;

    public JoinRequest() {}

    public Long getId() {
        return id;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String v) {
        projectId = v;
    }

    public String getProjectTitle() {
        return projectTitle;
    }

    public void setProjectTitle(String v) {
        projectTitle = v;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long v) {
        studentId = v;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String v) {
        studentName = v;
    }

    public String getStudentDepartment() {
        return studentDepartment;
    }

    public void setStudentDepartment(String v) {
        studentDepartment = v;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String v) {
        status = v;
    }

    public String getProjectOwnerName() {
        return projectOwnerName;
    }

    public void setProjectOwnerName(String name) {
        projectOwnerName = name;
    }
}