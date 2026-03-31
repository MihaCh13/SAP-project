package com.sap.project.controllers;

import com.sap.project.backend.models.User;
import com.sap.project.backend.services.WorkflowService;
import com.sap.project.database.entities.UserEntity;
import com.sap.project.database.entities.VersionEntity;
import com.sap.project.database.mappers.UserMapper;
import com.sap.project.database.repositories.UserRepository;
import com.sap.project.database.repositories.VersionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    @Autowired
    private WorkflowService workflowService;

    @Autowired
    private VersionRepository versionRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Взема историята на версиите за даден документ.
     */
    @GetMapping("/{docId}/history")
    public List<VersionEntity> getDocumentHistory(@PathVariable Integer docId) {
        // Връщаме списък от версиите директно от репозиторито
        return versionRepository.findByDocumentId(docId);
    }

    /**
     * Одобряване на версия.
     * @param versionId - ID на версията, която трябва да се одобри
     * @param userId - ID на потребителя (Рецензент), който извършва действието
     * @param comment - Коментар към одобрението
     */
    @PostMapping("/approve")
    public String approveVersion(
            @RequestParam Integer versionId,
            @RequestParam Integer userId,
            @RequestParam String comment) {

        // 1. Намираме реалния потребител в базата данни (без хардкод!)
        UserEntity reviewerEntity = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Потребителят с ID " + userId + " не е намерен."));

        // 2. Превръщаме Entity-то в модел чрез твоя UserMapper
        User reviewerModel = UserMapper.toModel(reviewerEntity);

        // 3. Извикваме бизнес логиката.
        // Твоят WorkflowService сам ще провери дали този потребител има роля REVIEWER.
        workflowService.approveDocument(reviewerModel, versionId, comment);

        return "Версията с ID " + versionId + " беше успешно одобрена от " + reviewerModel.getUsername() + ".";
    }

    /**
     * Отхвърляне на версия.
     */
    @PostMapping("/reject")
    public String rejectVersion(
            @RequestParam Integer versionId,
            @RequestParam Integer userId,
            @RequestParam String comment) {

        UserEntity reviewerEntity = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Потребителят с ID " + userId + " не е намерен."));

        User reviewerModel = UserMapper.toModel(reviewerEntity);

        // Извикваме метода за отхвърляне
        workflowService.rejectDocument(reviewerModel, versionId, comment);

        return "Версията с ID " + versionId + " беше отхвърлена от " + reviewerModel.getUsername() + ".";
    }
}