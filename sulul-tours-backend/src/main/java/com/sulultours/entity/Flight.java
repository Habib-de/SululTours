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
@Table(name = "flights")
public class Flight {
    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    @Column(name = "airline", nullable = false, length = 255)
    private String airline;

    @Column(name = "flight_number", nullable = false, length = 50)
    private String flightNumber;

    @Column(name = "origin", nullable = false, length = 255)
    private String origin;

    @Column(name = "destination", nullable = false, length = 255)
    private String destination;

    @Column(name = "flight_type", length = 50)
    private String flightType = "international"; // domestic, international, regional, charter

    @Column(name = "departure_date")
    private LocalDate departureDate;

    @Column(name = "departure_time")
    private LocalTime departureTime;

    @Column(name = "arrival_date")
    private LocalDate arrivalDate;

    @Column(name = "arrival_time")
    private LocalTime arrivalTime;

    @Column(name = "duration", length = 50)
    private String duration;

    @Column(name = "economy_price", precision = 15, scale = 2)
    private BigDecimal economyPrice = BigDecimal.ZERO;

    @Column(name = "business_price", precision = 15, scale = 2)
    private BigDecimal businessPrice = BigDecimal.ZERO;

    @Column(name = "first_class_price", precision = 15, scale = 2)
    private BigDecimal firstClassPrice = BigDecimal.ZERO;

    @Column(name = "economy_seats")
    private Integer economySeats = 100;

    @Column(name = "business_seats")
    private Integer businessSeats = 20;

    @Column(name = "first_class_seats")
    private Integer firstClassSeats = 10;

    @Column(name = "status", length = 50)
    private String status = "scheduled"; // active, scheduled, cancelled, completed, delayed

    @Column(name = "terminal", length = 50)
    private String terminal;

    @Column(name = "gate", length = 50)
    private String gate;

    @Column(name = "baggage_allowance", length = 50)
    private String baggageAllowance = "20kg";

    @Column(name = "amenities", columnDefinition = "JSON")
    private String amenities;

    @Column(name = "image", columnDefinition = "TEXT")
    private String image;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

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