package com.sulultours.repository;

import com.sulultours.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
    List<AuditLog> findByTenantId(String tenantId);
    List<AuditLog> findByUserId(String userId);
    List<AuditLog> findByEntity(String entity);
    
    @Modifying
    @Query("update AuditLog a set a.user = null where a.user.id = :userId")
    int nullifyUser(@Param("userId") String userId);
}