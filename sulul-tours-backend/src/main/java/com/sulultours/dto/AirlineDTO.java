package com.sulultours.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AirlineDTO {
    private String id;
    private String tenantId;
    private String name;
    private String code;
    private String country;
    private String headquarters;
    private String founded;
    private Integer fleetSize;
    private Integer destinations;
    private String website;
    private String phone;
    private String email;
    private String status;
    private String alliance;
    private Integer starRating;
    private String baggageAllowance;
    private String amenities;
    private String description;
    private String image;
    private String notes;
    private LocalDateTime createdAt;
}