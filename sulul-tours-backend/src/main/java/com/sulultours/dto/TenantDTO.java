package com.sulultours.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TenantDTO {
    private String id;
    private String name;
    private String subdomain;
    private String status;
    private String plan;
    private String config;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}