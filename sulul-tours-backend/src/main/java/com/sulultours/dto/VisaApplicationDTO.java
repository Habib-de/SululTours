package com.sulultours.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class VisaApplicationDTO {
    private String id;
    private String tenantId;
    private String bookingId;
    private String applicantName;
    private String passportNumber;
    private String nationality;
    private LocalDate dateOfBirth;
    private LocalDate passportExpiry;
    private String visaType;
    private LocalDate applicationDate;
    private LocalDate submissionDate;
    private String status;
    private String processingOfficer;
    private BigDecimal cost;
    private String paymentStatus;
    private String passportImage;
    private String notes;
    private Boolean flightBooked;
    private String flightBookingId;
    private LocalDateTime approvedAt;
    private LocalDateTime rejectedAt;
    private LocalDateTime createdAt;
}