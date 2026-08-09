package com.sulultours.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tour_guides")
public class TourGuide {
    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "specialties", columnDefinition = "JSON")
    private String specialties;

    @Column(name = "languages", columnDefinition = "JSON")
    private String languages;

    @Column(name = "experience", length = 100)
    private String experience;

    @Column(name = "rating", precision = 3, scale = 2)
    private BigDecimal rating = BigDecimal.ZERO;

    @Column(name = "reviews")
    private Integer reviews = 0;

    @Column(name = "image", columnDefinition = "TEXT")
    private String image;

    @Column(name = "status", length = 50)
    private String status = "active"; // active, inactive, on_leave

    @Column(name = "certifications", columnDefinition = "JSON")
    private String certifications;

    @Column(name = "availability", length = 50)
    private String availability = "available"; // available, busy, unavailable

    @Column(name = "price_per_day", precision = 15, scale = 2)
    private BigDecimal pricePerDay = BigDecimal.ZERO;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "city", length = 100)
    private String city;

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