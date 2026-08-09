package com.sulultours.service;

import com.sulultours.entity.Booking;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    // ============================================
    // ✅ SEND BOOKING CONFIRMATION EMAIL
    // ============================================
    public void sendBookingConfirmation(Booking booking) {
        String subject = "✅ Booking Confirmation - " + booking.getReference();
        String body = buildBookingConfirmationEmail(booking);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(booking.getCustomerEmail());
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("✅ Booking confirmation email sent to: {}", booking.getCustomerEmail());
        } catch (Exception e) {
            log.error("❌ Failed to send booking confirmation to {}: {}", booking.getCustomerEmail(), e.getMessage());
        }
    }

    // ============================================
    // ✅ BUILD BOOKING CONFIRMATION EMAIL CONTENT
    // ============================================
    private String buildBookingConfirmationEmail(Booking booking) {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");

        StringBuilder sb = new StringBuilder();
        sb.append("Dear ").append(booking.getCustomerName()).append(",\n\n");
        sb.append("Thank you for booking with Sulul Tours & Travel!\n\n");
        sb.append("Your booking has been confirmed.\n\n");
        sb.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        sb.append("📋 BOOKING DETAILS\n");
        sb.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        sb.append("Reference: ").append(booking.getReference()).append("\n");
        sb.append("Service: ").append(formatServiceType(booking.getServiceType())).append("\n");
        sb.append("Customer: ").append(booking.getCustomerName()).append("\n");
        sb.append("Email: ").append(booking.getCustomerEmail()).append("\n");
        sb.append("Phone: ").append(booking.getCustomerPhone()).append("\n\n");

        // Service specific details
        if ("car_hire".equals(booking.getServiceType())) {
            sb.append("🚗 CAR HIRE DETAILS\n");
            sb.append("Vehicle: ").append(booking.getVehicleMake()).append(" ").append(booking.getVehicleModel()).append("\n");
            sb.append("Registration: ").append(booking.getVehicleRegistration()).append("\n");
            if (booking.getStartDate() != null) {
                sb.append("Start: ").append(booking.getStartDate().format(dateFormatter)).append(" at ").append(booking.getStartTime() != null ? booking.getStartTime().format(timeFormatter) : "08:00 AM").append("\n");
            }
            if (booking.getEndDate() != null) {
                sb.append("End: ").append(booking.getEndDate().format(dateFormatter)).append(" at ").append(booking.getEndTime() != null ? booking.getEndTime().format(timeFormatter) : "06:00 PM").append("\n");
            }
            sb.append("Days: ").append(booking.getDays()).append("\n");
        } else if ("tour".equals(booking.getServiceType()) || "hajj".equals(booking.getServiceType())) {
            sb.append("✈️ PACKAGE DETAILS\n");
            sb.append("Package: ").append(booking.getPackageName()).append("\n");
            sb.append("Type: ").append(booking.getPackageType()).append("\n");
            sb.append("Destination: ").append(booking.getPackageDestination()).append("\n");
            sb.append("Duration: ").append(booking.getPackageDuration()).append("\n");
            sb.append("Passengers: ").append(booking.getPassengers()).append("\n");
            if (booking.getDepartureDate() != null) {
                sb.append("Departure: ").append(booking.getDepartureDate().format(dateFormatter)).append("\n");
            }
        } else if ("hotel".equals(booking.getServiceType())) {
            sb.append("🏨 HOTEL DETAILS\n");
            sb.append("Hotel: ").append(booking.getHotelName()).append("\n");
            sb.append("Location: ").append(booking.getHotelCity()).append("\n");
            sb.append("Room: ").append(booking.getRoomName()).append("\n");
            if (booking.getCheckIn() != null) {
                sb.append("Check-in: ").append(booking.getCheckIn().format(dateFormatter)).append("\n");
            }
            if (booking.getCheckOut() != null) {
                sb.append("Check-out: ").append(booking.getCheckOut().format(dateFormatter)).append("\n");
            }
            sb.append("Nights: ").append(booking.getNights()).append("\n");
            sb.append("Rooms: ").append(booking.getRooms()).append("\n");
            sb.append("Guests: ").append(booking.getGuests()).append("\n");
        } else if ("flight".equals(booking.getServiceType())) {
            sb.append("✈️ FLIGHT DETAILS\n");
            sb.append("Airline: ").append(booking.getAirline()).append("\n");
            sb.append("Flight: ").append(booking.getFlightNumber()).append("\n");
            sb.append("From: ").append(booking.getOrigin()).append("\n");
            sb.append("To: ").append(booking.getDestination()).append("\n");
            if (booking.getDepartureDateFlight() != null) {
                sb.append("Departure: ").append(booking.getDepartureDateFlight().format(dateFormatter));
                if (booking.getDepartureTimeFlight() != null) {
                    sb.append(" at ").append(booking.getDepartureTimeFlight().format(timeFormatter));
                }
                sb.append("\n");
            }
            if (booking.getArrivalDateFlight() != null) {
                sb.append("Arrival: ").append(booking.getArrivalDateFlight().format(dateFormatter));
                if (booking.getArrivalTimeFlight() != null) {
                    sb.append(" at ").append(booking.getArrivalTimeFlight().format(timeFormatter));
                }
                sb.append("\n");
            }
            sb.append("Seat Class: ").append(booking.getSeatClass()).append("\n");
            sb.append("Passengers: ").append(booking.getPassengers()).append("\n");
        }

        sb.append("\n💰 PAYMENT DETAILS\n");
        sb.append("Total Amount: KSh ").append(String.format("%,.0f", booking.getTotalPrice())).append("\n");
        sb.append("Payment Method: ").append(booking.getPaymentMethod()).append("\n");
        sb.append("Payment Status: ").append(booking.getPaymentStatus()).append("\n");

        sb.append("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        sb.append("📌 Important Information\n");
        sb.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        sb.append("• Please keep this reference number for any inquiries: ").append(booking.getReference()).append("\n");
        sb.append("• For changes or cancellations, contact us at least 24 hours in advance.\n");
        sb.append("• Our team will contact you shortly to confirm all details.\n\n");

        sb.append("Need help? Contact us:\n");
        sb.append("📞 Phone: 0725418081\n");
        sb.append("📧 Email: sulultoursandtravel@gmail.com\n\n");

        sb.append("Thank you for choosing Sulul Tours & Travel!\n");
        sb.append("We look forward to serving you.\n\n");
        sb.append("Best regards,\n");
        sb.append("Sulul Tours & Travel Team");

        return sb.toString();
    }

    // ============================================
    // ✅ HELPER METHOD - FORMAT SERVICE TYPE
    // ============================================
    private String formatServiceType(String serviceType) {
        if (serviceType == null) return "N/A";
        switch (serviceType) {
            case "car_hire": return "🚗 Car Hire";
            case "tour": return "✈️ Tour Package";
            case "hajj": return "🕋 Hajj/Umra";
            case "hotel": return "🏨 Hotel Booking";
            case "flight": return "✈️ Flight Booking";
            default: return serviceType;
        }
    }

    // ============================================
    // ✅ SEND PASSWORD RESET EMAIL
    // ============================================
    public void sendResetPasswordEmail(String to, String resetToken) {
        String resetLink = "http://localhost:3000/reset-password?token=" + resetToken;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Sulul Tours - Password Reset Request");
        message.setText(
            "Hello,\n\n" +
            "You have requested to reset your password for your Sulul Tours account.\n\n" +
            "Click the link below to reset your password:\n" +
            resetLink + "\n\n" +
            "This link will expire in 1 hour.\n\n" +
            "If you did not request this, please ignore this email.\n\n" +
            "Best regards,\n" +
            "Sulul Tours Team"
        );

        try {
            mailSender.send(message);
            log.info("✅ Password reset email sent to: {}", to);
        } catch (Exception e) {
            log.error("❌ Failed to send password reset email to {}: {}", to, e.getMessage());
        }
    }

    // ============================================
    // ✅ GENERIC SEND EMAIL METHOD
    // ============================================
    public void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("✅ Email sent to: {}", to);
        } catch (Exception e) {
            log.error("❌ Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}