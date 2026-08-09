package com.sulultours.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class BookingDTO {
    private String id;
    private String tenantId;
    private String reference;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String customerIdNumber;
    
    // ✅ ADD THESE MISSING FIELDS
    private String customerIdImage;
    private String customerLicenseImage;
    private String customerLicenseNumber;
    private String vehicleConditionImages;
    
    private String serviceType;
    private Boolean isGuestBooking;
    private String userId;
    private String userEmail;

    // Service references
    private String vehicleId;
    private String tourPackageId;
    private String hajjPackageId;
    private String hotelId;
    private String roomTypeId;
    private String flightId;
    private String visaId;
    private String ownerId;

    private String itemName;
    private BigDecimal itemPrice;

    // Car Hire
    private String vehicleRegistration;
    private String vehicleMake;
    private String vehicleModel;
    private BigDecimal vehiclePricePerDay;
    private Integer days;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private BigDecimal bookingFeePerDay;
    private BigDecimal commission;
    private BigDecimal subtotal;
    private String discountType;
    private String discountValue;
    private BigDecimal discountAmount;

    // Tour & Hajj
    private String packageName;
    private String packageType;
    private String packageDestination;
    private String packageDuration;
    private LocalDate departureDate;
    private Integer passengers;
    private String accommodation;
    private String meals;
    private String transport;
    private String guides;
    private String insurance;

    // Hotel
    private String hotelName;
    private String hotelCity;
    private Integer hotelStarRating;
    private String roomName;
    private String roomType;
    private LocalDate checkIn;
    private LocalDate checkOut;
    private Integer nights;
    private Integer rooms;
    private Integer guests;

    // Flight
    private String airline;
    private String flightNumber;
    private String origin;
    private String destination;
    private LocalDate departureDateFlight;
    private LocalTime departureTimeFlight;
    private LocalDate arrivalDateFlight;
    private LocalTime arrivalTimeFlight;
    private String durationFlight;
    private String seatClass;
    private BigDecimal economyPrice;
    private BigDecimal businessPrice;
    private BigDecimal firstClassPrice;

    // Payment
    private BigDecimal totalPrice;
    private BigDecimal paidAmount;
    private BigDecimal remainingBalance;
    private String paymentMethod;
    private String paymentStatus;
    private String mpesaCode;

    private String status;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}