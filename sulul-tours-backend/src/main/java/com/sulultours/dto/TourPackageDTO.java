package com.sulultours.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class TourPackageDTO {
    private String id;
    private String tenantId;
    private String name;
    private String destination;
    private String duration;
    private BigDecimal price;
    private String description;
    private String category;
    private String status;
    private Integer maxGroupSize;
    private String difficulty;
    private BigDecimal rating;
    private Integer reviews;
    private String inclusions;
    private String exclusions;
    private String itinerary;
    private String highlights;
    private String departureDates;
    private String images;
    private LocalDateTime createdAt;
}