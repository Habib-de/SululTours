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
@Table(name = "vehicles")
public class Vehicle {
    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private CarOwner owner;

    @Column(name = "registration", unique = true, nullable = false, length = 50)
    private String registration;

    @Column(name = "vin", length = 50)
    private String vin;

    @Column(name = "make", nullable = false, length = 100)
    private String make;

    @Column(name = "model", nullable = false, length = 100)
    private String model;

    @Column(name = "year")
    private Integer year;

    @Column(name = "color", length = 50)
    private String color;

    @Column(name = "category", length = 50)
    private String category; // SUV, Sedan, Minibus, Luxury, Hatchback, Pickup, Van, Truck

    @Column(name = "status", length = 50)
    private String status = "active"; // active, inactive, maintenance, disposed, rented

    @Column(name = "mileage", precision = 10, scale = 2)
    private BigDecimal mileage;

    @Column(name = "location", length = 255)
    private String location;

    @Column(name = "custodian", length = 255)
    private String custodian;

    @Column(name = "insurance", length = 255)
    private String insurance;

    @Column(name = "permit", length = 255)
    private String permit;

    @Column(name = "license_expiry")
    private LocalDate licenseExpiry;

    @Column(name = "roadworthy")
    private LocalDate roadworthy;

    @Column(name = "fuel_type", length = 50)
    private String fuelType; // Petrol, Diesel, Electric, Hybrid, LPG

    @Column(name = "engine_size", length = 50)
    private String engineSize;

    @Column(name = "transmission", length = 50)
    private String transmission; // Automatic, Manual, CVT

    @Column(name = "acquisition_date")
    private LocalDate acquisitionDate;

    @Column(name = "acquisition_cost", precision = 15, scale = 2)
    private BigDecimal acquisitionCost;

    @Column(name = "price_per_day", precision = 15, scale = 2)
    private BigDecimal pricePerDay = BigDecimal.ZERO;

    @Column(name = "seating_capacity")
    private Integer seatingCapacity = 4;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "images", columnDefinition = "JSON")
    private String images;

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