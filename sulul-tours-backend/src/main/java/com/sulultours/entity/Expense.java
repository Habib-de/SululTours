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
@Table(name = "expenses")
public class Expense {
    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private CarOwner owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "category", length = 50)
    private String category = "other"; // fuel, insurance, permit, maintenance, repairs, salaries, rent, marketing, utilities, other

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "amount", precision = 15, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "date")
    private LocalDate date;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod = "cash"; // cash, mpesa, bank, credit

    @Column(name = "status", length = 50)
    private String status = "paid"; // paid, pending, overdue

    @Column(name = "receipt_number", length = 100)
    private String receiptNumber;

    @Column(name = "receipt_image", columnDefinition = "TEXT")
    private String receiptImage;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "is_maintenance")
    private Boolean isMaintenance = false;

    @Column(name = "maintenance_id", length = 36)
    private String maintenanceId;

    @Column(name = "created_by_name", length = 255)
    private String createdByName;

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