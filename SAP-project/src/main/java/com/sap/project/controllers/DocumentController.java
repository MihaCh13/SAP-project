package com.sap.project.controllers;

import com.sap.project.backend.models.User;
import com.sap.project.backend.enums.Role;
import com.sap.project.backend.services.WorkflowService;
import com.sap.project.database.entities.UserEntity;
import com.sap.project.database.entities.VersionEntity;
import com.sap.project.database.entities.DocumentEntity;
import com.sap.project.database.mappers.UserMapper;
import com.sap.project.database.repositories.UserRepository;
import com.sap.project.database.repositories.VersionRepository;
import com.sap.project.database.repositories.DocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    @Autowired
    private WorkflowService workflowService;

    @Autowired
    private VersionRepository versionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DocumentRepository documentRepository;

    // ==========================================
    // --- 0. GET ALL DOCUMENTS ---
    // ==========================================
    @GetMapping
    public ResponseEntity<?> getAllDocuments(@RequestHeader("X-User-Id") Integer userId) {
        try {
            // 1. Get the user who is requesting the documents
            User userModel = getUserModelById(userId);

            // 2. Retrieve all documents from the database
            List<DocumentEntity> allDocs = documentRepository.findAll();

            // 3. FILTERING: Iterate through each document
            List<Map<String, Object>> response = allDocs.stream()
                    .map(doc -> {
                        // Get all versions of the specific document
                        List<VersionEntity> versions = versionRepository.findByDocumentId(doc.getId());

                        // Use our protected method canViewVersion to see which versions are allowed
                        List<VersionEntity> visibleVersions = versions.stream()
                                .filter(v -> canViewVersion(userModel, v))
                                .collect(Collectors.toList());

                        // IF THE USER HAS NO ACCESS TO ANY VERSION -> HIDE THE ENTIRE DOCUMENT (Return null)
                        if (visibleVersions.isEmpty()) {
                            return null;
                        }

                        // Get the latest version that this user is allowed to see
                        VersionEntity latestVisible = visibleVersions.get(visibleVersions.size() - 1);

                        // Return the information to the client
                        return Map.<String, Object>of(
                                "ID", doc.getId(),
                                "Title", doc.getTitle(),
                                "Version", "V" + latestVisible.getVersionNumber(),
                                "Status", latestVisible.getStatus().toString(), // Will show DRAFT, PENDING, or APPROVED
                                "Author", latestVisible.getCreatedBy() != null ? latestVisible.getCreatedBy().getUsername() : "Unknown"
                        );
                    })
                    .filter(java.util.Objects::nonNull) // Remove all null entries (hidden documents)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching documents: " + e.getMessage());
        }
    }

    // --- 1. CREATING A DOCUMENT ---
    @PostMapping
    public ResponseEntity<String> createNewDocument(
            @RequestHeader("X-User-Id") Integer userId,
            @RequestBody Map<String, String> request) {
        try {
            User authorModel = getUserModelById(userId);

            String title = request.get("title");
            String description = request.get("description");
            String content = request.getOrDefault("content", "No content provided.");

            workflowService.createDocument(authorModel, title, description, content);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body("Document '" + title + "' created successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error creating document: " + e.getMessage());
        }
    }

    // --- 2. EDITING A DOCUMENT (NEW VERSION) ---
    @PostMapping("/{docId}/versions")
    public ResponseEntity<String> editDocument(
            @PathVariable Integer docId,
            @RequestHeader("X-User-Id") Integer userId,
            @RequestBody String newContent) {
        try {
            User authorModel = getUserModelById(userId);

            // Find the latest version of this document
            List<VersionEntity> versions = versionRepository.findByDocumentId(docId);
            if (versions.isEmpty()) throw new RuntimeException("Document has no versions!");
            VersionEntity latestVersion = versions.get(versions.size() - 1);

            workflowService.editDocument(authorModel, latestVersion.getId(), newContent);

            return ResponseEntity.ok("New version created successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error during editing: " + e.getMessage());
        }
    }

    // --- 3. SENDING FOR REVIEW ---
    @PostMapping("/versions/{versionId}/submit")
    public ResponseEntity<String> submitForReview(
            @PathVariable Integer versionId,
            @RequestHeader("X-User-Id") Integer userId) {
        try {
            User authorModel = getUserModelById(userId);
            workflowService.submitForReview(authorModel, versionId);
            return ResponseEntity.ok("Document submitted for review successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // --- 4. APPROVAL ---
    @PutMapping("/versions/{versionId}/approve")
    public ResponseEntity<String> approveVersion(
            @PathVariable Integer versionId,
            @RequestHeader("X-User-Id") Integer userId,
            @RequestParam(required = false, defaultValue = "No comment") String comment) {
        try {
            User reviewerModel = getUserModelById(userId);
            workflowService.approveDocument(reviewerModel, versionId, comment);
            return ResponseEntity.ok("Version approved successfully! Comment: " + comment);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // --- 5. REJECTION ---
    @PostMapping("/versions/{versionId}/reject")
    public ResponseEntity<String> rejectVersion(
            @PathVariable Integer versionId,
            @RequestHeader("X-User-Id") Integer userId,
            @RequestParam(required = false, defaultValue = "No comment") String comment) {
        try {
            User reviewerModel = getUserModelById(userId);
            workflowService.rejectDocument(reviewerModel, versionId, comment);
            return ResponseEntity.ok("Version rejected successfully. Reason: " + comment);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // --- 6. DOCUMENT HISTORY ---
    @GetMapping("/{docId}/history")
    public ResponseEntity<?> getDocumentHistory(@PathVariable Integer docId, @RequestHeader("X-User-Id") Integer userId) {
        try {
            User userModel = getUserModelById(userId);

            // Filter and "flatten" the complex object into a simple, readable array
            List<Map<String, String>> historySummary = versionRepository.findByDocumentId(docId).stream()
                    .filter(v -> canViewVersion(userModel, v))
                    .map(v -> {
                        String content = v.getContent();
                        String preview = content.length() > 40 ? content.substring(0, 40) + "..." : content;
                        return Map.<String, String>of(
                                // IMPORTANT CHANGE: Add the ID in brackets
                                "Version", "V" + v.getVersionNumber() + " [ID: " + v.getId() + "]",
                                "Status", v.getStatus().toString(),
                                "Author", v.getCreatedBy() != null ? v.getCreatedBy().getUsername() : "Unknown",
                                "Preview", preview
                        );
                    })
                    .collect(Collectors.toList());

            if (historySummary.isEmpty()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied or No History Found.");
            }
            return ResponseEntity.ok(historySummary);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // --- 7. EXPORT (TXT AND PDF) ---
    @GetMapping("/versions/{versionId}/txt")
    public ResponseEntity<?> exportToTxt(@PathVariable Integer versionId, @RequestHeader("X-User-Id") Integer userId) {
        try {
            User userModel = getUserModelById(userId);
            VersionEntity vEntity = workflowService.viewVersion(userModel, versionId); // Your security method

            String fileContent = workflowService.exportVersionToText(vEntity);
            byte[] data = fileContent.getBytes();

            HttpHeaders headers = new HttpHeaders();
            headers.add("Content-Disposition", "attachment; filename=document_v" + vEntity.getVersionNumber() + ".txt");

            return ResponseEntity.ok().headers(headers).contentType(MediaType.TEXT_PLAIN).body(data);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @GetMapping("/versions/{versionId}/pdf")
    public ResponseEntity<?> exportToPdf(@PathVariable Integer versionId, @RequestHeader("X-User-Id") Integer userId) {
        try {
            User userModel = getUserModelById(userId);
            VersionEntity vEntity = workflowService.viewVersion(userModel, versionId); // Your security method

            byte[] pdfData = workflowService.exportVersionToPdf(vEntity);

            HttpHeaders headers = new HttpHeaders();
            headers.add("Content-Disposition", "attachment; filename=sap_doc_v" + vEntity.getVersionNumber() + ".pdf");
            return ResponseEntity.ok().headers(headers).contentType(MediaType.APPLICATION_PDF).body(pdfData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    /**
     * Uses your UserMapper to fetch the user.
     */
    private User getUserModelById(Integer userId) {
        UserEntity uEntity = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        return UserMapper.toModel(uEntity); // <-- Your clean mapper!
    }

    /**
     * Helper method to filter who can see what in the history.
     */
    private boolean canViewVersion(User user, VersionEntity v) {
        // 1. ADMIN - sees everything (including REJECTED and DRAFT of other users)
        if (user.getRoles().contains(Role.ADMIN)) {
            return true;
        }

        // 2. PROTECTION FOR READER - If the user is ONLY Reader, block immediately if the version is not approved
        boolean isOnlyReader = user.getRoles().contains(Role.READER) && user.getRoles().size() == 1;
        if (isOnlyReader && v.getStatus() != com.sap.project.backend.enums.Status.APPROVED) {
            return false;
        }

        // 3. GENERAL ACCESS - All others (Author, Reviewer, Reader with other roles) see APPROVED documents
        if (v.getStatus() == com.sap.project.backend.enums.Status.APPROVED) {
            return true;
        }

        // 4. SPECIFIC LOGIC FOR REJECTED
        if (v.getStatus() == com.sap.project.backend.enums.Status.REJECTED) {
            boolean isOwner = v.getCreatedBy() != null && v.getCreatedBy().getId().equals(user.getId());
            boolean isReviewer = user.getRoles().contains(Role.REVIEWER);
            // Rejected versions are visible only to their owner or a Reviewer (for reference)
            return isOwner || isReviewer;
        }

        // 5. COMBINED PERMISSIONS FOR OTHER STATUSES (DRAFT and PENDING_REVIEW)
        boolean canView = false;

        // A) If the user is AUTHOR - grant access only if the version is theirs
        if (user.getRoles().contains(Role.AUTHOR)) {
            if (v.getCreatedBy() != null && v.getCreatedBy().getId().equals(user.getId())) {
                canView = true;
            }
        }

        // B) If the user is REVIEWER - grant access to everything that is pending review
        if (user.getRoles().contains(Role.REVIEWER)) {
            if (v.getStatus() == com.sap.project.backend.enums.Status.PENDING_REVIEW) {
                canView = true;
            }
        }

        return canView;
    }
}