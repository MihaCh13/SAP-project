package com.sap.project.controllers;

import com.sap.project.database.entities.NotificationEntity;
import com.sap.project.database.repositories.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<?> getUnreadNotifications(@RequestHeader("X-User-Id") Integer userId) {
        // 1. Вземаме всички непрочетени
        List<NotificationEntity> unread = notificationRepository.findByUserIdAndIsReadFalse(userId);
        
        // 2. Извличаме само текста на съобщенията
        List<String> messages = unread.stream().map(NotificationEntity::getMessage).toList();
        
        // 3. Маркираме ги като прочетени и ги записваме в базата
        for (NotificationEntity notif : unread) {
            notif.setRead(true);
        }
        notificationRepository.saveAll(unread);
        
        // 4. Връщаме съобщенията на Клиента
        return ResponseEntity.ok(messages);
    }
}