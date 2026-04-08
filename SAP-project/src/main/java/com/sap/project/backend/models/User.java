package com.sap.project.backend.models;

import com.sap.project.backend.enums.Role;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

public class User {

    // --- FINAL fields (Immutable after creation) ---
    private final int id;
    private final String username;
    private final String email;
    private final LocalDateTime createdAt;

    // --- Mutable fields ---
    private String passwordHash;
    private boolean isActive;
    private Set<Role> roles;        // Connection with roles

    // Constructor
    public User(int id, String username, String email, String passwordHash, Set<Role> roles) {
        this.id = id;

        // 1. TEXT FIELD PROTECTION
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("The username cannot be empty.");
        }
        this.username = username;

        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("The email cannot be empty.");
        }
        this.email = email;

        if (passwordHash == null || passwordHash.trim().isEmpty()) {
            throw new IllegalArgumentException("The password cannot be empty.");
        }
        this.passwordHash = passwordHash;

        // We do not allow creating a user without a role.
        // If no role is provided (the list is null or empty),
        // we assign the READER role by default.
        if (roles == null || roles.isEmpty()) {
            this.roles = new HashSet<>();
            this.roles.add(Role.READER);
        } else {
            // If valid roles are provided, we save them
            this.roles = new HashSet<>(roles);
        }

        // By default, when a new user is created, they are active
        this.isActive = true;
        this.createdAt = LocalDateTime.now();
    }

    // --- GETTERS ---
    public int getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public boolean isActive() { return isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // 3. LOCKING THE LIST (Read-only)
    public Set<Role> getRoles() {
        return Collections.unmodifiableSet(roles);
    }

    // --- SETTERS & BUSINESS LOGIC ---

    // The method that WorkflowService will use for checks!
    public boolean hasRole(Role role) {
        return this.roles.contains(role);
    }

    // Adding an additional role
    public void addRole(Role role) {
        if (role == null) {
            throw new IllegalArgumentException("Cannot add a null role.");
        }
        this.roles.add(role);
    }

    // Removing a role
    public void removeRole(Role role) {
        if (role != null) {
            if (this.roles.size() == 1 && this.roles.contains(role)) {
                throw new IllegalStateException("Cannot remove the user's last role.");
            }
            this.roles.remove(role);
        }
    }

    // Changing the password (expects an already hashed password)
    public void setPasswordHash(String passwordHash) {
        if (passwordHash == null || passwordHash.trim().isEmpty()) {
            throw new IllegalArgumentException("The password cannot be empty.");
        }
        this.passwordHash = passwordHash;
    }

    // Deactivating an account
    public void deactivate() {
        if (!this.isActive) {
            throw new IllegalStateException("The user is already deactivated.");
        }
        this.isActive = false;
    }

    // Restoring (activating) an account
    public void activate() {
        if (this.isActive) {
            throw new IllegalStateException("The user is already active.");
        }
        this.isActive = true;
    }
}
