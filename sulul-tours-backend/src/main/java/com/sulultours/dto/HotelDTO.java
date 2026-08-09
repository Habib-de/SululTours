package com.sulultours.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class HotelDTO {
    private String id;
    private String tenantId;
    private String name;
    private String address;
    private String city;
    private String country;
    private String phone;
    private String email;
    private String website;
    private String description;
    private Integer starRating;
    private String status;
    private LocalTime checkIn;
    private LocalTime checkOut;
    private String contactPerson;
    private String contactPhone;
    private String amenities;
    private String images;
    private String agreementType;
    private LocalDate agreementDate;
    private LocalDate agreementEndDate;
    private BigDecimal commissionRate;
    private String supplierName;
    private String supplierContact;
    private String paymentTerms;
    private String notes;
    private LocalDateTime createdAt;
}