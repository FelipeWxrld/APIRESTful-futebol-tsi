package com.example.footballapi.security;

import jakarta.persistence.*;

@Entity
@Table(name = "api_keys")
public class ApiKey {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "api_key", unique = true, nullable = false)
    private String key;

    @Column(nullable = false)
    private String owner;

    @Column(nullable = false)
    private String role; // Ex: READ, WRITE, ADMIN

    private boolean active = true;

    public ApiKey() {}

    public ApiKey(String key, String owner, String role) {
        this.key = key;
        this.owner = owner;
        this.role = role;
        this.active = true;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }
    public String getOwner() { return owner; }
    public void setOwner(String owner) { this.owner = owner; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
