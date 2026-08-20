package com.sulultours.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "bookings")
public class Booking {
    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    @Column(name = "reference", unique = true, nullable = false, length = 50)
    private String reference;

    @Column(name = "customer_name", nullable = false, length = 255)
    private String customerName;

    @Column(name = "customer_email", length = 255)
    private String customerEmail;

    @Column(name = "customer_phone", length = 50)
    private String customerPhone;

    @Column(name = "customer_id_number", length = 50)
    private String customerIdNumber;

    @Column(name = "customer_id_image", columnDefinition = "TEXT")
    private String customerIdImage;

    @Column(name = "customer_license_image", columnDefinition = "TEXT")
    private String customerLicenseImage;

    @Column(name = "customer_license_number", length = 100)
    private String customerLicenseNumber;

    @Column(name = "service_type", nullable = false, length = 50)
    private String serviceType;

    @Column(name = "is_guest_booking")
    private Boolean isGuestBooking = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "user_email", length = 255)
    private String userEmail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tour_package_id")
    private TourPackage tourPackage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hajj_package_id")
    private HajjPackage hajjPackage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hotel_id")
    private Hotel hotel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_type_id")
    private RoomType roomType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flight_id")
    private Flight flight;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "visa_id")
    private VisaApplication visa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private CarOwner owner;

    @Column(name = "item_name", length = 255)
    private String itemName;

    @Column(name = "item_price", precision = 15, scale = 2)
    private BigDecimal itemPrice = BigDecimal.ZERO;

    @Column(name = "vehicle_registration", length = 50)
    private String vehicleRegistration;

    @Column(name = "vehicle_make", length = 100)
    private String vehicleMake;

    @Column(name = "vehicle_model", length = 100)
    private String vehicleModel;

    @Column(name = "vehicle_price_per_day", precision = 15, scale = 2)
    private BigDecimal vehiclePricePerDay = BigDecimal.ZERO;

    @Column(name = "days")
    private Integer days = 0;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "booking_fee_per_day", precision = 15, scale = 2)
    private BigDecimal bookingFeePerDay;

    @Column(name = "commission", precision = 15, scale = 2)
    private BigDecimal commission = BigDecimal.ZERO;

    @Column(name = "subtotal", precision = 15, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "discount_type", length = 50)
    private String discountType;

    @Column(name = "discount_value", length = 50)
    private String discountValue;

    @Column(name = "discount_amount", precision = 15, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "vehicle_condition_images", columnDefinition = "JSON")
    private String vehicleConditionImages;

    @Column(name = "package_name", length = 255)
    private String packageName;

    @Column(name = "package_type", length = 50)
    private String packageType;

    @Column(name = "package_destination", length = 255)
    private String packageDestination;

    @Column(name = "package_duration", length = 100)
    private String packageDuration;

    @Column(name = "departure_date")
    private LocalDate departureDate;

    @Column(name = "passengers")
    private Integer passengers = 1;

    @Column(name = "accommodation", length = 255)
    private String accommodation;

    @Column(name = "meals", length = 255)
    private String meals;

    @Column(name = "transport", length = 255)
    private String transport;

    @Column(name = "guides", length = 255)
    private String guides;

    @Column(name = "insurance", length = 255)
    private String insurance;

    @Column(name = "hotel_name", length = 255)
    private String hotelName;

    @Column(name = "hotel_city", length = 255)
    private String hotelCity;

    @Column(name = "hotel_star_rating")
    private Integer hotelStarRating = 0;

    @Column(name = "room_name", length = 255)
    private String roomName;

    @Column(name = "check_in")
    private LocalDate checkIn;

    @Column(name = "check_out")
    private LocalDate checkOut;

    @Column(name = "nights")
    private Integer nights = 0;

    @Column(name = "rooms")
    private Integer rooms = 1;

    @Column(name = "guests")
    private Integer guests = 1;

    @Column(name = "airline", length = 255)
    private String airline;

    @Column(name = "flight_number", length = 50)
    private String flightNumber;

    @Column(name = "origin", length = 255)
    private String origin;

    @Column(name = "destination", length = 255)
    private String destination;

    @Column(name = "departure_date_flight")
    private LocalDate departureDateFlight;

    @Column(name = "departure_time_flight")
    private LocalTime departureTimeFlight;

    @Column(name = "arrival_date_flight")
    private LocalDate arrivalDateFlight;

    @Column(name = "arrival_time_flight")
    private LocalTime arrivalTimeFlight;

    @Column(name = "duration_flight", length = 50)
    private String durationFlight;

    @Column(name = "seat_class", length = 50)
    private String seatClass = "economy";

    @Column(name = "economy_price", precision = 15, scale = 2)
    private BigDecimal economyPrice = BigDecimal.ZERO;

    @Column(name = "business_price", precision = 15, scale = 2)
    private BigDecimal businessPrice = BigDecimal.ZERO;

    @Column(name = "first_class_price", precision = 15, scale = 2)
    private BigDecimal firstClassPrice = BigDecimal.ZERO;

    @Column(name = "total_price", precision = 15, scale = 2)
    private BigDecimal totalPrice = BigDecimal.ZERO;

    @Column(name = "paid_amount", precision = 15, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "remaining_balance", precision = 15, scale = 2)
    private BigDecimal remainingBalance = BigDecimal.ZERO;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod = "CASH";

    @Column(name = "payment_status", length = 50)
    private String paymentStatus = "PENDING";

    @Column(name = "mpesa_code", length = 100)
    private String mpesaCode;

    @Column(name = "status", length = 50)
    private String status = "pending";

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // Terms and Conditions fields
    @Column(name = "terms_accepted")
    private Boolean termsAccepted = false;

    @Column(name = "terms_accepted_at")
    private LocalDateTime termsAcceptedAt;

    @Column(name = "terms_version", length = 50)
    private String termsVersion = "1.0";

    @Column(name = "customer_signature", columnDefinition = "TEXT")
    private String customerSignature;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}