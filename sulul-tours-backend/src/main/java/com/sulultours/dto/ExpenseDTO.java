package com.sulultours.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ExpenseDTO {
    private String id;
    private String tenantId;
    private String vehicleId;
    private String ownerId;
    private String createdBy;
    private String category;
    private String description;
    private BigDecimal amount;
    private LocalDate date;
    private String paymentMethod;
    private String status;
    private String receiptNumber;
    private String receiptImage;
    private String notes;
    private Boolean isMaintenance;
    private String maintenanceId;
    private String createdByName;
    private LocalDateTime createdAt;
}