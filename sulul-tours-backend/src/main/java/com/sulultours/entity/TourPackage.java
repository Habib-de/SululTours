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
@Table(name = "tour_packages")
public class TourPackage {
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

    @Column(name = "destination", length = 255)
    private String destination;

    @Column(name = "duration", length = 100)
    private String duration;

    @Column(name = "price", precision = 15, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "category", length = 50)
    private String category; // safari, beach, mountain, cultural, adventure, wildlife, hiking, city

    @Column(name = "status", length = 50)
    private String status = "draft"; // active, draft, archived

    @Column(name = "max_group_size")
    private Integer maxGroupSize = 10;

    @Column(name = "difficulty", length = 50)
    private String difficulty; // easy, moderate, hard

    @Column(name = "rating", precision = 3, scale = 2)
    private BigDecimal rating = BigDecimal.ZERO;

    @Column(name = "reviews")
    private Integer reviews = 0;

    @Column(name = "inclusions", columnDefinition = "JSON")
    private String inclusions;

    @Column(name = "exclusions", columnDefinition = "JSON")
    private String exclusions;

    @Column(name = "itinerary", columnDefinition = "TEXT")
    private String itinerary;

    @Column(name = "highlights", columnDefinition = "JSON")
    private String highlights;

    @Column(name = "departure_dates", columnDefinition = "JSON")
    private String departureDates;

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