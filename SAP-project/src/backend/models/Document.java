package backend.models;

import java.time.LocalDateTime;

public class Document {

    // --- Неизменяеми след създаване ---
    private final int id;
    private final int createdBy;          // ID на създателя (автора)
    private final LocalDateTime createdAt; // Дата и час на създаване

    // --- Метаданни, които могат да се редактират ---
    private String title;                 // Заглавие
    private String description;           // Описание
    private boolean isActive;             // Дали документът е активен или архивиран
    private Integer activeVersionId;      // ID на текущата активна версия (може да е null)

    // Конструктор
    public Document(int id, String title, String description, int createdBy) {
        // 1. ЗАЩИТА НА ЧИСЛАТА
        if (id <= 0 || createdBy <= 0) {
            throw new IllegalArgumentException("Document and creator IDs must be positive numbers.");
        }
        this.id = id;
        this.createdBy = createdBy;

        // 2. ЗАЩИТА НА ЗАГЛАВИЕТО (използваме логиката от сетъра)
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("The title cannot be empty.");
        }
        this.title = title;

        // 3. ЗАЩИТА НА ОПИСАНИЕТО (Предпазва от NullPointerException)
        this.description = (description != null) ? description : "";

        this.createdAt = LocalDateTime.now();

        // По подразбиране, когато създадем нов документ, той е активен
        this.isActive = true;

        // Първоначално документът няма активна (одобрена) версия
        this.activeVersionId = null;
    }

    // --- GETTERS (Методи за четене) ---
    public int getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public int getCreatedBy() { return createdBy; }
    public boolean isActive() { return isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Активна версия
    public Integer getActiveVersionId() { return activeVersionId; }

// --- SETTERS & БИЗНЕС ЛОГИКА ---

    // Позволяваме редакция на заглавието
    public void setTitle(String title) {
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("The title cannot be empty.");
        }
        this.title = title;
    }

    // Позволяваме редакция на описанието
    public void setDescription(String description) {
        // Отново се пазим от null
        this.description = (description != null) ? description : "";
    }

    // Активната версия (извиква се, когато рецензент одобри версия)
    public void setActiveVersionId(Integer activeVersionId) {
        // 4. ЗАЩИТА НА АКТИВНАТА ВЕРСИЯ (Ако не е null, трябва да е над 0)
        if (activeVersionId != null && activeVersionId <= 0) {
            throw new IllegalArgumentException("The active version ID must be a positive number.");
        }
        this.activeVersionId = activeVersionId;
    }

    // Архивиране/деактивиране на документа
    public void archive() {
        if (!this.isActive) {
            throw new IllegalStateException("The document is already archived.");
        }
        this.isActive = false;
    }

    // Възстановяване на документа
    public void activate() {
        if (this.isActive) {
            throw new IllegalStateException("The document is already active.");
        }
        this.isActive = true;
    }
}