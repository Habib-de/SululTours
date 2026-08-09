package com.sulultours.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class HajjPackageDTO {
    private String id;
    private String tenantId;
    private String name;
    private String type;
    private String destination;
    private String duration;
    private BigDecimal price;
    private String description;
    private String status;
    private Integer maxGroupSize;
    private String departureDates;
    private String images;
    private String accommodation;
    private String meals;
    private String transport;
    private String guides;
    private String visa;
    private String insurance;
    private String inclusions;
    private String highlights;
    private LocalDateTime createdAt;
}