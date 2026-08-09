package com.sulultours.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ComplianceDTO {
    private String id;
    private String tenantId;
    private String vehicleId;
    private String type;
    private LocalDate validFrom;
    private LocalDate validUntil;
    private String status;
    private String documentImage;
    private String notes;
    private String createdBy;
    private LocalDateTime createdAt;
}