package com.sap.project.database.repositories;

import com.sap.project.database.entities.NotificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Integer> {
    // Намира всички НЕПРОЧЕТЕНИ известия за даден потребител
    List<NotificationEntity> findByUserIdAndIsReadFalse(Integer userId);
}