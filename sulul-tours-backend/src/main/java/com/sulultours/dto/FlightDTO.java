package com.sulultours.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class FlightDTO {
    private String id;
    private String tenantId;
    private String airline;
    private String flightNumber;
    private String origin;
    private String destination;
    private String flightType;
    private LocalDate departureDate;
    private LocalTime departureTime;
    private LocalDate arrivalDate;
    private LocalTime arrivalTime;
    private String duration;
    private BigDecimal economyPrice;
    private BigDecimal businessPrice;
    private BigDecimal firstClassPrice;
    private Integer economySeats;
    private Integer businessSeats;
    private Integer firstClassSeats;
    private String status;
    private String terminal;
    private String gate;
    private String baggageAllowance;
    private String amenities;
    private String image;
    private String notes;
    private LocalDateTime createdAt;
}