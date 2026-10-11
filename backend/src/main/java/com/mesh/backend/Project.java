
package com.mesh.backend;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(length = 2000)
    private String description;

    private String category;
    private String department;
    private int members;
    private String needed;
    private String color;

    // Student who created this project
    private Long ownerId;

    @ElementCollection
    @CollectionTable(
        name = "project_skills",
        joinColumns = @JoinColumn(name = "project_id")
    )
    @Column(name = "skill")
    private List<String> skills = new ArrayList<>();

    public Project() {}

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public int getMembers() {
        return members;
    }

    public void setMembers(int members) {
        this.members = members;
    }

    public String getNeeded() {
        return needed;
    }

    public void setNeeded(String needed) {
        this.needed = needed;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public List<String> getSkills() {
        return skills;
    }

    public void setSkills(List<String> skills) {
        this.skills = skills != null
            ? skills
            : new ArrayList<>();
    }
}
