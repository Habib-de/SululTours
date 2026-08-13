package com.sulultours.controller;

import com.sulultours.dto.ApiResponse;
import com.sulultours.dto.BookingDTO;
import com.sulultours.dto.VehicleDTO;
import com.sulultours.entity.Booking;
import com.sulultours.entity.CarOwner;
import com.sulultours.entity.Tenant;
import com.sulultours.entity.User;
import com.sulultours.entity.Vehicle;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.CarOwnerRepository;
import com.sulultours.repository.FlightRepository;
import com.sulultours.repository.HajjPackageRepository;
import com.sulultours.repository.HotelRepository;
import com.sulultours.repository.RoomTypeRepository;
import com.sulultours.repository.TenantRepository;
import com.sulultours.repository.TourPackageRepository;
import com.sulultours.repository.UserRepository;
import com.sulultours.repository.VehicleRepository;
import com.sulultours.service.BookingService;
import com.sulultours.entity.TourPackage;         
import com.sulultours.repository.TourPackageRepository;
import com.sulultours.entity.HajjPackage;
import com.sulultours.repository.HajjPackageRepository;
import com.sulultours.entity.Flight;
import com.sulultours.repository.FlightRepository;
import com.sulultours.entity.Hotel;
import com.sulultours.entity.RoomType;
import com.sulultours.repository.HotelRepository;
import com.sulultours.repository.RoomTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
// @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager', 'client')")
public class BookingController {

    private final BookingService bookingService;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final CarOwnerRepository carOwnerRepository;
    private final TourPackageRepository tourPackageRepository;
    private final HajjPackageRepository hajjPackageRepository;
    private final FlightRepository flightRepository; 
    private final HotelRepository hotelRepository;        
    private final RoomTypeRepository roomTypeRepository;  

    @PostMapping
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager', 'client')")
public ResponseEntity<ApiResponse<BookingDTO>> createBooking(@RequestBody BookingDTO bookingDTO) {
    try {
        // ✅ Add these debug logs
        System.out.println("========================================");
        System.out.println("📥 Received BookingDTO:");
        System.out.println("  - customerName: " + bookingDTO.getCustomerName());
        System.out.println("  - vehicleId: " + bookingDTO.getVehicleId());
        System.out.println("  - startDate: " + bookingDTO.getStartDate());
        System.out.println("  - endDate: " + bookingDTO.getEndDate());
        System.out.println("  - vehicleConditionImages: " + bookingDTO.getVehicleConditionImages());
        System.out.println("  - totalPrice: " + bookingDTO.getTotalPrice());
        System.out.println("  - tenantId: " + bookingDTO.getTenantId());
        System.out.println("  - tourPackageId: " + bookingDTO.getTourPackageId());
        System.out.println("  - hajjPackageId: " + bookingDTO.getHajjPackageId());
        System.out.println("  - flightId: " + bookingDTO.getFlightId());  // ✅ ADD THIS
        System.out.println("========================================");
        
        Booking booking = convertToEntity(bookingDTO);
        System.out.println("📥 Converted to Entity: " + booking);
        
        Booking created = bookingService.createBooking(booking);
        System.out.println("✅ Booking created: " + created.getId());
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Booking created successfully", convertToDTO(created)));
    } catch (Exception e) {
        // ✅ Print the FULL error stack trace
        e.printStackTrace();
        System.out.println("❌ ERROR: " + e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to create booking: " + e.getMessage()));
    }
}

@PostMapping("/public")
    public ResponseEntity<ApiResponse<BookingDTO>> createPublicBooking(@RequestBody BookingDTO bookingDTO) {
        try {
            System.out.println("========================================");
            System.out.println("📥 PUBLIC GUEST BOOKING:");
            System.out.println("  - customerName: " + bookingDTO.getCustomerName());
            System.out.println("  - serviceType: " + bookingDTO.getServiceType());
            System.out.println("  - totalPrice: " + bookingDTO.getTotalPrice());
            System.out.println("========================================");
            
            // Set default tenant (sulul)
            Tenant defaultTenant = tenantRepository.findBySubdomain("sulul")
                    .orElseThrow(() -> new ResourceNotFoundException("Default tenant 'sulul' not found."));
            
            bookingDTO.setTenantId(defaultTenant.getId());
            bookingDTO.setIsGuestBooking(true);
            
            // Set default status if not provided
            if (bookingDTO.getStatus() == null) {
                bookingDTO.setStatus("pending");
            }
            
            Booking booking = convertToEntity(bookingDTO);
            Booking created = bookingService.createBooking(booking);
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Guest booking created successfully", convertToDTO(created)));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create guest booking: " + e.getMessage()));
        }
    }

    // ✅ PUBLIC - GET all bookings (for guest availability check)
