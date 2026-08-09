package com.sulultours.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class RoomTypeDTO {
    private String id;
    private String hotelId;
    private String name;
    private String type;
    private String description;
    private BigDecimal price;
    private Integer capacity;
    private Integer beds;
    private String bedType;
    private String size;
    private Integer quantity;
    private String status;
    private String amenities;
    private String images;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}