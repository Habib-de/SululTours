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
@Table(name = "hajj_packages")
public class HajjPackage {
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

    @Column(name = "type", length = 50)
    private String type = "hajj"; // hajj, umra, ramadan_umra

    @Column(name = "destination", length = 255)
    private String destination;

    @Column(name = "duration", length = 100)
    private String duration;

    @Column(name = "price", precision = 15, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "status", length = 50)
    private String status = "active"; // active, draft, archived

    @Column(name = "max_group_size")
    private Integer maxGroupSize = 10;

    @Column(name = "departure_dates", columnDefinition = "JSON")
    private String departureDates;

    @Column(name = "images", columnDefinition = "LONGTEXT")
    private String images;

    @Column(name = "accommodation", length = 255)
    private String accommodation;

    @Column(name = "meals", length = 255)
    private String meals;

    @Column(name = "transport", length = 255)
    private String transport;

    @Column(name = "guides", length = 255)
    private String guides;

    @Column(name = "visa", length = 255)
    private String visa;

    @Column(name = "insurance", length = 255)
    private String insurance;

    @Column(name = "inclusions", columnDefinition = "JSON")
    private String inclusions;

    @Column(name = "highlights", columnDefinition = "JSON")
    private String highlights;

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