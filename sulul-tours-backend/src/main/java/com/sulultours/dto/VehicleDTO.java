package com.sulultours.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class VehicleDTO {
    private String id;
    private String tenantId;
    private String ownerId;
    private String registration;
    private String vin;
    private String make;
    private String model;
    private Integer year;
    private String color;
    private String category;
    private String status;
    private BigDecimal mileage;
    private String location;
    private String custodian;
    private String insurance;
    private String permit;
    private LocalDate licenseExpiry;
    private LocalDate roadworthy;
    private String fuelType;
    private String engineSize;
    private String transmission;
    private LocalDate acquisitionDate;
    private BigDecimal acquisitionCost;
    private BigDecimal pricePerDay;
    private Integer seatingCapacity;
    private String description;
    private String images;
    private LocalDateTime createdAt;
}