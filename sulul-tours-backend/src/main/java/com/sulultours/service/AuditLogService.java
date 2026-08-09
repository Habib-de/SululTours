package com.sulultours.service;

import com.sulultours.entity.AuditLog;
import com.sulultours.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public AuditLog createAuditLog(AuditLog auditLog) {
        return auditLogRepository.save(auditLog);
    }

    public List<AuditLog> getAuditLogsByTenant(String tenantId) {
        return auditLogRepository.findByTenantId(tenantId);
    }

    public List<AuditLog> getAuditLogsByUser(String userId) {
        return auditLogRepository.findByUserId(userId);
    }

    public List<AuditLog> getAuditLogsByEntity(String entity) {
        return auditLogRepository.findByEntity(entity);
    }

    @Transactional
    public void deleteAuditLog(String id) {
        auditLogRepository.deleteById(id);
    }
}