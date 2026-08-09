package com.sulultours.service;

import com.sulultours.entity.Booking;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.sulultours.entity.User;
import com.sulultours.entity.Notification;
// import java.util.HashMap;
// import java.util.Map;
import com.sulultours.entity.RoleEnum;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final EmailService emailService;
    private final NotificationService notificationService; 
    private final UserService userService; 

    @Transactional
public Booking createBooking(Booking booking) {
    try {
        // Generate reference if not provided
        if (booking.getReference() == null || booking.getReference().isEmpty()) {
            booking.setReference("BK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        
        // Set defaults for null values
        if (booking.getCustomerName() == null) {
            booking.setCustomerName("");
        }
        if (booking.getServiceType() == null) {
            booking.setServiceType("car_hire");
        }
        if (booking.getStatus() == null) {
            booking.setStatus("pending");
        }
        if (booking.getPaymentMethod() == null) {
            booking.setPaymentMethod("CASH");
        }
        if (booking.getPaymentStatus() == null) {
            booking.setPaymentStatus("PENDING");
        }
        if (booking.getTotalPrice() == null) {
            booking.setTotalPrice(BigDecimal.ZERO);
        }
        if (booking.getPaidAmount() == null) {
            booking.setPaidAmount(BigDecimal.ZERO);
        }
        if (booking.getRemainingBalance() == null) {
            booking.setRemainingBalance(BigDecimal.ZERO);
        }
        if (booking.getDays() == null) {
            booking.setDays(0);
        }
        if (booking.getVehicleConditionImages() == null) {
            booking.setVehicleConditionImages(null);
        }
        
        booking.setCreatedAt(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());
        
        // ✅ SAVE FIRST
        Booking savedBooking = bookingRepository.save(booking);

                // ==========================================
        // ✅ SEND PUSH NOTIFICATIONS
        // ==========================================
        try {
            // 1. Notify Car Owner (if this is a car hire booking)
            if ("car_hire".equals(savedBooking.getServiceType()) && savedBooking.getOwner() != null) {
                try {
                    User owner = savedBooking.getOwner().getUser();
                    if (owner != null) {
                        Notification ownerNotif = new Notification();
                        ownerNotif.setUser(owner);
                        ownerNotif.setTitle("📅 New Booking Request");
                        ownerNotif.setDescription("You have a new booking for " + 
                            (savedBooking.getVehicleRegistration() != null ? savedBooking.getVehicleRegistration() : "your vehicle") + 
                            " by " + savedBooking.getCustomerName());
                        ownerNotif.setType("alert");
                        ownerNotif.setRole("car_owner");
                        
                        notificationService.createNotification(ownerNotif);
                        System.out.println("✅ Push notification sent to owner: " + owner.getEmail());
                    }
                } catch (Exception e) {
                    System.err.println("⚠️ Failed to send notification to owner: " + e.getMessage());
                }
            }
            
            // 2. Notify Fleet Manager
            if (savedBooking.getTenant() != null && savedBooking.getTenant().getId() != null) {
            try {
                 String tenantId = savedBooking.getTenant().getId();
                 List<User> managers = userService.getUsersByRoleAndTenant(RoleEnum.fleet_manager, tenantId);
                    for (User manager : managers) {
                        Notification managerNotif = new Notification();
                        managerNotif.setUser(manager);
                        managerNotif.setTitle("📋 New " + capitalize(savedBooking.getServiceType()) + " Booking");
                        managerNotif.setDescription("New booking from " + savedBooking.getCustomerName() + 
                            " for " + getServiceItemName(savedBooking));
                        managerNotif.setType("info");
                        managerNotif.setRole("fleet_manager");
                        
                        notificationService.createNotification(managerNotif);
                    }
                    System.out.println("✅ Push notifications sent to " + managers.size() + " fleet managers");
                } catch (Exception e) {
                    System.err.println("⚠️ Failed to send notifications to fleet managers: " + e.getMessage());
                }
            }
            
            // 3. Notify Client (if they have an account)
            if (savedBooking.getUser() != null && savedBooking.getUser().getId() != null) {
                try {
                    User client = savedBooking.getUser();
                    
                    Notification clientNotif = new Notification();
                    clientNotif.setUser(client);
                    clientNotif.setTitle("📋 Booking Received");
                    clientNotif.setDescription("Your " + savedBooking.getServiceType() + " booking has been received and is waiting for confirmation. Reference: "+ savedBooking.getReference());
                    clientNotif.setType("info");
                    clientNotif.setRole("client");
                    
                    notificationService.createNotification(clientNotif);
                    System.out.println("✅ Push notification sent to client: " + client.getEmail());
                } catch (Exception e) {
                    System.err.println("⚠️ Failed to send notification to client: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("⚠️ Error sending push notifications: " + e.getMessage());
            // Don't fail the booking if notification fails
        }
        
        // ✅ SEND EMAIL ONLY FOR GUEST BOOKINGS
        if (savedBooking.getIsGuestBooking() != null && savedBooking.getIsGuestBooking() && 
            savedBooking.getCustomerEmail() != null && !savedBooking.getCustomerEmail().isEmpty()) {
            try {
                emailService.sendBookingConfirmation(savedBooking);
                System.out.println("✅ Booking confirmation email sent to guest: " + savedBooking.getCustomerEmail());
            } catch (Exception e) {
                System.err.println("⚠️ Failed to send booking confirmation email to guest: " + e.getMessage());
                // Don't fail the booking if email fails
            }
        } else {
            System.out.println("ℹ️ Not a guest booking or no email provided - skipping email");
        }
        
        return savedBooking;
    } catch (Exception e) {
        e.printStackTrace();
        throw e;
    }
}

    public Booking getBookingById(String id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
    }

    public Booking getBookingByReference(String reference) {
        return bookingRepository.findByReference(reference)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with reference: " + reference));
    }

    public List<Booking> getBookingsByTenant(String tenantId) {
        return bookingRepository.findByTenantId(tenantId);
    }

    public List<Booking> getBookingsByUser(String userId) {
        return bookingRepository.findByUserId(userId);
    }

    public List<Booking> getBookingsByServiceType(String serviceType) {
        return bookingRepository.findByServiceType(serviceType);
    }

    public List<Booking> getBookingsByStatus(String status) {
        return bookingRepository.findByStatus(status);
    }

    public List<Booking> getBookingsByCustomerEmail(String email) {
        return bookingRepository.findByCustomerEmail(email);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    @Transactional
    public Booking updateBooking(String id, Booking bookingDetails) {
        Booking booking = getBookingById(id);
        booking.setVehicle(bookingDetails.getVehicle());   // ← ADD THIS LINE
        booking.setOwner(bookingDetails.getOwner());
        // Customer Info
        booking.setCustomerName(bookingDetails.getCustomerName());
        booking.setCustomerEmail(bookingDetails.getCustomerEmail());
        booking.setCustomerPhone(bookingDetails.getCustomerPhone());
        booking.setCustomerIdNumber(bookingDetails.getCustomerIdNumber());
        booking.setCustomerIdImage(bookingDetails.getCustomerIdImage());
        booking.setCustomerLicenseImage(bookingDetails.getCustomerLicenseImage());
        booking.setCustomerLicenseNumber(bookingDetails.getCustomerLicenseNumber());
        
        // Vehicle & Service Info
        booking.setVehicleRegistration(bookingDetails.getVehicleRegistration());
        booking.setVehicleMake(bookingDetails.getVehicleMake());
        booking.setVehicleModel(bookingDetails.getVehicleModel());
        booking.setVehiclePricePerDay(bookingDetails.getVehiclePricePerDay());
        booking.setDays(bookingDetails.getDays());
        booking.setStartDate(bookingDetails.getStartDate());
        booking.setEndDate(bookingDetails.getEndDate());
        booking.setStartTime(bookingDetails.getStartTime());
        booking.setEndTime(bookingDetails.getEndTime());
        
        // Booking Fee & Discount
        booking.setBookingFeePerDay(bookingDetails.getBookingFeePerDay());
        booking.setCommission(bookingDetails.getCommission());
        booking.setSubtotal(bookingDetails.getSubtotal());
        booking.setDiscountType(bookingDetails.getDiscountType());
        booking.setDiscountValue(bookingDetails.getDiscountValue());
        booking.setDiscountAmount(bookingDetails.getDiscountAmount());
        booking.setVehicleConditionImages(bookingDetails.getVehicleConditionImages());
        
        // Payment
        booking.setTotalPrice(bookingDetails.getTotalPrice());
        booking.setPaidAmount(bookingDetails.getPaidAmount());
        booking.setRemainingBalance(bookingDetails.getRemainingBalance());
        booking.setPaymentMethod(bookingDetails.getPaymentMethod());
        booking.setPaymentStatus(bookingDetails.getPaymentStatus());
        booking.setMpesaCode(bookingDetails.getMpesaCode());
        
        // Status & Notes
        booking.setStatus(bookingDetails.getStatus());
        booking.setNotes(bookingDetails.getNotes());
        
        booking.setUpdatedAt(LocalDateTime.now());
        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking updateBookingStatus(String id, String status) {
        Booking booking = getBookingById(id);
        String oldStatus = booking.getStatus();
        booking.setStatus(status);
        booking.setUpdatedAt(LocalDateTime.now());
        Booking updated = bookingRepository.save(booking);

        // ==========================================
        // ✅ SEND PUSH NOTIFICATIONS FOR STATUS CHANGE
        // ==========================================
        try {
            if ("confirmed".equals(status) && !"confirmed".equals(oldStatus)) {
                // Notify Client
                if (booking.getUser() != null && booking.getUser().getId() != null) {
                    try {
                        User client = booking.getUser();
                        Notification notif = new Notification();
                        notif.setUser(client);
                        notif.setTitle("✅ Booking Confirmed");
                        notif.setDescription("Your " + booking.getServiceType() + " booking for " + getServiceItemName(booking) + " has been confirmed!");
                        notif.setType("success");
                        notif.setRole("client");
                        notificationService.createNotification(notif);
                    } catch (Exception e) {
                        System.err.println("⚠️ Failed to send confirmation notification: " + e.getMessage());
                    }
                }
                
                // Notify Car Owner
                if ("car_hire".equals(booking.getServiceType()) && booking.getOwner() != null) {
                    try {
                        User owner = booking.getOwner().getUser();
                        if (owner != null) {
                            Notification notif = new Notification();
                            notif.setUser(owner);
                            notif.setTitle("✅ Booking Confirmed");
                            notif.setDescription("Booking for " + booking.getVehicleRegistration() + " has been confirmed");
                            notif.setType("success");
                            notif.setRole("car_owner");
                            notificationService.createNotification(notif);
                        }
                    } catch (Exception e) {
                        System.err.println("⚠️ Failed to send confirmation notification to owner: " + e.getMessage());
                    }
                }
            }
            
            if ("cancelled".equals(status) && !"cancelled".equals(oldStatus)) {
                // Notify Client
                if (booking.getUser() != null && booking.getUser().getId() != null) {
                    try {
                        User client = booking.getUser();
                        Notification notif = new Notification();
                        notif.setUser(client);
                        notif.setTitle("❌ Booking Cancelled");
                        notif.setDescription("Your " + booking.getServiceType() + " booking for " + getServiceItemName(booking) + " has been cancelled");
                        notif.setType("alert");
                        notif.setRole("client");
                        notificationService.createNotification(notif);
                    } catch (Exception e) {
                        System.err.println("⚠️ Failed to send cancellation notification: " + e.getMessage());
                    }
                }
                
                // Notify Car Owner
                if ("car_hire".equals(booking.getServiceType()) && booking.getOwner() != null) {
                    try {
                        User owner = booking.getOwner().getUser();
                        if (owner != null) {
                            Notification notif = new Notification();
                            notif.setUser(owner);
                            notif.setTitle("❌ Booking Cancelled");
                            notif.setDescription("Booking for " + booking.getVehicleRegistration() + " has been cancelled");
                            notif.setType("alert");
                            notif.setRole("car_owner");
                            notificationService.createNotification(notif);
                        }
                    } catch (Exception e) {
                        System.err.println("⚠️ Failed to send cancellation notification to owner: " + e.getMessage());
                    }
                }
            }
            
            if ("completed".equals(status) && !"completed".equals(oldStatus)) {
                // Notify Client
                if (booking.getUser() != null && booking.getUser().getId() != null) {
                    try {
                        User client = booking.getUser();
                        Notification notif = new Notification();
                        notif.setUser(client);
                        notif.setTitle("📝 Booking Completed");
                        notif.setDescription("Your " + booking.getServiceType() + " booking for " + getServiceItemName(booking) + " is complete. Thank you!");
                        notif.setType("info");
                        notif.setRole("client");
                        notificationService.createNotification(notif);
                    } catch (Exception e) {
                        System.err.println("⚠️ Failed to send completion notification: " + e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("⚠️ Error sending status change notifications: " + e.getMessage());
        }
        
        return updated;
    }

    @Transactional
    public void deleteBooking(String id) {
        Booking booking = getBookingById(id);
        bookingRepository.delete(booking);
    }

    // ==========================================
    // ✅ ADD HELPER METHODS HERE (BEFORE THE FINAL })
    // ==========================================
    
    private String capitalize(String str) {
        if (str == null) return "";
        return str.substring(0, 1).toUpperCase() + str.substring(1).replace("_", " ");
    }

    private String getServiceItemName(Booking booking) {
        if (booking == null) return "booking";
        
        String serviceType = booking.getServiceType();
        if (serviceType == null) return "booking";
        
        switch (serviceType) {
            case "car_hire":
                return booking.getVehicleRegistration() != null ? 
                    booking.getVehicleRegistration() : "vehicle";
            case "tour":
                return booking.getPackageName() != null ? 
                    booking.getPackageName() : "tour";
            case "hajj":
                return booking.getPackageName() != null ? 
                    booking.getPackageName() : "Hajj package";
            case "hotel":
                return booking.getHotelName() != null ? 
                    booking.getHotelName() : "hotel";
            case "flight":
                return (booking.getAirline() != null ? booking.getAirline() + " " : "") + 
                       (booking.getFlightNumber() != null ? booking.getFlightNumber() : "flight");
            default:
                return "booking";
        }
    }
}