package com.sulultours.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AuditLogDTO {
    private String id;
    private String tenantId;
    private String userId;
    private String userEmail;
    private String userRole;
    private String action;
    private String entity;
    private String entityId;
    private String details;
    private String ipAddress;
    private String userAgent;
    private String status;
    private LocalDateTime createdAt;
}