package com.sulultours.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CarOwnerDTO {
    private String id;
    private String tenantId;
    private String userId;
    private String name;
    private String email;
    private String phone;
    private String idNumber;
    private String address;
    private String companyName;
    private String status;
    private Integer vehicleCount;
    private LocalDateTime approvedAt;
    private LocalDateTime createdAt;
}