package com.sulultours.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class NotificationDTO {
    private String id;
    private String tenantId;
    private String userId;
    private String title;
    private String description;
    private String type;
    private Boolean isRead;
    private String role;
    private String data;
    private LocalDateTime createdAt;
}