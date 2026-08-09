package com.sulultours.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class TourGuideDTO {
    private String id;
    private String tenantId;
    private String name;
    private String email;
    private String phone;
    private String bio;
    private String specialties;     // String (JSON)
    private String languages;       // String (JSON)
    private String experience;
    private BigDecimal rating;
    private Integer reviews;
    private String image;
    private String status;
    private String certifications;  // String (JSON)
    private String availability;
    private BigDecimal pricePerDay;
    private String country;
    private String city;
    private LocalDateTime createdAt;
}