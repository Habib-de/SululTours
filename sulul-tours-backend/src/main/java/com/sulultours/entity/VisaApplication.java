package com.sulultours.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "visa_applications")
public class VisaApplication {
    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private Booking booking;

    @Column(name = "applicant_name", nullable = false, length = 255)
    private String applicantName;

    @Column(name = "passport_number", nullable = false, length = 50)
    private String passportNumber;

    @Column(name = "nationality", length = 100)
    private String nationality;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "passport_expiry")
    private LocalDate passportExpiry;

    @Column(name = "visa_type", length = 50)
    private String visaType = "hajj";

    @Column(name = "application_date")
    private LocalDate applicationDate;

    @Column(name = "submission_date")
    private LocalDate submissionDate;

    @Column(name = "status", length = 50)
    private String status = "pending";

    @Column(name = "processing_officer", length = 255)
    private String processingOfficer;

    @Column(name = "cost", precision = 15, scale = 2)
    private BigDecimal cost = BigDecimal.ZERO;

    @Column(name = "payment_status", length = 50)
    private String paymentStatus = "pending";

    @Column(name = "passport_image", columnDefinition = "TEXT")
    private String passportImage;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "flight_booked")
    private Boolean flightBooked = false;

    @Column(name = "flight_booking_id", length = 36)
    private String flightBookingId;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ✅ ADD THIS HELPER METHOD
    public String getBookingId() {
        return this.booking != null ? this.booking.getId() : null;
    }

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