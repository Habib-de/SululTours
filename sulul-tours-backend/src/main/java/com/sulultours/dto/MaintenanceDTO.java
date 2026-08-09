package com.sulultours.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class MaintenanceDTO {
    private String id;
    private String tenantId;
    private String vehicleId;
    private String maintenanceType;
    private String description;
    private BigDecimal cost;
    private LocalDate date;
    private LocalDate nextDueDate;
    private String status;
    private String priority;
    private String technician;
    private String receiptImage;
    private String notes;
    private LocalDateTime createdAt;
}