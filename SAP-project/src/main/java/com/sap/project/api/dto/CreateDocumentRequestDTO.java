package com.sap.project.api.dto;

public class CreateDocumentRequestDTO {
    
    private String title;
    private String description;

    // Празен конструктор
    public CreateDocumentRequestDTO() {
    }

    // Getters and Setters
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
}