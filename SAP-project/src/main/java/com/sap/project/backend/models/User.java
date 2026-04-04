package com.sap.project.backend.models;

import com.sap.project.backend.enums.Role;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

public class User {

    // --- FINAL полета (Неизменяеми след създаване) ---
    private final int id;
    private final String username;
    private final String email;
    private final LocalDateTime createdAt;

    // --- Променливи полета ---
    private String passwordHash;
    private boolean isActive;
    private Set<Role> roles;        // Връзката с ролите

    // Конструктор
    public User(int id, String username, String email, String passwordHash, Set<Role> roles) {
        this.id = id;

        // 1. ЗАЩИТА НА ТЕКСТОВИТЕ ПОЛЕТА
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

        // Не позволяваме създаване на потребител без роля.
        // Ако не е подадена роля (списъкът е null или празен),
        // даваме роля READER по подразбиране.
        if (roles == null || roles.isEmpty()) {
            this.roles = new HashSet<>();
            this.roles.add(Role.READER);
        } else {
            // Ако са подадени валидни роли, ги записваме тях
            this.roles = new HashSet<>(roles);
        }

        // По подразбиране, когато създадем нов потребител, той е активен
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

    // 3. ЗАКЛЮЧВАНЕ НА СПИСЪКА (Само за четене)
    public Set<Role> getRoles() {
        return Collections.unmodifiableSet(roles);
    }

    // --- SETTERS & БИЗНЕС ЛОГИКА ---

    // Методът, който WorkflowService ще използва за проверките!
    public boolean hasRole(Role role) {
        return this.roles.contains(role);
    }

    // Добавяне на допълнителна роля
    public void addRole(Role role) {
        if (role == null) {
            throw new IllegalArgumentException("Cannot add a null role.");
        }
        this.roles.add(role);
    }

    // Премахване на роля
    public void removeRole(Role role) {
        if (role != null) {
            if (this.roles.size() == 1 && this.roles.contains(role)) {
                throw new IllegalStateException("Cannot remove the user's last role.");
            }
            this.roles.remove(role);
        }
    }

    // Смяна на парола (очаква се да се подава вече хеширана парола)
    public void setPasswordHash(String passwordHash) {
        if (passwordHash == null || passwordHash.trim().isEmpty()) {
            throw new IllegalArgumentException("The password cannot be empty.");
        }
        this.passwordHash = passwordHash;
    }

    // Деактивиране на акаунт
    public void deactivate() {
        if (!this.isActive) {
            throw new IllegalStateException("The user is already deactivated.");
        }
        this.isActive = false;
    }

    // Възстановяване на акаунт
    public void activate() {
        if (this.isActive) {
            throw new IllegalStateException("The user is already active.");
        }
        this.isActive = true;
    }
}