@GetMapping
@PreAuthorize("permitAll()")
public ResponseEntity<ApiResponse<List<BookingDTO>>> getAllBookings() {
    List<Booking> bookings = bookingService.getAllBookings();
    List<BookingDTO> dtos = bookings.stream().map(this::convertToDTO).collect(Collectors.toList());
    return ResponseEntity.ok(ApiResponse.success(dtos));
}

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager', 'client')")
    public ResponseEntity<ApiResponse<BookingDTO>> getBookingById(@PathVariable String id) {
        Booking booking = bookingService.getBookingById(id);
        return ResponseEntity.ok(ApiResponse.success(convertToDTO(booking)));
    }

    @GetMapping("/reference/{reference}")
    public ResponseEntity<ApiResponse<BookingDTO>> getBookingByReference(@PathVariable String reference) {
        Booking booking = bookingService.getBookingByReference(reference);
        return ResponseEntity.ok(ApiResponse.success(convertToDTO(booking)));
    }

    @GetMapping("/tenant/{tenantId}")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager', 'client')")
    public ResponseEntity<ApiResponse<List<BookingDTO>>> getBookingsByTenant(@PathVariable String tenantId) {
        List<Booking> bookings = bookingService.getBookingsByTenant(tenantId);
        List<BookingDTO> dtos = bookings.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager', 'client')")
    public ResponseEntity<ApiResponse<List<BookingDTO>>> getBookingsByUser(@PathVariable String userId) {
        List<Booking> bookings = bookingService.getBookingsByUser(userId);
        List<BookingDTO> dtos = bookings.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/service/{serviceType}")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager', 'client')")
    public ResponseEntity<ApiResponse<List<BookingDTO>>> getBookingsByServiceType(@PathVariable String serviceType) {
        List<Booking> bookings = bookingService.getBookingsByServiceType(serviceType);
        List<BookingDTO> dtos = bookings.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager', 'client')")
    public ResponseEntity<ApiResponse<List<BookingDTO>>> getBookingsByStatus(@PathVariable String status) {
        List<Booking> bookings = bookingService.getBookingsByStatus(status);
        List<BookingDTO> dtos = bookings.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager', 'client')")
    public ResponseEntity<ApiResponse<BookingDTO>> updateBooking(@PathVariable String id, @RequestBody BookingDTO bookingDTO) {
        Booking booking = convertToEntity(bookingDTO);
        Booking updated = bookingService.updateBooking(id, booking);
        return ResponseEntity.ok(ApiResponse.success("Booking updated successfully", convertToDTO(updated)));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager', 'client')")
    public ResponseEntity<ApiResponse<BookingDTO>> updateBookingStatus(
            @PathVariable String id,
            @RequestParam String status) {
        Booking updated = bookingService.updateBookingStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Booking status updated successfully", convertToDTO(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager', 'client')")
    public ResponseEntity<ApiResponse<Void>> deleteBooking(@PathVariable String id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.ok(ApiResponse.success("Booking deleted successfully", null));
    }

        // ============================================
    // ✅ VEHICLE AVAILABILITY ENDPOINTS
    // ============================================

    /**
     * Check if a specific vehicle is available for the given dates
     * GET /bookings/availability/vehicle/{vehicleId}?startDate=2024-09-01T08:00&endDate=2024-09-05T18:00
     */
    @GetMapping("/availability/vehicle/{vehicleId}")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager', 'client')")
    public ResponseEntity<ApiResponse<Boolean>> checkVehicleAvailability(
            @PathVariable String vehicleId,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        
        try {
            // Parse the date strings to LocalDateTime
            LocalDateTime start = LocalDateTime.parse(startDate);
            LocalDateTime end = LocalDateTime.parse(endDate);
            
            boolean isAvailable = bookingService.isVehicleAvailable(vehicleId, start, end);
            return ResponseEntity.ok(ApiResponse.success(isAvailable));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Invalid date format: " + e.getMessage()));
        }
    }

    /**
     * Get all available vehicles for the given dates
     * GET /bookings/availability/available-vehicles?tenantId=xxx&startDate=2024-09-01T08:00&endDate=2024-09-05T18:00
     */
    @GetMapping("/availability/available-vehicles")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager', 'client')")
    public ResponseEntity<ApiResponse<List<VehicleDTO>>> getAvailableVehicles(
            @RequestParam String tenantId,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        
        try {
            // Parse the date strings to LocalDateTime
            LocalDateTime start = LocalDateTime.parse(startDate);
            LocalDateTime end = LocalDateTime.parse(endDate);
            
            // Get available vehicles from service
            List<Vehicle> availableVehicles = bookingService.getAvailableVehicles(tenantId, start, end);
            
            // Convert to DTOs
            List<VehicleDTO> dtos = availableVehicles.stream()
                    .map(this::convertVehicleToDTO)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(ApiResponse.success(dtos));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Error checking availability: " + e.getMessage()));
        }
    }

    private Booking convertToEntity(BookingDTO dto) {
        Booking booking = new Booking();
        
        // Set ID if present (for updates)
        if (dto.getId() != null) {
            booking.setId(dto.getId());
        }
        
        // Generate reference if not provided
        if (dto.getReference() == null || dto.getReference().isEmpty()) {
            booking.setReference("BK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        } else {
            booking.setReference(dto.getReference());
        }
        
        // Set Tenant
        if (dto.getTenantId() != null) {
            Tenant tenant = tenantRepository.findById(dto.getTenantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
            booking.setTenant(tenant);
        }
        
        // Set User
        if (dto.getUserId() != null) {
            User user = userRepository.findById(dto.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            booking.setUser(user);
        }
        
        // Set Vehicle
        if (dto.getVehicleId() != null) {
            Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));
            booking.setVehicle(vehicle);
        }
        
        // Set Car Owner
        if (dto.getOwnerId() != null) {
            CarOwner owner = carOwnerRepository.findById(dto.getOwnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Car owner not found"));
            booking.setOwner(owner);
        }

        if (dto.getTourPackageId() != null && !dto.getTourPackageId().isEmpty()) {
    TourPackage tourPackage = tourPackageRepository.findById(dto.getTourPackageId())
            .orElseThrow(() -> new ResourceNotFoundException("Tour package not found"));
    booking.setTourPackage(tourPackage);
    System.out.println("✅ Tour package attached: " + tourPackage.getName() + " (ID: " + tourPackage.getId() + ")");
} else {
    System.out.println("⚠️ No tour package ID provided");
}

if (dto.getHajjPackageId() != null && !dto.getHajjPackageId().isEmpty()) {
    HajjPackage hajjPackage = hajjPackageRepository.findById(dto.getHajjPackageId())
            .orElseThrow(() -> new ResourceNotFoundException("Hajj package not found"));
    booking.setHajjPackage(hajjPackage);
    System.out.println("✅ Hajj package attached: " + hajjPackage.getName() + " (ID: " + hajjPackage.getId() + ")");
} else {
    System.out.println("⚠️ No hajj package ID provided");
}

if (dto.getFlightId() != null && !dto.getFlightId().isEmpty()) {
    Flight flight = flightRepository.findById(dto.getFlightId())
            .orElseThrow(() -> new ResourceNotFoundException("Flight not found"));
    booking.setFlight(flight);
    
    // ✅ COPY ALL FLIGHT DETAILS TO BOOKING
    booking.setAirline(flight.getAirline());
    booking.setFlightNumber(flight.getFlightNumber());
    booking.setOrigin(flight.getOrigin());
    booking.setDestination(flight.getDestination());
    booking.setDepartureDateFlight(flight.getDepartureDate());     // ← This is what's missing!
    booking.setDepartureTimeFlight(flight.getDepartureTime());     // ← This is what's missing!
    booking.setArrivalDateFlight(flight.getArrivalDate());         // ← This is what's missing!
    booking.setArrivalTimeFlight(flight.getArrivalTime());         // ← This is what's missing!
    booking.setDurationFlight(flight.getDuration());               // ← This is what's missing!
    booking.setEconomyPrice(flight.getEconomyPrice());
    booking.setBusinessPrice(flight.getBusinessPrice());
    booking.setFirstClassPrice(flight.getFirstClassPrice());
    
    System.out.println("✅ Flight attached: " + flight.getAirline() + " " + flight.getFlightNumber());
    System.out.println("   Departure: " + flight.getDepartureDate() + " " + flight.getDepartureTime());
    System.out.println("   Arrival: " + flight.getArrivalDate() + " " + flight.getArrivalTime());
}

if (dto.getHotelId() != null && !dto.getHotelId().isEmpty()) {
    Hotel hotel = hotelRepository.findById(dto.getHotelId())
            .orElseThrow(() -> new ResourceNotFoundException("Hotel not found"));
    booking.setHotel(hotel);
    
    // ✅ COPY HOTEL DETAILS TO BOOKING
    booking.setHotelName(hotel.getName());
    booking.setHotelCity(hotel.getCity());
    booking.setHotelStarRating(hotel.getStarRating());
    
    System.out.println("✅ Hotel attached: " + hotel.getName() + " (ID: " + hotel.getId() + ")");
} else {
    System.out.println("⚠️ No hotel ID provided");
}

// ✅ ADD THIS - Set Room Type
if (dto.getRoomTypeId() != null && !dto.getRoomTypeId().isEmpty()) {
    RoomType roomType = roomTypeRepository.findById(dto.getRoomTypeId())
            .orElseThrow(() -> new ResourceNotFoundException("Room type not found"));
    booking.setRoomType(roomType);
    
    // ✅ COPY ROOM TYPE DETAILS TO BOOKING
    booking.setRoomName(roomType.getName());
    booking.setRoomType(roomType);  
    
    System.out.println("✅ Room type attached: " + roomType.getName() + " (ID: " + roomType.getId() + ")");
} else {
    System.out.println("⚠️ No room type ID provided");
}
        
        // Set basic fields
        booking.setCustomerName(dto.getCustomerName());
        booking.setCustomerEmail(dto.getCustomerEmail());
        booking.setCustomerPhone(dto.getCustomerPhone());
        booking.setCustomerIdNumber(dto.getCustomerIdNumber());
        booking.setCustomerIdImage(dto.getCustomerIdImage());
        booking.setCustomerLicenseImage(dto.getCustomerLicenseImage());
        booking.setCustomerLicenseNumber(dto.getCustomerLicenseNumber());
        
        // Service Type
        booking.setServiceType(dto.getServiceType() != null ? dto.getServiceType() : "car_hire");
        booking.setIsGuestBooking(dto.getIsGuestBooking() != null ? dto.getIsGuestBooking() : false);
        booking.setUserEmail(dto.getUserEmail());
        
        // Car Hire fields
        booking.setVehicleRegistration(dto.getVehicleRegistration());
        booking.setVehicleMake(dto.getVehicleMake());
        booking.setVehicleModel(dto.getVehicleModel());
        booking.setVehiclePricePerDay(dto.getVehiclePricePerDay());
        booking.setDays(dto.getDays());
        booking.setStartDate(dto.getStartDate());
        booking.setEndDate(dto.getEndDate());
        booking.setStartTime(dto.getStartTime());
        booking.setEndTime(dto.getEndTime());
        booking.setBookingFeePerDay(dto.getBookingFeePerDay());
        booking.setCommission(dto.getCommission());
        booking.setSubtotal(dto.getSubtotal());
        booking.setDiscountType(dto.getDiscountType());
        booking.setDiscountValue(dto.getDiscountValue());
        booking.setDiscountAmount(dto.getDiscountAmount());
        booking.setVehicleConditionImages(dto.getVehicleConditionImages());

        // ============================================
// ✅ FLIGHT FIELDS
// ============================================
booking.setAirline(dto.getAirline());
booking.setFlightNumber(dto.getFlightNumber());
booking.setOrigin(dto.getOrigin());
booking.setDestination(dto.getDestination());
booking.setDepartureDateFlight(dto.getDepartureDateFlight());
booking.setDepartureTimeFlight(dto.getDepartureTimeFlight());
booking.setArrivalDateFlight(dto.getArrivalDateFlight());
booking.setArrivalTimeFlight(dto.getArrivalTimeFlight());
booking.setDurationFlight(dto.getDurationFlight());
booking.setSeatClass(dto.getSeatClass());
booking.setEconomyPrice(dto.getEconomyPrice());
booking.setBusinessPrice(dto.getBusinessPrice());
booking.setFirstClassPrice(dto.getFirstClassPrice());

// ============================================
// ✅ TOUR & HAJJ/UMRA FIELDS
// ============================================
booking.setPackageName(dto.getPackageName());
booking.setPackageType(dto.getPackageType());
booking.setPackageDestination(dto.getPackageDestination());
booking.setPackageDuration(dto.getPackageDuration());
booking.setDepartureDate(dto.getDepartureDate());
booking.setPassengers(dto.getPassengers());
booking.setAccommodation(dto.getAccommodation());
booking.setMeals(dto.getMeals());
booking.setTransport(dto.getTransport());
booking.setGuides(dto.getGuides());
booking.setInsurance(dto.getInsurance());
// Handle visa relationship using visaId
if (dto.getVisaId() != null && !dto.getVisaId().isEmpty()) {
    // You'll need to inject VisaRepository or use a service to fetch visa
    // VisaApplication visa = visaRepository.findById(dto.getVisaId())
    //         .orElseThrow(() -> new ResourceNotFoundException("Visa not found"));
    // booking.setVisa(visa);
}
// OR if you don't need to set visa, just remove the line

// ============================================
// ✅ HOTEL FIELDS
// ============================================
booking.setHotelName(dto.getHotelName());
booking.setHotelCity(dto.getHotelCity());
booking.setHotelStarRating(dto.getHotelStarRating());
booking.setRoomName(dto.getRoomName());
booking.setCheckIn(dto.getCheckIn());
booking.setCheckOut(dto.getCheckOut());
booking.setNights(dto.getNights());
booking.setRooms(dto.getRooms());
booking.setGuests(dto.getGuests());
        
        // Payment fields
        booking.setTotalPrice(dto.getTotalPrice());
        booking.setPaidAmount(dto.getPaidAmount());
        booking.setRemainingBalance(dto.getRemainingBalance());
        booking.setPaymentMethod(dto.getPaymentMethod() != null ? dto.getPaymentMethod() : "CASH");
        booking.setPaymentStatus(dto.getPaymentStatus() != null ? dto.getPaymentStatus() : "PENDING");
        booking.setMpesaCode(dto.getMpesaCode());
        
        // Status
        booking.setStatus(dto.getStatus() != null ? dto.getStatus() : "pending");
        
        // Notes
        booking.setNotes(dto.getNotes());
        
        // Set timestamps
        if (dto.getCreatedAt() != null) {
            booking.setCreatedAt(dto.getCreatedAt());
        }
        if (dto.getUpdatedAt() != null) {
            booking.setUpdatedAt(dto.getUpdatedAt());
        }
        
        return booking;
    }

    private BookingDTO convertToDTO(Booking booking) {
        BookingDTO dto = new BookingDTO();
        dto.setId(booking.getId());
        dto.setTenantId(booking.getTenant() != null ? booking.getTenant().getId() : null);
        dto.setReference(booking.getReference());
        dto.setCustomerName(booking.getCustomerName());
        dto.setCustomerEmail(booking.getCustomerEmail());
        dto.setCustomerPhone(booking.getCustomerPhone());
        dto.setCustomerIdNumber(booking.getCustomerIdNumber());
        dto.setCustomerIdImage(booking.getCustomerIdImage());
        dto.setCustomerLicenseImage(booking.getCustomerLicenseImage());
        dto.setCustomerLicenseNumber(booking.getCustomerLicenseNumber());
        dto.setServiceType(booking.getServiceType());
        dto.setIsGuestBooking(booking.getIsGuestBooking());
        dto.setUserId(booking.getUser() != null ? booking.getUser().getId() : null);
        dto.setUserEmail(booking.getUserEmail());
        
        dto.setVehicleId(booking.getVehicle() != null ? booking.getVehicle().getId() : null);
        dto.setOwnerId(booking.getOwner() != null ? booking.getOwner().getId() : null);
        dto.setTourPackageId(booking.getTourPackage() != null ? booking.getTourPackage().getId() : null);  
        dto.setHajjPackageId(booking.getHajjPackage() != null ? booking.getHajjPackage().getId() : null); 
        dto.setFlightId(booking.getFlight() != null ? booking.getFlight().getId() : null); 
        dto.setHotelId(booking.getHotel() != null ? booking.getHotel().getId() : null);
        dto.setRoomTypeId(booking.getRoomType() != null ? booking.getRoomType().getId() : null); 
        
        // Car Hire
        dto.setVehicleRegistration(booking.getVehicleRegistration());
        dto.setVehicleMake(booking.getVehicleMake());
        dto.setVehicleModel(booking.getVehicleModel());
        dto.setVehiclePricePerDay(booking.getVehiclePricePerDay());
        dto.setDays(booking.getDays());
        dto.setStartDate(booking.getStartDate());
        dto.setEndDate(booking.getEndDate());
        dto.setStartTime(booking.getStartTime());
        dto.setEndTime(booking.getEndTime());
        dto.setBookingFeePerDay(booking.getBookingFeePerDay());
        dto.setCommission(booking.getCommission());
        dto.setSubtotal(booking.getSubtotal());
        dto.setDiscountType(booking.getDiscountType());
        dto.setDiscountValue(booking.getDiscountValue());
        dto.setDiscountAmount(booking.getDiscountAmount());
        dto.setVehicleConditionImages(booking.getVehicleConditionImages());

        // ============================================
// ✅ FLIGHT FIELDS
// ============================================
dto.setAirline(booking.getAirline());
dto.setFlightNumber(booking.getFlightNumber());
dto.setOrigin(booking.getOrigin());
dto.setDestination(booking.getDestination());
dto.setDepartureDateFlight(booking.getDepartureDateFlight());
dto.setDepartureTimeFlight(booking.getDepartureTimeFlight());
dto.setArrivalDateFlight(booking.getArrivalDateFlight());
dto.setArrivalTimeFlight(booking.getArrivalTimeFlight());
dto.setDurationFlight(booking.getDurationFlight());
dto.setSeatClass(booking.getSeatClass());
dto.setEconomyPrice(booking.getEconomyPrice());
dto.setBusinessPrice(booking.getBusinessPrice());
dto.setFirstClassPrice(booking.getFirstClassPrice());

if (booking.getFlight() != null) {
    dto.setAirline(booking.getFlight().getAirline());
    dto.setFlightNumber(booking.getFlight().getFlightNumber());
    dto.setOrigin(booking.getFlight().getOrigin());
    dto.setDestination(booking.getFlight().getDestination());
    dto.setDepartureDateFlight(booking.getFlight().getDepartureDate());
    dto.setDepartureTimeFlight(booking.getFlight().getDepartureTime());
    dto.setArrivalDateFlight(booking.getFlight().getArrivalDate());
    dto.setArrivalTimeFlight(booking.getFlight().getArrivalTime());
    dto.setDurationFlight(booking.getFlight().getDuration());
    dto.setEconomyPrice(booking.getFlight().getEconomyPrice());
    dto.setBusinessPrice(booking.getFlight().getBusinessPrice());
    dto.setFirstClassPrice(booking.getFlight().getFirstClassPrice());
}

// ============================================
// ✅ TOUR & HAJJ/UMRA FIELDS
// ============================================
dto.setPackageName(booking.getPackageName());
dto.setPackageType(booking.getPackageType());
dto.setPackageDestination(booking.getPackageDestination());
dto.setPackageDuration(booking.getPackageDuration());
dto.setDepartureDate(booking.getDepartureDate());
dto.setPassengers(booking.getPassengers());
dto.setAccommodation(booking.getAccommodation());
dto.setMeals(booking.getMeals());
dto.setTransport(booking.getTransport());
dto.setGuides(booking.getGuides());
dto.setInsurance(booking.getInsurance());
dto.setVisaId(booking.getVisa() != null ? booking.getVisa().getId() : null);

if (booking.getTourPackage() != null) {
    dto.setPackageName(booking.getTourPackage().getName());
    dto.setPackageDestination(booking.getTourPackage().getDestination());
    dto.setPackageType(booking.getTourPackage().getCategory());
    dto.setPackageDuration(booking.getTourPackage().getDuration());
}

if (booking.getHajjPackage() != null) {
    dto.setPackageName(booking.getHajjPackage().getName());
    dto.setPackageDestination(booking.getHajjPackage().getDestination());
    dto.setPackageType(booking.getHajjPackage().getType());
    dto.setPackageDuration(booking.getHajjPackage().getDuration());
}

// ============================================
// ✅ HOTEL FIELDS
// ============================================
dto.setHotelName(booking.getHotelName());
dto.setHotelCity(booking.getHotelCity());
dto.setHotelStarRating(booking.getHotelStarRating());
dto.setRoomName(booking.getRoomName());
dto.setCheckIn(booking.getCheckIn());
dto.setCheckOut(booking.getCheckOut());
dto.setNights(booking.getNights());
dto.setRooms(booking.getRooms());
dto.setGuests(booking.getGuests());

if (booking.getHotel() != null) {
    dto.setHotelName(booking.getHotel().getName());
    dto.setHotelCity(booking.getHotel().getCity());
    dto.setHotelStarRating(booking.getHotel().getStarRating());
}

if (booking.getRoomType() != null) {
    dto.setRoomName(booking.getRoomType().getName());
    dto.setRoomType(booking.getRoomType().getType());
}
        
        // Payment
        dto.setTotalPrice(booking.getTotalPrice());
        dto.setPaidAmount(booking.getPaidAmount());
        dto.setRemainingBalance(booking.getRemainingBalance());
        dto.setPaymentMethod(booking.getPaymentMethod());
        dto.setPaymentStatus(booking.getPaymentStatus());
        dto.setMpesaCode(booking.getMpesaCode());
        
        dto.setStatus(booking.getStatus());
        dto.setNotes(booking.getNotes());
        dto.setCreatedAt(booking.getCreatedAt());
        dto.setUpdatedAt(booking.getUpdatedAt());
        
        return dto;
    }

        // ============================================
    // ✅ HELPER METHOD - Convert Vehicle to DTO
    // ============================================
    
    private VehicleDTO convertVehicleToDTO(Vehicle vehicle) {
        VehicleDTO dto = new VehicleDTO();
        dto.setId(vehicle.getId());
        dto.setRegistration(vehicle.getRegistration());
        dto.setMake(vehicle.getMake());
        dto.setModel(vehicle.getModel());
        dto.setYear(vehicle.getYear());
        dto.setColor(vehicle.getColor());
        dto.setCategory(vehicle.getCategory());
        dto.setStatus(vehicle.getStatus());
        dto.setPricePerDay(vehicle.getPricePerDay());
        dto.setSeatingCapacity(vehicle.getSeatingCapacity());
        dto.setFuelType(vehicle.getFuelType());
        dto.setTransmission(vehicle.getTransmission());
        dto.setLocation(vehicle.getLocation());
        dto.setDescription(vehicle.getDescription());
        dto.setImages(vehicle.getImages());
        dto.setOwnerId(vehicle.getOwner() != null ? vehicle.getOwner().getId() : null);
        return dto;
    }
}